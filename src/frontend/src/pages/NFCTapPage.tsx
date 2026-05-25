import { createActor } from "@/backend";
import type { MarkAttendanceRequest, MarkAttendanceResponse } from "@/backend";
import {
  useHotspotIp,
  useLocationConfig,
  useMarkAttendance,
} from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertCircle,
  CheckCircle,
  Crosshair,
  MapPin,
  Shield,
  ShieldOff,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// TOTP math lives on the backend only — frontend passes token through

/** Haversine distance in metres between two lat/lng points */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── 403 Forbidden Component ──────────────────────────────────────────────────
function ForbiddenPage() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-6 bg-background"
      data-ocid="nfc_tap.forbidden.page"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: "var(--danger-bg)" }}
      >
        <ShieldOff className="w-10 h-10" style={{ color: "var(--danger)" }} />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">403 Forbidden</h1>
      <p className="text-base text-muted-foreground text-center max-w-sm">
        Unauthorized Network
      </p>
      <p className="text-sm text-muted-foreground/70 text-center max-w-sm mt-2">
        You must be connected to the Faculty Hotspot to mark attendance. Please
        connect to the designated classroom network and try again.
      </p>
    </div>
  );
}
type GateStatus = "pending" | "pass" | "fail";

export default function NFCTapPage() {
  const { actor } = useActor(createActor);
  const markMutation = useMarkAttendance();
  const { data: locationConfig } = useLocationConfig();
  const { data: configuredGatewayIp } = useHotspotIp();

  const [prn, setPrn] = useState("");
  const [studentName, setStudentName] = useState<string | null>(null);
  const [prnError, setPrnError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  // null = still checking IP, false = allowed, true = blocked
  const [ipBlocked, setIpBlocked] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"form" | "submitting" | "success" | "error">(
    "form",
  );
  const [successTime, setSuccessTime] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const autoResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract token from URL param ?t=TOKEN (QR short form) or ?token= (legacy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t") ?? params.get("token") ?? "";
    setToken(t);
  }, []);

  // Fetch client IP and check against configured gateway IP
  useEffect(() => {
    if (configuredGatewayIp === undefined) return; // still loading
    const gatewayIp = (configuredGatewayIp ?? "").trim();
    if (!gatewayIp) {
      // Not configured — skip IP check
      setIpBlocked(false);
      return;
    }
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data: { ip: string }) => {
        setIpBlocked(data.ip !== gatewayIp);
      })
      .catch(() => {
        // If IP check fails due to network issues, fail open
        setIpBlocked(false);
      });
  }, [configuredGatewayIp]);

  // Request geolocation
  useEffect(() => {
    if (!locationConfig) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        const dist = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          locationConfig.lat,
          locationConfig.lng,
        );
        setDistance(dist);
        setGeoError("");
      },
      (err) => {
        setGeoError(err.message || "Location access denied");
      },
      { timeout: 10000, maximumAge: 0 },
    );
  }, [locationConfig]);

  // Validate PRN on blur
  const handlePrnBlur = async () => {
    if (!prn.trim() || prn.trim().length < 3) {
      setStudentName(null);
      setPrnError("PRN must be at least 3 characters");
      return;
    }
    if (!actor) {
      setPrnError("Backend not ready");
      return;
    }
    try {
      const student = await actor.get_student_by_prn(prn.trim());
      if (student) {
        setStudentName(student.name);
        setPrnError("");
      } else {
        setStudentName(null);
        setPrnError("Student not found");
      }
    } catch {
      setStudentName(null);
      setPrnError("Failed to validate PRN");
    }
  };

  const gates: {
    label: string;
    status: GateStatus;
    icon: React.ElementType;
  }[] = [
    {
      // Token presence shown — backend performs actual TOTP validation
      label: "QR Token Present",
      status: token ? "pass" : "pending",
      icon: Shield,
    },
    {
      label: "Location in Range",
      status:
        distance !== null && locationConfig
          ? distance <= locationConfig.radiusMeters
            ? "pass"
            : "fail"
          : geoError
            ? "fail"
            : "pending",
      icon: MapPin,
    },
    {
      label: "PRN Exists",
      status: studentName ? "pass" : prnError ? "fail" : "pending",
      icon: User,
    },
    {
      label: "Not Already Marked",
      status: "pending",
      icon: Crosshair,
    },
  ];

  // Geo is soft: submission allowed even outside radius (backend sets GEO_FAIL)
  // Token validation is backend-only: only require presence here
  const canSubmit = !!token && !!studentName;

  const resetForm = useCallback(() => {
    setPrn("");
    setStudentName(null);
    setPrnError("");
    setErrorMsg("");
    setSuccessTime("");
    setStep("form");
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t") ?? params.get("token") ?? "";
    setToken(t);
  }, []);

  // Auto-reset after success/error
  useEffect(() => {
    if (step === "success" || step === "error") {
      autoResetRef.current = setTimeout(resetForm, 5000);
    }
    return () => {
      if (autoResetRef.current) clearTimeout(autoResetRef.current);
    };
  }, [step, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !actor) return;

    setStep("submitting");

    const req: MarkAttendanceRequest = {
      prn: prn.trim(),
      latitude: userLat ?? 0,
      longitude: userLng ?? 0,
      token: BigInt(token),
      image_url: "",
      device_info: navigator.userAgent,
    };

    try {
      const response: MarkAttendanceResponse =
        await markMutation.mutateAsync(req);
      if (response.__kind__ === "ok") {
        setSuccessTime(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
        );
        setStep("success");
      } else if (response.__kind__ === "alreadyMarked") {
        setErrorMsg("You have already marked attendance for today.");
        setStep("error");
      } else if (response.__kind__ === "invalidPRN") {
        setErrorMsg("Invalid PRN. Please check and try again.");
        setStep("error");
      } else {
        // __kind__ === "error" — may include token validation errors from backend
        const errMsg =
          (response as { __kind__: "error"; error: string }).error ?? "";
        if (
          errMsg.toLowerCase().includes("token") ||
          errMsg.toLowerCase().includes("invalid")
        ) {
          setErrorMsg("QR code expired or invalid. Please scan a fresh code.");
        } else {
          setErrorMsg(errMsg || "Something went wrong. Please try again.");
        }
        setStep("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    }
  };

  // Hard block — replace entire DOM for unauthorized network
  if (ipBlocked === true) {
    return <ForbiddenPage />;
  }

  // IP check still in-flight — show neutral spinner, do NOT flash the form
  if (ipBlocked === null) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center bg-background"
        data-ocid="nfc_tap.ip_loading_state"
      >
        <span className="nfc-spinner w-8 h-8" aria-label="Verifying network…" />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-6 bg-background"
      data-ocid="nfc_tap.page"
    >
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-1 select-none">
        <div className="flex items-center gap-2">
          <Wifi className="w-6 h-6 text-primary" aria-hidden />
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Attendix
          </span>
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">
          Tap to Mark Attendance
        </span>
      </div>

      {/* Token status banner — presence only; backend validates TOTP math */}
      {!token && (
        <div
          className="w-full max-w-sm rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3 flex items-center gap-3 mb-4"
          role="alert"
          data-ocid="nfc_tap.token_error_banner"
        >
          <AlertCircle
            className="w-5 h-5 shrink-0 text-destructive"
            aria-hidden
          />
          <p className="text-sm font-semibold text-destructive text-left">
            No QR token — please scan a fresh QR code
          </p>
        </div>
      )}

      {!!token && (
        <output
          className="w-full max-w-sm rounded-xl border border-success/60 bg-success/10 px-4 py-2 flex items-center justify-between mb-4"
          data-ocid="nfc_tap.token_valid_banner"
        >
          <span className="text-sm font-medium text-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> QR token received
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            #{token}
          </span>
        </output>
      )}

      {/* Main form */}
      {step === "form" && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-5"
          data-ocid="nfc_tap.prn_form"
          noValidate
        >
          {/* Location status */}
          {geoError ? (
            <div
              className="w-full rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3 flex items-center gap-3"
              role="alert"
              data-ocid="nfc_tap.location_error_banner"
            >
              <AlertCircle
                className="w-5 h-5 shrink-0 text-destructive"
                aria-hidden
              />
              <p className="text-sm font-semibold text-destructive text-left">
                {geoError}
              </p>
            </div>
          ) : distance !== null && locationConfig ? (
            distance <= locationConfig.radiusMeters ? (
              <output
                className="w-full rounded-xl border border-success/60 bg-success/10 px-4 py-2 flex items-center gap-2"
                data-ocid="nfc_tap.location_verified_banner"
              >
                <MapPin className="w-4 h-4 text-success" aria-hidden />
                <span className="text-sm font-medium text-success">
                  Location verified — {locationConfig.locationLabel}
                </span>
              </output>
            ) : (
              <div
                className="w-full rounded-xl border border-amber-500/60 bg-amber-500/10 px-4 py-3 flex items-center gap-3"
                role="alert"
                data-ocid="nfc_tap.location_mismatch_banner"
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0"
                  style={{ color: "var(--warning)" }}
                  aria-hidden
                />
                <p
                  className="text-sm font-semibold text-left"
                  style={{ color: "var(--warning)" }}
                >
                  Outside allowed area ({Math.round(distance)}m away) —
                  attendance will be flagged
                </p>
              </div>
            )
          ) : (
            <div
              className="w-full rounded-xl border border-muted/60 bg-muted/10 px-4 py-2 flex items-center gap-2"
              data-ocid="nfc_tap.location_loading_state"
            >
              <span className="nfc-spinner w-4 h-4" aria-hidden />
              <span className="text-sm text-muted-foreground">
                Verifying location…
              </span>
            </div>
          )}

          {/* PRN Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="prn-input"
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Enter Full PRN
            </label>
            <input
              id="prn-input"
              data-ocid="nfc_tap.prn_input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="PRN Number"
              value={prn}
              onChange={(e) => {
                setPrn(e.target.value.replace(/\D/g, ""));
                if (prnError) setPrnError("");
              }}
              onBlur={handlePrnBlur}
              className="nfc-input text-center text-3xl tracking-[0.15em] h-14 md:h-16"
              aria-invalid={!!prnError}
              aria-describedby={prnError ? "prn-error" : undefined}
            />
            {studentName && !prnError && (
              <p
                className="text-sm text-success text-center font-medium"
                data-ocid="nfc_tap.student_name"
              >
                {studentName}
              </p>
            )}
            {prnError && (
              <p
                id="prn-error"
                data-ocid="nfc_tap.prn_field_error"
                className="text-sm text-destructive mt-1 text-center"
                role="alert"
              >
                {prnError}
              </p>
            )}
          </div>

          {/* 4-Point Gate Checklist */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
            data-ocid="nfc_tap.gate_checklist"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Verification Checklist
            </p>
            {gates.map((gate, i) => {
              return (
                <div
                  key={gate.label}
                  data-ocid={`nfc_tap.gate.item.${i + 1}`}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        gate.status === "pass"
                          ? "var(--success-bg)"
                          : gate.status === "fail"
                            ? "var(--danger-bg)"
                            : "var(--surface-2)",
                    }}
                  >
                    {gate.status === "pass" ? (
                      <CheckCircle
                        className="w-4 h-4"
                        style={{ color: "var(--success)" }}
                      />
                    ) : gate.status === "fail" ? (
                      <XCircle
                        className="w-4 h-4"
                        style={{ color: "var(--danger)" }}
                      />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color:
                        gate.status === "pass"
                          ? "var(--success)"
                          : gate.status === "fail"
                            ? "var(--danger)"
                            : "var(--text-secondary)",
                    }}
                  >
                    {gate.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            data-ocid="nfc_tap.submit_button"
            className="nfc-button text-base"
            disabled={!canSubmit || markMutation.isPending}
          >
            {markMutation.isPending ? "Marking…" : "MARK ATTENDANCE"}
          </button>
        </form>
      )}

      {/* Submitting */}
      {step === "submitting" && (
        <div
          className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
          data-ocid="nfc_tap.capturing.loading_state"
        >
          <span className="nfc-spinner" aria-hidden />
          <p className="text-sm text-muted-foreground">Marking attendance…</p>
        </div>
      )}

      {/* Success */}
      {step === "success" && (
        <div
          className="w-full max-w-sm flex flex-col items-center gap-4 text-center"
          data-ocid="nfc_tap.success_state"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--success-bg)" }}
          >
            <CheckCircle
              className="w-10 h-10"
              style={{ color: "var(--success)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground">
              Attendance Marked!
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              {studentName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              at {successTime}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Resetting in 5 seconds…
          </p>
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div
          className="w-full max-w-sm flex flex-col items-center gap-4 text-center"
          data-ocid="nfc_tap.error_state"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--danger-bg)" }}
          >
            <AlertCircle
              className="w-10 h-10"
              style={{ color: "var(--danger)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-foreground">
              Unable to Mark Attendance
            </h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Resetting in 5 seconds…
          </p>
        </div>
      )}
    </div>
  );
}
