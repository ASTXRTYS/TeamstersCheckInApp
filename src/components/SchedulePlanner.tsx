import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  fetchLastWeekSchedule,
  fetchWeeklySchedule,
  submitWeeklySchedule,
  type DetailedSchedule,
  type DetailedShift,
  type ShiftId,
  type SimpleSchedule,
  type WeekdayKey,
  type WeeklySchedule
} from "../data/mockApi";

const WEEK_DAYS: Array<{ key: WeekdayKey; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" }
];

const WORK_DAYS = WEEK_DAYS.filter(day => day.key !== "saturday" && day.key !== "sunday");
const WEEKEND_DAYS = WEEK_DAYS.filter(day => day.key === "saturday" || day.key === "sunday");

const SIMPLE_SHIFTS: Record<ShiftId, { label: string; startHour: number }> = {
  morning: { label: "Morning", startHour: 6 },
  afternoon: { label: "Afternoon", startHour: 13 },
  night: { label: "Night", startHour: 20 }
};

const SHIFT_LENGTH_HOURS = 7;
const WEEKLY_TARGET_HOURS = 35;
const WEEKLY_SHIFT_TARGET = WEEKLY_TARGET_HOURS / SHIFT_LENGTH_HOURS;
const MAX_FRIDAY_END_HOUR = 20; // 8 PM cut-off per requirements

const SHIFT_SEQUENCE: Array<ShiftId | null> = ["morning", "afternoon", "night", null];

const DAYPART_BANDS = [
  { label: "Overnight", start: 0, end: 6, color: "rgba(15, 23, 42, 0.35)" },
  { label: "Dawn", start: 6, end: 9, color: "rgba(59, 130, 246, 0.18)" },
  { label: "Day", start: 9, end: 18, color: "rgba(250, 204, 21, 0.16)" },
  { label: "Evening", start: 18, end: 24, color: "rgba(147, 51, 234, 0.18)" }
];

const TIMELINE_TICKS = [0, 6, 12, 18, 24];

const CONFIG = {
  validation: {
    maxWeeklyHours: WEEKLY_TARGET_HOURS,
    maxDailyHours: SHIFT_LENGTH_HOURS
  },
  features: {
    copyLastWeek: true
  }
};

interface SchedulePlannerProps {
  open: boolean;
  userId: string;
  onClose: () => void;
}

const createEmptySchedule = (userId: string, weekStart: string): WeeklySchedule => ({
  userId,
  weekStart,
  simple: WEEK_DAYS.reduce((acc, day) => {
    acc[day.key] = [];
    return acc;
  }, {} as SimpleSchedule),
  detailed: WEEK_DAYS.reduce((acc, day) => {
    acc[day.key] = null;
    return acc;
  }, {} as DetailedSchedule)
});

const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatWeekRange = (start: Date): string => {
  const end = addDays(start, 6);
  const startFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  const endFormatterSameMonth = new Intl.DateTimeFormat(undefined, { day: "numeric" });
  const endFormatterDifferentMonth = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  const endLabel = start.getMonth() === end.getMonth()
    ? endFormatterSameMonth.format(end)
    : endFormatterDifferentMonth.format(end);
  return `${startFormatter.format(start)}-${endLabel}, ${end.getFullYear()}`;
};

const getDailySimpleHours = (schedule: SimpleSchedule, day: WeekdayKey): number =>
  schedule[day].length * SHIFT_LENGTH_HOURS;

const getDailyDetailedHours = (shift: DetailedShift | null): number => (shift ? SHIFT_LENGTH_HOURS : 0);

const totalSimpleHours = (schedule: SimpleSchedule): number =>
  WEEK_DAYS.reduce((total, day) => total + getDailySimpleHours(schedule, day.key), 0);

const totalDetailedHours = (schedule: DetailedSchedule): number =>
  WEEK_DAYS.reduce((total, day) => total + getDailyDetailedHours(schedule[day.key]), 0);

