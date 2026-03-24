from datetime import datetime, timedelta
from typing import Dict, List

from db import db


def upsert_users(users: List[Dict]) -> None:
    for user in users:
        db.users.update_one({"email": user["email"]}, {"$set": user}, upsert=True)


def seed(db_conn=None) -> None:
    """Populate baseline data for demo purposes."""
    db_conn = db_conn or db

    if db_conn.users.count_documents({}) > 0:
        return

    now = datetime.utcnow()
    users = [
        {
            "name": "Aditi Rao",
            "email": "aditi.rao@example.com",
            "role": "Citizen",
            "location_zone": "Central Delhi",
        },
        {
            "name": "Rahul Khurana",
            "email": "rahul.khurana@example.com",
            "role": "Citizen",
            "location_zone": "Bengaluru Urban",
        },
        {
            "name": "Officer Kavya Iyer",
            "email": "kavya.iyer@traffic.gov",
            "role": "Officer",
            "location_zone": "Central Delhi",
        },
        {
            "name": "Officer Arjun Patel",
            "email": "arjun.patel@traffic.gov",
            "role": "Officer",
            "location_zone": "Bengaluru Urban",
        },
    ]

    upsert_users(users)

    complaints = [
        {
            "user_email": "aditi.rao@example.com",
            "image_url": "https://mockstorage.local/cmp-001.jpg",
            "timestamp": (now - timedelta(days=2)).isoformat() + "Z",
            "status": "Resolved",
            "violation_type_manual": "Signal Jump",
            "location_geotag": "28.6139,77.2090",
            "comments_citizen": "Vehicle jumped the red light at Connaught Place.",
        },
        {
            "user_email": "rahul.khurana@example.com",
            "image_url": "https://mockstorage.local/cmp-002.jpg",
            "timestamp": (now - timedelta(days=1)).isoformat() + "Z",
            "status": "Pending",
            "violation_type_manual": "Wrong Parking",
            "location_geotag": "12.9716,77.5946",
            "comments_citizen": "Blocked entire footpath on MG Road.",
        },
    ]

    for idx, complaint in enumerate(complaints):
        user = db_conn.users.find_one({"email": complaint.pop("user_email")})
        if not user:
            continue
        complaint["user_id"] = str(user["_id"])
        result = db_conn.complaints.insert_one(complaint)

        ml_payload = {
            "complaint_id": str(result.inserted_id),
            "license_plate": f"DL0{idx+1}AB12{idx+1}",
            "vehicle_type": "Sedan" if idx == 1 else "Motorcycle",
            "violation_type_ai": complaint["violation_type_manual"],
            "confidence_score": 0.9 - (idx * 0.05),
        }
        db_conn.ml_extracted_data.insert_one(ml_payload)

        db_conn.actions.insert_one(
            {
                "complaint_id": str(result.inserted_id),
                "officer_id": str(
                    db_conn.users.find_one({"role": "Officer"})["_id"]
                ),
                "action_type": "Issued Notice",
                "remarks": "Notice dispatched via SMS.",
                "action_timestamp": (now - timedelta(hours=12)).isoformat() + "Z",
            }
        )

        db_conn.feedback.insert_one(
            {
                "complaint_id": str(result.inserted_id),
                "rating": 4,
                "comments_feedback": "Resolved quickly, thanks!",
                "submitted_on": now.isoformat() + "Z",
            }
        )


