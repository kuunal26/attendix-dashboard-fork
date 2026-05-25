import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import FacultyLayout from "./components/layout/FacultyLayout";
import StudentLayout from "./components/layout/StudentLayout";
import LoginPage from "./pages/LoginPage";
import NFCTapPage from "./pages/NFCTapPage";
import AnalyticsPage from "./pages/faculty/AnalyticsPage";
import AttendancePage from "./pages/faculty/AttendancePage";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import LecturesPage from "./pages/faculty/LecturesPage";
import ProxyAlertsPage from "./pages/faculty/ProxyAlertsPage";
import ReportsPage from "./pages/faculty/ReportsPage";
import SettingsPage from "./pages/faculty/SettingsPage";
import StudentsPage from "./pages/faculty/StudentsPage";
import HistoryPage from "./pages/student/HistoryPage";
import MyAttendancePage from "./pages/student/MyAttendancePage";
import ProfilePage from "./pages/student/ProfilePage";
import StudentDashboard from "./pages/student/StudentDashboard";
import SubjectsPage from "./pages/student/SubjectsPage";

// Auth guard wrapper
function RequireAuth({
  children,
  userRole,
}: { children: React.ReactNode; userRole: "faculty" | "student" }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role !== userRole)
    return <Navigate to={user.role === "faculty" ? "/faculty" : "/student"} />;
  return <>{children}</>;
}

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function LoginRoute() {
    const { user } = useAuth();
    if (user?.role === "faculty") return <Navigate to="/faculty" />;
    if (user?.role === "student") return <Navigate to="/student" />;
    return <LoginPage />;
  },
});

// Faculty routes
const facultyLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faculty",
  component: function FacultyGuard() {
    return (
      <RequireAuth userRole="faculty">
        <FacultyLayout />
      </RequireAuth>
    );
  },
});

const facultyDashRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/",
  component: FacultyDashboard,
});

const facultyStudentsRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/students",
  component: StudentsPage,
});

const facultyAttendanceRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/attendance",
  component: AttendancePage,
});

const facultyAnalyticsRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

const facultyLecturesRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/lectures",
  component: LecturesPage,
});

const facultyProxyRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/proxy-alerts",
  component: ProxyAlertsPage,
});

const facultyReportsRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/reports",
  component: ReportsPage,
});

const facultySettingsRoute = createRoute({
  getParentRoute: () => facultyLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

// Student routes
const studentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  component: function StudentGuard() {
    return (
      <RequireAuth userRole="student">
        <StudentLayout />
      </RequireAuth>
    );
  },
});

const studentDashRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/",
  component: StudentDashboard,
});

const studentAttendanceRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/attendance",
  component: MyAttendancePage,
});

const studentSubjectsRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/subjects",
  component: SubjectsPage,
});

const studentHistoryRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/history",
  component: HistoryPage,
});

const studentProfileRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

// NFC Tap route — no auth guard
const nfcTapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nfc-tap",
  component: NFCTapPage,
});

// Short alias /a for QR readability on small ESP displays
const shortAttendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/a",
  component: NFCTapPage,
});
// Short alias /q for ESP QR code displays (TOTP token param: /q?t=TOKEN)
const qrAttendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/q",
  component: NFCTapPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  nfcTapRoute,
  shortAttendanceRoute,
  qrAttendanceRoute,
  facultyLayoutRoute.addChildren([
    facultyDashRoute,
    facultyStudentsRoute,
    facultyAttendanceRoute,
    facultyAnalyticsRoute,
    facultyLecturesRoute,
    facultyProxyRoute,
    facultyReportsRoute,
    facultySettingsRoute,
  ]),
  studentLayoutRoute.addChildren([
    studentDashRoute,
    studentAttendanceRoute,
    studentSubjectsRoute,
    studentHistoryRoute,
    studentProfileRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
