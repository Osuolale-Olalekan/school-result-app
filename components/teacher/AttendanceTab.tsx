"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Save,
  Users,
  Sun,
  Sunset,
  AlertCircle,
  Loader2,
  PartyPopper,
  Coffee,
  School,
  HelpCircle,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type SessionType = "morning" | "afternoon";
type CalendarEventType =
  | "public_holiday"
  | "mid_term_break"
  | "school_event"
  | "other";

interface TermOption {
  _id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface Student {
  _id: string;
  surname: string;
  firstName: string;
  otherName?: string;
  admissionNumber: string;
  gender: "male" | "female";
}

interface StudentAttendance {
  student: string;
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  students: StudentAttendance[];
}

interface CalendarEvent {
  _id: string;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  blocksAttendance: boolean;
}

interface AttendanceTabProps {
  classId: string;
  sessionId: string;
  terms: TermOption[];
  defaultTerm: TermOption;
  className: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Short labels for mobile, full labels for larger screens
const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    shortLabel: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
    iconSm: React.ReactNode;
  }
> = {
  present: {
    label: "Present",
    shortLabel: "P",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-300 hover:bg-emerald-100",
    icon: <CheckCircle2 className="w-4 h-4" />,
    iconSm: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  absent: {
    label: "Absent",
    shortLabel: "A",
    color: "text-red-700",
    bg: "bg-red-50 border-red-300 hover:bg-red-100",
    icon: <XCircle className="w-4 h-4" />,
    iconSm: <XCircle className="w-3.5 h-3.5" />,
  },
  late: {
    label: "Late",
    shortLabel: "L",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-300 hover:bg-amber-100",
    icon: <Clock className="w-4 h-4" />,
    iconSm: <Clock className="w-3.5 h-3.5" />,
  },
  excused: {
    label: "Excused",
    shortLabel: "E",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-300 hover:bg-blue-100",
    icon: <FileCheck className="w-4 h-4" />,
    iconSm: <FileCheck className="w-3.5 h-3.5" />,
  },
};

const CALENDAR_TYPE_CONFIG: Record<
  CalendarEventType,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
  }
> = {
  public_holiday: {
    label: "Public Holiday",
    icon: <PartyPopper className="w-4 h-4" />,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  mid_term_break: {
    label: "Mid-Term Break",
    icon: <Coffee className="w-4 h-4" />,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  school_event: {
    label: "School Event",
    icon: <School className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  other: {
    label: "Non-School Day",
    icon: <HelpCircle className="w-4 h-4" />,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
};

const STATUS_CYCLE: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

function nextStatus(current: AttendanceStatus): AttendanceStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

function getBlockingEvent(
  dateStr: string,
  events: CalendarEvent[]
): CalendarEvent | null {
  const date = new Date(dateStr + "T00:00:00");
  for (const event of events) {
    if (!event.blocksAttendance) continue;
    const start = new Date(event.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(event.endDate);
    end.setUTCHours(23, 59, 59, 999);
    if (date >= start && date <= end) return event;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendanceTab({
  classId,
  sessionId,
  terms,
  defaultTerm,
  className,
}: AttendanceTabProps) {
  const [selectedTerm, setSelectedTerm] = useState<TermOption>(defaultTerm);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(
    new Map()
  );
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateKey(new Date())
  );
  const [draft, setDraft] = useState<Map<string, StudentAttendance>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedDate, setSavedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"mark" | "register">("mark");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attendanceRes, calendarRes] = await Promise.all([
        fetch(
          `/api/teacher/attendance?classId=${classId}&term=${selectedTerm.name}&sessionId=${sessionId}`
        ),
        fetch(
          `/api/teacher/school-calendar?sessionId=${sessionId}&term=${selectedTerm.name}`
        ),
      ]);

      const attendanceJson = (await attendanceRes.json()) as {
        success: boolean;
        data?: { students: Student[]; records: AttendanceRecord[] };
        error?: string;
      };
      const calendarJson = (await calendarRes.json()) as {
        success: boolean;
        data?: CalendarEvent[];
      };

      if (!attendanceJson.success || !attendanceJson.data) {
        throw new Error(attendanceJson.error ?? "Failed to load attendance");
      }

      setStudents(attendanceJson.data.students);

      const map = new Map<string, AttendanceRecord>();
      for (const rec of attendanceJson.data.records) {
        map.set(toDateKey(new Date(rec.date)), rec);
      }
      setRecords(map);

      if (calendarJson.success && calendarJson.data) {
        setCalendarEvents(calendarJson.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  }, [classId, selectedTerm.name, sessionId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const existing = records.get(selectedDate);
    const newDraft = new Map<string, StudentAttendance>();
    for (const student of students) {
      const found = existing?.students.find((s) => s.student === student._id);
      newDraft.set(student._id, {
        student: student._id,
        morning: found?.morning ?? "present",
        afternoon: found?.afternoon ?? "present",
      });
    }
    setDraft(newDraft);
  }, [selectedDate, records, students]);

  function toggleStatus(studentId: string, sessionType: SessionType) {
    setDraft((prev) => {
      const next = new Map(prev);
      const entry = next.get(studentId);
      if (!entry) return prev;
      next.set(studentId, {
        ...entry,
        [sessionType]: nextStatus(entry[sessionType]),
      });
      return next;
    });
  }

  function markAllPresent() {
    setDraft((prev) => {
      const next = new Map(prev);
      for (const [id, entry] of next)
        next.set(id, { ...entry, morning: "present", afternoon: "present" });
      return next;
    });
  }

  function markAllAbsent() {
    setDraft((prev) => {
      const next = new Map(prev);
      for (const [id, entry] of next)
        next.set(id, { ...entry, morning: "absent", afternoon: "absent" });
      return next;
    });
  }

  async function saveAttendance() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          sessionId,
          term: selectedTerm.name,
          date: selectedDate,
          students: Array.from(draft.values()),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Save failed");
      await fetchData();
      setSavedDate(selectedDate);
      setTimeout(() => setSavedDate(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(toDateKey(d));
  }

  const isSaved = records.has(selectedDate);
  const weekend = isWeekend(selectedDate);
  const blockingEvent = getBlockingEvent(selectedDate, calendarEvents);
  const isBlocked = weekend || (blockingEvent?.blocksAttendance ?? false);
  const presentMorning = Array.from(draft.values()).filter(
    (s) => s.morning === "present"
  ).length;
  const presentAfternoon = Array.from(draft.values()).filter(
    (s) => s.afternoon === "present"
  ).length;
  const recordDates = Array.from(records.keys()).sort();

  // ── Term selector ─────────────────────────────────────────────────────────
  const TermSelector = (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1">
        <Info className="w-3 h-3" /> Term:
      </span>
      {terms.map((t) => (
        <button
          key={t._id}
          onClick={() => {
            setSelectedTerm(t);
            setViewMode("mark");
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border transition-colors ${
            selectedTerm._id === t._id
              ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}
        >
          {t.name}
          {t._id === defaultTerm._id && selectedTerm._id !== t._id && (
            <span className="ml-1 opacity-50">(current)</span>
          )}
        </button>
      ))}
      {selectedTerm._id !== defaultTerm._id && (
        <button
          onClick={() => setSelectedTerm(defaultTerm)}
          className="text-[11px] text-[#1e3a5f] underline underline-offset-2 hover:no-underline"
        >
          Back to current
        </button>
      )}
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {TermSelector}
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
          <span className="ml-2 text-gray-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        {TermSelector}
        <div className="text-center py-10 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active students found.</p>
        </div>
      </div>
    );
  }

  // ── Register view ─────────────────────────────────────────────────────────
  if (viewMode === "register") {
    return (
      <div className="space-y-3 w-full min-w-0">
        {TermSelector}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-bold text-base text-gray-900 leading-tight">
              Register — {className}
            </h2>
            <p className="text-[11px] text-gray-500 capitalize mt-0.5">
              {selectedTerm.name} Term
            </p>
          </div>
          <button
            onClick={() => setViewMode("mark")}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#1e3a5f] text-white text-xs font-semibold hover:bg-[#152847] transition-colors"
          >
            Mark Today
          </button>
        </div>

        {calendarEvents.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Term Calendar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {calendarEvents.map((event) => {
                const cfg = CALENDAR_TYPE_CONFIG[event.type];
                return (
                  <span
                    key={event._id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium ${cfg.bg} ${cfg.border} ${cfg.color}`}
                  >
                    {cfg.icon}
                    <span className="truncate max-w-[120px]">
                      {event.title}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {recordDates.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              No attendance marked yet for {selectedTerm.name} term.
            </p>
          </div>
        ) : (
          /* Scrollable register table */
          <div className="overflow-x-auto -mx-3 px-3">
            <div className="min-w-[320px]">
              <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1e3a5f] text-white">
                      {/* Sticky student column */}
                      <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-[#1e3a5f] z-10 min-w-[110px] max-w-[130px]">
                        Student
                      </th>
                      {recordDates.map((d) => {
                        const evt = getBlockingEvent(d, calendarEvents);
                        return (
                          <th
                            key={d}
                            className="px-1.5 py-2.5 font-medium text-center min-w-[38px]"
                          >
                            <div className="text-[10px] opacity-80">
                              {new Date(d + "T00:00:00").toLocaleDateString(
                                "en-NG",
                                { day: "numeric", month: "short" }
                              )}
                            </div>
                            <div className="text-[9px] opacity-60">
                              {evt
                                ? "🏖"
                                : new Date(
                                    d + "T00:00:00"
                                  ).toLocaleDateString("en-NG", {
                                    weekday: "short",
                                  })}
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-2 py-2.5 font-semibold text-center min-w-[52px] sticky right-0 bg-[#1e3a5f]">
                        Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      let daysPresent = 0;
                      return (
                        <tr
                          key={student._id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                          }
                        >
                          <td className="px-3 py-2 sticky left-0 z-10 bg-inherit min-w-[110px] max-w-[130px]">
                            <p className="font-semibold text-gray-800 truncate text-[11px] leading-tight">
                              {student.surname}{" "}
                              {student.firstName.charAt(0)}.
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono leading-tight">
                              {student.admissionNumber}
                            </p>
                          </td>
                          {recordDates.map((d) => {
                            const rec = records.get(d);
                            const entry = rec?.students.find(
                              (s) => s.student === student._id
                            );
                            const morning = entry?.morning ?? "—";
                            const afternoon = entry?.afternoon ?? "—";
                            if (morning === "present") daysPresent += 0.5;
                            if (afternoon === "present") daysPresent += 0.5;
                            const statusColor = (s: string) =>
                              s === "present"
                                ? "text-emerald-600"
                                : s === "absent"
                                ? "text-red-500"
                                : s === "late"
                                ? "text-amber-500"
                                : s === "excused"
                                ? "text-blue-500"
                                : "text-gray-300";
                            const statusLetter = (s: string) =>
                              s === "present"
                                ? "P"
                                : s === "absent"
                                ? "A"
                                : s === "late"
                                ? "L"
                                : s === "excused"
                                ? "E"
                                : "·";
                            return (
                              <td key={d} className="px-1.5 py-2 text-center">
                                <div className="flex flex-col items-center gap-px">
                                  <span
                                    className={`text-[10px] font-bold leading-none ${statusColor(morning)}`}
                                  >
                                    {statusLetter(morning)}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold leading-none ${statusColor(afternoon)}`}
                                  >
                                    {statusLetter(afternoon)}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center sticky right-0 bg-inherit">
                            <span className="text-[11px] font-bold text-[#1e3a5f]">
                              {daysPresent}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              /{recordDates.length}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Legend */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-100 flex-wrap">
                  {(
                    [
                      ["P", "Present", "text-emerald-600"],
                      ["A", "Absent", "text-red-500"],
                      ["L", "Late", "text-amber-500"],
                      ["E", "Excused", "text-blue-500"],
                    ] as const
                  ).map(([code, label, color]) => (
                    <span
                      key={code}
                      className="flex items-center gap-0.5 text-[10px] text-gray-500"
                    >
                      <span className={`font-bold ${color}`}>{code}</span>={" "}
                      {label}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    Top=AM · Bot=PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Mark attendance view ───────────────────────────────────────────────────
  return (
    <div className="space-y-3 w-full min-w-0">
      {/* Term selector */}
      {TermSelector}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold text-base text-gray-900 leading-tight">
            Mark Attendance
          </h2>
          <p className="text-[11px] text-gray-500 capitalize mt-0.5">
            {selectedTerm.name} Term · {students.length} students
          </p>
        </div>
        <button
          onClick={() => setViewMode("register")}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Register
        </button>
      </div>

      {/* Date navigator */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="text-center flex-1 min-w-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-gray-800 text-center bg-transparent border-none outline-none cursor-pointer w-full"
            />
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
          {isSaved && !blockingEvent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          {weekend && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-medium">
              <AlertCircle className="w-3 h-3" /> Weekend
            </span>
          )}
          {savedDate === selectedDate && !blockingEvent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium animate-pulse">
              <CheckCircle2 className="w-3 h-3" /> Just saved!
            </span>
          )}
        </div>
      </div>

      {/* Holiday / break banner */}
      {blockingEvent && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl border ${CALENDAR_TYPE_CONFIG[blockingEvent.type].bg} ${CALENDAR_TYPE_CONFIG[blockingEvent.type].border}`}
        >
          <div
            className={`flex-shrink-0 mt-0.5 ${CALENDAR_TYPE_CONFIG[blockingEvent.type].color}`}
          >
            {CALENDAR_TYPE_CONFIG[blockingEvent.type].icon}
          </div>
          <div className="min-w-0">
            <p
              className={`text-xs font-bold ${CALENDAR_TYPE_CONFIG[blockingEvent.type].color}`}
            >
              {blockingEvent.title}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {CALENDAR_TYPE_CONFIG[blockingEvent.type].label} — attendance
              cannot be marked on this date.
            </p>
          </div>
        </div>
      )}

      {/* Marking UI */}
      {!isBlocked && (
        <>
          {/* Quick mark + stats row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-500 font-medium mr-0.5">
              Quick:
            </span>
            <button
              onClick={markAllPresent}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors"
            >
              All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium hover:bg-red-100 transition-colors"
            >
              All Absent
            </button>
            {/* Stats — pushed to its own line at small sizes via flex-wrap */}
            <div className="flex items-center gap-2 ml-auto text-[11px] text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-0.5">
                <Sun className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <strong className="text-gray-700 tabular-nums">
                  {presentMorning}/{students.length}
                </strong>
              </span>
              <span className="flex items-center gap-0.5">
                <Sunset className="w-3 h-3 text-orange-400 flex-shrink-0" />
                <strong className="text-gray-700 tabular-nums">
                  {presentAfternoon}/{students.length}
                </strong>
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Column header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-1.5 px-2 pb-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">
              Student
            </span>
            <div className="flex items-center justify-center gap-0.5 w-[52px]">
              <Sun className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase">
                AM
              </span>
            </div>
            <div className="flex items-center justify-center gap-0.5 w-[52px]">
              <Sunset className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase">
                PM
              </span>
            </div>
          </div>

          {/* Student rows */}
          <div className="space-y-1.5">
            {students.map((student, idx) => {
              const entry = draft.get(student._id);
              if (!entry) return null;
              const morningCfg = STATUS_CONFIG[entry.morning];
              const afternoonCfg = STATUS_CONFIG[entry.afternoon];

              return (
                <div
                  key={student._id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5 bg-white rounded-xl border border-gray-100 px-2 py-2 hover:border-gray-200 transition-colors"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-gray-500 w-4 text-right flex-shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    {/* Avatar */}
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase ${
                        student.gender === "female"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {student.surname.charAt(0)}
                      {student.firstName.charAt(0)}
                    </div>
                    {/* Name — truncates before buttons ever get squeezed */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                        {student.surname} {student.firstName}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono leading-tight">
                        {student.admissionNumber}
                      </p>
                    </div>
                  </div>

                  {/*
                   * ── Attendance buttons ────────────────────────────────────
                   * Fixed width of 52px each so they never overflow on 320px.
                   * On sm+ screens the full label appears; on mobile only the
                   * coloured icon + short letter is shown.
                   */}
                  <button
                    onClick={() => toggleStatus(student._id, "morning")}
                    title={`Morning: ${morningCfg.label}`}
                    className={`w-[52px] h-8 flex flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition-colors ${morningCfg.bg} ${morningCfg.color}`}
                  >
                    {/* Icon only — tiny but tappable */}
                    <span className="flex items-center gap-0.5">
                      {morningCfg.iconSm}
                      {/* Short letter always visible on mobile */}
                      <span className="sm:hidden">{morningCfg.shortLabel}</span>
                      {/* Full label on sm+ */}
                      <span className="hidden sm:inline">{morningCfg.label}</span>
                    </span>
                  </button>

                  <button
                    onClick={() => toggleStatus(student._id, "afternoon")}
                    title={`Afternoon: ${afternoonCfg.label}`}
                    className={`w-[52px] h-8 flex flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition-colors ${afternoonCfg.bg} ${afternoonCfg.color}`}
                  >
                    <span className="flex items-center gap-0.5">
                      {afternoonCfg.iconSm}
                      <span className="sm:hidden">{afternoonCfg.shortLabel}</span>
                      <span className="hidden sm:inline">{afternoonCfg.label}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap px-1">
            <span className="text-[10px] text-gray-400">Tap to cycle:</span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span
                key={key}
                className={`flex items-center gap-0.5 text-[10px] font-medium ${cfg.color}`}
              >
                {cfg.iconSm} {cfg.label}
              </span>
            ))}
          </div>

          {/* Save button */}
          <div className="pt-1">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold text-sm hover:bg-[#152847] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isSaved ? "Update Attendance" : "Save Attendance"}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}