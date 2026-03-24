import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  BarChart,
  Bar as RBar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AnalyticsCharts({ analytics }) {
  if (!analytics) return null;
  const violationLabels = analytics.violations?.map((v) => v._id) || [];
  const violationCounts = analytics.violations?.map((v) => v.count) || [];
  const hotspotData =
    analytics.hotspots?.map((hotspot) => ({
      zone: hotspot._id || "Unknown",
      count: hotspot.count,
    })) || [];

  const doughnutData = {
    labels: ["Resolved", "Pending", "Under Review"],
    datasets: [
      {
        label: "Complaints",
        data: [
          analytics.totals?.resolved || 0,
          analytics.totals?.pending || 0,
          analytics.totals?.under_review || 0,
        ],
        backgroundColor: ["#10b981", "#f97316", "#6366f1"],
      },
    ],
  };

  const barData = {
    labels: violationLabels,
    datasets: [
      {
        label: "Top Violations",
        backgroundColor: "#0ea5e9",
        data: violationCounts,
      },
    ],
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="text-sm font-semibold mb-4">Resolution Split</p>
        <Doughnut data={doughnutData} />
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="text-sm font-semibold mb-4">Most Common Violations</p>
        <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Hotspot Heatmap (mock)</p>
          <p className="text-xs text-slate-500">
            Avg resolution: {analytics.avg_resolution_hours} hrs
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={hotspotData}>
            <XAxis dataKey="zone" />
            <YAxis />
            <RTooltip />
            <RBar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