const clampStartHour = (day: WeekdayKey, rawHour: number): number => {
  const snapped = Math.round(rawHour);
  const clampedMin = Math.max(0, snapped);
  if (day === "friday") {
    const maxStart = Math.max(0, MAX_FRIDAY_END_HOUR - SHIFT_LENGTH_HOURS);
    return Math.min(clampedMin, maxStart);
  }
  return Math.min(clampedMin, 23);
};

const matchPresetByStartHour = (startHour: number): ShiftId | null => {
  const entry = (Object.entries(SIMPLE_SHIFTS) as Array<[ShiftId, { label: string; startHour: number }]>)
    .find(([, value]) => value.startHour === startHour);
  return entry ? entry[0] : null;
};

const shiftEndHour = (shift: DetailedShift | null): number | null =>
  shift ? shift.startHour + SHIFT_LENGTH_HOURS : null;

const overflowIntoNextDay = (shift: DetailedShift | null): number => {
  if (!shift) return 0;
  return Math.max(0, shift.startHour + SHIFT_LENGTH_HOURS - 24);
};

const formatTime = (hour: number): string => {
  const base = new Date();
  base.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(base);
};

const formatShiftLabel = (dayIndex: number, shift: DetailedShift): string => {
  const startLabel = formatTime(shift.startHour);
  const endHour = shift.startHour + SHIFT_LENGTH_HOURS;
  if (endHour <= 24 || dayIndex >= WORK_DAYS.length - 1) {
    return `${startLabel} – ${formatTime(endHour)}`;
  }
  const nextDayLabel = WORK_DAYS[dayIndex + 1].label;
  return `${startLabel} → ${nextDayLabel} ${formatTime(endHour)}`;
};

const formatSimpleShiftSummary = (shiftIds: ShiftId[]): string | null => {
  if (shiftIds.length === 0) return null;
  const earliest = [...shiftIds]
    .map(id => ({ id, start: SIMPLE_SHIFTS[id].startHour }))
    .sort((a, b) => a.start - b.start)[0];
  const shift = SIMPLE_SHIFTS[earliest.id];
  return `${shift.label} · ${formatTime(shift.startHour)} – ${formatTime(shift.startHour + SHIFT_LENGTH_HOURS)}`;
};

