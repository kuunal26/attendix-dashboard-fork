import { Bell, Moon, Search, Sun } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b"
      style={{
        background: "var(--app-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <Search className="w-4 h-4" />
          <input
            data-ocid="topbar.search_input"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-40"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          data-ocid="topbar.notification.button"
          className="relative p-2.5 rounded-xl border transition-colors"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--danger)" }}
          />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          data-ocid="topbar.theme.toggle"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border transition-colors"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
            color: "var(--text-secondary)",
          }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Profile chip */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            {user?.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <span
            className="text-sm font-medium hidden sm:block"
            style={{ color: "var(--text-primary)" }}
          >
            {user?.name.split(" ")[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
