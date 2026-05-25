import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Topbar from "../../components/layout/Topbar";

export default function AnalyticsPage() {
  return (
    <div>
      <Topbar title="Analytics" subtitle="Attendance insights and trends" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Subject-wise Attendance %
            </h2>
            <div
              className="flex items-center justify-center h-[260px] text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              No data available yet
            </div>
          </div>
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Daily Attendance Trend
            </h2>
            <div
              className="flex items-center justify-center h-[260px] text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              No data available yet
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div
            className="xl:col-span-1 rounded-2xl p-5 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Attendance Breakdown
            </h2>
            <div
              className="flex items-center justify-center h-[260px] text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              No data available yet
            </div>
          </div>
          <div
            className="xl:col-span-2 rounded-2xl p-5 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2
              className="text-base font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Subject Performance
            </h2>
            <div
              className="flex items-center justify-center h-[260px] text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              No data available yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
