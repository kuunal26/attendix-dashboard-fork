import { Outlet } from "@tanstack/react-router";
import Sidebar from "./Sidebar";

export default function StudentLayout() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--app-bg)" }}
    >
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
