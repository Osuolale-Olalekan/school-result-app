"use client";

import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Users, Award, Shield, ChevronRight,
  Star, CheckCircle, Menu, X, Globe, TrendingUp, Bell, FileText,
  ArrowRight, Sparkles, Phone, Mail, MapPin, BookOpen
} from "lucide-react";

const SCHOOL_LOGO = "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Programs", href: "#programs" },
  { label: "Contact", href: "#contact" },
];

const STATS = [
  { value: "15+", label: "Years of Excellence" },
  { value: "2,000+", label: "Students Enrolled" },
  { value: "150+", label: "Dedicated Staff" },
  { value: "98%", label: "Pass Rate" },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Digital Report Cards",
    description: "Beautiful, QR-code secured report cards available online. Parents get instant notifications when results are ready.",
  },
  {
    icon: TrendingUp,
    title: "Automatic Promotion",
    description: "Intelligent system tracks student performance across all three terms and handles class promotions automatically.",
  },
  {
    icon: Users,
    title: "Parent Portal",
    description: "Parents stay connected with their children's academic journey. View results, download reports, track history.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with role-based access control. Every action is audited and traceable.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automated email alerts for report approvals, result availability, and important school updates.",
  },
  {
    icon: Globe,
    title: "Multi-Level Management",
    description: "Seamlessly manages Primary, JSS, and SSS sections with department assignments for senior students.",
  },
];

