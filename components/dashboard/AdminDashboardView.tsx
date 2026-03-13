// "use client";

// import { useEffect, useState, useRef } from "react";
// import {
//   Users, GraduationCap, BookOpen, FileText, CreditCard,
//   TrendingUp, CheckCircle, Clock, BarChart2, ArrowUpRight,
//   ArrowDownRight, Minus
// } from "lucide-react";
// import {
//   PieChart, Pie, Cell, Tooltip, ResponsiveContainer
// } from "recharts";
// import type { AdminAnalytics } from "@/types";

// const CHART_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

// // ─── Stat Card ────────────────────────────────────────────────────────────────
// function StatCard({
//   icon: Icon, label, value, sub, color, loading
// }: {
//   icon: React.ComponentType<{ className?: string }>;
//   label: string;
//   value: string | number;
//   sub?: string;
//   color: string;
//   loading?: boolean;
// }) {
//   return (
//     <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
//       <div className="flex items-start justify-between">
//         <div>
//           {loading ? (
//             <>
//               <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1" />
//               <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
//             </>
//           ) : (
//             <>
//               <div className="text-2xl font-bold font-display text-gray-900">{value}</div>
//               <div className="text-sm text-gray-500 mt-0.5">{label}</div>
//               {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
//             </>
//           )}
//         </div>
//         <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
//           <Icon className="w-5 h-5 text-white" />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Students by Class Chart ──────────────────────────────────────────────────
// type ClassData = {
//   className: string;
//   count: number;
//   capacity?: number;
//   teacher?: string;
// };

// function StudentsChart({
//   data,
//   loading
// }: {
//   data: ClassData[];
//   loading: boolean;
// }) {
//   const [sortByCount, setSortByCount] = useState(false);
//   const [animationKey, setAnimationKey] = useState(0);
//   const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
//   const chartRef = useRef<HTMLDivElement>(null);

//   const total = data.reduce((s, d) => s + d.count, 0);
//   const avg = data.length ? Math.round(total / data.length) : 0;
//   const maxCount = Math.max(...data.map(d => d.count), 1);

//   const sorted = sortByCount
//     ? [...data].sort((a, b) => b.count - a.count)
//     : data;

//   useEffect(() => {
//     if (!loading && data.length > 0) {
//       const timer = setTimeout(() => setAnimationKey(k => k + 1), 80);
//       return () => clearTimeout(timer);
//     }
//   }, [loading, data]);

//   function handleSortToggle() {
//     setSortByCount(v => !v);
//     setAnimationKey(k => k + 1);
//   }

//   function getBarStyle(item: ClassData): {
//     bg: string;
//     fill: string;
//     accent: string;
//     badge: string;
//     badgeText: string;
//     label: string;
//   } {
//     const capPct = item.capacity ? item.capacity > 0 ? item.count / item.capacity : 0 : null;
//     if (capPct !== null && capPct >= 0.95) {
//       return {
//         bg: "bg-red-50",
//         fill: "bg-gradient-to-r from-red-400 to-red-500",
//         accent: "bg-red-500",
//         badge: "bg-red-100 text-red-700",
//         badgeText: "At capacity",
//         label: "text-red-700",
//       };
//     }
//     if (item.count >= avg) {
//       return {
//         bg: "bg-amber-50",
//         fill: "bg-gradient-to-r from-amber-400 to-amber-500",
//         accent: "bg-amber-500",
//         badge: "bg-amber-100 text-amber-700",
//         badgeText: "Above avg",
//         label: "text-amber-700",
//       };
//     }
//     return {
//       bg: "bg-blue-50",
//       fill: "bg-gradient-to-r from-blue-400 to-blue-500",
//       accent: "bg-blue-500",
//       badge: "bg-blue-100 text-blue-700",
//       badgeText: "Below avg",
//       label: "text-blue-700",
//     };
//   }

//   const skeletonRows = Array.from({ length: 5 });

//   return (
//     <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">

