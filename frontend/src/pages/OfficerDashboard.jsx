import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useOfficerComplaints } from "../hooks/useComplaints.js";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";

const STATUS_OPTIONS = ["All", "Pending", "Under Review", "Resolved"];

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: "Pending",
    zone: "",
    violation_type_manual: "",
  });
  const { complaints, loading, refresh } = useOfficerComplaints(filters);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState("Issued Notice");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api
      .get("/analytics/summary", { headers: { "X-User-Role": "Officer" } })
      .then(({ data }) => setAnalytics(data));
  }, []);

  useEffect(() => {
    if (complaints.length && !activeComplaint) {
      setActiveComplaint(complaints[0]);
    }
  }, [complaints]);

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!activeComplaint) return;
    await api.post(
      `/complaints/${activeComplaint.id}/actions`,
      {
        officer_id: user.id,
        action_type: actionType,
        remarks,
      },
      { headers: { "X-User-Role": "Officer" } },
    );
    setRemarks("");
    refresh();
  };

  return (
    <Layout title="Officer command center">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-slate-500 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="border border-slate-300 rounded-md px-2 py-1"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block">Zone</label>
            <input
              value={filters.zone}
              placeholder="Central Delhi"
              onChange={(e) => setFilters((prev) => ({ ...prev, zone: e.target.value }))}
              className="border border-slate-300 rounded-md px-2 py-1"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block">Violation</label>
            <input
              value={filters.violation_type_manual}
              placeholder="Signal Jump"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, violation_type_manual: e.target.value }))
              }
              className="border border-slate-300 rounded-md px-2 py-1"
            />
          </div>
          <button
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          {loading ? (
            <p className="text-sm text-slate-500">Loading complaints...</p>
          ) : complaints.length ? (
            complaints.map((complaint) => (
              <button
                key={complaint.id}
                onClick={() => setActiveComplaint(complaint)}
                className={`w-full text-left bg-white border rounded-lg p-4 ${
                  activeComplaint?.id === complaint.id
                    ? "border-brand-500 shadow"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{complaint.violation_type_manual}</p>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{complaint.zone || "N/A"}</p>
                <p className="text-xs text-slate-500">
                  {new Date(complaint.timestamp).toLocaleString()}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500">No complaints found.</p>
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
          {activeComplaint ? (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {activeComplaint.violation_type_manual}
                    </p>
                    <p className="text-xs text-slate-500">
                      Citizen comments: {activeComplaint.comments_citizen || "None"}
                    </p>
                  </div>
                  <StatusBadge status={activeComplaint.status} />
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Citizen Input
                    </p>
                    <ul className="space-y-1 mt-1">
                      <li>Location: {activeComplaint.location_geotag}</li>
                      <li>Timestamp: {new Date(activeComplaint.timestamp).toLocaleString()}</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      ML Extraction
                    </p>
                    <ul className="space-y-1 mt-1">
                      <li>
                        Plate: {activeComplaint.ml_data?.license_plate || "Processing"}
                      </li>
                      <li>Vehicle: {activeComplaint.ml_data?.vehicle_type || "TBD"}</li>
                      <li>
                        Violation: {activeComplaint.ml_data?.violation_type_ai || "TBD"} (
                        {activeComplaint.ml_data?.confidence_score || "-"})
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Officer actions
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {(activeComplaint.actions || []).map((action) => (
                      <li
                        className="border border-slate-100 rounded-lg px-3 py-2"
                        key={action.id}
                      >
                        <p className="font-semibold">{action.action_type}</p>
                        <p className="text-xs text-slate-500">{action.action_timestamp}</p>
                        <p className="text-sm text-slate-600">{action.remarks}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-slate-900">
                  Action panel (Two-way loop)
                </p>
                <form onSubmit={handleActionSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      Action type
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option>Issued Notice</option>
                      <option>Mark Resolved</option>
                      <option>Request More Info</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Remarks</label>
                    <textarea
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                  <button className="bg-brand-500 text-white px-4 py-2 rounded-lg">
                    Update complaint
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a complaint to view details.</p>
          )}
        </div>
      </div>

      <AnalyticsCharts analytics={analytics} />
    </Layout>
  );
}


