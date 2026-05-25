import { Moon, ShieldCheck, Sun, Wifi } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = useState<"faculty" | "student">("faculty");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoCredentials = {
    faculty: { username: "faculty@attendix.edu", password: "faculty123" },
    student: { username: "student@attendix.edu", password: "student123" },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const success = login(username, password);
    setLoading(false);
    if (!success)
      setError("Invalid credentials. Please check your username and password.");
  };

  const fillDemo = () => {
    setUsername(demoCredentials[role].username);
    setPassword(demoCredentials[role].password);
    setError("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--app-bg)", isolation: "isolate" }}
    >
      {/* Background pattern — pointer-events-none so it never intercepts taps */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        aria-hidden
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #3B82F6 0%, transparent 50%), radial-gradient(circle at 75% 75%, #8B5CF6 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Theme toggle */}
      <button
        type="button"
        data-ocid="login.toggle"
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl border transition-colors z-20"
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4 relative z-10"
        style={{ isolation: "isolate" }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Attendix
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Smart Classroom Attendance System
          </p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          {/* Role selector */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "var(--app-bg)" }}
          >
            {(["faculty", "student"] as const).map((r) => (
              <button
                key={r}
                type="button"
                data-ocid={`login.${r}.tab`}
                onClick={() => {
                  setRole(r);
                  setError("");
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                  background:
                    role === r
                      ? "linear-gradient(135deg, #3B82F6, #8B5CF6)"
                      : "transparent",
                  color: role === r ? "#fff" : "var(--text-secondary)",
                  boxShadow:
                    role === r ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "none",
                }}
              >
                {r === "faculty" ? "Faculty Login" : "Student Login"}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Username / Email
              </label>
              <input
                id="login-username"
                data-ocid="login.input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={demoCredentials[role].username}
                className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)",
                  position: "relative",
                  zIndex: 20,
                  touchAction: "manipulation",
                  fontSize: "16px",
                  WebkitUserSelect: "text",
                }}
                required
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                id="login-password"
                data-ocid="login.password_input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)",
                  position: "relative",
                  zIndex: 20,
                  touchAction: "manipulation",
                  fontSize: "16px",
                  WebkitUserSelect: "text",
                }}
                required
              />
            </div>

            {error && (
              <p
                data-ocid="login.error_state"
                className="text-sm"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </p>
            )}

            <button
              data-ocid="login.submit_button"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: loading
                  ? "#374151"
                  : "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(99, 102, 241, 0.4)",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div
            className="mt-5 rounded-xl p-4 border"
            style={{
              background: "var(--info-bg)",
              borderColor: "rgba(59,130,246,0.3)",
            }}
          >
            <div className="flex items-start gap-3">
              <Wifi
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--blue)" }}
              />
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <p
                  className="font-semibold mb-1"
                  style={{ color: "var(--blue)" }}
                >
                  Demo Credentials
                </p>
                <p>
                  <strong>Faculty:</strong> faculty@attendix.edu / faculty123
                </p>
                <p>
                  <strong>Student:</strong> student@attendix.edu / student123
                </p>
                <button
                  type="button"
                  data-ocid="login.secondary_button"
                  onClick={fillDemo}
                  className="mt-2 text-xs font-medium underline"
                  style={{ color: "var(--blue)" }}
                >
                  Fill {role} credentials →
                </button>
              </div>
            </div>
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-secondary)" }}
        >
          NFC + Face Recognition powered by ESP32
        </p>
      </motion.div>
    </div>
  );
}
