import base64
import random
import uuid
from datetime import datetime
from functools import wraps
from typing import Any, Dict, List, Optional

from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS

from config import get_settings
from db import db
from seed_data import seed

app = Flask(__name__)
CORS(app)

settings = get_settings()
if settings.seed_data:
    seed(db)

MOCK_LOCATIONS = [
    {"geotag": "28.6139,77.2090", "zone": "Central Delhi"},
    {"geotag": "12.9716,77.5946", "zone": "Bengaluru Urban"},
    {"geotag": "19.0760,72.8777", "zone": "South Mumbai"},
    {"geotag": "13.0827,80.2707", "zone": "Chennai Central"},
    {"geotag": "17.3850,78.4867", "zone": "Hyderabad Core"},
]

VIOLATION_MAPPING = {
    "Signal Jump": {"violation_type_ai": "Red Light", "vehicle_type": "Motorcycle"},
    "Overspeeding": {"violation_type_ai": "Overspeeding", "vehicle_type": "Sedan"},
    "Wrong Parking": {"violation_type_ai": "Illegal Parking", "vehicle_type": "Hatchback"},
    "No Helmet": {"violation_type_ai": "Helmet Violation", "vehicle_type": "Scooter"},
    "Lane Cutting": {"violation_type_ai": "Unsafe Lane Change", "vehicle_type": "SUV"},
    "Unspecified": {"violation_type_ai": "General Violation", "vehicle_type": "Sedan"},
}

LICENSE_PLATES = ["DL03AB1234", "KA05MN7788", "MH14QZ4400", "TN09JK9900", "TS10BD7700"]


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    doc["id"] = str(doc.pop("_id"))
    return doc


def require_role(allowed_roles: List[str]):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            role = request.headers.get("X-User-Role")
            if role not in allowed_roles:
                return (
                    jsonify(
                        {
                            "message": "Forbidden – insufficient permissions",
                            "required_roles": allowed_roles,
                        }
                    ),
                    403,
                )
            return func(*args, **kwargs)

        return wrapper

    return decorator


def to_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return value


def store_image_mock(image_b64: str) -> str:
    if not image_b64:
        return "https://mockstorage.local/placeholders/complaint.jpg"
    # Validate base64 so frontend errors are easier to spot
    try:
        base64.b64decode(image_b64.split(",")[-1])
    except Exception:
        return "https://mockstorage.local/placeholders/complaint.jpg"
    return f"https://mockstorage.local/{uuid.uuid4()}.jpg"


def auto_location() -> Dict[str, str]:
    return random.choice(MOCK_LOCATIONS)


def generate_ml_payload(
    complaint_id: str, manual_type: Optional[str] = None
) -> Dict[str, Any]:
    baseline = VIOLATION_MAPPING.get(manual_type) or random.choice(
        list(VIOLATION_MAPPING.values())
    )
    return {
        "complaint_id": complaint_id,
        "license_plate": random.choice(LICENSE_PLATES),
        "vehicle_type": baseline["vehicle_type"],
        "violation_type_ai": baseline["violation_type_ai"],
        "confidence_score": round(random.uniform(0.78, 0.97), 2),
    }


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


@app.post("/api/auth/login")
def login():
    payload = request.get_json(force=True)
    email = payload.get("email", "").lower().strip()
    role = payload.get("role")
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404
    if role and role != user["role"]:
        return jsonify({"message": "Role mismatch"}), 403
    serialized = serialize_doc(user)
    serialized.pop("password", None)
    return jsonify(serialized)


@app.post("/api/users")
def register_user():
    data = request.get_json(force=True)
    required = {"name", "email", "role"}
    if not required.issubset(data):
        return jsonify({"message": "Missing required fields"}), 400
    data["email"] = data["email"].lower()
    existing = db.users.find_one({"email": data["email"]})
    if existing:
        return jsonify({"message": "User already exists"}), 409
    result = db.users.insert_one(data)
    return jsonify({"id": str(result.inserted_id)}), 201


@app.post("/api/complaints")
@require_role(["Citizen"])
def create_complaint():
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return jsonify({"message": "User not found"}), 404

    location_info = data.get("location_geotag")
    zone = user.get("location_zone")
    if not location_info:
        loc = auto_location()
        location_info = loc["geotag"]
        zone = loc["zone"]

    complaint = {
        "user_id": str(user["_id"]),
        "image_url": store_image_mock(data.get("image_base64", "")),
        "timestamp": data.get("timestamp", datetime.utcnow().isoformat() + "Z"),
        "status": "Pending",
        "violation_type_manual": data.get("violation_type_manual", "Unspecified"),
        "location_geotag": location_info,
        "zone": zone,
        "comments_citizen": data.get("comments_citizen", ""),
    }

    result = db.complaints.insert_one(complaint)
    complaint_id = str(result.inserted_id)

    ml_payload = data.get("ml_payload") or generate_ml_payload(
        complaint_id, complaint["violation_type_manual"]
    )
    ml_payload["complaint_id"] = complaint_id
    db.ml_extracted_data.insert_one(ml_payload)

    return jsonify({"complaint_id": complaint_id}), 201