//       {/* Header */}
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
//             <BarChart2 className="w-4 h-4 text-amber-500" />
//             Students by class
//           </h3>
//           <p className="text-xs text-gray-400 mt-0.5">Enrollment across all active classes</p>
//         </div>

//         {/* Summary pills */}
//         {!loading && (
//           <div className="flex items-center gap-3 flex-shrink-0">
//             <div className="text-right">
//               <div className="text-lg font-bold font-display text-gray-900 leading-none">{total}</div>
//               <div className="text-[10px] text-gray-400 mt-0.5">Total</div>
//             </div>
//             <div className="w-px h-8 bg-gray-100" />
//             <div className="text-right">
//               <div className="text-lg font-bold font-display text-gray-900 leading-none">{avg}</div>
//               <div className="text-[10px] text-gray-400 mt-0.5">Avg / class</div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Sort toggle */}
//       {!loading && data.length > 0 && (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3 text-[10px] text-gray-400">
//             <span className="flex items-center gap-1">
//               <span className="inline-block w-2 h-2 rounded-[2px] bg-amber-400" />Above avg
//             </span>
//             <span className="flex items-center gap-1">
//               <span className="inline-block w-2 h-2 rounded-[2px] bg-blue-400" />Below avg
//             </span>
//             <span className="flex items-center gap-1">
//               <span className="inline-block w-2 h-2 rounded-[2px] bg-red-400" />At capacity
//             </span>
//           </div>
//           <button
//             onClick={handleSortToggle}
//             className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md px-2.5 py-1 transition-colors hover:bg-gray-50"
//           >
//             {sortByCount ? "Sort by name ↑" : "Sort by count ↓"}
//           </button>
//         </div>
//       )}

//       {/* Chart rows */}
//       <div ref={chartRef} className="flex flex-col gap-2">
//         {loading
//           ? skeletonRows.map((_, i) => (
//               <div key={i} className="flex items-center gap-3">
//                 <div className="w-16 h-4 bg-gray-100 rounded animate-pulse flex-shrink-0" />
//                 <div className="flex-1 h-8 bg-gray-100 rounded-lg animate-pulse" />
//                 <div className="w-8 h-4 bg-gray-100 rounded animate-pulse flex-shrink-0" />
//               </div>
//             ))
//           : sorted.map((item, i) => {
//               const style = getBarStyle(item);
//               const widthPct = (item.count / (maxCount * 1.08)) * 100;
//               const capPct = item.capacity && item.capacity > 0
//                 ? Math.min((item.count / item.capacity) * 100, 100)
//                 : null;
//               const isHovered = hoveredIndex === i;

//               return (
//                 <div
//                   key={item.className}
//                   className={`group flex items-center gap-3 rounded-xl px-2 py-1.5 cursor-pointer transition-colors duration-150 ${
//                     isHovered ? "bg-gray-50" : "hover:bg-gray-50"
//                   }`}
//                   onMouseEnter={() => setHoveredIndex(i)}
//                   onMouseLeave={() => setHoveredIndex(null)}
//                 >
//                   {/* Class label */}
//                   <span className="text-xs font-medium text-gray-500 w-14 flex-shrink-0 text-right">
//                     {item.className}
//                   </span>

//                   {/* Bar track */}
//                   <div className="flex-1 flex flex-col gap-1">
//                     <div className="relative h-7 bg-gray-100 rounded-lg overflow-hidden">
//                       {/* Avg marker */}
//                       <div
//                         className="absolute top-0 bottom-0 w-px bg-gray-300 z-10"
//                         style={{ left: `${(avg / (maxCount * 1.08)) * 100}%` }}
//                       />
//                       {/* Bar fill */}
//                       <div
//                         className={`absolute left-0 top-0 bottom-0 rounded-lg transition-all duration-700 ease-out ${style.fill}`}
//                         style={{
//                           width: animationKey > 0 ? `${widthPct}%` : "0%",
//                           transitionDelay: `${i * 60}ms`,
//                         }}
//                       >
//                         {/* Count inside bar (shows when wide enough) */}
//                         {widthPct > 25 && (
//                           <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-white`}>
//                             {item.count}
//                           </span>
//                         )}
//                       </div>
//                       {/* Count outside bar (shows when bar is narrow) */}
//                       {widthPct <= 25 && (
//                         <span
//                           className={`absolute top-1/2 -translate-y-1/2 text-xs font-semibold ${style.label} transition-all duration-700`}
//                           style={{
//                             left: animationKey > 0 ? `calc(${widthPct}% + 8px)` : "8px",
//                             transitionDelay: `${i * 60}ms`,
//                           }}
//                         >
//                           {item.count}
//                         </span>
//                       )}
//                     </div>

