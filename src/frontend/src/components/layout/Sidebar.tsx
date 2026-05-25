import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const facultyNav = [
  { label: "Dashboard", to: "/faculty", icon: LayoutDashboard, exact: true },
  { label: "Students", to: "/faculty/students", icon: Users, exact: false },
  {
    label: "Attendance",
    to: "/faculty/attendance",
    icon: ClipboardCheck,
    exact: false,
  },
  {
    label: "Analytics",
    to: "/faculty/analytics",
    icon: BarChart3,
    exact: false,
  },
  { label: "Lectures", to: "/faculty/lectures", icon: BookOpen, exact: false },
  {
    label: "Proxy Alerts",
    to: "/faculty/proxy-alerts",
    icon: ShieldAlert,
    exact: false,
  },
  { label: "Reports", to: "/faculty/reports", icon: FileText, exact: false },
  { label: "Settings", to: "/faculty/settings", icon: Settings2, exact: false },
];

const studentNav = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard, exact: true },
  {
    label: "My Attendance",
    to: "/student/attendance",
    icon: ClipboardCheck,
    exact: false,
  },
  { label: "Subjects", to: "/student/subjects", icon: BookOpen, exact: false },
  { label: "History", to: "/student/history", icon: History, exact: false },
  { label: "Profile", to: "/student/profile", icon: UserCircle, exact: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = user?.role === "faculty" ? facultyNav : studentNav;
  const currentPath = routerState.location.pathname;

  const isActive = (to: string, exact: boolean) => {
    if (exact) return currentPath === to;
    return currentPath.startsWith(to);
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
        >
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span
            className="font-bold text-base"
            style={{ color: "var(--text-primary)" }}
          >
            Attendix
          </span>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {user?.role === "faculty" ? "Faculty Portal" : "Student Portal"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
            >
              <div
                data-ocid={`sidebar.${item.label.toLowerCase().replace(/ /g, "_")}.link`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: active
                    ? "linear-gradient(135deg, #3B82F6, #8B5CF6)"
                    : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  boxShadow: active
                    ? "0 4px 16px rgba(99,102,241,0.3)"
                    : "none",
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div
        className="px-3 pb-4 border-t pt-4"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
          style={{ background: "var(--surface-2)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            {user?.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {user?.role === "faculty" ? "Faculty" : user?.studentId}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-ocid="sidebar.logout.button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "var(--text-secondary)" }}
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        data-ocid="sidebar.menu.toggle"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop dismiss
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0"
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
