import Topbar from "@/components/layout/Topbar";
import {
  useAttendanceStats,
  useLiveCheckins,
  useStudentSectionCounts,
} from "@/hooks/useQueries";
import { BookOpen, TrendingUp, Users, Wifi, Zap } from "lucide-react";
import { motion } from "motion/react";

function formatNanoTs(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function FacultyDashboard() {
  const { data: stats, isLoading: statsLoading } = useAttendanceStats();
  const { data: liveCheckins, isLoading: checkinsLoading } = useLiveCheckins();
  const { data: sectionCounts, isLoading: sectionsLoading } =
    useStudentSectionCounts();

  const totalStudents = stats ? Number(stats.total_students) : 0;
  const todayCount = stats ? Number(stats.today_count) : 0;
  const totalRecords = stats ? Number(stats.total_records) : 0;
  const uniqueStudents = stats ? Number(stats.unique_students) : 0;
  const todayPct =
    totalStudents > 0 ? Math.round((todayCount / totalStudents) * 100) : 0;

  const recentCheckins = (liveCheckins ?? []).slice(0, 6);

  const kpiCards = [
    {
      label: "Total Students",
      value: String(totalStudents),
      delta: `${totalStudents} enrolled`,
      icon: Users,
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#3B82F6",
    },
    {
      label: "Today's Attendance",
      value: totalStudents > 0 ? `${todayPct}%` : "--",
      delta: `${todayCount} present today`,
      icon: TrendingUp,
      iconBg: "rgba(34,197,94,0.15)",
      iconColor: "#22C55E",
    },
    {
      label: "Total Check-ins",
      value: String(totalRecords),
      delta: "All time records",
      icon: BookOpen,
      iconBg: "rgba(99,102,241,0.15)",
      iconColor: "#6366F1",
    },
    {
      label: "Active Students",
      value: String(uniqueStudents),
      delta: `${uniqueStudents} active`,
      icon: Zap,
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#F59E0B",
    },
  ];

  const sections = [
    {
      key: "first_year",
      label: "First Year",
      count: Number(sectionCounts?.first_year ?? 0),
      color: "#3B82F6",
    },
    {
      key: "second_year",
      label: "Second Year",
      count: Number(sectionCounts?.second_year ?? 0),
      color: "#8B5CF6",
    },
    {
      key: "third_year",
      label: "Third Year",
      count: Number(sectionCounts?.third_year ?? 0),
      color: "#22C55E",
    },
    {
      key: "btech",
      label: "B.Tech",
      count: Number(sectionCounts?.btech ?? 0),
      color: "#F59E0B",
    },
  ];

  const loading = statsLoading || checkinsLoading || sectionsLoading;

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Welcome back, Prof. Attendix" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5 border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <card.icon
                    className="w-5 h-5"
                    style={{ color: card.iconColor }}
                  />
                </div>
              </div>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {loading && i < 2 ? (
                  <span
                    className="inline-block w-16 h-7 rounded animate-pulse"
                    style={{ background: "var(--surface-2)" }}
                  />
                ) : (
                  card.value
                )}
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {card.label}
              </p>
              <p className="text-xs mt-2" style={{ color: card.iconColor }}>
                {card.delta}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Section Breakdown */}
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
              Student Sections
            </h2>
            {sectionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((k) => (
                  <div
                    key={k}
                    className="h-12 rounded-lg animate-pulse"
                    style={{ background: "var(--surface-2)" }}
                  />
                ))}
              </div>
            ) : sections.every((s) => s.count === 0) ? (
              <div
                data-ocid="sections.empty_state"
                className="text-center py-8"
                style={{ color: "var(--text-secondary)" }}
              >
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No students enrolled yet</p>
                <p className="text-xs mt-1 opacity-60">
                  Add students to see section breakdown
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((s) => (
                  <div
                    key={s.key}
                    data-ocid={`sections.item.${s.key}`}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        background: `${s.color}20`,
                        color: s.color,
                      }}
                    >
                      {s.label[0]}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.label}
                      </p>
                      <div
                        className="w-full h-1.5 rounded-full mt-1"
                        style={{ background: "var(--surface)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${totalStudents > 0 ? (s.count / totalStudents) * 100 : 0}%`,
                            background: s.color,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Check-ins */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#22C55E" }}
              />
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Live Check-ins
              </h2>
            </div>
            {checkinsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((k) => (
                  <div
                    key={k}
                    className="h-10 rounded-lg animate-pulse"
                    style={{ background: "var(--surface-2)" }}
                  />
                ))}
              </div>
            ) : recentCheckins.length === 0 ? (
              <div
                data-ocid="checkins.empty_state"
                className="text-center py-8"
                style={{ color: "var(--text-secondary)" }}
              >
                <Wifi className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No check-ins yet</p>
                <p className="text-xs mt-1 opacity-60">Waiting for NFC taps…</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCheckins.map((c, i) => (
                  <div
                    key={c.id}
                    data-ocid={`checkins.item.${i + 1}`}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: "rgba(59,130,246,0.2)",
                        color: "#3B82F6",
                      }}
                    >
                      {getInitials(c.student_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.student_name}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        PRN: {c.prn}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatNanoTs(c.timestamp)}
                      </p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: "var(--success-bg)",
                          color: "var(--success)",
                        }}
                      >
                        <Wifi className="w-2.5 h-2.5" /> NFC
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