//                     {/* Capacity mini bar */}
//                     {capPct !== null && (
//                       <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full rounded-full transition-all duration-700 ease-out ${style.accent}`}
//                           style={{
//                             width: animationKey > 0 ? `${capPct}%` : "0%",
//                             transitionDelay: `${i * 60 + 200}ms`,
//                             opacity: 0.5,
//                           }}
//                         />
//                       </div>
//                     )}
//                   </div>

//                   {/* Capacity % */}
//                   {capPct !== null ? (
//                     <span className={`text-[10px] font-semibold w-9 flex-shrink-0 text-right ${style.label}`}>
//                       {Math.round(capPct)}%
//                     </span>
//                   ) : (
//                     <span className="w-9 flex-shrink-0" />
//                   )}

//                   {/* Hover tooltip */}
//                   {isHovered && item.teacher && (
//                     <div className="absolute right-16 z-20 bg-white border border-gray-100 rounded-xl shadow-lg p-3 min-w-[160px] pointer-events-none">
//                       <p className="text-xs font-semibold text-gray-800 mb-1.5">{item.className}</p>
//                       <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
//                         <span>Teacher</span>
//                         <span className="font-medium text-gray-700">{item.teacher}</span>
//                       </div>
//                       {item.capacity && (
//                         <div className="flex justify-between text-[10px] text-gray-500">
//                           <span>Enrolled</span>
//                           <span className={`font-semibold ${style.label}`}>{item.count} / {item.capacity}</span>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//       </div>

//       {/* Footer: avg marker legend */}
//       {!loading && data.length > 0 && (
//         <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1 border-t border-gray-50">
//           <div className="w-3 h-px bg-gray-300" />
//           <span>Avg mark at {avg} students</span>
//         </div>
//       )}

//       {!loading && data.length === 0 && (
//         <div className="h-40 flex items-center justify-center text-sm text-gray-400">
//           No class data yet
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main Dashboard ───────────────────────────────────────────────────────────
// export default function AdminDashboardView() {
//   const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAnalytics();
//   }, []);

//   async function fetchAnalytics() {
//     try {
//       const res = await fetch("/api/admin/analytics");
//       const json = await res.json() as { success: boolean; data?: AdminAnalytics };
//       if (json.success && json.data) setAnalytics(json.data);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const reportStatusData = analytics?.reportsByStatus.map((item) => ({
//     name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
//     value: item.count,
//   })) ?? [];

//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div>
//         <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
//         <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
//       </div>

//       {/* Stat Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard icon={GraduationCap} label="Total Students" value={analytics?.totalStudents ?? 0} sub={`${analytics?.activeStudents ?? 0} active`} color="bg-amber-500" loading={loading} />
//         <StatCard icon={Users} label="Teachers" value={analytics?.totalTeachers ?? 0} color="bg-blue-500" loading={loading} />
//         <StatCard icon={Users} label="Parents" value={analytics?.totalParents ?? 0} color="bg-emerald-500" loading={loading} />
//         <StatCard icon={BookOpen} label="Classes" value={analytics?.totalClasses ?? 0} color="bg-purple-500" loading={loading} />
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <StatCard icon={Clock} label="Pending Reviews" value={analytics?.pendingReports ?? 0} color="bg-orange-500" loading={loading} />
//         <StatCard icon={CheckCircle} label="Approved Reports" value={analytics?.approvedReports ?? 0} color="bg-emerald-600" loading={loading} />
//         <StatCard
//           icon={CreditCard}
//           label="Payments Cleared"
//           value={analytics?.paymentStats.paid ?? 0}
//           sub={`${analytics?.paymentStats.unpaid ?? 0} pending`}
//           color="bg-[#1e3a5f]"
//           loading={loading}
//         />
//       </div>

