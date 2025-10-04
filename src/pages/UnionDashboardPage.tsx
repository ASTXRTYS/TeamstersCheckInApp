import { useEffect, useState } from "react";
import {
  DashboardSnapshot,
  fetchDashboardSnapshot
} from "../data/mockApi";

const statCards: Array<{
  key: keyof DashboardSnapshot["metrics"];
  title: string;
  accent: string;
  suffix?: string;
}> = [
  { key: "activeWorkers", title: "Active Workers", accent: "text-primary" },
  { key: "checkinsToday", title: "Check-ins Today", accent: "text-secondary" },
  { key: "alerts", title: "Alerts", accent: "text-warning" },
  { key: "coverage", title: "Coverage", accent: "text-success", suffix: "%" }
];

function UnionDashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchDashboardSnapshot();
        if (!mounted) return;
        setSnapshot(data);
        setLoading(false);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Unable to load dashboard data.");
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 30_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Union Rep Dashboard</h2>
          <p className="text-sm opacity-70">Real-time visibility across your job sites</p>
        </div>
        <button className="btn btn-sm btn-ghost">Logout</button>
      </header>

      {lastUpdated && (
        <p className="text-xs text-right text-base-content/70">
          Last updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {loading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div className="skeleton h-32 rounded-2xl" key={idx} />
          ))}
        {!loading && snapshot &&
          statCards.map(({ key, title, accent, suffix }) => (
            <article key={key} className="stat rounded-2xl border border-base-300/50 bg-base-100/80 shadow-lg">
              <div className="stat-title">{title}</div>
              <div className={`stat-value ${accent}`}>
                {snapshot.metrics[key]}
                {suffix ?? ""}
              </div>
              <div className="stat-desc">
                {key === "alerts" ? "Require attention" : "Live metric"}
              </div>
            </article>
          ))}
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {snapshot && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="card border border-base-300/50 bg-base-100/80 shadow-lg lg:col-span-1">
            <div className="card-body">
              <h3 className="card-title">Recent Alerts</h3>
              <div className="space-y-2">
                {snapshot.recentAlerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`alert alert-${alert.type} flex items-start gap-3 border border-base-300/40 bg-base-200/60`}
                  >
                    <span>
                      <strong className="block text-xs uppercase opacity-70">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </strong>
                      {alert.message}
                    </span>
                  </div>
                ))}
                {snapshot.recentAlerts.length === 0 && (
                  <div className="text-sm opacity-70">No recent alerts 🎉</div>
                )}
              </div>
            </div>
          </article>

          <article className="card border border-base-300/50 bg-base-100/80 shadow-lg lg:col-span-2">
            <div className="card-body">
              <h3 className="card-title">Active Workers</h3>
              <div className="overflow-x-auto rounded-lg border border-base-300/40">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Job Site</th>
                      <th>Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.workers.map(worker => (
                      <tr key={worker.id}>
                        <td>{worker.name}</td>
                        <td>
                          <span className="badge badge-success">{worker.status}</span>
                        </td>
                        <td>{worker.site}</td>
                        <td>{worker.checkin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export default UnionDashboardPage;
