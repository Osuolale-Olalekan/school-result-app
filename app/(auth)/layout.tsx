import type { ReactNode } from "react";
import Link from "next/link";

const SCHOOL_LOGO =
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "#0a1d3b" }}>

      {/* ── Left decorative panel ──────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(150deg, #071428 0%, #0a1d3b 40%, #0c2348 70%, #0a1d3b 100%)",
        }} />

        {/* Top rainbow rule */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
          background: "linear-gradient(90deg, #f97316 0%, #0ea5e9 50%, #f97316 100%)",
        }} />

        {/* Glows */}
        <div className="absolute pointer-events-none" style={{
          top: "-10%", left: "-15%", width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 65%)",
          filter: "blur(80px)",
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: "-10%", right: "-5%", width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 65%)",
          filter: "blur(70px)",
        }} />

        {/* Ruled-paper lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.025 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="absolute left-0 right-0 h-px"
              style={{ top: `${i * 4.3}%`, background: "#7ab8d4" }} />
          ))}
        </div>

        {/* Watermark logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <img src={SCHOOL_LOGO} alt="" aria-hidden="true"
            style={{
              width: "480px", height: "480px", objectFit: "contain",
              opacity: 0.06, filter: "blur(0.5px) sepia(15%)",
            }}
          />
        </div>

        {/* Inner content — flex-col with gap, no justify-between to avoid overflow */}
        <div className="relative z-10 w-full flex flex-col gap-8 p-10 xl:p-12 my-auto">

          {/* Logo + school name */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex-shrink-0">
              <div className="absolute rounded-full" style={{
                inset: "-4px",
                background: "conic-gradient(from 0deg, transparent 50%, rgba(249,115,22,0.7) 68%, rgba(14,165,233,0.6) 84%, transparent 100%)",
                animation: "gwSpin 16s linear infinite",
              }} />
              <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(245,240,232,0.18)" }}>
                <img src={SCHOOL_LOGO} alt="God's Way Schools" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: "#f5f0e8" }}>God&apos;s Way</p>
              <p className="text-xs leading-tight" style={{ color: "#7ab8d4" }}>Model Groups of Schools</p>
            </div>
          </Link>

          {/* Quote + attribution */}
          <div>
            <blockquote
              className="font-bold leading-snug mb-5"
              style={{ fontSize: "clamp(1.25rem, 1.8vw, 1.75rem)", color: "rgba(245,240,232,0.88)" }}
            >
              &ldquo;Excellence in education,{" "}
              <span style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #0ea5e9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                grounded in faith
              </span>{" "}
              and integrity.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)" }}>
                <img src={SCHOOL_LOGO} alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "rgba(245,240,232,0.70)" }}>School Management Portal</p>
                <p className="text-xs" style={{ color: "rgba(245,240,232,0.38)" }}>Empowering education since 2009</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "2,000+", label: "Students" },
              { value: "150+",   label: "Staff Members" },
              { value: "98%",    label: "Pass Rate" },
              { value: "3",      label: "School Sections" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-4" style={{
                background: "rgba(14,165,233,0.06)",
                border: "1px solid rgba(14,165,233,0.18)",
              }}>
                <div className="text-xl xl:text-2xl font-bold" style={{ color: "#f97316" }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.40)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Motto pill */}
          <div className="inline-flex items-center self-start px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              border: "1px solid rgba(14,165,233,0.35)",
              background: "rgba(14,165,233,0.08)",
              color: "#7ab8d4",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}>
            Sowing the Seed of Merit and Excellence
          </div>

        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────── */}
      <div
        className="w-full lg:w-1/2 flex items-start lg:items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #071428 0%, #0a1d3b 60%, #0c2348 100%)",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Subtle glow */}
        <div className="absolute pointer-events-none" style={{
          top: "20%", right: "-10%", width: "350px", height: "350px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 65%)",
          filter: "blur(60px)",
        }} />

        {/* Mobile-only top rainbow rule */}
        <div className="absolute top-0 left-0 right-0 h-[3px] lg:hidden" style={{
          background: "linear-gradient(90deg, #f97316 0%, #0ea5e9 50%, #f97316 100%)",
        }} />

        <div className="w-full max-w-md relative z-10 px-5 py-10 sm:px-8 sm:py-12 lg:py-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute rounded-full" style={{
                inset: "-4px",
                background: "conic-gradient(from 0deg, transparent 50%, rgba(249,115,22,0.7) 68%, rgba(14,165,233,0.6) 84%, transparent 100%)",
                animation: "gwSpin 16s linear infinite",
              }} />
              <div className="relative w-full h-full rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(245,240,232,0.18)" }}>
                <img src={SCHOOL_LOGO} alt="God's Way Schools" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: "#f5f0e8" }}>God&apos;s Way</p>
              <p className="text-xs leading-tight" style={{ color: "#7ab8d4" }}>Model Groups of Schools</p>
            </div>
          </div>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes gwSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}