//       {/* Charts Row */}
//       <div className="grid lg:grid-cols-2 gap-6">
//         {/* Students by Class — enterprise chart */}
//         <StudentsChart
//           data={analytics?.studentsByClass ?? []}
//           loading={loading}
//         />

//         {/* Reports by Status */}
//         <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
//           <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
//             <FileText className="w-4 h-4 text-blue-500" />
//             Reports by Status
//           </h3>
//           {loading ? (
//             <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
//           ) : reportStatusData.length === 0 ? (
//             <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No report data yet</div>
//           ) : (
//             <div className="flex items-center gap-6">
//               <ResponsiveContainer width="60%" height={180}>
//                 <PieChart>
//                   <Pie data={reportStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
//                     {reportStatusData.map((_, i) => (
//                       <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//               <div className="space-y-2 flex-1">
//                 {reportStatusData.map((item, i) => (
//                   <div key={item.name} className="flex items-center gap-2">
//                     <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
//                     <span className="text-xs text-gray-600">{item.name}</span>
//                     <span className="text-xs font-bold text-gray-800 ml-auto">{item.value}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Recent Audit Logs */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
//           <h3 className="font-display font-semibold text-gray-900">Recent Activity</h3>
//           <a href="/admin/audit-logs" className="text-sm text-amber-600 hover:text-amber-700 font-medium">View all →</a>
//         </div>
//         <div className="divide-y divide-gray-50">
//           {loading ? (
//             Array.from({ length: 4 }).map((_, i) => (
//               <div key={i} className="px-5 py-3 flex items-center gap-3">
//                 <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
//                 <div className="flex-1">
//                   <div className="h-3.5 w-48 bg-gray-100 rounded animate-pulse mb-1.5" />
//                   <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
//                 </div>
//               </div>
//             ))
//           ) : analytics?.recentAuditLogs.length === 0 ? (
//             <div className="px-5 py-8 text-center text-gray-400 text-sm">No activity yet</div>
//           ) : (
//             (analytics?.recentAuditLogs ?? []).slice(0, 8).map((log) => (
//               <div key={log._id} className="px-5 py-3 flex items-start gap-3">
//                 <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
//                   <TrendingUp className="w-4 h-4 text-amber-500" />
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <p className="text-sm text-gray-800 font-medium truncate">{log.description}</p>
//                   <p className="text-xs text-gray-400">
//                     {log.actorName} · {new Date(log.createdAt).toLocaleString("en-NG")}
//                   </p>
//                 </div>
//                 <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize flex-shrink-0">
//                   {log.action}
//                 </span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap, Users, BookOpen, FileText, CreditCard,
  CheckCircle, Clock, TrendingUp, ArrowUpRight, Activity,
  BarChart2, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { AdminAnalytics } from "@/types";

