import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import WorkerMobilePage from "./pages/WorkerMobilePage";
import UnionDashboardPage from "./pages/UnionDashboardPage";
import CheckinHistoryPage from "./pages/CheckinHistoryPage";

const navItems = [
  { to: "/worker", label: "Worker App", icon: "🏃" },
  { to: "/dashboard", label: "Union Dashboard", icon: "🛠️" },
  { to: "/history", label: "Check-in History", icon: "📊" }
];

function App() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-base-300/60 bg-base-100/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">Picket Tracker Suite</p>
              <h1 className="text-xl font-bold">Teamsters Check-in Toolkit</h1>
            </div>
            <nav className="flex gap-2">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `btn btn-sm font-semibold ${
                      isActive ? "btn-primary text-primary-content" : "btn-ghost"
                    }`
                  }
                  end
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/worker" replace />} />
            <Route path="/worker" element={<WorkerMobilePage />} />
            <Route path="/dashboard" element={<UnionDashboardPage />} />
            <Route path="/history" element={<CheckinHistoryPage />} />
            <Route path="*" element={<Navigate to="/worker" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-base-300/60 bg-base-100/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-base-content/70">
            <span>© {new Date().getFullYear()} Teamsters Check-in App</span>
            <span>Built with Vite · React · Tailwind + DaisyUI</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
