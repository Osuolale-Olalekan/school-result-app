"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Loader2, Clock, User, Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

interface Period {
  _id?:         string;
  day:          Day;
  periodNumber: number;
  startTime:    string;
  endTime:      string;
  subjectId:    { _id: string; name: string } | string;
  teacherId:    { _id: string; firstName: string; surname: string } | string;
  room?:        string;
}

interface Timetable {
  _id:       string;
  classId:   { name: string; section?: string } | string;
  sessionId: { name: string } | string;
  termId:    { name: string } | string;
  periods:   Period[];
}

interface ChildTimetable {
  child:     { _id: string; firstName: string; surname: string };
  timetable: Timetable | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: Day; label: string; full: string }[] = [
  { key: "monday",    label: "Mon", full: "Monday"    },
  { key: "tuesday",   label: "Tue", full: "Tuesday"   },
  { key: "wednesday", label: "Wed", full: "Wednesday" },
  { key: "thursday",  label: "Thu", full: "Thursday"  },
  { key: "friday",    label: "Fri", full: "Friday"    },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DAY_COLORS: Record<Day, { bg: string; text: string; border: string }> = {
  monday:    { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200"    },
  tuesday:   { bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-200"  },
  wednesday: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  thursday:  { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200"  },
  friday:    { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200"   },
};

// ─── TimetableGrid sub-component ─────────────────────────────────────────────

function TimetableGrid({ timetable }: { timetable: Timetable }) {
  const [viewDay, setViewDay] = useState<Day>(() => {
    const dayIndex = new Date().getDay();
    if (dayIndex >= 1 && dayIndex <= 5) {
      const dayMap: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      return dayMap[dayIndex - 1];
    }
    return "monday";
  });

  function getPeriod(day: Day, pNum: number) {
    return timetable.periods.find((p) => p.day === day && p.periodNumber === pNum);
  }

  const dc = DAY_COLORS[viewDay];
  const periodsToday = timetable.periods.filter((p) => p.day === viewDay);

  return (
    <div className="space-y-3">
      {/* Day tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit overflow-x-auto">
        {DAYS.map(({ key, label }) => {
          const c     = DAY_COLORS[key];
          const count = timetable.periods.filter((p) => p.day === key).length;
          return (
            <button
              key={key}
              onClick={() => setViewDay(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 relative border ${
                viewDay === key
                  ? `${c.bg} ${c.text} ${c.border} shadow-sm`
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center border ${c.bg} ${c.text} ${c.border}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day label */}
      <p className={`text-xs font-semibold capitalize ${dc.text}`}>
        {DAYS.find((d) => d.key === viewDay)?.full}
        {periodsToday.length === 0 && (
          <span className="ml-2 font-normal text-gray-300"> — No classes</span>
        )}
      </p>

      {/* Period rows */}
      <div className="space-y-1.5">
        {PERIODS.map((pNum) => {
          const period = getPeriod(viewDay, pNum);
          if (!period) return null;

          const subj    = typeof period.subjectId === "object" ? period.subjectId.name : "—";
          const teacher = typeof period.teacherId === "object"
            ? `${period.teacherId.firstName} ${period.teacherId.surname}`
            : "—";

          return (
            <motion.div
              key={pNum}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: pNum * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
            >
              {/* Period number badge */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border ${dc.bg} ${dc.text} ${dc.border}`}>
                {pNum}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{subj}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-0.5">
                    <User className="w-2.5 h-2.5" /> {teacher}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {period.startTime} – {period.endTime}
                  </span>
                  {period.room && (
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px]">
                      {period.room}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {periodsToday.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <CalendarDays className="w-6 h-6 mb-1.5 text-gray-300" />
            <p className="text-xs text-gray-400">No classes scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TimetableViewProps {
  role:      "student" | "teacher" | "parent";
  childId?:  string;
}

export default function TimetableView({ role, childId }: TimetableViewProps) {
  const [data, setData]               = useState<Timetable | Timetable[] | ChildTimetable[] | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>("");

  const apiUrl =
    role === "student" ? "/api/student/timetable"
    : role === "teacher" ? "/api/teacher/timetable"
    : `/api/parent/timetable${childId ? `?childId=${childId}` : ""}`;

  const fetchTimetable = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res  = await fetch(apiUrl);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      if (!silent) toast.error("Failed to load timetable");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => { void fetchTimetable(true); }, [fetchTimetable]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 font-display">
            {role === "teacher" ? "My Schedule" : "Timetable"}
          </h2>
          <p className="text-xs text-gray-400">Weekly class schedule</p>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : !data || (Array.isArray(data) && data.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <CalendarDays className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No timetable available</p>
        </div>
      ) : (
        <>
          {/* ── Student: single timetable ── */}
          {role === "student" && data && !Array.isArray(data) && (
            <div>
              {typeof (data as Timetable).classId === "object" && (
                <p className="text-xs text-gray-400 mb-3">
                  {((data as Timetable).classId as { name: string; section?: string }).name}
                  {" · "}
                  {typeof (data as Timetable).termId === "object"
                    ? ((data as Timetable).termId as { name: string }).name
                    : ""}
                </p>
              )}
              <TimetableGrid timetable={data as Timetable} />
            </div>
          )}

          {/* ── Teacher: multiple class timetables ── */}
          {role === "teacher" && Array.isArray(data) && (
            <div className="space-y-6">
              {(data as Timetable[]).map((t) => (
                <div key={t._id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Users className="w-3 h-3 text-blue-500" />
                    </div>
                    <p className="text-xs font-semibold text-gray-900">
                      {typeof t.classId === "object" ? t.classId.name : "—"}
                      {typeof t.termId === "object" ? ` · ${t.termId.name}` : ""}
                    </p>
                  </div>
                  <TimetableGrid timetable={t} />
                </div>
              ))}
            </div>
          )}

          {/* ── Parent: child selector + timetable ── */}
          {role === "parent" && Array.isArray(data) && (
            <div className="space-y-4">
              {/* Child tabs */}
              {(data as ChildTimetable[]).length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {(data as ChildTimetable[]).map(({ child }) => {
                    const isActive =
                      selectedChild === String(child._id) ||
                      (!selectedChild && (data as ChildTimetable[])[0].child._id === child._id);
                    return (
                      <button
                        key={String(child._id)}
                        onClick={() => setSelectedChild(String(child._id))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isActive
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {child.firstName} {child.surname}
                      </button>
                    );
                  })}
                </div>
              )}

              {(data as ChildTimetable[])
                .filter(({ child }) =>
                  !selectedChild
                    ? (data as ChildTimetable[])[0].child._id === child._id
                    : String(child._id) === selectedChild
                )
                .slice(0, 1)
                .map(({ child, timetable }) => (
                  <div key={String(child._id)}>
                    {timetable ? (
                      <TimetableGrid timetable={timetable} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                        <CalendarDays className="w-7 h-7 mb-2 text-gray-300" />
                        <p className="text-xs text-gray-400">
                          No timetable for {child.firstName}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import {
//   CalendarDays,
//   Loader2,
//   Clock,
//   User,
//   BookOpen,
//   Users,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { toast } from "sonner";
// import { UserRole } from "@/types/enums";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

// interface Period {
//   _id?: string;
//   day: Day;
//   periodNumber: number;
//   startTime: string;
//   endTime: string;
//   subjectId: { _id: string; name: string } | string;
//   teacherId: { _id: string; firstName: string; surname: string } | string;
//   room?: string;
// }

// interface Timetable {
//   _id: string;
//   classId: { name: string; section?: string } | string;
//   sessionId: { name: string } | string;
//   termId: { name: string } | string;
//   periods: Period[];
// }

// interface ChildTimetable {
//   child: { _id: string; firstName: string; surname: string };
//   timetable: Timetable | null;
// }

// // ─── Constants ────────────────────────────────────────────────────────────────

// const DAYS: { key: Day; label: string; full: string }[] = [
//   { key: "monday", label: "Mon", full: "Monday" },
//   { key: "tuesday", label: "Tue", full: "Tuesday" },
//   { key: "wednesday", label: "Wed", full: "Wednesday" },
//   { key: "thursday", label: "Thu", full: "Thursday" },
//   { key: "friday", label: "Fri", full: "Friday" },
// ];

// const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// const DAY_COLORS: Record<Day, { bg: string; text: string; border: string }> = {
//   monday: {
//     bg: "rgba(14,165,233,0.1)",
//     text: "#38bdf8",
//     border: "rgba(14,165,233,0.2)",
//   },
//   tuesday: {
//     bg: "rgba(167,139,250,0.1)",
//     text: "#a78bfa",
//     border: "rgba(167,139,250,0.2)",
//   },
//   wednesday: {
//     bg: "rgba(16,185,129,0.1)",
//     text: "#34d399",
//     border: "rgba(16,185,129,0.2)",
//   },
//   thursday: {
//     bg: "rgba(249,115,22,0.1)",
//     text: "#f97316",
//     border: "rgba(249,115,22,0.2)",
//   },
//   friday: {
//     bg: "rgba(245,158,11,0.1)",
//     text: "#fbbf24",
//     border: "rgba(245,158,11,0.2)",
//   },
// };

// // ─── Sub-component: single timetable grid ────────────────────────────────────

// function TimetableGrid({ timetable }: { timetable: Timetable }) {
//   //   const [viewDay, setViewDay] = useState<Day>("monday");

//   //   // Default to today's day if it's a weekday
//   //   useEffect(() => {
//   //     const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon...5=Fri, 6=Sat
//   //     if (dayIndex >= 1 && dayIndex <= 5) {
//   //       const dayMap: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
//   //       setViewDay(dayMap[dayIndex - 1]);
//   //     }
//   //   }, []);

//   // ✅ Fix — compute initial value directly in useState
//   const [viewDay, setViewDay] = useState<Day>(() => {
//     const dayIndex = new Date().getDay();
//     if (dayIndex >= 1 && dayIndex <= 5) {
//       const dayMap: Day[] = [
//         "monday",
//         "tuesday",
//         "wednesday",
//         "thursday",
//         "friday",
//       ];
//       return dayMap[dayIndex - 1];
//     }
//     return "monday";
//   });

//   function getPeriod(day: Day, pNum: number) {
//     return timetable.periods.find(
//       (p) => p.day === day && p.periodNumber === pNum,
//     );
//   }

//   const dc = DAY_COLORS[viewDay];
//   const periodsToday = timetable.periods.filter((p) => p.day === viewDay);

//   return (
//     <div className="space-y-3">
//       {/* Day tabs */}
//       <div
//         className="flex gap-1 p-1 rounded-xl w-fit overflow-x-auto"
//         style={{
//           background: "rgba(255,255,255,0.04)",
//           border: "1px solid rgba(14,165,233,0.12)",
//         }}
//       >
//         {DAYS.map(({ key, label }) => {
//           const c = DAY_COLORS[key];
//           const count = timetable.periods.filter((p) => p.day === key).length;
//           return (
//             <button
//               key={key}
//               onClick={() => setViewDay(key)}
//               className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 relative"
//               style={
//                 viewDay === key
//                   ? {
//                       background: c.bg,
//                       color: c.text,
//                       border: `1px solid ${c.border}`,
//                     }
//                   : {
//                       color: "rgba(245,240,232,0.4)",
//                       border: "1px solid transparent",
//                     }
//               }
//             >
//               {label}
//               {count > 0 && (
//                 <span
//                   className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
//                   style={{
//                     background: c.bg,
//                     color: c.text,
//                     border: `1px solid ${c.border}`,
//                   }}
//                 >
//                   {count}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* Day label */}
//       <p
//         className="text-xs font-semibold capitalize"
//         style={{ color: dc.text }}
//       >
//         {DAYS.find((d) => d.key === viewDay)?.full}
//         {periodsToday.length === 0 && (
//           <span
//             className="ml-2 font-normal"
//             style={{ color: "rgba(245,240,232,0.3)" }}
//           >
//             — No classes
//           </span>
//         )}
//       </p>

//       {/* Periods */}
//       <div className="space-y-1.5">
//         {PERIODS.map((pNum) => {
//           const period = getPeriod(viewDay, pNum);
//           if (!period) return null;

//           const subj =
//             typeof period.subjectId === "object" ? period.subjectId.name : "—";
//           const teacher =
//             typeof period.teacherId === "object"
//               ? `${period.teacherId.firstName} ${period.teacherId.surname}`
//               : "—";

//           return (
//             <motion.div
//               key={pNum}
//               initial={{ opacity: 0, x: -4 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: pNum * 0.04 }}
//               className="flex items-center gap-3 p-3 rounded-xl"
//               style={{
//                 background: "rgba(255,255,255,0.04)",
//                 border: "1px solid rgba(255,255,255,0.07)",
//               }}
//             >
//               {/* Period number */}
//               <div
//                 className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
//                 style={{
//                   background: dc.bg,
//                   color: dc.text,
//                   border: `1px solid ${dc.border}`,
//                 }}
//               >
//                 {pNum}
//               </div>

//               <div className="flex-1 min-w-0">
//                 <p
//                   className="text-xs font-semibold truncate"
//                   style={{ color: "#f5f0e8" }}
//                 >
//                   {subj}
//                 </p>
//                 <div
//                   className="flex items-center gap-3 text-[10px] mt-0.5"
//                   style={{ color: "rgba(245,240,232,0.4)" }}
//                 >
//                   <span className="flex items-center gap-1">
//                     <User className="w-2.5 h-2.5" />
//                     {teacher}
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <Clock className="w-2.5 h-2.5" />
//                     {period.startTime} – {period.endTime}
//                   </span>
//                   {period.room && (
//                     <span
//                       className="px-1.5 py-0.5 rounded text-[9px]"
//                       style={{
//                         background: "rgba(255,255,255,0.06)",
//                         color: "rgba(245,240,232,0.4)",
//                       }}
//                     >
//                       {period.room}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           );
//         })}

//         {periodsToday.length === 0 && (
//           <div
//             className="flex flex-col items-center justify-center py-8 rounded-xl"
//             style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
//           >
//             <CalendarDays
//               className="w-6 h-6 mb-1.5"
//               style={{ color: "rgba(245,240,232,0.12)" }}
//             />
//             <p className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
//               No classes scheduled
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// interface TimetableViewProps {
//   role: "student" | "teacher" | "parent";
//   childId?: string;
// }

// export default function TimetableView({ role, childId }: TimetableViewProps) {
//   const [data, setData] = useState<
//     Timetable | Timetable[] | ChildTimetable[] | null
//   >(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedChild, setSelectedChild] = useState<string>("");

//   const apiUrl =
//     role === "student"
//       ? "/api/student/timetable"
//       : role === "teacher"
//         ? "/api/teacher/timetable"
//         : `/api/parent/timetable${childId ? `?childId=${childId}` : ""}`;

//   const fetchTimetable = useCallback(
//     async (silent = false) => {
//       if (!silent) setIsLoading(true);
//       try {
//         const res = await fetch(apiUrl);
//         const json = await res.json();
//         if (json.success) setData(json.data);
//       } catch {
//         if (!silent) toast.error("Failed to load timetable");
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [apiUrl],
//   );

//   useEffect(() => {
//     void fetchTimetable(true);
//   }, [fetchTimetable]);

//   // ─── Render ───────────────────────────────────────────────────────────────

//   return (
//     <div
//       className="w-full min-w-0 rounded-2xl p-4 lg:p-6 space-y-4"
//       style={{
//         background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
//         border: "1px solid rgba(14,165,233,0.12)",
//       }}
//     >
//       {/* Header */}
//       <div className="flex items-center gap-2">
//         <div
//           className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
//           style={{
//             background: "rgba(14,165,233,0.15)",
//             border: "1px solid rgba(14,165,233,0.25)",
//           }}
//         >
//           <CalendarDays className="w-4 h-4" style={{ color: "#38bdf8" }} />
//         </div>
//         <div>
//           <h2 className="text-base font-bold" style={{ color: "#f5f0e8" }}>
//             {role === "teacher" ? "My Schedule" : "Timetable"}
//           </h2>
//           <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
//             Weekly class schedule
//           </p>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="flex items-center justify-center py-14">
//           <Loader2
//             className="w-5 h-5 animate-spin"
//             style={{ color: "#38bdf8" }}
//           />
//         </div>
//       ) : !data || (Array.isArray(data) && data.length === 0) ? (
//         <div
//           className="flex flex-col items-center justify-center py-14 rounded-2xl"
//           style={{
//             border: "1px dashed rgba(14,165,233,0.15)",
//             background: "rgba(255,255,255,0.01)",
//           }}
//         >
//           <CalendarDays
//             className="w-8 h-8 mb-2"
//             style={{ color: "rgba(245,240,232,0.12)" }}
//           />
//           <p className="text-sm" style={{ color: "rgba(245,240,232,0.3)" }}>
//             No timetable available
//           </p>
//         </div>
//       ) : (
//         <>
//           {/* ── Student: single timetable ── */}
//           {role === "student" && data && !Array.isArray(data) && (
//             <div>
//               {typeof (data as Timetable).classId === "object" && (
//                 <p
//                   className="text-xs mb-3"
//                   style={{ color: "rgba(245,240,232,0.4)" }}
//                 >
//                   {
//                     (
//                       (data as Timetable).classId as {
//                         name: string;
//                         section?: string;
//                       }
//                     ).name
//                   }
//                   {" · "}
//                   {typeof (data as Timetable).termId === "object"
//                     ? ((data as Timetable).termId as { name: string }).name
//                     : ""}
//                 </p>
//               )}
//               <TimetableGrid timetable={data as Timetable} />
//             </div>
//           )}

//           {/* ── Teacher: multiple class timetables, filtered to their periods ── */}
//           {role === "teacher" && Array.isArray(data) && (
//             <div className="space-y-6">
//               {(data as Timetable[]).map((t) => (
//                 <div key={t._id}>
//                   <div className="flex items-center gap-2 mb-3">
//                     <div
//                       className="w-6 h-6 rounded-lg flex items-center justify-center"
//                       style={{
//                         background: "rgba(14,165,233,0.12)",
//                         border: "1px solid rgba(14,165,233,0.2)",
//                       }}
//                     >
//                       <Users className="w-3 h-3" style={{ color: "#38bdf8" }} />
//                     </div>
//                     <p
//                       className="text-xs font-semibold"
//                       style={{ color: "#f5f0e8" }}
//                     >
//                       {typeof t.classId === "object" ? t.classId.name : "—"}
//                       {typeof t.termId === "object"
//                         ? ` · ${t.termId.name}`
//                         : ""}
//                     </p>
//                   </div>
//                   <TimetableGrid timetable={t} />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* ── Parent: child selector + timetable ── */}
//           {role === "parent" && Array.isArray(data) && (
//             <div className="space-y-4">
//               {/* Child tabs */}
//               {(data as ChildTimetable[]).length > 1 && (
//                 <div className="flex gap-1.5 flex-wrap">
//                   {(data as ChildTimetable[]).map(({ child }) => (
//                     <button
//                       key={String(child._id)}
//                       onClick={() => setSelectedChild(String(child._id))}
//                       className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
//                       style={
//                         selectedChild === String(child._id) ||
//                         (!selectedChild &&
//                           (data as ChildTimetable[])[0].child._id === child._id)
//                           ? {
//                               background: "rgba(14,165,233,0.15)",
//                               color: "#38bdf8",
//                               border: "1px solid rgba(14,165,233,0.25)",
//                             }
//                           : {
//                               background: "rgba(255,255,255,0.04)",
//                               color: "rgba(245,240,232,0.4)",
//                               border: "1px solid rgba(255,255,255,0.08)",
//                             }
//                       }
//                     >
//                       {child.firstName} {child.surname}
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {(data as ChildTimetable[])
//                 .filter(({ child }) =>
//                   !selectedChild
//                     ? (data as ChildTimetable[]).indexOf({
//                         child,
//                         timetable: null,
//                       }) === 0 || true
//                     : String(child._id) === selectedChild,
//                 )
//                 .slice(0, 1)
//                 .map(({ child, timetable }) => (
//                   <div key={String(child._id)}>
//                     {timetable ? (
//                       <TimetableGrid timetable={timetable} />
//                     ) : (
//                       <div
//                         className="flex flex-col items-center justify-center py-10 rounded-2xl"
//                         style={{ border: "1px dashed rgba(14,165,233,0.12)" }}
//                       >
//                         <CalendarDays
//                           className="w-7 h-7 mb-2"
//                           style={{ color: "rgba(245,240,232,0.12)" }}
//                         />
//                         <p
//                           className="text-xs"
//                           style={{ color: "rgba(245,240,232,0.3)" }}
//                         >
//                           No timetable for {child.firstName}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }
