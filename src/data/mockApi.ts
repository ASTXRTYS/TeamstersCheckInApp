export type AlertType = "warning" | "info" | "success" | "error";

export interface DashboardAlert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
}

export interface DashboardMetrics {
  activeWorkers: number;
  checkinsToday: number;
  alerts: number;
  coverage: number;
}

export interface DashboardWorker {
  id: string;
  name: string;
  status: "Active" | "On Break" | "In Transit";
  site: string;
  checkin: string;
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  workers: DashboardWorker[];
  recentAlerts: DashboardAlert[];
}

export interface ManifestEntry {
  id: string;
  name: string;
  initials: string;
  status: "Active" | "Checked Out" | "Late" | "On Break";
  checkedInAt: string;
  role: string;
}

export interface ShiftManifest {
  siteName: string;
  shiftLabel: string;
  scheduledCount: number;
  workers: ManifestEntry[];
}

export interface CheckinRecord {
  id: string;
  workerName: string;
  site: string;
  checkinTime: string;
  checkoutTime?: string;
  hoursWorked?: number;
  status: "Completed" | "In Progress";
}

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ShiftId = "morning" | "afternoon" | "night";

export interface DetailedShift {
  startHour: number; // 0-24, interpreted in local site time
}

export type SimpleSchedule = Record<WeekdayKey, ShiftId[]>;
export type DetailedSchedule = Record<WeekdayKey, DetailedShift | null>;

export interface WeeklySchedule {
  userId: string;
  weekStart: string; // ISO yyyy-mm-dd
  simple: SimpleSchedule;
  detailed: DetailedSchedule;
}

const manifestSeed: ShiftManifest = {
  siteName: "Downtown Plaza",
  shiftLabel: "Today's Shift",
  scheduledCount: 15,
  workers: [
    {
      id: "john-martinez",
      name: "John Martinez",
      initials: "JM",
      status: "Active",
      checkedInAt: new Date(Date.now() - 2.25 * 60 * 60 * 1000).toISOString(),
      role: "Line Lead"
    },
    {
      id: "sarah-chen",
      name: "Sarah Chen",
      initials: "SC",
      status: "Active",
      checkedInAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      role: "Steward"
    },
    {
      id: "michael-brown",
      name: "Michael Brown",
      initials: "MB",
      status: "On Break",
      checkedInAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      role: "Picketer"
    }
  ]
};

const dashboardSeed: DashboardSnapshot = {
  metrics: {
    activeWorkers: 24,
    checkinsToday: 89,
    alerts: 5,
    coverage: 94
  },
  workers: [
    {
      id: "maria-garcia",
      name: "Maria Garcia",
      status: "Active",
      site: "Site #12",
      checkin: "8:15 AM"
    },
    {
      id: "james-wilson",
      name: "James Wilson",
      status: "Active",
      site: "Site #8",
      checkin: "7:45 AM"
    },
    {
      id: "sarah-chen",
      name: "Sarah Chen",
      status: "Active",
      site: "Site #15",
      checkin: "8:00 AM"
    }
  ],
  recentAlerts: [
    {
      id: "late-checkin-42",
      type: "warning",
      message: "Worker late check-in at Site #42",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: "new-worker-smith",
      type: "info",
      message: "New worker registered: John Smith",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ]
};

const historySeed: CheckinRecord[] = [
  {
    id: "maria-garcia-2024-10-04",
    workerName: "Maria Garcia",
    site: "Site #12",
    checkinTime: "2024-10-04T08:15:00-07:00",
    checkoutTime: "2024-10-04T17:00:00-07:00",
    hoursWorked: 8.75,
    status: "Completed"
  },
  {
    id: "james-wilson-2024-10-04",
    workerName: "James Wilson",
    site: "Site #8",
    checkinTime: "2024-10-04T07:45:00-07:00",
    checkoutTime: "2024-10-04T16:30:00-07:00",
    hoursWorked: 8.75,
    status: "Completed"
  },
  {
    id: "sarah-chen-2024-10-04",
    workerName: "Sarah Chen",
    site: "Site #15",
    checkinTime: "2024-10-04T08:00:00-07:00",
    status: "In Progress"
  },
  {
    id: "michael-brown-2024-10-03",
    workerName: "Michael Brown",
    site: "Site #3",
    checkinTime: "2024-10-03T08:30:00-07:00",
    checkoutTime: "2024-10-03T17:15:00-07:00",
    hoursWorked: 8.75,
    status: "Completed"
  },
  {
    id: "lucy-hernandez-2024-10-02",
    workerName: "Lucy Hernandez",
    site: "Site #5",
    checkinTime: "2024-10-02T08:10:00-07:00",
    checkoutTime: "2024-10-02T16:40:00-07:00",
    hoursWorked: 8.5,
    status: "Completed"
  }
];

const WEEKDAY_KEYS: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const createEmptySchedule = (userId: string, weekStart: string): WeeklySchedule => ({
  userId,
  weekStart,
  simple: WEEKDAY_KEYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as SimpleSchedule),
  detailed: WEEKDAY_KEYS.reduce((acc, day) => {
    acc[day] = null;
    return acc;
  }, {} as DetailedSchedule)
});

const scheduleSeed: WeeklySchedule = {
  userId: "worker-jordan",
  weekStart: "2025-09-29",
  simple: {
    monday: ["morning"],
    tuesday: ["morning"],
    wednesday: ["morning"],
    thursday: ["morning"],
    friday: ["morning", "afternoon"],
    saturday: ["afternoon"],
    sunday: []
  },
  detailed: {
    monday: { startHour: 6 },
    tuesday: { startHour: 6 },
    wednesday: { startHour: 6 },
    thursday: { startHour: 6 },
    friday: { startHour: 8 },
    saturday: null,
    sunday: null
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

let manifestState = clone(manifestSeed);
let dashboardState = clone(dashboardSeed);
let historyState = clone(historySeed);
let scheduleState: Record<string, WeeklySchedule> = {
  [`${scheduleSeed.userId}:${scheduleSeed.weekStart}`]: clone(scheduleSeed)
};

function mutateDashboard(snapshot: DashboardSnapshot): DashboardSnapshot {
  const next = clone(snapshot);
  const jitter = (value: number, delta: number, min = 0) => Math.max(min, value + Math.round((Math.random() - 0.5) * 2 * delta));
  next.metrics.activeWorkers = jitter(next.metrics.activeWorkers, 2, 0);
  next.metrics.checkinsToday = jitter(next.metrics.checkinsToday, 5, 0);
  next.metrics.alerts = Math.max(0, next.metrics.alerts + Math.round((Math.random() - 0.5) * 2));
  next.metrics.coverage = Math.min(100, Math.max(0, next.metrics.coverage + Math.round((Math.random() - 0.5) * 4)));

  if (Math.random() > 0.6) {
    next.recentAlerts = [
      {
        id: `alert-${Date.now()}`,
        type: Math.random() > 0.5 ? "warning" : "info",
        message: Math.random() > 0.5
          ? "Headcount adjustment requested at Site #21"
          : "Overtime approved for Site #8",
        timestamp: new Date().toISOString()
      },
      ...next.recentAlerts.slice(0, 2)
    ];
  }

  return next;
}

export async function fetchShiftManifest(): Promise<ShiftManifest> {
  await delay(180);
  manifestState = clone(manifestState);
  return manifestState;
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  await delay(220);
  dashboardState = mutateDashboard(dashboardState);
  return dashboardState;
}

export async function fetchCheckinHistory(): Promise<CheckinRecord[]> {
  await delay(260);
  historyState = clone(historyState);
  return historyState;
}

export async function addMockCheckin(record: CheckinRecord): Promise<void> {
  await delay(120);
  historyState = [record, ...historyState];
}

export function resetMockData(): void {
  manifestState = clone(manifestSeed);
  dashboardState = clone(dashboardSeed);
  historyState = clone(historySeed);
  scheduleState = {
    [`${scheduleSeed.userId}:${scheduleSeed.weekStart}`]: clone(scheduleSeed)
  };
}

const getScheduleKey = (userId: string, weekStart: string) => `${userId}:${weekStart}`;

export async function fetchWeeklySchedule(userId: string, weekStart: string): Promise<WeeklySchedule> {
  await delay(180);
  const key = getScheduleKey(userId, weekStart);
  const existing = scheduleState[key];
  if (existing) {
    return clone(existing);
  }
  const empty = createEmptySchedule(userId, weekStart);
  scheduleState[key] = clone(empty);
  return empty;
}

export async function submitWeeklySchedule(schedule: WeeklySchedule): Promise<void> {
  await delay(180);
  const key = getScheduleKey(schedule.userId, schedule.weekStart);
  scheduleState[key] = clone(schedule);
}

export async function fetchLastWeekSchedule(userId: string): Promise<WeeklySchedule> {
  await delay(160);
  const entries = Object.values(scheduleState).filter(entry => entry.userId === userId);
  if (entries.length === 0) {
    return createEmptySchedule(userId, scheduleSeed.weekStart);
  }
  const latest = entries.sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  return clone(latest);
}
