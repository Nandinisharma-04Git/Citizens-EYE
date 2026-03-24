import StatusBadge from "./StatusBadge.jsx";

export default function ComplaintCard({ complaint, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(complaint)}
      className="w-full text-left bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-900">
          {complaint.violation_type_manual}
        </p>
        <StatusBadge status={complaint.status} />
      </div>
      <p className="text-xs text-slate-500">
        {new Date(complaint.timestamp).toLocaleString()}
      </p>
      <p className="text-sm text-slate-600 mt-2">{complaint.location_geotag}</p>
      {complaint.actions?.length ? (
        <p className="text-xs text-slate-500 mt-2">
          Last action:{" "}
          <span className="font-medium">
            {complaint.actions[complaint.actions.length - 1].action_type}
          </span>
        </p>
      ) : null}
    </button>
  );
}

