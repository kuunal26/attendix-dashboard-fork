import { BookOpen } from "lucide-react";
import Topbar from "../../components/layout/Topbar";

export default function SubjectsPage() {
  return (
    <div>
      <Topbar title="Subjects" subtitle="Your enrolled subjects and details" />
      <div className="p-6 space-y-6">
        <div
          data-ocid="subjects.empty_state"
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
            <BookOpen className="w-8 h-8" style={{ color: "#3B82F6" }} />
          </div>
          <div className="text-center">
            <p
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              No subjects enrolled yet
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Subject data will appear here once available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
