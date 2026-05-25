import type { AttendanceRecord } from "@/backend";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckSquare,
  SmartphoneNfc,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import Topbar from "../../components/layout/Topbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  useAllAttendance,
  useAttendanceByStudent,
} from "../../hooks/useQueries";

// ─── circular progress ────────────────────────────────────────────────────────
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg
        width="144"
        height="144"
        viewBox="0 0 144 144"
        className="-rotate-90"
        aria-label={`Attendance ${percentage}%`}
        role="img"
      >
        <title>Attendance {percentage}%</title>
        <defs>
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          strokeWidth="10"
          style={{ stroke: "var(--surface-2)" }}
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="url(#circleGrad)"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {percentage}%
        </span>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Attendance
        </span>
      </div>
    </div>
  );
}

// ─── derive per-day subject-like groups from raw records ─────────────────────
function deriveSubjectGroups(records: AttendanceRecord[]) {
  // Group by calendar day, count how many times each student appeared
  const daySet = new Set<string>();
  for (const r of records) {
    const ms = Number(r.timestamp) / 1_000_000;
    const day = new Date(ms).toLocaleDateString("en-CA"); // YYYY-MM-DD
    daySet.add(day);
  }
  return daySet;
}

// ─── empty state ─────────────────────────────────────────────────────────────
function EmptyAttendance() {
  return (
    <div
      data-ocid="student_dashboard.empty_state"
      className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(59,130,246,0.1)" }}
      >
        <SmartphoneNfc className="w-8 h-8" style={{ color: "#3B82F6" }} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          No attendance records yet
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Tap the NFC tag in your classroom to mark attendance
        </p>
      </div>
    </div>
  );
}

// ─── skeleton loader ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="xl:col-span-2 h-64 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const studentPrn = user?.studentId ?? undefined;

  // Try per-student query first; fall back to all records if no PRN
  const studentQuery = useAttendanceByStudent(studentPrn);
  const allQuery = useAllAttendance();

  const isLoading = studentPrn ? studentQuery.isLoading : allQuery.isLoading;

  // Records to display: prefer per-student when PRN known
  const rawRecords: AttendanceRecord[] = studentPrn
    ? (studentQuery.data ?? [])
    : (allQuery.data ?? []);

  // Sort newest-first
  const records = [...rawRecords].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  const totalAttended = records.length;

  // Unique days present (proxy for "sessions attended")
  const uniqueDays = deriveSubjectGroups(records);
  const daysCount = uniqueDays.size;

  // Overall % — capped at 100
  // We compute a rolling 30-day window to show something meaningful
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentRecords = records.filter(
    (r) => now - Number(r.timestamp) / 1_000_000 < thirtyDaysMs,
  );
  // assume max 1 lecture/day over 30 days = 30 total possible
  const possibleLectures = Math.max(30, daysCount);
  const overallPct = Math.min(
    100,
    Math.round((recentRecords.length / possibleLectures) * 100),
  );

  const isLowAttendance = overallPct < 75 && totalAttended > 0;

  const kpiCards = [
    {
      label: "Overall Attendance",
      value: totalAttended === 0 ? "—" : `${overallPct}%`,
      icon: TrendingUp,
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#3B82F6",
    },
    {
      label: "Days Present",
      value: daysCount === 0 ? "0" : String(daysCount),
      icon: BookOpen,
      iconBg: "rgba(139,92,246,0.15)",
      iconColor: "#8B5CF6",
    },
    {
      label: "Total Check-ins",
      value: String(totalAttended),
      icon: CheckSquare,
      iconBg: "rgba(34,197,94,0.15)",
      iconColor: "#22C55E",
    },
    {
      label: "This Month",
      value: String(recentRecords.length),
      icon: Calendar,
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#F59E0B",
    },
  ];

  return (
    <div>
      <Topbar
        title="My Dashboard"
        subtitle={`Welcome back, ${user?.name ?? "Student"}`}
      />
      <div className="p-6 space-y-6">
        {/* Low attendance alert */}
        {isLowAttendance && (
          <div
            data-ocid="attendance.warning.overall"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: "var(--danger-bg)",
              borderColor: "rgba(239,68,68,0.3)",
              color: "var(--danger)",
            }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Low Attendance Alert: Your attendance is{" "}
              <strong>{overallPct}%</strong> — below the 75% threshold.
            </p>
          </div>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {kpiCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-5 border"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: card.iconBg }}
                  >
                    <card.icon
                      className="w-5 h-5"
                      style={{ color: card.iconColor }}
                    />
                  </div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {card.value}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {card.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {totalAttended === 0 ? (
              <EmptyAttendance />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Circular progress */}
                <div
                  className="rounded-2xl p-6 border flex flex-col items-center justify-center gap-4"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h2
                    className="text-base font-semibold self-start"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Overall Attendance
                  </h2>
                  <CircularProgress percentage={overallPct} />
                  <div className="w-full grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: "var(--success)" }}
                      >
                        {recentRecords.length}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        This Month
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {daysCount}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Days Present
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {totalAttended}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent check-ins timeline */}
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
                    Recent Check-ins
                  </h2>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {records.slice(0, 8).map((rec, i) => {
                      const ms = Number(rec.timestamp) / 1_000_000;
                      const d = new Date(ms);
                      const dateStr = d.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      });
                      const timeStr = d.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return (
                        <div
                          key={rec.id}
                          data-ocid={`subjects.item.${i + 1}`}
                          className="flex items-center gap-4 p-3 rounded-xl"
                          style={{ background: "var(--surface-2)" }}
                        >
                          <div
                            className="w-2 h-10 rounded-full flex-shrink-0"
                            style={{ background: "#3B82F6" }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className="text-sm font-medium truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {rec.student_name}
                              </span>
                              <span
                                className="text-xs ml-2 flex-shrink-0"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {timeStr}
                              </span>
                            </div>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {dateStr} · PRN: {rec.prn}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{
                              background: "var(--success-bg)",
                              color: "var(--success)",
                            }}
                          >
                            Present
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