@app.get("/api/complaints")
@require_role(["Officer"])
def list_complaints():
    status = request.args.get("status")
    zone = request.args.get("zone")
    violation = request.args.get("violation_type_manual")
    sort_field = request.args.get("sort", "timestamp")
    sort_direction = -1 if request.args.get("order", "desc") == "desc" else 1

    filters: Dict[str, Any] = {}
    if status and status != "All":
        filters["status"] = status
    if zone:
        filters["zone"] = zone
    if violation:
        filters["violation_type_manual"] = violation

    cursor = db.complaints.find(filters).sort(sort_field, sort_direction)
    complaints = []
    for doc in cursor:
        serialized = serialize_doc(doc)
        ml = db.ml_extracted_data.find_one({"complaint_id": serialized["id"]})
        serialized["ml_data"] = serialize_doc(ml) if ml else {}
        serialized["actions"] = [
            serialize_doc(a)
            for a in db.actions.find({"complaint_id": serialized["id"]}).sort(
                "action_timestamp", 1
            )
        ]
        complaints.append(serialized)

    return jsonify(complaints)


@app.get("/api/complaints/user/<user_id>")
@require_role(["Citizen"])
def complaints_by_user(user_id):
    docs = db.complaints.find({"user_id": user_id})
    response = []
    for doc in docs:
        serialized = serialize_doc(doc)
        actions = list(db.actions.find({"complaint_id": serialized["id"]}))
        serialized["actions"] = [serialize_doc(a) for a in actions]
        ml_doc = db.ml_extracted_data.find_one({"complaint_id": serialized["id"]})
        serialized["ml_data"] = serialize_doc(ml_doc) if ml_doc else {}
        response.append(serialized)
    return jsonify(response)


@app.get("/api/complaints/<complaint_id>")
def get_complaint(complaint_id):
    doc = db.complaints.find_one({"_id": to_object_id(complaint_id)})
    if not doc:
        return jsonify({"message": "Complaint not found"}), 404
    serialized = serialize_doc(doc)
    ml_doc = db.ml_extracted_data.find_one({"complaint_id": serialized["id"]})
    serialized["ml_data"] = serialize_doc(ml_doc) if ml_doc else {}
    serialized["actions"] = [
        serialize_doc(a) for a in db.actions.find({"complaint_id": serialized["id"]})
    ]
    feedback_doc = db.feedback.find_one({"complaint_id": serialized["id"]})
    serialized["feedback"] = serialize_doc(feedback_doc) if feedback_doc else {}
    return jsonify(serialized)


@app.post("/api/complaints/<complaint_id>/actions")
@require_role(["Officer"])
def log_action(complaint_id):
    data = request.get_json(force=True)
    officer_id = data.get("officer_id")
    action_type = data.get("action_type")
    if action_type not in ["Issued Notice", "Mark Resolved", "Request More Info"]:
        return jsonify({"message": "Invalid action type"}), 400

    action = {
        "complaint_id": complaint_id,
        "officer_id": officer_id,
        "action_type": action_type,
        "remarks": data.get("remarks", ""),
        "action_timestamp": datetime.utcnow().isoformat() + "Z",
    }
    db.actions.insert_one(action)
    complaint_filter = {"_id": to_object_id(complaint_id)}
    if action_type == "Mark Resolved":
        db.complaints.update_one(
            complaint_filter, {"$set": {"status": "Resolved"}}
        )
    elif action_type == "Issued Notice":
        db.complaints.update_one(
            complaint_filter, {"$set": {"status": "Under Review"}}
        )
    return jsonify({"message": "Action recorded"}), 201


@app.post("/api/complaints/<complaint_id>/feedback")
@require_role(["Citizen"])
def submit_feedback(complaint_id):
    data = request.get_json(force=True)
    feedback = {
        "complaint_id": complaint_id,
        "rating": data.get("rating"),
        "comments_feedback": data.get("comments_feedback", ""),
        "submitted_on": datetime.utcnow().isoformat() + "Z",
    }
    db.feedback.update_one(
        {"complaint_id": complaint_id}, {"$set": feedback}, upsert=True
    )
    return jsonify({"message": "Feedback saved"}), 201


@app.get("/api/analytics/summary")
@require_role(["Officer"])
def analytics():
    total = db.complaints.count_documents({})
    resolved = db.complaints.count_documents({"status": "Resolved"})
    pending = db.complaints.count_documents({"status": "Pending"})
    under_review = db.complaints.count_documents({"status": "Under Review"})

    hotspots = (
        db.complaints.aggregate(
            [
                {"$group": {"_id": "$zone", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]
        )
        or []
    )

    violations = (
        db.complaints.aggregate(
            [
                {"$group": {"_id": "$violation_type_manual", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]
        )
        or []
    )

    avg_resolution = 36  # Placeholder hours

    return jsonify(
        {
            "totals": {
                "all": total,
                "resolved": resolved,
                "pending": pending,
                "under_review": under_review,
            },
            "hotspots": list(hotspots),
            "violations": list(violations),
            "avg_resolution_hours": avg_resolution,
        }
    )


@app.post("/api/ml/process_image")
def ml_process():
    data = request.get_json(force=True)
    complaint_id = data.get("complaint_id", str(uuid.uuid4()))
    manual_type = data.get("manual_violation")
    ml_payload = generate_ml_payload(complaint_id, manual_type)
    if data.get("persist", True):
        db.ml_extracted_data.update_one(
            {"complaint_id": complaint_id}, {"$set": ml_payload}, upsert=True
        )
    return jsonify(ml_payload)


if __name__ == "__main__":
    app.run(debug=True)