// ─── Palette ──────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function LightTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { color?: string; name?: string; value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs bg-white border border-gray-200 shadow-lg">
      {label && <p className="mb-1 text-gray-400">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-medium text-gray-700">
          {p.name ?? "Value"}: <strong className="text-gray-900">{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Accent definitions ───────────────────────────────────────────────────────
const ACCENTS = {
  amber:   { iconBg: "bg-amber-500",   subColor: "text-amber-500"   },
  blue:    { iconBg: "bg-blue-500",    subColor: "text-blue-500"    },
  emerald: { iconBg: "bg-emerald-500", subColor: "text-emerald-500" },
  purple:  { iconBg: "bg-purple-500",  subColor: "text-purple-500"  },
  orange:  { iconBg: "bg-orange-500",  subColor: "text-orange-500"  },
  navy:    { iconBg: "bg-[#1e3a5f]",   subColor: "text-gray-500"    },
};

type AccentKey = keyof typeof ACCENTS;

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, accentKey, loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accentKey: AccentKey;
  loading?: boolean;
}) {
  const a = ACCENTS[accentKey];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          {loading ? (
            <>
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold font-display text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
              {sub && <div className={`text-xs mt-0.5 font-medium ${a.subColor}`}>{sub}</div>}
            </>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Chart card ───────────────────────────────────────────────────────────────
function ChartCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, title, action, iconClassName = "text-amber-500",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: { label: string; href: string };
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconClassName}`} />
        {title}
      </h3>
      {action && (
        <a
          href={action.href}
          className="flex items-center gap-0.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          {action.label}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardView() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: AdminAnalytics }) => {
        if (json.success && json.data) setAnalytics(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const reportStatusData = analytics?.reportsByStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  })) ?? [];

  const totalReports = reportStatusData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* ── Primary stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Students"  value={analytics?.totalStudents ?? 0} sub={`${analytics?.activeStudents ?? 0} active`} accentKey="amber"   loading={loading} />
        <StatCard icon={Users}         label="Teachers"         value={analytics?.totalTeachers ?? 0} accentKey="blue"    loading={loading} />
        <StatCard icon={Users}         label="Parents"          value={analytics?.totalParents ?? 0}  accentKey="emerald" loading={loading} />
        <StatCard icon={BookOpen}      label="Classes"          value={analytics?.totalClasses ?? 0}  accentKey="purple"  loading={loading} />
      </div>

      {/* ── Secondary stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Clock}       label="Pending Reviews"  value={analytics?.pendingReports ?? 0}        accentKey="orange"  loading={loading} />
        <StatCard icon={CheckCircle} label="Approved Reports" value={analytics?.approvedReports ?? 0}       accentKey="emerald" loading={loading} />
        <StatCard icon={CreditCard}  label="Payments Cleared" value={analytics?.paymentStats.paid ?? 0} sub={`${analytics?.paymentStats.unpaid ?? 0} pending`} accentKey="navy" loading={loading} />
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Bar chart — 3 cols */}
        <div className="lg:col-span-3">
          <ChartCard>
            <SectionHeader icon={BarChart2} title="Students by Class" />
            {loading ? (
              <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={analytics?.studentsByClass ?? []}
                  barSize={26}
                  margin={{ left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="className"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<LightTooltip />} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[5, 5, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Pie chart — 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard className="flex flex-col">
            <SectionHeader icon={FileText} title="Reports by Status" iconClassName="text-blue-500" />
            {loading ? (
              <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
            ) : reportStatusData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
                <FileText className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-400">No report data yet</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie
                        data={reportStatusData}
                        cx="50%" cy="50%"
                        innerRadius={44} outerRadius={68}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {reportStatusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<LightTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-gray-900">{totalReports}</span>
                    <span className="text-[9px] text-gray-400">total</span>
                  </div>
                </div>
                <div className="w-full space-y-1.5">
                  {reportStatusData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-500 flex-1">{item.name}</span>
                      <span className="text-xs font-bold text-gray-900">{item.value}</span>
                      <span className="text-[10px] text-gray-400">
                        {totalReports > 0 ? Math.round((item.value / totalReports) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <ChartCard>
        <SectionHeader
          icon={Activity}
          title="Recent Activity"
          action={{ label: "View all", href: "/admin/audit-logs" }}
          iconClassName="text-blue-500"
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-48 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (analytics?.recentAuditLogs ?? []).length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <Zap className="w-7 h-7 text-gray-300" />
            <p className="text-sm text-gray-400">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(analytics?.recentAuditLogs ?? []).slice(0, 8).map((log) => (
              <div
                key={log._id}
                className="px-3 py-3 flex items-start gap-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 font-medium truncate">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.actorName} · {new Date(log.createdAt).toLocaleString("en-NG")}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize flex-shrink-0 mt-0.5">
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
