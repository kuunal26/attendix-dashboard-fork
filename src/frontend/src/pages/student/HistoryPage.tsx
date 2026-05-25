import { Clock, History } from "lucide-react";
import Topbar from "../../components/layout/Topbar";

export default function HistoryPage() {
  return (
    <div>
      <Topbar
        title="Attendance History"
        subtitle="Your past attendance records"
      />
      <div className="p-6">
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Attendance History (0 records)
            </h2>
          </div>
          <div
            data-ocid="history.empty_state"
            className="flex flex-col items-center justify-center gap-3 py-16"
          >
            <History
              className="w-10 h-10"
              style={{ color: "var(--text-secondary)", opacity: 0.5 }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              No attendance history yet
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Your records will appear here after you mark attendance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
