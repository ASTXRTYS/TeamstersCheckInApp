import { useEffect, useMemo, useState } from "react";
import { fetchShiftManifest, ShiftManifest } from "../data/mockApi";
import { formatDurationFromNow } from "../utils/format";

const quickActions = [
  { id: "view-schedule", label: "My Schedule", icon: "📅" },
  { id: "report-issue", label: "Report Issue", icon: "🚨" },
  { id: "view-updates", label: "Updates", icon: "📢", badge: "3 new" },
  { id: "solidarity-wall", label: "Solidarity Wall", icon: "✊" }
];

function WorkerMobilePage() {
  const [manifest, setManifest] = useState<ShiftManifest | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: true });

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

  const activeCount = useMemo(
    () => manifest?.workers.filter(worker => worker.status === "Active").length ?? 0,
    [manifest]
  );

  const shiftTimer = useMemo(
    () => ({
      isCheckedIn: false,
      elapsed: "0:00:00",
      todayTotal: "0h 0m",
      geofenceStatus: "Outside geofence",
      geofenceHint: "Move to Acme Factory Gate to check in."
    }),
    []
  );

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
            }).format(new Date())}
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
        className="card overflow-hidden bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg transition-all hover:shadow-xl"
        type="button"
        onClick={() => {
          const modal = document.getElementById("shift-actions-modal") as HTMLDialogElement | null;
          modal?.showModal();
        }}
      >
        <div className="card-body gap-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="badge badge-sm border-0 bg-white/20 text-primary-content/90">
                <span className="text-xs">📍 {shiftTimer.geofenceStatus}</span>
              </div>
            </div>
            <div className="text-xl">⏱️</div>
          </div>
          <div className="text-4xl font-bold leading-none">{shiftTimer.elapsed}</div>
          <div className="flex items-center justify-between text-sm text-primary-content/90">
            <span>{shiftTimer.isCheckedIn ? "On shift" : "Not checked in"}</span>
            <span className="text-xs opacity-80">Tap to manage →</span>
          </div>
        </div>
      </button>

      <section className="card overflow-hidden bg-gradient-to-br from-primary to-secondary text-primary-content shadow-2xl">
        <div className="card-body gap-3 p-5">
          <div className="flex items-center justify-between">
            <div className="badge badge-sm border-0 bg-white/25 text-primary-content/90">Status</div>
            <div className="text-2xl">⏱️</div>
          </div>
          <h3 className="text-2xl font-bold">Not Checked In</h3>
          <p className="text-sm text-primary-content/90">
            Ready to join the line?
          </p>
          <button
            id="quick-checkin"
            className="btn btn-block border-0 bg-white/20 text-primary-content hover:bg-white/30"
            onClick={() => console.info("Quick check-in")}
          >
            <span className="text-xl">📍</span>
            Check In Now
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {quickActions.map(action => (
          <button
            key={action.id}
            id={action.id}
            className="card bg-base-200/80 transition-colors hover:bg-base-300/60"
            onClick={() => console.info(action.id)}
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
              <p className="text-sm text-base-content/70">
                {shiftTimer.isCheckedIn ? "Currently on shift" : "Currently not checked in"}
              </p>
            </div>

            <div className="card bg-base-200/80">
              <div className="card-body p-4 text-center">
                <div className="text-4xl font-bold">{shiftTimer.elapsed}</div>
                <div className="flex items-center justify-center gap-2 text-xs text-base-content/70">
                  <span>Today:</span>
                  <span className="font-semibold text-base-content">{shiftTimer.todayTotal}</span>
                </div>
              </div>
            </div>

            <div className="alert alert-warning">
              <span>📍</span>
              <span className="text-sm">
                You are outside the geofence area. {shiftTimer.geofenceHint}
              </span>
            </div>

            <div className="space-y-2">
              <button id="action-checkin" className="btn btn-primary btn-block btn-lg" disabled>
                <span className="text-xl">▶️</span>
                Start Shift
              </button>
              <button id="action-manual-checkin" className="btn btn-outline btn-block">
                Manual Check-In
              </button>
            </div>

            <div className="divider text-xs text-base-content/50">Quick Actions</div>

            <div className="grid grid-cols-2 gap-2">
              <button id="action-break" className="btn btn-sm btn-outline" disabled>
                ☕ Take Break
              </button>
              <button id="action-end" className="btn btn-sm btn-outline" disabled>
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
    </div>
  );
}

export default WorkerMobilePage;
