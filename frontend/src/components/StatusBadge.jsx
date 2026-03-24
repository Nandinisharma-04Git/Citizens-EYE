const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  "Under Review": "bg-indigo-100 text-indigo-800",
  Resolved: "bg-emerald-100 text-emerald-800",
};

export default function StatusBadge({ status = "Pending" }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}


