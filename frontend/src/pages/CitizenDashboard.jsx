import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import ComplaintCard from "../components/ComplaintCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCitizenComplaints } from "../hooks/useComplaints.js";
import { api } from "../api/client";

const VIOLATIONS = [
  "Signal Jump",
  "Overspeeding",
  "Wrong Parking",
  "No Helmet",
  "Lane Cutting",
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { complaints, loading, refresh } = useCitizenComplaints();
  const [form, setForm] = useState({
    violation_type_manual: VIOLATIONS[0],
    comments_citizen: "",
  });
  const [imageBase64, setImageBase64] = useState("");
  const [geo, setGeo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState({ rating: 5, comment: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
      },
      () => setGeo("28.6139,77.2090"),
    );
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result.toString());
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post(
        "/complaints",
        {
          ...form,
          user_id: user.id,
          image_base64: imageBase64,
          timestamp: new Date().toISOString(),
          location_geotag: geo,
        },
        { headers: { "X-User-Role": "Citizen" } },
      );
      setForm({ violation_type_manual: VIOLATIONS[0], comments_citizen: "" });
      setImageBase64("");
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const resolvedComplaints = useMemo(
    () => complaints.filter((c) => c.status === "Resolved"),
    [complaints],
  );

  const submitFeedback = async (complaintId) => {
    await api.post(
      `/complaints/${complaintId}/feedback`,
      {
        rating: feedbackDraft.rating,
        comments_feedback: feedbackDraft.comment,
      },
      { headers: { "X-User-Role": "Citizen" } },
    );
    refresh();
    setSelectedComplaint(null);
  };

  return (
    <Layout title="Citizen workspace">
      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Report a violation
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Timestamp and location captured automatically.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-600 block mb-1">
                Violation type
              </label>
              <select
                value={form.violation_type_manual}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, violation_type_manual: e.target.value }))
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                {VIOLATIONS.map((violation) => (
                  <option key={violation}>{violation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">
                Additional comments
              </label>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.comments_citizen}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comments_citizen: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Attach image</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="text-xs text-slate-500">
              <p>Location: {geo || "Fetching location..."}</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-500 text-white py-2 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit complaint"}
            </button>
          </form>
        </section>
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Complaint tracker</p>
              <p className="text-xs text-slate-500">Two-way accountability loop</p>
            </div>
            <span className="text-xs text-slate-500">
              {complaints.length} submission(s)
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2">
            {loading ? (
              <p className="text-sm text-slate-500">Loading complaints...</p>
            ) : complaints.length ? (
              complaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onSelect={setSelectedComplaint}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No complaints yet.</p>
            )}
          </div>
        </section>
      </div>

      {selectedComplaint && (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedComplaint.violation_type_manual}
              </p>
              <p className="text-xs text-slate-500">
                {selectedComplaint.location_geotag}
              </p>
            </div>
            <button
              className="text-sm text-brand-500"
              onClick={() => setSelectedComplaint(null)}
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Auto ML plate: {selectedComplaint.ml_data?.license_plate || "TBD"}</p>
            <p>
              Officer remarks:{" "}
              {selectedComplaint.actions?.length
                ? selectedComplaint.actions[selectedComplaint.actions.length - 1].remarks ||
                  "No remarks yet"
                : "Awaiting review"}
            </p>
          </div>
        </div>
      )}

      {resolvedComplaints.length > 0 && (
        <section className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Share your feedback
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Rate resolved complaints to close the loop.
          </p>
          <div className="flex flex-wrap gap-2">
            {resolvedComplaints.map((complaint) => (
              <button
                key={complaint.id}
                className={`px-3 py-1 rounded-full border text-xs ${
                  selectedComplaint?.id === complaint.id
                    ? "border-brand-500 text-brand-700"
                    : "border-slate-200 text-slate-600"
                }`}
                onClick={() => setSelectedComplaint(complaint)}
              >
                {complaint.violation_type_manual}
              </button>
            ))}
          </div>
          {selectedComplaint?.status === "Resolved" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={feedbackDraft.rating}
                  onChange={(e) =>
                    setFeedbackDraft((prev) => ({
                      ...prev,
                      rating: Number(e.target.value),
                    }))
                  }
                  className="w-16 border border-slate-300 rounded-lg px-2 py-1"
                />
              </div>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Share your feedback"
                value={feedbackDraft.comment}
                onChange={(e) =>
                  setFeedbackDraft((prev) => ({ ...prev, comment: e.target.value }))
                }
              />
              <button
                onClick={() => submitFeedback(selectedComplaint.id)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
              >
                Submit feedback
              </button>
            </div>
          )}
        </section>
      )}
    </Layout>
  );
}