const PROGRAMS = [
  {
    level: "Primary School",
    classes: ["Primary 2", "Primary 3", "Primary 4", "Primary 5"],
    description: "A nurturing foundation that builds lifelong learners with strong academic and moral values.",
    icon: "🌱",
    accent: "#0ea5e9",
  },
  {
    level: "Junior Secondary",
    classes: ["JSS 1", "JSS 2", "JSS 3"],
    description: "Expanding minds with a broad curriculum that prepares students for senior secondary studies.",
    icon: "📚",
    accent: "#f97316",
  },
  {
    level: "Senior Secondary",
    classes: ["SSS 1", "SSS 2"],
    description: "Specialized departments: Science, Arts & Commercial — tailored for university success.",
    icon: "🎓",
    accent: "#0ea5e9",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden font-sans" style={{ background: "#0a1d3b", color: "#f5f0e8" }}>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(8,22,50,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(14,165,233,0.15)" : "none",
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <img src={SCHOOL_LOGO} alt="God's Way Schools Logo" className="w-9 h-9 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="block">
                <p className="text-sm font-bold leading-tight tracking-tight" style={{ color: "#f5f0e8" }}>God&apos;s Way</p>
                <p className="text-xs leading-tight" style={{ color: "#7ab8d4" }}>Model Groups of Schools</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href}
                  className="text-sm font-semibold relative group transition-colors"
                  style={{ color: "rgba(245,240,232,0.7)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f5f0e8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.7)")}
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 rounded-full"
                    style={{ background: "#f97316" }} />
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {/* <Link href="/sign-in"
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "rgba(245,240,232,0.7)" }}
              >
                Sign In
              </Link> */}
              <Link href="/sign-in"
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
                }}
              >
                Portal Access
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "#f5f0e8" }}
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ background: "rgba(8,22,50,0.99)", borderTop: "1px solid rgba(14,165,233,0.15)" }}
            >
              <div className="px-4 py-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <a key={link.label} href={link.href}
                    className="block py-3 px-3 rounded-lg font-medium transition-all"
                    style={{ color: "rgba(245,240,232,0.75)" }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Link href="/sign-in"
                  className="block py-3 px-4 rounded-xl text-white font-bold text-center mt-2"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
                >
                  Portal Access
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Rich navy gradient background */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(150deg, #071428 0%, #0a1d3b 40%, #0c2348 70%, #0a1d3b 100%)" }} />

        {/* Horizontal rule accent — school-like */}
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg, #f97316 0%, #0ea5e9 50%, #f97316 100%)" }} />

        {/* Sky blue atmospheric glows — softer, more institutional */}
        <div className="absolute top-1/4 left-[-10%] `w-[600px]` `h-[600px]` rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-[-5%] `w-[500px]` `h-[500px]` rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 60%)", filter: "blur(100px)" }} />

        {/* Subtle ruled-paper lines — very school-like touch */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute left-0 right-0 h-px"
              style={{ top: `${5 + i * 5}%`, background: "#7ab8d4" }} />
          ))}
        </div>

        {/* Large watermark logo — bigger as requested */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <img
              src={SCHOOL_LOGO}
              alt=""
              aria-hidden="true"
              className="object-contain"
              style={{
                width: "680px",
                height: "680px",
                opacity: 0.07,
                filter: "blur(0.5px) sepia(20%)",
              }}
            />
          </motion.div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-20">
          <div className="flex flex-col items-center text-center">

            {/* School badge pill */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm mb-8 font-semibold"
              style={{
                border: "1px solid rgba(14,165,233,0.4)",
                background: "rgba(14,165,233,0.1)",
                color: "#7ab8d4",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* <Sparkles className="w-4 h-4" /> */}
             <span style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, color: "var(--gold)", textTransform: "uppercase" }}>
                Sowing the Seed of Merit and Excellence
              </span>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
              className="mb-9"
            >
              <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
                <div className="absolute inset-0 rounded-full blur-2xl scale-125"
                  style={{ background: "radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)" }} />
                <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: "2px solid rgba(245,240,232,0.2)",
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 40px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}>
                  <img src={SCHOOL_LOGO} alt="God's Way Model Schools Logo"
                    className="w-[100%] h-[100%] object-contain" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
                </div>
                {/* Orange + sky ring accent */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="absolute rounded-full"
                  style={{
                    inset: "-7px",
                    background: "conic-gradient(from 0deg, transparent 55%, rgba(249,115,22,0.6) 70%, rgba(14,165,233,0.5) 85%, transparent 100%)",
                  }}
                />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="font-bold mb-3 leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", color: "#f5f0e8" }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              God&apos;s Way{" "}
              <span style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #0ea5e9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Model
              </span>
            </motion.h1>
            <motion.h1
              className="font-bold mb-6 leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", color: "rgba(245,240,232,0.85)" }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28 }}
            >
              Groups of Schools
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg lg:text-xl max-w-2xl mb-10 leading-relaxed"
              style={{ color: "rgba(245,240,232,0.5)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38 }}
            >
              A world-class educational institution nurturing the leaders of tomorrow through
              academic excellence, moral values, and spiritual growth.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.48 }}
            >
              <Link href="/sign-in"
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-1 w-full sm:w-auto justify-center"
                style={{
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  boxShadow: "0 6px 30px rgba(249,115,22,0.4)",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 10px 40px rgba(249,115,22,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 6px 30px rgba(249,115,22,0.4)")}
              >
                Access Student Portal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#about"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                style={{
                  border: "1.5px solid rgba(14,165,233,0.35)",
                  color: "#7ab8d4",
                  background: "rgba(14,165,233,0.07)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Discover More
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.58 }}
            >
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.65 + i * 0.1 }}
                  className="rounded-2xl p-4 sm:p-5 text-center transition-all"
                  style={{
                    border: "1px solid rgba(14,165,233,0.2)",
                    background: "rgba(14,165,233,0.06)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="text-2xl sm:text-3xl font-bold mb-1"
                    style={{ color: "#f97316" }}>{stat.value}</div>
                  <div className="text-xs leading-snug" style={{ color: "rgba(245,240,232,0.45)" }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, #0a1d3b, transparent)" }} />
      </section>

      {/* ── About ──────────────────────────────────────────────────── */}
      <section id="about" className="py-24 px-4 relative" style={{ background: "#0a1d3b" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)" }} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={itemVariants}>
              <span className="text-sm font-bold tracking-widest uppercase mb-4 block"
                style={{ color: "#f97316" }}>About Us</span>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight"
                style={{ color: "#f5f0e8" }}>
                Building Tomorrow&apos;s{" "}
                <span style={{ color: "#0ea5e9" }}>Leaders</span> Today
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ color: "rgba(245,240,232,0.6)" }}>
                God&apos;s Way Model Groups of Schools has been a beacon of educational excellence, providing
                a holistic education that develops the mind, character, and spirit of every student.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: "rgba(245,240,232,0.38)" }}>
                From Primary to Senior Secondary, our students benefit from experienced educators,
                modern facilities, and a proven curriculum that prepares them for national examinations
                and beyond.
              </p>
              <div className="space-y-3">
                {[
                  "Qualified and dedicated teaching staff",
                  "Individual student performance tracking",
                  "Modern digital management system",
                  "Strong parent-school communication",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#f97316" }} />
                    <span style={{ color: "rgba(245,240,232,0.65)" }}>{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, title: "Academics", desc: "Rigorous curriculum from Primary to SSS" },
                  { icon: Award, title: "Awards", desc: "Consistent top performers in WAEC & NECO" },
                  { icon: Users, title: "Community", desc: "A family of students, staff & parents" },
                  { icon: Star, title: "Values", desc: "Faith, integrity and moral excellence" },
                ].map((item) => (
                  <div key={item.title}
                    className="rounded-2xl p-5 transition-all group cursor-default"
                    style={{
                      background: "rgba(14,165,233,0.06)",
                      border: "1px solid rgba(14,165,233,0.18)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.border = "1px solid rgba(249,115,22,0.4)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.07)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.border = "1px solid rgba(14,165,233,0.18)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,0.06)";
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.25)" }}>
                      <item.icon className="w-5 h-5" style={{ color: "#0ea5e9" }} />
                    </div>
                    <h4 className="font-bold mb-1" style={{ color: "#f5f0e8" }}>{item.title}</h4>
                    <p className="text-sm" style={{ color: "rgba(245,240,232,0.40)" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 relative"
        style={{ background: "linear-gradient(180deg, #0a1d3b 0%, #091829 50%, #0a1d3b 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(245,240,232,0.08), transparent)" }} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-bold tracking-widest uppercase mb-4 block" style={{ color: "#f97316" }}>
              Platform Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight" style={{ color: "#f5f0e8" }}>
              Everything You Need, In One Place
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(245,240,232,0.45)" }}>
              Our enterprise school management platform empowers administrators, teachers, and parents
              with powerful tools designed for modern education.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative rounded-2xl p-6 transition-all duration-300 overflow-hidden cursor-default"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(14,165,233,0.15)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(14,165,233,0.45)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,0.07)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(14,165,233,0.15)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0.08) 100%)",
                    border: "1px solid rgba(14,165,233,0.3)",
                  }}>
                  <feature.icon className="w-6 h-6" style={{ color: "#0ea5e9" }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#f5f0e8" }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.45)" }}>{feature.description}</p>
                {/* Orange bottom accent on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(90deg, transparent, #f97316, transparent)" }} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Programs ───────────────────────────────────────────────── */}
      <section id="programs" className="py-24 px-4 relative" style={{ background: "#0a1d3b" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.2), transparent)" }} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-bold tracking-widest uppercase mb-4 block" style={{ color: "#f97316" }}>
              Academic Programs
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight" style={{ color: "#f5f0e8" }}>
              From Nursery to Senior Secondary
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {PROGRAMS.map((program, i) => (
              <motion.div
                key={program.level}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative group rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${program.accent}30`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${program.accent}60`;
                  (e.currentTarget as HTMLElement).style.background = `${program.accent}08`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${program.accent}30`;
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                }}
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${program.accent}, transparent)`, opacity: 0.6 }} />
                <div className="text-4xl mb-4">{program.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#f5f0e8" }}>{program.level}</h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(245,240,232,0.50)" }}>{program.description}</p>
                <div className="flex flex-wrap gap-2">
                  {program.classes.map((cls) => (
                    <span key={cls}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        background: `${program.accent}15`,
                        border: `1px solid ${program.accent}35`,
                        color: program.accent,
                      }}>
                      {cls}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0c2348 0%, #0a1d3b 50%, #0d1f40 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg, #f97316, #0ea5e9, #f97316)" }} />
        <div className="absolute bottom-0 right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)", filter: "blur(60px)" }} />
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none">
          <img src={SCHOOL_LOGO} alt="" aria-hidden="true"
            className="object-contain grayscale"
            style={{ width: "360px", height: "360px", opacity: 0.05, marginRight: "-40px" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <img src={SCHOOL_LOGO} alt="School Logo" className="w-36 h-36 object-contain" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight" style={{ color: "#f5f0e8" }}>
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(245,240,232,0.50)" }}>
              Access the school management portal to view results, manage classes, and stay connected
              with your child&apos;s academic progress.
            </p>
            <Link href="/sign-in"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                boxShadow: "0 8px 40px rgba(249,115,22,0.4)",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 50px rgba(249,115,22,0.55)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 8px 40px rgba(249,115,22,0.4)")}
            >
              Sign In to Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 relative" style={{ background: "#0a1d3b" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.3), transparent)" }} />
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#f5f0e8" }}>Get In Touch</h2>
            <p style={{ color: "rgba(245,240,232,0.4)" }}>We&apos;d love to hear from you</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Phone, label: "Phone", value: "08069825847, 08067110930", href: "tel:+2348069825847, +2348067110930" },
              { icon: Mail, label: "Email", value: "godswaygroupofschools@gmail.com", href: "mailto:godswaygroupofschools@gmail.com" },
              { icon: MapPin, label: "Address", value: "No 5 Siyanbola Street, Osogbo, Osun-State" },
            ].map((contact) => (
              <motion.a
                key={contact.label}
                href={contact.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group flex flex-col items-center text-center p-6 rounded-2xl transition-all"
                style={{
                  background: "rgba(14,165,233,0.05)",
                  border: "1px solid rgba(14,165,233,0.2)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(249,115,22,0.4)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.06)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(14,165,233,0.2)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,0.05)";
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)" }}>
                  <contact.icon className="w-5 h-5" style={{ color: "#0ea5e9" }} />
                </div>
                <div className="text-sm mb-1 font-medium" style={{ color: "rgba(245,240,232,0.35)" }}>{contact.label}</div>
                <div className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>{contact.value}</div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-10 px-4" style={{ borderTop: "1px solid rgba(14,165,233,0.15)", background: "#071428" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <img src={SCHOOL_LOGO} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
            <span className="text-sm font-medium" style={{ color: "rgba(245,240,232,0.45)" }}>
              God&apos;s Way Model Groups of Schools
            </span>
          </div>
          {/* Color legend — small school brand strip */}
          <div className="hidden md:flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: "#0ea5e9" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#f97316" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#f5f0e8" }} />
          </div>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.25)" }}>
            &copy; {new Date().getFullYear()} All rights reserved. Merit & Excellence
          </p>
        </div>
      </footer>

    </div>
  );
}






// "use client";

// import Link from "next/link";
// import { motion, AnimatePresence, Variants } from "framer-motion";
// import { useState, useEffect } from "react";
// import {
//   GraduationCap, BookOpen, Users, Award, Shield, ChevronRight,
//   Star, CheckCircle, Menu, X, Globe, TrendingUp, Bell, FileText,
//   ArrowRight, Sparkles, Phone, Mail, MapPin
// } from "lucide-react";

// const NAV_LINKS = [
//   { label: "About", href: "#about" },
//   { label: "Features", href: "#features" },
//   { label: "Programs", href: "#programs" },
//   { label: "Contact", href: "#contact" },
// ];

// const STATS = [
//   { value: "15+", label: "Years of Excellence" },
//   { value: "2,000+", label: "Students Enrolled" },
//   { value: "150+", label: "Dedicated Staff" },
//   { value: "98%", label: "Pass Rate" },
// ];

// const FEATURES = [
//   {
//     icon: FileText,
//     title: "Digital Report Cards",
//     description: "Beautiful, QR-code secured report cards available online. Parents get instant notifications when results are ready.",
//     accent: "#1e3a6e",
//   },
//   {
//     icon: TrendingUp,
//     title: "Automatic Promotion",
//     description: "Intelligent system tracks student performance across all three terms and handles class promotions automatically.",
//     accent: "#1e3a6e",
//   },
//   {
//     icon: Users,
//     title: "Parent Portal",
//     description: "Parents stay connected with their children's academic journey. View results, download reports, track history.",
//     accent: "#1e3a6e",
//   },
//   {
//     icon: Shield,
//     title: "Secure & Reliable",
//     description: "Enterprise-grade security with role-based access control. Every action is audited and traceable.",
//     accent: "#1e3a6e",
//   },
//   {
//     icon: Bell,
//     title: "Smart Notifications",
//     description: "Automated email alerts for report approvals, result availability, and important school updates.",
//     accent: "#1e3a6e",
//   },
//   {
//     icon: Globe,
//     title: "Multi-Level Management",
//     description: "Seamlessly manages Primary, JSS, and SSS sections with department assignments for senior students.",
//     accent: "#1e3a6e",
//   },
// ];

// const PROGRAMS = [
//   {
//     level: "Primary School",
//     classes: ["Primary 2", "Primary 3", "Primary 4", "Primary 5"],
//     description: "A nurturing foundation that builds lifelong learners with strong academic and moral values.",
//     icon: "🌱",
//   },
//   {
//     level: "Junior Secondary",
//     classes: ["JSS 1", "JSS 2", "JSS 3"],
//     description: "Expanding minds with a broad curriculum that prepares students for senior secondary studies.",
//     icon: "📚",
//   },
//   {
//     level: "Senior Secondary",
//     classes: ["SSS 1", "SSS 2"],
//     description: "Specialized departments: Science, Arts & Commercial — tailored for university success.",
//     icon: "🎓",
//   },
// ];

// export default function LandingPage() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);



//   useEffect(() => {
//     const handleScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
//   };

//   const itemVariants: Variants = {
//     hidden: { opacity: 0, y: 30 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
//   };

//   return (
//     <div className="min-h-screen bg-white text-[#0f1e3d] overflow-x-hidden font-sans">

//       {/* ── Navigation ─────────────────────────────────────────────── */}
//       <motion.nav
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//           scrolled
//             ? "bg-white/95 backdrop-blur-md border-b border-[#1e3a6e]/10 shadow-sm"
//             : "bg-[#0f1e3d]/60 backdrop-blur-sm"
//         }`}
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.6 }}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16 lg:h-20">
//             {/* Logo */}
//             <Link href="/" className="flex items-center gap-3 group">
//               <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center group-hover:bg-white/25 transition-colors">
//                 <GraduationCap className={`w-5 h-5 ${scrolled ? "text-[#1e3a6e]" : "text-white"}`} />
//               </div>
//               <div className="block">
//                 <p className={`text-sm font-bold leading-tight tracking-tight ${scrolled ? "text-[#1e3a6e]" : "text-white"}`}>God&apos;s Way</p>
//                 <p className={`text-xs leading-tight ${scrolled ? "text-[#1e3a6e]/50" : "text-white/60"}`}>Model Groups of Schools</p>
//               </div>
//             </Link>

//             {/* Desktop Nav */}
//             <div className="hidden md:flex items-center gap-8">
//               {NAV_LINKS.map((link) => (
//                 <a
//                   key={link.label}
//                   href={link.href}
//                   className={`text-sm transition-colors font-medium ${scrolled ? "text-[#1e3a6e]/60 hover:text-[#1e3a6e]" : "text-white/70 hover:text-white"}`}
//                 >
//                   {link.label}
//                 </a>
//               ))}
//             </div>

//             {/* CTA */}
//             <div className="hidden md:flex items-center gap-3">
//               <Link
//                 href="/sign-in"
//                 className={`px-4 py-2 text-sm transition-colors font-medium ${scrolled ? "text-[#1e3a6e]" : "text-white/80 hover:text-white"}`}
//               >
//                 Sign In
//               </Link>
//               <Link
//                 href="/sign-in"
//                 className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md ${scrolled ? "bg-[#1e3a6e] text-white hover:bg-[#162d56]" : "bg-white text-[#1e3a6e] hover:bg-blue-50"}`}
//               >
//                 Portal Access
//               </Link>
//             </div>

//             {/* Mobile Menu Button */}
//             <button
//               className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-[#1e3a6e] hover:bg-[#1e3a6e]/5" : "text-white hover:bg-white/10"}`}
//               onClick={() => setMenuOpen(!menuOpen)}
//             >
//               {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         <AnimatePresence>
//           {menuOpen && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               className="md:hidden bg-white border-t border-[#1e3a6e]/10 shadow-lg"
//             >
//               <div className="px-4 py-4 space-y-3">
//                 {NAV_LINKS.map((link) => (
//                   <a
//                     key={link.label}
//                     href={link.href}
//                     className="block py-2 text-[#1e3a6e]/70 hover:text-[#1e3a6e] transition-colors font-medium"
//                     onClick={() => setMenuOpen(false)}
//                   >
//                     {link.label}
//                   </a>
//                 ))}
//                 <Link
//                   href="/sign-in"
//                   className="block py-2 px-4 rounded-lg bg-[#1e3a6e] text-white font-semibold text-center"
//                 >
//                   Portal Access
//                 </Link>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.nav>

//       {/* ── Hero ───────────────────────────────────────────────────── */}
//       <section
//         className="relative flex items-center overflow-hidden bg-white"
//       >
//         {/* Split diagonal: white left, navy right */}
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{ background: "linear-gradient(118deg, #ffffff 0%, #ffffff 52%, #1e3a6e 52%, #0f1e3d 100%)" }}
//         />
//         {/* Dot grid on navy panel */}
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{
//             backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1.5px, transparent 0)",
//             backgroundSize: "28px 28px",
//             clipPath: "polygon(55% 0%, 100% 0%, 100% 100%, 40% 100%)",
//           }}
//         />
//         {/* Blue glow on navy side */}
//         <div
//           className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none -translate-y-1/2"
//           style={{ background: "radial-gradient(circle, #5b9bd5 0%, transparent 65%)", transform: "translate(20%, -50%)" }}
//         />

//         <motion.div
//           className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 w-full"
//         >
//           <div className="grid lg:grid-cols-2 gap-12 items-center pt-28 pb-20">

//             {/* Left: text content on white side */}
//             <motion.div>
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1e3a6e]/20 bg-[#1e3a6e]/6 text-[#1e3a6e] text-sm mb-8 font-medium"
//               >
//                 <Sparkles className="w-4 h-4" />
//                 <span>Excellence • Integrity • Faith</span>
//               </motion.div>

//               <motion.h1
//                 className="text-5xl sm:text-6xl xl:text-7xl font-bold text-[#0f1e3d] mb-6 leading-[1.08] tracking-tight"
//                 initial={{ opacity: 0, y: 40 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.7, delay: 0.1 }}
//               >
//                 God&apos;s Way{" "}
//                 <span className="relative inline-block text-[#1e3a6e]">
//                   Model
//                   <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#1e3a6e]/25" />
//                 </span>{" "}
//                 <span className="block">Groups of Schools</span>
//               </motion.h1>

//               <motion.p
//                 className="text-lg text-[#1e3a6e]/60 max-w-lg mb-10 leading-relaxed"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.7, delay: 0.2 }}
//               >
//                 A world-class educational institution nurturing the leaders of tomorrow through
//                 academic excellence, moral values, and spiritual growth.
//               </motion.p>

//               <motion.div
//                 className="flex flex-col sm:flex-row items-start gap-4"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.7, delay: 0.3 }}
//               >
//                 <Link
//                   href="/sign-in"
//                   className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-[#1e3a6e] text-white font-bold text-base hover:bg-[#162d56] transition-all shadow-lg shadow-[#1e3a6e]/25 hover:shadow-xl hover:-translate-y-0.5"
//                 >
//                   Access Student Portal
//                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//                 </Link>
//                 <a
//                   href="#about"
//                   className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[#1e3a6e]/20 text-[#1e3a6e] font-medium text-base hover:border-[#1e3a6e]/40 hover:bg-[#1e3a6e]/5 transition-all"
//                 >
//                   Discover More
//                   <ChevronRight className="w-4 h-4" />
//                 </a>
//               </motion.div>

//               {/* Mobile stats */}
//               <motion.div
//                 className="lg:hidden grid grid-cols-2 gap-3 mt-12"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ duration: 0.7, delay: 0.5 }}
//               >
//                 {STATS.map((stat) => (
//                   <div key={stat.label} className="rounded-xl p-4 text-center border border-[#1e3a6e]/12 bg-[#1e3a6e]/5">
//                     <div className="text-2xl font-bold text-[#1e3a6e]">{stat.value}</div>
//                     <div className="text-xs text-[#1e3a6e]/50 mt-0.5">{stat.label}</div>
//                   </div>
//                 ))}
//               </motion.div>
//             </motion.div>

//             {/* Right: stats panel on navy side */}
//             <motion.div
//               className="hidden lg:flex flex-col items-center justify-center gap-5"
//               initial={{ opacity: 0, x: 40 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.8, delay: 0.4 }}
//             >
//               <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
//                 <GraduationCap className="w-14 h-14 text-white/85" />
//               </div>
//               <p className="text-white/50 text-xs font-semibold tracking-widest uppercase">Our Impact</p>
//               <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
//                 {STATS.map((stat) => (
//                   <div
//                     key={stat.label}
//                     className="rounded-2xl p-5 text-center border border-white/15 backdrop-blur-sm"
//                     style={{ background: "rgba(255,255,255,0.07)" }}
//                   >
//                     <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
//                     <div className="text-xs text-white/55 leading-snug">{stat.label}</div>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//           </div>
//         </motion.div>
//       </section>

//       {/* ── About ──────────────────────────────────────────────────── */}
//       <section id="about" className="py-24 px-4 bg-white relative">
//         {/* Top border accent */}
//         <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1e3a6e] via-blue-400 to-[#1e3a6e]" />
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, margin: "-100px" }}
//             className="grid lg:grid-cols-2 gap-16 items-center"
//           >
//             <motion.div variants={itemVariants}>
//               <span className="text-[#1e3a6e] text-sm font-bold tracking-widest uppercase mb-4 block">About Us</span>
//               <h2 className="text-4xl lg:text-5xl font-bold text-[#0f1e3d] mb-6 leading-tight tracking-tight">
//                 Building Tomorrow&apos;s Leaders Today
//               </h2>
//               <p className="text-[#1e3a6e]/70 text-lg leading-relaxed mb-6">
//                 God&apos;s Way Model Groups of Schools has been a beacon of educational excellence, providing
//                 a holistic education that develops the mind, character, and spirit of every student.
//               </p>
//               <p className="text-[#1e3a6e]/50 leading-relaxed mb-8">
//                 From Primary to Senior Secondary, our students benefit from experienced educators,
//                 modern facilities, and a proven curriculum that prepares them for national examinations
//                 and beyond.
//               </p>
//               <div className="space-y-3">
//                 {[
//                   "Qualified and dedicated teaching staff",
//                   "Individual student performance tracking",
//                   "Modern digital management system",
//                   "Strong parent-school communication",
//                 ].map((point) => (
//                   <div key={point} className="flex items-center gap-3">
//                     <CheckCircle className="w-5 h-5 text-[#1e3a6e] flex-shrink-0" />
//                     <span className="text-[#1e3a6e]/70">{point}</span>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//             <motion.div variants={itemVariants} className="relative">
//               <div className="grid grid-cols-2 gap-4">
//                 {[
//                   { icon: BookOpen, title: "Academics", desc: "Rigorous curriculum from Primary to SSS" },
//                   { icon: Award, title: "Awards", desc: "Consistent top performers in WAEC & NECO" },
//                   { icon: Users, title: "Community", desc: "A family of students, staff & parents" },
//                   { icon: Star, title: "Values", desc: "Faith, integrity and moral excellence" },
//                 ].map((item) => (
//                   <div
//                     key={item.title}
//                     className="bg-white border border-[#1e3a6e]/10 rounded-2xl p-5 hover:border-[#1e3a6e]/30 hover:shadow-md transition-all"
//                   >
//                     <div className="w-10 h-10 rounded-lg bg-[#1e3a6e]/10 flex items-center justify-center mb-3">
//                       <item.icon className="w-5 h-5 text-[#1e3a6e]" />
//                     </div>
//                     <h4 className="font-bold text-[#0f1e3d] mb-1">{item.title}</h4>
//                     <p className="text-[#1e3a6e]/50 text-sm">{item.desc}</p>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── Features ───────────────────────────────────────────────── */}
//       <section id="features" className="py-24 px-4 bg-[#f4f7fc] relative">
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//             className="text-center mb-16"
//           >
//             <span className="text-[#1e3a6e] text-sm font-bold tracking-widest uppercase mb-4 block">
//               Platform Features
//             </span>
//             <h2 className="text-4xl lg:text-5xl font-bold text-[#0f1e3d] mb-4 tracking-tight">
//               Everything You Need, In One Place
//             </h2>
//             <p className="text-[#1e3a6e]/55 text-lg max-w-2xl mx-auto">
//               Our enterprise school management platform empowers administrators, teachers, and parents
//               with powerful tools designed for modern education.
//             </p>
//           </motion.div>

//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, margin: "-50px" }}
//             className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
//           >
//             {FEATURES.map((feature) => (
//               <motion.div
//                 key={feature.title}
//                 variants={itemVariants}
//                 className="group relative rounded-2xl p-6 bg-white border border-[#1e3a6e]/10 hover:border-[#1e3a6e]/30 hover:shadow-lg transition-all duration-300"
//               >
//                 <div className="w-12 h-12 rounded-xl bg-[#1e3a6e] flex items-center justify-center mb-4 group-hover:bg-[#162d56] transition-colors">
//                   <feature.icon className="w-6 h-6 text-white" />
//                 </div>
//                 <h3 className="text-lg font-bold text-[#0f1e3d] mb-2">{feature.title}</h3>
//                 <p className="text-[#1e3a6e]/55 text-sm leading-relaxed">{feature.description}</p>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* ── Programs ───────────────────────────────────────────────── */}
//       <section id="programs" className="py-24 px-4 bg-white relative">
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="text-center mb-16"
//           >
//             <span className="text-[#1e3a6e] text-sm font-bold tracking-widest uppercase mb-4 block">
//               Academic Programs
//             </span>
//             <h2 className="text-4xl lg:text-5xl font-bold text-[#0f1e3d] mb-4 tracking-tight">
//               From Nursery to Senior Secondary
//             </h2>
//           </motion.div>

//           <div className="grid md:grid-cols-3 gap-6">
//             {PROGRAMS.map((program, i) => (
//               <motion.div
//                 key={program.level}
//                 initial={{ opacity: 0, y: 40 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ duration: 0.6, delay: i * 0.1 }}
//                 className="relative group bg-white border border-[#1e3a6e]/10 rounded-2xl p-8 hover:border-[#1e3a6e]/30 hover:shadow-lg transition-all"
//               >
//                 <div className="text-4xl mb-4">{program.icon}</div>
//                 <h3 className="text-xl font-bold text-[#0f1e3d] mb-3">{program.level}</h3>
//                 <p className="text-[#1e3a6e]/55 text-sm mb-5 leading-relaxed">{program.description}</p>
//                 <div className="flex flex-wrap gap-2">
//                   {program.classes.map((cls) => (
//                     <span
//                       key={cls}
//                       className="px-3 py-1 rounded-full bg-[#1e3a6e]/8 border border-[#1e3a6e]/15 text-[#1e3a6e] text-xs font-semibold"
//                     >
//                       {cls}
//                     </span>
//                   ))}
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── CTA ────────────────────────────────────────────────────── */}
//       <section className="py-24 px-4 relative overflow-hidden"
//         style={{ background: "linear-gradient(135deg, #0f1e3d 0%, #1e3a6e 100%)" }}
//       >
//         <div
//           className="absolute inset-0 opacity-5"
//           style={{
//             backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
//             backgroundSize: "40px 40px",
//           }}
//         />
//         <div className="relative max-w-3xl mx-auto text-center">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             whileInView={{ opacity: 1, scale: 1 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//           >
//             <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-8">
//               <GraduationCap className="w-10 h-10 text-white" />
//             </div>
//             <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
//               Ready to Get Started?
//             </h2>
//             <p className="text-white/60 text-lg mb-10">
//               Access the school management portal to view results, manage classes, and stay connected
//               with your child&apos;s academic progress.
//             </p>
//             <Link
//               href="/sign-in"
//               className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white text-[#1e3a6e] font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
//             >
//               Sign In to Portal
//               <ArrowRight className="w-5 h-5" />
//             </Link>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── Contact ────────────────────────────────────────────────── */}
//       <section id="contact" className="py-24 px-4 bg-[#f4f7fc] relative">
//         <div className="max-w-5xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="text-center mb-12"
//           >
//             <h2 className="text-3xl font-bold text-[#0f1e3d] mb-2">Get In Touch</h2>
//             <p className="text-[#1e3a6e]/50">We&apos;d love to hear from you</p>
//           </motion.div>

//           <div className="grid md:grid-cols-3 gap-6">
//             {[
//               { icon: Phone, label: "Phone", value: "+234 800 000 0000", href: "tel:+2348000000000" },
//               { icon: Mail, label: "Email", value: "info@godswayschools.edu.ng", href: "mailto:info@godswayschools.edu.ng" },
//               { icon: MapPin, label: "Address", value: "1 School Road, Nigeria", href: "#" },
//             ].map((contact) => (
//               <motion.a
//                 key={contact.label}
//                 href={contact.href}
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 className="group flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-[#1e3a6e]/10 hover:border-[#1e3a6e]/30 hover:shadow-md transition-all"
//               >
//                 <div className="w-12 h-12 rounded-xl bg-[#1e3a6e] flex items-center justify-center mb-4 group-hover:bg-[#162d56] transition-colors">
//                   <contact.icon className="w-5 h-5 text-white" />
//                 </div>
//                 <div className="text-[#1e3a6e]/40 text-sm mb-1 font-medium">{contact.label}</div>
//                 <div className="text-[#0f1e3d] text-sm font-semibold">{contact.value}</div>
//               </motion.a>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── Footer ─────────────────────────────────────────────────── */}
//       <footer className="border-t border-[#1e3a6e]/10 py-10 px-4 bg-white">
//         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-[#1e3a6e] flex items-center justify-center">
//               <GraduationCap className="w-4 h-4 text-white" />
//             </div>
//             <span className="text-sm text-[#1e3a6e]/70 font-medium">
//               God&apos;s Way Model Groups of Schools
//             </span>
//           </div>
//           <p className="text-[#1e3a6e]/35 text-sm">
//             &copy; {new Date().getFullYear()} All rights reserved. Excellence • Integrity • Faith
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }