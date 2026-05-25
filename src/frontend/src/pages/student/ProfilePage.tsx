import { BookOpen, Hash, Mail, User } from "lucide-react";
import Topbar from "../../components/layout/Topbar";

const STUDENT = {
  id: "STU2024001",
  name: "Alex Johnson",
  email: "student@attendix.edu",
  major: "Electronics & Telecommunication",
  year: "2nd Year",
  semester: "4th Semester",
  phone: "+1 (555) 234-5678",
  joinDate: "August 2024",
};

export default function ProfilePage() {
  return (
    <div>
      <Topbar title="Profile" subtitle="Your personal information" />
      <div className="p-6 space-y-6 max-w-3xl">
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                }}
              >
                AJ
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ background: "#22C55E", borderColor: "var(--surface)" }}
              />
            </div>
            <div className="flex-1">
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {STUDENT.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {STUDENT.major}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--info-bg)", color: "var(--blue)" }}
                >
                  {STUDENT.year}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--success-bg)",
                    color: "var(--success)",
                  }}
                >
                  {STUDENT.semester}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium font-mono"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {STUDENT.id}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--blue)" }}
              >
                —
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Overall Attendance
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: "Email Address", value: STUDENT.email },
            { icon: Hash, label: "Student ID", value: STUDENT.id },
            {
              icon: User,
              label: "Academic Year",
              value: `${STUDENT.year} — ${STUDENT.semester}`,
            },
            {
              icon: BookOpen,
              label: "Enrolled Since",
              value: STUDENT.joinDate,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl p-4 border flex items-center gap-4"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border-color)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--info-bg)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--blue)" }} />
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Enrolled Subjects
          </h3>
          <div
            data-ocid="profile.subjects.empty_state"
            className="flex flex-col items-center justify-center gap-3 py-10"
          >
            <BookOpen
              className="w-8 h-8"
              style={{ color: "var(--text-secondary)", opacity: 0.5 }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              No subjects enrolled yet
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Subject data will appear here once available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