function SchedulePlanner({ open, userId, onClose }: SchedulePlannerProps) {
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const weekStartKey = useMemo(() => formatDateKey(weekStart), [weekStart]);
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => createEmptySchedule(userId, weekStartKey));
  const [activeView, setActiveView] = useState<"simple" | "detailed">("simple");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragState, setDragState] = useState<{ day: WeekdayKey; grabOffset: number } | null>(null);

  const trackRefs = useRef<Partial<Record<WeekdayKey, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setFeedback(null);
      try {
        const data = await fetchWeeklySchedule(userId, weekStartKey);
        if (!cancelled) {
          setSchedule(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Unable to load schedule");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, userId, weekStartKey]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState) return;
      const track = trackRefs.current[dragState.day];
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const pointerHour = ratio * 24;
      if (Number.isNaN(pointerHour)) return;
      const nextStart = pointerHour - dragState.grabOffset;
      setSchedule(prev => ({
        ...prev,
        detailed: {
          ...prev.detailed,
          [dragState.day]: { startHour: clampStartHour(dragState.day, nextStart) }
        }
      }));
    };

    const handlePointerUp = () => setDragState(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  const simpleDailyHours = useMemo(() => {
    return WEEK_DAYS.reduce<Record<WeekdayKey, number>>((acc, day) => {
      acc[day.key] = getDailySimpleHours(schedule.simple, day.key);
      return acc;
    }, {} as Record<WeekdayKey, number>);
  }, [schedule.simple]);

  const detailedDailyHours = useMemo(() => {
    return WEEK_DAYS.reduce<Record<WeekdayKey, number>>((acc, day) => {
      acc[day.key] = getDailyDetailedHours(schedule.detailed[day.key]);
      return acc;
    }, {} as Record<WeekdayKey, number>);
  }, [schedule.detailed]);

  const weeklySimpleHours = useMemo(() => totalSimpleHours(schedule.simple), [schedule.simple]);
  const weeklyDetailedHours = useMemo(() => totalDetailedHours(schedule.detailed), [schedule.detailed]);

  const weeklyHours = activeView === "simple" ? weeklySimpleHours : weeklyDetailedHours;
  const remainingHours = Math.max(0, WEEKLY_TARGET_HOURS - weeklyHours);
  const detailedShiftCount = useMemo(
    () => WORK_DAYS.filter(day => Boolean(schedule.detailed[day.key])).length,
    [schedule.detailed]
  );
  const simpleShiftCount = useMemo(
    () => WORK_DAYS.filter(day => schedule.simple[day.key].length > 0).length,
    [schedule.simple]
  );

  const handleWeekChange = (direction: -1 | 1) => {
    setWeekStart(prev => addDays(prev, direction * 7));
  };

  const getSelectedSimpleShift = (day: WeekdayKey): ShiftId | null => schedule.simple[day][0] ?? null;

  const setSimpleShift = (day: WeekdayKey, shiftId: ShiftId | null) => {
    if (shiftId == null) {
      setSchedule(prev => ({
        ...prev,
        simple: {
          ...prev.simple,
          [day]: []
        },
        detailed: {
          ...prev.detailed,
          [day]: null
        }
      }));
      return;
    }

    const startHour = SIMPLE_SHIFTS[shiftId].startHour;
    setSchedule(prev => ({
      ...prev,
      simple: {
        ...prev.simple,
        [day]: [shiftId]
      },
      detailed: {
        ...prev.detailed,
        [day]: { startHour: clampStartHour(day, startHour) }
      }
    }));
  };

  const handleCycleShift = (day: WeekdayKey) => {
    const current = getSelectedSimpleShift(day);
    const currentIndex = SHIFT_SEQUENCE.findIndex(entry => entry === current);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    const next = SHIFT_SEQUENCE[nextIndex % SHIFT_SEQUENCE.length];
    setSimpleShift(day, next);
  };

  const handleSelectShift = (day: WeekdayKey, shiftId: ShiftId) => {
    setSimpleShift(day, shiftId);
  };

  const handleClearShift = (day: WeekdayKey) => {
    setSimpleShift(day, null);
  };

  const handleFineTune = (day: WeekdayKey) => {
    if (!schedule.detailed[day]) {
      const fallback = getSelectedSimpleShift(day) ?? "morning";
      setSimpleShift(day, fallback);
    }
    setActiveView("detailed");
  };

  const renderSimpleDayCard = (
    day: { key: WeekdayKey; label: string },
    options: { optional?: boolean } = {}
  ) => {
    const simpleSelection = getSelectedSimpleShift(day.key);
    const detailedShift = schedule.detailed[day.key];
    const displayStartHour = detailedShift?.startHour ?? (simpleSelection != null
      ? SIMPLE_SHIFTS[simpleSelection].startHour
      : null);
    const hasShift = displayStartHour != null;
    const matchedPreset = simpleSelection != null
      ? SIMPLE_SHIFTS[simpleSelection]
      : null;
    const summaryLabel = hasShift
      ? matchedPreset && matchedPreset.startHour === displayStartHour
        ? matchedPreset.label
        : "Custom shift"
      : options.optional
      ? "Not scheduled"
      : "Off duty";
    const timeLabel = hasShift
      ? `${formatTime(displayStartHour!)} – ${formatTime(displayStartHour! + SHIFT_LENGTH_HOURS)}`
      : "Tap to set a shift";

    return (
      <article key={day.key} className="rounded-2xl border border-base-300/60 bg-base-200/60 p-4">
        {options.optional && (
          <span className="badge badge-outline badge-xs mb-2">Optional</span>
        )}
        <button
          type="button"
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
            hasShift
              ? "border-primary/60 bg-primary/10 hover:border-primary"
              : "border-base-300/70 bg-base-200/70 hover:border-primary/40"
          }`}
          onClick={() => handleCycleShift(day.key)}
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              {day.label}
            </span>
            <span className="text-lg font-semibold text-base-content">{summaryLabel}</span>
            <span className="text-xs text-base-content/70">{timeLabel}</span>
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-[10px] uppercase tracking-wide text-base-content/60">
            <span className={`badge badge-sm ${hasShift ? "badge-success" : "badge-ghost"}`}>
              {hasShift ? `${SHIFT_LENGTH_HOURS} hrs` : "Off"}
            </span>
            <span className="text-primary">Cycle</span>
          </div>
        </button>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(SIMPLE_SHIFTS) as ShiftId[]).map(option => (
            <button
              key={option}
              type="button"
              className={`btn btn-xs ${simpleSelection === option ? "btn-primary" : "btn-outline"}`}
              onClick={() => handleSelectShift(day.key, option)}
            >
              {SIMPLE_SHIFTS[option].label}
            </button>
          ))}
          <button type="button" className="btn btn-xs btn-ghost" onClick={() => handleClearShift(day.key)}>
            Off
          </button>
          <button type="button" className="btn btn-xs btn-link text-primary" onClick={() => handleFineTune(day.key)}>
            Fine tune
          </button>
        </div>
      </article>
    );
  };

  const applyDetailedShift = (day: WeekdayKey, startHour: number) => {
    const nextStart = clampStartHour(day, startHour);
    const matchedPreset = matchPresetByStartHour(nextStart);
    setSchedule(prev => ({
      ...prev,
      detailed: {
        ...prev.detailed,
        [day]: { startHour: nextStart }
      },
      simple: matchedPreset != null
        ? {
            ...prev.simple,
            [day]: [matchedPreset]
          }
        : {
            ...prev.simple,
            [day]: []
          }
    }));
  };

  const clearDetailedShift = (day: WeekdayKey) => {
    setSchedule(prev => ({
      ...prev,
      detailed: {
        ...prev.detailed,
        [day]: null
      },
      simple: {
        ...prev.simple,
        [day]: []
      }
    }));
  };

  const handleTrackPointerDown = (day: WeekdayKey, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const track = trackRefs.current[day];
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const pointerHour = ratio * 24;
    if (Number.isNaN(pointerHour)) return;
    const nextStart = clampStartHour(day, pointerHour - SHIFT_LENGTH_HOURS / 2);
    applyDetailedShift(day, nextStart);
    setDragState({ day, grabOffset: SHIFT_LENGTH_HOURS / 2 });
  };

  const handleBlockPointerDown = (day: WeekdayKey, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const track = trackRefs.current[day];
    const shift = schedule.detailed[day];
    if (!track || !shift) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const pointerHour = ratio * 24;
    const grabOffset = pointerHour - shift.startHour;
    setDragState({ day, grabOffset: Math.max(0, Math.min(SHIFT_LENGTH_HOURS, grabOffset)) });
  };

  const handleCopyFromPrevious = (day: WeekdayKey) => {
    const index = WORK_DAYS.findIndex(item => item.key === day);
    if (index <= 0) return;
    const previousDay = WORK_DAYS[index - 1].key;
    const previousShift = schedule.detailed[previousDay];
    if (!previousShift) return;
    applyDetailedShift(day, previousShift.startHour);
  };

  const handleApplySimplePreset = (day: WeekdayKey) => {
    const firstPreset = getSelectedSimpleShift(day);
    if (!firstPreset) return;
    setSimpleShift(day, firstPreset);
  };

  const handleCopyLastWeek = async () => {
    setLoading(true);
    setError(null);
    try {
      const lastWeek = await fetchLastWeekSchedule(userId);
      setSchedule(prev => ({
        ...prev,
        simple: lastWeek.simple,
        detailed: lastWeek.detailed
      }));
      setFeedback("Copied last week's schedule");
    } catch (err) {
      console.error(err);
      setError("Unable to copy last week's schedule");
    } finally {
      setLoading(false);
    }
  };

  const validateSchedule = (): string | null => {
    const simpleDailyLimitExceeded = WEEK_DAYS.some(day => simpleDailyHours[day.key] > CONFIG.validation.maxDailyHours);
    if (simpleDailyLimitExceeded) {
      return `Simple view exceeds ${CONFIG.validation.maxDailyHours} hrs on at least one day.`;
    }
    if (weeklySimpleHours > CONFIG.validation.maxWeeklyHours) {
      return `Weekly hours cannot exceed ${CONFIG.validation.maxWeeklyHours}.`;
    }
    if (weeklyDetailedHours > CONFIG.validation.maxWeeklyHours) {
      return `Detailed schedule exceeds ${CONFIG.validation.maxWeeklyHours} hrs.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateSchedule();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await submitWeeklySchedule({
        userId,
        weekStart: weekStartKey,
        simple: schedule.simple,
        detailed: schedule.detailed
      });
      setFeedback("Schedule submitted successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to submit schedule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-box w-full max-w-4xl bg-base-100/95 text-base-content">
      <form method="dialog">
        <button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          ✕
        </button>
      </form>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">My Schedule</h2>
          <p className="text-sm text-base-content/70">Place five 7-hour shifts anywhere between Monday 12 AM and Friday 8 PM.</p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base-200/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-sm" onClick={() => handleWeekChange(-1)} disabled={loading}>
              ←
            </button>
            <h3 className="text-lg font-semibold" id="week-display">
              {formatWeekRange(weekStart)}
            </h3>
            <button type="button" className="btn btn-sm" onClick={() => handleWeekChange(1)} disabled={loading}>
              →
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">{weeklyHours} / {WEEKLY_TARGET_HOURS} hrs scheduled</span>
            <span className="text-base-content/70">
              {(activeView === "simple" ? simpleShiftCount : detailedShiftCount)} of {WEEKLY_SHIFT_TARGET} shifts
            </span>
            {remainingHours > 0 ? (
              <span className="badge badge-outline badge-sm text-xs">{remainingHours} hrs remaining</span>
            ) : (
              <span className="badge badge-success badge-sm text-xs">Target met</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="join">
            <button
              type="button"
              className={`join-item btn btn-sm ${activeView === "simple" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveView("simple")}
            >
              Simple
            </button>
            <button
              type="button"
              className={`join-item btn btn-sm ${activeView === "detailed" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveView("detailed")}
            >
              Detailed
            </button>
          </div>
          {CONFIG.features.copyLastWeek && (
            <button type="button" className="btn btn-sm btn-outline" onClick={handleCopyLastWeek} disabled={loading}>
              Copy Last Week
            </button>
          )}
        </div>

        {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
        {feedback && <div className="alert alert-success py-2 text-sm">{feedback}</div>}

        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
        ) : activeView === "simple" ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              {WORK_DAYS.map(day => renderSimpleDayCard(day))}
            </div>
            <div className="rounded-2xl border border-base-300/60 bg-base-200/50 p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                    Weekend coverage (optional)
                  </p>
                  <p className="text-sm text-base-content/70">
                    Add shifts for extra coverage or leave off by default.
                  </p>
                </div>
              </header>
              <div className="grid gap-3 sm:grid-cols-2">
                {WEEKEND_DAYS.map(day => renderSimpleDayCard(day, { optional: true }))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {WORK_DAYS.map((day, index) => {
              const detailedShift = schedule.detailed[day.key];
              const overflowFromPrevious = index > 0 ? overflowIntoNextDay(schedule.detailed[WORK_DAYS[index - 1].key]) : 0;
              const simpleSummary = formatSimpleShiftSummary(schedule.simple[day.key]);
              const endHour = shiftEndHour(detailedShift);
              const wrapsToNextDay = Boolean(detailedShift && endHour && endHour > 24 && index < WORK_DAYS.length - 1);
              const visibleWidthHours = detailedShift ? Math.min(SHIFT_LENGTH_HOURS, 24 - detailedShift.startHour) : 0;
              const visibleWidthPercent = (visibleWidthHours / 24) * 100;
              const blockLeftPercent = detailedShift ? (Math.max(0, detailedShift.startHour) / 24) * 100 : 0;
              const overflowHours = overflowIntoNextDay(detailedShift);

              return (
                <article key={day.key} className="rounded-2xl border border-base-300/60 bg-base-200/50 px-4 py-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold uppercase tracking-wide text-base-content/60">{day.label}</div>
                      {detailedShift ? (
                        <span className="text-sm font-semibold text-base-content">
                          {formatShiftLabel(index, detailedShift)} · {SHIFT_LENGTH_HOURS}h
                          {wrapsToNextDay && ` (wraps to ${WORK_DAYS[index + 1].label})`}
                        </span>
                      ) : (
                        <span className="text-sm text-base-content/70">No shift assigned</span>
                      )}
                      {simpleSummary && (
                        <span className="text-xs text-base-content/60">Simple view: {simpleSummary}</span>
                      )}
                      {overflowFromPrevious > 0 && (
                        <span className="text-xs text-warning">Continuing from {WORK_DAYS[index - 1].label} · {formatTime(0)} – {formatTime(overflowFromPrevious)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {simpleSummary && (
                        <button type="button" className="btn btn-xs btn-outline" onClick={() => handleApplySimplePreset(day.key)}>
                          Apply simple preset
                        </button>
                      )}
                      {index > 0 && (
                        <button type="button" className="btn btn-xs btn-outline" onClick={() => handleCopyFromPrevious(day.key)}>
                          Copy previous day
                        </button>
                      )}
                      {detailedShift && (
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => clearDetailedShift(day.key)}>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    ref={node => {
                      trackRefs.current[day.key] = node;
                    }}
                    className="relative h-20 cursor-pointer overflow-hidden rounded-xl border border-base-300/50 bg-base-200"
                    onPointerDown={event => handleTrackPointerDown(day.key, event)}
                  >
                    {DAYPART_BANDS.map(band => (
                      <div
                        key={`${band.label}-${band.start}`}
                        className="absolute inset-y-0"
                        style={{
                          left: `${(band.start / 24) * 100}%`,
                          width: `${((band.end - band.start) / 24) * 100}%`,
                          backgroundColor: band.color
                        }}
                        aria-hidden
                      />
                    ))}
                    {TIMELINE_TICKS.map(tick => (
                      <div
                        key={`tick-${tick}`}
                        className="absolute inset-y-0 w-px bg-base-300/60"
                        style={{ left: `${(tick / 24) * 100}%` }}
                        aria-hidden
                      />
                    ))}
                    {TIMELINE_TICKS.map(tick => (
                      <span
                        key={`tick-label-${tick}`}
                        className="absolute top-2 text-[10px] font-medium uppercase tracking-wide text-base-content/60"
                        style={{ left: `${(tick / 24) * 100}%`, transform: "translateX(-50%)" }}
                      >
                        {formatTime(tick % 24)}
                      </span>
                    ))}

                    {detailedShift && (
                      <div
                        role="button"
                        tabIndex={0}
                        className="absolute top-6 h-10 rounded-lg border border-primary/70 bg-primary/80 text-primary-content shadow-lg shadow-primary/30"
                        style={{
                          left: `${blockLeftPercent}%`,
                          width: `${visibleWidthPercent}%`
                        }}
                        onPointerDown={event => handleBlockPointerDown(day.key, event)}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                          {formatTime(detailedShift.startHour)} – {formatTime(detailedShift.startHour + SHIFT_LENGTH_HOURS)}
                        </span>
                      </div>
                    )}

                    {overflowHours > 0 && index < WORK_DAYS.length - 1 && (
                      <span className="absolute bottom-1 right-2 text-[10px] font-medium text-base-content/70">
                        Continues {formatTime(0)} – {formatTime(overflowHours)} → {WORK_DAYS[index + 1].label}
                      </span>
                    )}

                    {!detailedShift && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-base-content/50">
                        Tap anywhere to place a 7-hour block
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="flex flex-col gap-2 border-t border-base-300/60 pt-3 text-xs text-base-content/60 sm:flex-row sm:items-center sm:justify-between">
          <span>Target: {WEEKLY_TARGET_HOURS} hrs · {WEEKLY_SHIFT_TARGET} shifts · Friday cutoff 8 PM</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Schedule"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default SchedulePlanner;
