import { useEffect, useMemo, useState } from "react";
import { CheckinRecord, fetchCheckinHistory } from "../data/mockApi";
import { formatDateTime, formatHoursWorked } from "../utils/format";

type Filters = {
  search: string;
  site: string;
  date: string;
};

const recordsPerPage = 10;

function CheckinHistoryPage() {
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [filters, setFilters] = useState<Filters>({ search: "", site: "all", date: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchCheckinHistory();
        if (!mounted) return;
        setRecords(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Unable to fetch check-in history.");
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const availableSites = useMemo(() => {
    const sites = new Set<string>();
    records.forEach(record => sites.add(record.site));
    return Array.from(sites).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.workerName
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const matchesSite = filters.site === "all" || record.site === filters.site;
      const matchesDate = !filters.date || record.checkinTime.startsWith(filters.date);
      return matchesSearch && matchesSite && matchesDate;
    });
  }, [records, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.site, filters.date]);

  const paginationSummary = useMemo(() => {
    if (filteredRecords.length === 0) {
      return "Showing 0-0 of 0 records";
    }
    const start = (currentPage - 1) * recordsPerPage + 1;
    const end = Math.min(currentPage * recordsPerPage, filteredRecords.length);
    return `Showing ${start}-${end} of ${filteredRecords.length} records`;
  }, [currentPage, filteredRecords.length]);

  const handleExport = () => {
    const csv = [
      ["Worker Name", "Job Site", "Check-in Time", "Check-out Time", "Hours Worked", "Status"],
      ...filteredRecords.map(record => [
        record.workerName,
        record.site,
        formatDateTime(record.checkinTime),
        record.checkoutTime ? formatDateTime(record.checkoutTime) : "",
        record.hoursWorked?.toString() ?? "",
        record.status
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "checkin-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card mx-auto w-full max-w-6xl border border-base-300/50 bg-base-100/80 shadow-xl">
      <div className="card-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-title">Check-in History</h2>
          <button className="btn btn-primary btn-sm" onClick={handleExport} disabled={filteredRecords.length === 0}>
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search worker..."
            className="input input-bordered input-sm"
            value={filters.search}
            onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
          />
          <select
            className="select select-bordered select-sm"
            value={filters.site}
            onChange={event => setFilters(prev => ({ ...prev, site: event.target.value }))}
          >
            <option value="all">All Sites</option>
            {availableSites.map(site => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={filters.date}
            onChange={event => setFilters(prev => ({ ...prev, date: event.target.value }))}
          />
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setFilters({ search: "", site: "all", date: "" })}
            disabled={!filters.search && filters.site === "all" && !filters.date}
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-base-300/40">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Job Site</th>
                <th>Check-in Time</th>
                <th>Check-out Time</th>
                <th>Hours Worked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="skeleton h-4 w-full" />
                  </td>
                </tr>
              )}

              {!loading && paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-sm opacity-70">
                    No records found with the current filters.
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRecords.map(record => (
                  <tr key={record.id}>
                    <td>{record.workerName}</td>
                    <td>{record.site}</td>
                    <td>{formatDateTime(record.checkinTime)}</td>
                    <td>{record.checkoutTime ? formatDateTime(record.checkoutTime) : "-"}</td>
                    <td>{formatHoursWorked(record.hoursWorked)}</td>
                    <td>
                      <span
                        className={`badge ${
                          record.status === "Completed" ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-sm opacity-70">{paginationSummary}</span>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  className={`join-item btn btn-sm ${page === currentPage ? "btn-active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="join-item btn btn-sm"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error mt-4">{error}</div>}
      </div>
    </section>
  );
}

export default CheckinHistoryPage;
