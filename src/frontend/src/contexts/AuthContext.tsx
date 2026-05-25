import type React from "react";
import { createContext, useContext, useRef, useState } from "react";

export type Role = "faculty" | "student";

export interface AuthUser {
  username: string;
  name: string;
  role: Role;
  studentId?: string;
}

interface StoredFacultyCreds {
  email: string;
  password: string;
  name: string;
}

const FALLBACK_FACULTY: StoredFacultyCreds = {
  email: "faculty@attendix.edu",
  password: "faculty123",
  name: "Prof. Attendix",
};

const STUDENT_CREDENTIAL = {
  username: "student@attendix.edu",
  password: "student123",
  user: {
    username: "student@attendix.edu",
    name: "Alex Johnson",
    role: "student" as Role,
    studentId: "STU2024001",
  },
};

/** Persist faculty credentials in sessionStorage so they survive page refresh within a session */
const FACULTY_CREDS_KEY = "attendix-faculty-creds";

function loadFacultyCreds(): StoredFacultyCreds {
  try {
    const raw = sessionStorage.getItem(FACULTY_CREDS_KEY);
    if (raw) return JSON.parse(raw) as StoredFacultyCreds;
  } catch {
    // ignore
  }
  return FALLBACK_FACULTY;
}

function saveFacultyCreds(creds: StoredFacultyCreds) {
  sessionStorage.setItem(FACULTY_CREDS_KEY, JSON.stringify(creds));
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  /** Called by SettingsPage after a successful credential update */
  updateCredentials: (name: string, email: string, password: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => false,
  logout: () => {},
  updateCredentials: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const facultyCredsRef = useRef<StoredFacultyCreds>(loadFacultyCreds());

  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem("attendix-user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (username: string, password: string): boolean => {
    // Check student first (fixed credentials)
    if (
      username === STUDENT_CREDENTIAL.username &&
      password === STUDENT_CREDENTIAL.password
    ) {
      setUser(STUDENT_CREDENTIAL.user);
      sessionStorage.setItem(
        "attendix-user",
        JSON.stringify(STUDENT_CREDENTIAL.user),
      );
      return true;
    }

    // Faculty: check against stored/updated credentials
    const fc = facultyCredsRef.current;
    if (username === fc.email && password === fc.password) {
      const facultyUser: AuthUser = {
        username: fc.email,
        name: fc.name,
        role: "faculty",
      };
      setUser(facultyUser);
      sessionStorage.setItem("attendix-user", JSON.stringify(facultyUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("attendix-user");
  };

  const updateCredentials = (name: string, email: string, password: string) => {
    const updated: StoredFacultyCreds = { name, email, password };
    facultyCredsRef.current = updated;
    saveFacultyCreds(updated);
    // Update the active session user so the topbar name refreshes immediately
    if (user?.role === "faculty") {
      const updatedUser: AuthUser = { username: email, name, role: "faculty" };
      setUser(updatedUser);
      sessionStorage.setItem("attendix-user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
