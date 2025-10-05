import { useEffect, useMemo, useRef, useState } from "react";
import { fetchShiftManifest, ShiftManifest } from "../data/mockApi";
import { useGeofenceDistance } from "../hooks/useGeofenceDistance";
import {
  formatDistance,
  formatDurationFromNow,
  formatDurationHms
} from "../utils/format";
import SchedulePlanner from "../components/SchedulePlanner";

const quickActions = [
  { id: "view-schedule", label: "My Schedule", icon: "📅" },
  { id: "report-issue", label: "Report Issue", icon: "🚨" },
  { id: "view-updates", label: "Updates", icon: "📢", badge: "3 new" },
  { id: "solidarity-wall", label: "Solidarity Wall", icon: "✊" }
];

const GEOFENCE_TARGET = { lat: 37.78081, lng: -122.40524 };
const GEOFENCE_RADIUS_METERS = 120;
const WORKER_USER_ID = "worker-jordan";

type ShiftMode = "idle" | "running" | "paused";

type StopReason = "geofence" | "manual" | undefined;

interface ShiftState {
  mode: ShiftMode;
  startedAt: number | null;
  baseMs: number;
  lastStoppedReason?: StopReason;
}

const computeElapsedMs = (state: ShiftState): number => {
  if (state.mode === "running" && state.startedAt != null) {
    return state.baseMs + (Date.now() - state.startedAt);
  }
  return state.baseMs;
};

