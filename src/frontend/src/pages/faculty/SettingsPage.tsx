import { createActor } from "@/backend";
import {
  useHotspotIp,
  useLocationConfig,
  useUpdateHotspotIp,
  useUpdateLocationConfig,
} from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Nfc,
  QrCode,
  Save,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Topbar from "../../components/layout/Topbar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../contexts/AuthContext";

export default function SettingsPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const { updateCredentials } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPasswordRef, setCurrentPasswordRef] = useState("");

  // Location config state
  const { data: locConfig, isLoading: locLoading } = useLocationConfig();
  const updateLocMutation = useUpdateLocationConfig();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("");
  const [locLabel, setLocLabel] = useState("");

  // Hotspot IP state
  const { data: hotspotIpData, isLoading: hotspotLoading } = useHotspotIp();
  const updateHotspotMutation = useUpdateHotspotIp();
  const [hotspotIp, setHotspotIp] = useState("");

  useEffect(() => {
    if (hotspotIpData !== undefined) {
      setHotspotIp(hotspotIpData);
    }
  }, [hotspotIpData]);

  useEffect(() => {
    if (locConfig) {
      setLat(String(locConfig.lat));
      setLng(String(locConfig.lng));
      setRadius(String(locConfig.radiusMeters));
      setLocLabel(locConfig.locationLabel);
    }
  }, [locConfig]);

  const { data: creds, isLoading } = useQuery({
    queryKey: ["faculty", "credentials"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.get_faculty_credentials();
    },
    enabled: !!actor && !isFetching,
  });

  useEffect(() => {
    if (creds) {
      setName(creds.name);
      setEmail(creds.email);
      setCurrentPasswordRef(creds.password);
    }
  }, [creds]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const passwordToSave = newPassword.trim() || currentPasswordRef;
      const ok = await actor.update_faculty_credentials(
        name.trim(),
        email.trim(),
        passwordToSave,
      );
      if (!ok) throw new Error("Backend rejected the update");
      return {
        name: name.trim(),
        email: email.trim(),
        password: passwordToSave,
      };
    },
    onSuccess: (saved) => {
      updateCredentials(saved.name, saved.email, saved.password);
      setCurrentPasswordRef(saved.password);
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["faculty", "credentials"] });
      toast.success("Settings updated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update settings");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    mutation.mutate();
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--app-bg)" }}
    >
      <Topbar title="Settings" subtitle="Manage your account credentials" />

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Account Settings
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Update your display name, login email, and password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile card */}
          <div
            className="rounded-2xl p-6 border space-y-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4" style={{ color: "var(--blue)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Profile Information
              </span>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="settings-name"
                style={{ color: "var(--text-secondary)" }}
              >
                Display Name
              </Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Input
                  id="settings-name"
                  data-ocid="settings.name_input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="rounded-xl"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="settings-email"
                style={{ color: "var(--text-secondary)" }}
              >
                Email / Username
              </Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Input
                  id="settings-email"
                  data-ocid="settings.email_input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@attendix.edu"
                  className="rounded-xl"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              )}
            </div>
          </div>

          {/* Password card */}
          <div
            className="rounded-2xl p-6 border space-y-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <KeyRound
                className="w-4 h-4"
                style={{ color: "var(--purple)" }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Change Password
              </span>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="settings-new-password"
                style={{ color: "var(--text-secondary)" }}
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="settings-new-password"
                  data-ocid="settings.new_password_input"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="rounded-xl pr-10"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {newPassword && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="settings-confirm-password"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="settings-confirm-password"
                    data-ocid="settings.confirm_password_input"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="rounded-xl pr-10"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p
                    data-ocid="settings.password_mismatch.error_state"
                    className="text-xs mt-1"
                    style={{ color: "var(--danger)" }}
                  >
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Leave the new password field blank to keep your current password
              unchanged.
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              data-ocid="settings.save_button"
              disabled={mutation.isPending || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                opacity: mutation.isPending || isLoading ? 0.7 : 1,
              }}
            >
              {mutation.isPending ? (
                <>
                  <span
                    data-ocid="settings.save.loading_state"
                    className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* ─── Attendance Location Settings ─────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #22C55E, #3B82F6)",
              }}
            >
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Attendance Location Settings
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Configure the allowed area for student check-ins
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 border space-y-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="loc-lat"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Center Latitude
                </Label>
                {locLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input
                    id="loc-lat"
                    data-ocid="settings.location.lat_input"
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="e.g. 18.5204"
                    className="rounded-xl"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="loc-lng"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Center Longitude
                </Label>
                {locLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input
                    id="loc-lng"
                    data-ocid="settings.location.lng_input"
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="e.g. 73.8567"
                    className="rounded-xl"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="loc-radius"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Radius (meters)
                </Label>
                {locLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input
                    id="loc-radius"
                    data-ocid="settings.location.radius_input"
                    type="number"
                    min={1}
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    placeholder="e.g. 100"
                    className="rounded-xl"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="loc-label"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Location Label
                </Label>
                {locLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input
                    id="loc-label"
                    data-ocid="settings.location.label_input"
                    type="text"
                    value={locLabel}
                    onChange={(e) => setLocLabel(e.target.value)}
                    placeholder="e.g. Main Campus"
                    className="rounded-xl"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                )}
              </div>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Students outside this radius cannot mark attendance.
            </p>

            <div className="flex justify-end">
              <Button
                type="button"
                data-ocid="settings.location.save_button"
                disabled={updateLocMutation.isPending || locLoading}
                onClick={() => {
                  const parsedLat = Number.parseFloat(lat);
                  const parsedLng = Number.parseFloat(lng);
                  const parsedRadius = Number.parseFloat(radius);
                  if (
                    Number.isNaN(parsedLat) ||
                    Number.isNaN(parsedLng) ||
                    Number.isNaN(parsedRadius)
                  ) {
                    toast.error(
                      "Please enter valid numbers for latitude, longitude, and radius",
                    );
                    return;
                  }
                  updateLocMutation.mutate(
                    {
                      lat: parsedLat,
                      lng: parsedLng,
                      radiusMeters: parsedRadius,
                      locationLabel: locLabel.trim(),
                    },
                    {
                      onSuccess: (res) => {
                        if (res.__kind__ === "ok") {
                          toast.success("Location settings saved");
                        } else {
                          toast.error(
                            res.err || "Failed to save location settings",
                          );
                        }
                      },
                      onError: (err: Error) => {
                        toast.error(
                          err.message || "Failed to save location settings",
                        );
                      },
                    },
                  );
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, #22C55E, #3B82F6)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                  opacity: updateLocMutation.isPending || locLoading ? 0.7 : 1,
                }}
              >
                {updateLocMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Location
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Faculty Hotspot Gateway IP ───────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #EF4444, #F97316)",
              }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Faculty Hotspot IP Lock
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Restrict attendance check-ins to the classroom network
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 border space-y-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="hotspot-ip"
                style={{ color: "var(--text-secondary)" }}
              >
                Gateway IP Address
              </Label>
              {hotspotLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Input
                  id="hotspot-ip"
                  data-ocid="settings.hotspot.ip_input"
                  type="text"
                  value={hotspotIp}
                  onChange={(e) => setHotspotIp(e.target.value)}
                  placeholder="e.g. 192.168.1.1"
                  className="rounded-xl font-mono"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              )}
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Enter your Faculty Hotspot router gateway IP (e.g. 192.168.1.1).
                Students not on this network will be blocked from the attendance
                page with a 403 Forbidden screen. Leave blank to disable the IP
                lock.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                data-ocid="settings.hotspot.save_button"
                disabled={updateHotspotMutation.isPending || hotspotLoading}
                onClick={() => {
                  updateHotspotMutation.mutate(hotspotIp.trim(), {
                    onSuccess: (ok) => {
                      if (ok) {
                        toast.success("Hotspot IP saved");
                      } else {
                        toast.error("Failed to save hotspot IP");
                      }
                    },
                    onError: (err: Error) => {
                      toast.error(err.message || "Failed to save hotspot IP");
                    },
                  });
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, #EF4444, #F97316)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
                  opacity:
                    updateHotspotMutation.isPending || hotspotLoading ? 0.7 : 1,
                }}
              >
                {updateHotspotMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save IP Lock
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── QR Code & NFC Section ────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #EF4444)",
              }}
            >
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Attendance URL
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Share this short link with your ESP device for QR and NFC
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 border space-y-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Share this URL with your ESP device
              </p>
              <div className="p-4 rounded-xl" style={{ background: "#fff" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `${window.location.origin}/a`,
                  )}`}
                  alt="Attendance QR Code"
                  className="w-48 h-48"
                  data-ocid="settings.qr_code.image"
                />
              </div>
              <code
                className="px-3 py-1.5 rounded-lg text-sm font-mono"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {`${window.location.origin}/a`}
              </code>
            </div>

            {/* NFC */}
            <div
              className="pt-5 border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Nfc className="w-4 h-4" style={{ color: "var(--blue)" }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  NFC Tag Programming
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Program your NFC tags to open:{" "}
                <code
                  className="ml-1 px-2 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {`${window.location.origin}/a`}
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