function WorkerMobilePage() {
  const [manifest, setManifest] = useState<ShiftManifest | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: true });
  const [now, setNow] = useState(() => new Date());
  const [timePalette, setTimePalette] = useState(() => resolveTimePalette(new Date()));
  const [shiftState, setShiftState] = useState<ShiftState>({
    mode: "idle",
    startedAt: null,
    baseMs: 0,
    lastStoppedReason: undefined
  });
  const [tick, setTick] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleDialogRef = useRef<HTMLDialogElement | null>(null);

  const geofence = useGeofenceDistance({
    target: GEOFENCE_TARGET,
    radiusMeters: GEOFENCE_RADIUS_METERS,
    simulateWhenUnavailable: true
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchShiftManifest();
        if (mounted) {
          setManifest(data);
          setStatus({ loading: false });
        }
      } catch (error) {
        console.error(error);
        if (mounted) setStatus({ loading: false, error: "Unable to load shift manifest." });
      }
    };
    load();

    const interval = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updatePalette = () => {
      const current = new Date();
      setNow(current);
      setTimePalette(resolveTimePalette(current));
    };

    updatePalette();
    const paletteInterval = setInterval(updatePalette, 60_000);
    return () => clearInterval(paletteInterval);
  }, []);

  useEffect(() => {
    if (shiftState.mode !== "running") return;
    const id = window.setInterval(() => setTick(t => (t + 1) % Number.MAX_SAFE_INTEGER), 1000);
    return () => clearInterval(id);
  }, [shiftState.mode]);

  useEffect(() => {
    if (shiftState.mode !== "running") return;
    if (geofence.isInside === false) {
      setShiftState(prev => {
        if (prev.mode !== "running") return prev;
        const total = computeElapsedMs(prev);
        return {
          mode: "paused",
          startedAt: null,
          baseMs: total,
          lastStoppedReason: "geofence"
        };
      });
    }
  }, [geofence.isInside, shiftState.mode]);

  const activeCount = useMemo(
    () => manifest?.workers.filter(worker => worker.status === "Active").length ?? 0,
    [manifest]
  );

  const elapsedMs = useMemo(
    () => computeElapsedMs(shiftState),
    // include tick and now to re-render while running and update timestamps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shiftState, tick, now]
  );

  const distanceLabel = geofence.distanceMeters != null ? formatDistance(geofence.distanceMeters) : null;
  const outsideMeters = geofence.distanceMeters != null
    ? Math.max(0, geofence.distanceMeters - GEOFENCE_RADIUS_METERS)
    : null;
  const outsideLabel = outsideMeters && outsideMeters > 0 ? formatDistance(outsideMeters) : null;

  const geofenceBadgeText = useMemo(() => {
    switch (geofence.status) {
      case "locating":
        return "Locating...";
      case "denied":
        return "Location blocked";
      case "unsupported":
        return "Location unavailable";
      case "error":
        return "Signal lost";
      case "ready":
      case "simulated":
        if (geofence.isInside === false) {
          return outsideLabel ? `Outside by ${outsideLabel}` : "Outside geofence";
        }
        if (distanceLabel) {
          return `${distanceLabel} from center`;
        }
        return "Within geofence";
      default:
        return "Checking status";
    }
  }, [distanceLabel, geofence.isInside, geofence.status, outsideLabel]);

  const geofenceHint = useMemo(() => {
    if (geofence.isInside === false) {
      return outsideLabel
        ? `You are ${outsideLabel} outside the perimeter. Return within ${formatDistance(
            GEOFENCE_RADIUS_METERS
          )} to resume.`
        : "You are outside the geofence. Return to resume tracking.";
    }
    switch (geofence.status) {
      case "locating":
        return "Waiting for GPS lock...";
      case "denied":
        return "Location denied. Using simulated distance so you can preview the workflow.";
      case "unsupported":
        return "Location not available on this device.";
      default:
        return distanceLabel ? `Distance to hub: ${distanceLabel}.` : "Tap to manage your shift.";
    }
  }, [distanceLabel, geofence.isInside, geofence.status, outsideLabel]);

  const primaryActionLabel = useMemo(() => {
    if (shiftState.mode === "running") return "Pause Shift";
    if (shiftState.mode === "paused") return geofence.isInside === true ? "Resume Shift" : "Awaiting Entry";
    return "Start Shift";
  }, [geofence.isInside, shiftState.mode]);

  const canOperateInside = geofence.isInside === true;
  const primaryActionDisabled =
    shiftState.mode !== "running" && !canOperateInside;

  const paletteStyle = useMemo(
    () => ({
      backgroundImage: timePalette.gradient,
      boxShadow: timePalette.shadow
    }),
    [timePalette]
  );

  const textStyle = useMemo(() => ({ color: timePalette.textColor }), [timePalette]);
  const mutedTextStyle = useMemo(() => ({ color: timePalette.mutedText }), [timePalette]);
  const badgeStyle = useMemo(
    () => ({ backgroundColor: timePalette.badgeBg, color: timePalette.badgeText }),
    [timePalette]
  );
  const buttonStyle = useMemo(
    () => ({ backgroundColor: timePalette.buttonBg, color: timePalette.buttonText }),
    [timePalette]
  );

  const timerStatus = shiftState.mode === "running"
    ? "On shift"
    : shiftState.lastStoppedReason === "geofence"
    ? "Paused • outside zone"
    : "Not checked in";

  const elapsedDisplay = formatDurationHms(elapsedMs);
  const todayDisplay = formatDurationHms(shiftState.baseMs);

  const geofenceAlertVariant =
    geofence.isInside === false ? "alert-warning" : geofence.status === "ready" ? "alert-info" : "alert-info";

  const geofenceAlertMessage = (() => {
    if (geofence.isInside === false) {
      return outsideLabel
        ? `You are ${outsideLabel} outside the Acme Factory geofence. Head back inside the perimeter to resume.`
        : "You are outside the geofence. Move toward the checkpoint to resume.";
    }
    switch (geofence.status) {
      case "locating":
        return "Trying to lock onto your location...";
      case "denied":
        return "Location permissions are blocked. Showing a simulated preview.";
      case "unsupported":
        return "This device cannot share location data. Manual check-in is recommended.";
      default:
        return distanceLabel ? `You are ${distanceLabel} from the center of the line.` : "Location synced.";
    }
  })();

  const handlePrimaryAction = () => {
    setShiftState(prev => {
      if (prev.mode === "running") {
        const total = computeElapsedMs(prev);
        return {
          mode: "paused",
          startedAt: null,
          baseMs: total,
          lastStoppedReason: "manual"
        };
      }

      if (prev.mode === "paused") {
        if (!canOperateInside) return prev;
        return {
          mode: "running",
          startedAt: Date.now(),
          baseMs: prev.baseMs,
          lastStoppedReason: undefined
        };
      }

      if (!canOperateInside) return prev;
      return {
        mode: "running",
        startedAt: Date.now(),
        baseMs: prev.baseMs,
        lastStoppedReason: undefined
      };
    });
  };

  const handleManualCheckIn = () => {
    setShiftState(prev => ({
      mode: "running",
      startedAt: Date.now(),
      baseMs: prev.baseMs,
      lastStoppedReason: undefined
    }));
  };

  const handleEndShift = () => {
    setShiftState({
      mode: "idle",
      startedAt: null,
      baseMs: 0,
      lastStoppedReason: "manual"
    });
  };

  const handleBreak = () => {
    setShiftState(prev => {
      if (prev.mode !== "running") return prev;
      const total = computeElapsedMs(prev);
      return {
        mode: "paused",
        startedAt: null,
        baseMs: total,
        lastStoppedReason: "manual"
      };
    });
  };

  useEffect(() => {
    const dialog = scheduleDialogRef.current;
    if (!dialog) return;
    const handleClose = () => setScheduleOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  useEffect(() => {
    const dialog = scheduleDialogRef.current;
    if (!dialog) return;
    if (scheduleOpen && !dialog.open) {
      dialog.showModal();
    } else if (!scheduleOpen && dialog.open) {
      dialog.close();
    }
  }, [scheduleOpen]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <header className="flex items-center justify-between rounded-2xl bg-base-100/80 px-4 py-5 shadow-lg">
        <div>
          <h2 className="text-xl font-bold">Welcome back, Jordan</h2>
          <p className="text-sm text-base-content/60">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            }).format(now)}
          </p>
        </div>
        <div className="avatar placeholder">
          <div className="w-12 rounded-full bg-primary text-primary-content">
            <span className="text-lg font-semibold">JW</span>
          </div>
        </div>
      </header>

      <button
        id="shift-timer-widget"
        className="card overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-2xl"
        type="button"
        style={paletteStyle}
        onClick={() => {
          const modal = document.getElementById("shift-actions-modal") as HTMLDialogElement | null;
          modal?.showModal();
        }}
      >
        <div className="card-body gap-3 p-4" style={textStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="badge badge-sm border-0" style={badgeStyle}>
                <span className="text-xs font-medium">📍 {geofenceBadgeText}</span>
              </div>
            </div>
            <div className="text-xl">⏱️</div>
          </div>
          <div className="text-4xl font-bold leading-none">{elapsedDisplay}</div>
          <div className="flex items-center justify-between text-sm" style={mutedTextStyle}>
            <span>{timerStatus}</span>
            <span className="text-xs font-medium">Tap to manage →</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide opacity-80">
            <span>
              {timePalette.icon} {timePalette.label}
            </span>
            <span>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)}</span>
          </div>
        </div>
      </button>

      <section
        className="card overflow-hidden rounded-2xl shadow-2xl"
        style={paletteStyle}
      >
        <div className="card-body gap-3 p-5" style={textStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="badge badge-sm border-0" style={badgeStyle}>
                Status
              </div>
              <span className="text-xs font-semibold uppercase opacity-80" style={mutedTextStyle}>
                {timePalette.icon} {timePalette.label}
              </span>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
          <h3 className="text-2xl font-bold">{timerStatus}</h3>
          <p className="text-sm" style={mutedTextStyle}>
            {geofenceHint}
          </p>
          <button
            id="quick-checkin"
            className="btn btn-block border-0 transition hover:opacity-95"
            style={buttonStyle}
            onClick={handlePrimaryAction}
            disabled={primaryActionDisabled}
          >
            <span className="text-xl">📍</span>
            {primaryActionLabel}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {quickActions.map(action => (
          <button
            key={action.id}
            id={action.id}
            className="card bg-base-200/80 transition-colors hover:bg-base-300/60"
            onClick={() => {
              if (action.id === "view-schedule") {
                setScheduleOpen(true);
              } else {
                console.info(action.id);
              }
            }}
          >
            <div className="card-body items-center gap-2 p-4 text-center">
              <div className="text-3xl" aria-hidden>
                {action.icon}
              </div>
              <div className="text-sm font-semibold">{action.label}</div>
              {action.badge && <div className="badge badge-primary badge-sm">{action.badge}</div>}
            </div>
          </button>
        ))}
      </section>

      <section className="card bg-base-200/90 shadow-lg">
        <div className="card-body gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">👥</div>
            <div>
              <h4 className="text-sm font-bold">Active on Line</h4>
              <p className="text-xs text-base-content/60">Live count at {manifest?.siteName ?? "current site"}</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{47}</span>
            <span className="text-sm text-base-content/60">workers present</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-base-100/70 p-4 shadow-lg">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
            Shift Manifest
          </h3>
          <span className="badge badge-outline badge-sm">
            {manifest ? `${manifest.scheduledCount} scheduled` : "Loading"}
          </span>
        </header>
        <div className="space-y-3">
          {status.loading && <div className="skeleton h-16 w-full" />}
          {status.error && <div className="alert alert-error text-xs">{status.error}</div>}
          {!status.loading && manifest &&
            manifest.workers.map(worker => (
              <article key={worker.id} className="flex items-center gap-3 rounded-xl bg-base-200/70 p-3">
                <div className="avatar placeholder">
                  <div className="w-10 rounded-full bg-primary text-primary-content">
                    <span className="text-sm font-semibold">{worker.initials}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{worker.name}</p>
                  <p className="text-xs text-base-content/60">
                    Checked in • {formatDurationFromNow(worker.checkedInAt)} · {worker.role}
                  </p>
                </div>
                <span
                  className={`badge badge-sm ${
                    worker.status === "Active"
                      ? "badge-success"
                      : worker.status === "On Break"
                      ? "badge-warning"
                      : worker.status === "Late"
                      ? "badge-error"
                      : "badge-outline"
                  }`}
                >
                  {worker.status}
                </span>
              </article>
            ))}

          {!status.loading && manifest && (
            <div className="flex items-center justify-between text-xs text-base-content/60">
              <span>Active on line</span>
              <span>{activeCount} workers</span>
            </div>
          )}
        </div>
      </section>

      <dialog id="shift-actions-modal" className="modal">
        <div className="modal-box max-w-md bg-base-100/95 text-base-content">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <div className="flex flex-col gap-4 p-2">
            <div className="text-center">
              <div className="mb-3 text-5xl">⏱️</div>
              <h2 className="mb-1 text-xl font-bold">Shift Timer</h2>
              <p className="text-sm text-base-content/70">{timerStatus}</p>
            </div>

            <div className="card bg-base-200/80">
              <div className="card-body p-4 text-center">
                <div className="text-4xl font-bold">{elapsedDisplay}</div>
                <div className="flex items-center justify-center gap-2 text-xs text-base-content/70">
                  <span>Today:</span>
                  <span className="font-semibold text-base-content">{todayDisplay}</span>
                </div>
              </div>
            </div>

            <div className={`alert ${geofenceAlertVariant}`}>
              <span>📍</span>
              <span className="text-sm">{geofenceAlertMessage}</span>
            </div>

            <div className="space-y-2">
              <button
                id="action-checkin"
                className="btn btn-primary btn-block btn-lg"
                onClick={handlePrimaryAction}
                disabled={primaryActionDisabled}
              >
                <span className="text-xl">{shiftState.mode === "running" ? "⏸️" : "▶️"}</span>
                {primaryActionLabel}
              </button>
              <button id="action-manual-checkin" className="btn btn-outline btn-block" onClick={handleManualCheckIn}>
                Manual Check-In
              </button>
            </div>

            <div className="divider text-xs text-base-content/50">Quick Actions</div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="action-break"
                className="btn btn-sm btn-outline"
                onClick={handleBreak}
                disabled={shiftState.mode !== "running"}
              >
                ☕ Take Break
              </button>
              <button
                id="action-end"
                className="btn btn-sm btn-outline"
                onClick={handleEndShift}
                disabled={shiftState.mode === "idle"}
              >
                🏁 End Shift
              </button>
              <button id="view-history" className="btn btn-sm btn-ghost col-span-2">
                📊 View History
              </button>
            </div>
          </div>
        </div>
        <form className="modal-backdrop" method="dialog">
          <button>close</button>
        </form>
      </dialog>

      <dialog ref={scheduleDialogRef} className="modal">
        {scheduleOpen && (
          <SchedulePlanner
            open={scheduleOpen}
            userId={WORKER_USER_ID}
            onClose={() => setScheduleOpen(false)}
          />
        )}
        <form className="modal-backdrop" method="dialog">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

interface TimePalette {
  id: "dawn" | "zenith" | "dusk" | "midnight";
  label: string;
  icon: string;
  gradient: string;
  textColor: string;
  mutedText: string;
  badgeBg: string;
  badgeText: string;
  buttonBg: string;
  buttonText: string;
  shadow: string;
}

const TIME_PALETTES: TimePalette[] = [
  {
    id: "dawn",
    label: "Dawn shift",
    icon: "🌅",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f97316 45%, #fb7185 100%)",
    textColor: "#fff9ed",
    mutedText: "rgba(255, 244, 214, 0.86)",
    badgeBg: "rgba(255, 255, 255, 0.18)",
    badgeText: "#fff7e3",
    buttonBg: "rgba(255, 255, 255, 0.22)",
    buttonText: "#fffaf2",
    shadow: "0 25px 50px -12px rgba(251, 161, 82, 0.65)"
  },
  {
    id: "zenith",
    label: "High noon",
    icon: "🌞",
    gradient: "linear-gradient(135deg, #fcd34d 0%, #fb923c 40%, #ef4444 100%)",
    textColor: "#1f1307",
    mutedText: "rgba(63, 36, 11, 0.75)",
    badgeBg: "rgba(0, 0, 0, 0.18)",
    badgeText: "#1f1307",
    buttonBg: "rgba(255, 255, 255, 0.24)",
    buttonText: "#1f1307",
    shadow: "0 25px 50px -12px rgba(239, 68, 68, 0.55)"
  },
  {
    id: "dusk",
    label: "Golden hour",
    icon: "🌇",
    gradient: "linear-gradient(135deg, #f97316 0%, #ec4899 45%, #8b5cf6 100%)",
    textColor: "#fdf2ff",
    mutedText: "rgba(249, 208, 255, 0.85)",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#fdf2ff",
    buttonBg: "rgba(255, 255, 255, 0.22)",
    buttonText: "#fdf2ff",
    shadow: "0 25px 50px -12px rgba(168, 85, 247, 0.55)"
  },
  {
    id: "midnight",
    label: "Midnight run",
    icon: "🌌",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #4338ca 100%)",
    textColor: "#e2e8f0",
    mutedText: "rgba(226, 232, 240, 0.72)",
    badgeBg: "rgba(148, 163, 184, 0.24)",
    badgeText: "#e2e8f0",
    buttonBg: "rgba(148, 163, 184, 0.24)",
    buttonText: "#e0f2fe",
    shadow: "0 25px 50px -12px rgba(79, 70, 229, 0.6)"
  }
];

const resolveTimePalette = (date: Date): TimePalette => {
  const hour = date.getHours();
  if (hour >= 4 && hour < 9) {
    return TIME_PALETTES[0];
  }
  if (hour >= 9 && hour < 17) {
    return TIME_PALETTES[1];
  }
  if (hour >= 17 && hour < 21) {
    return TIME_PALETTES[2];
  }
  return TIME_PALETTES[3];
};

export default WorkerMobilePage;
