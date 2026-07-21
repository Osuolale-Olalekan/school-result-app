"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronRight,
  Users,
  Globe,
  Trophy,
  Shield,
  Quote,
  GraduationCap,
  CalendarCheck,
  BadgeCheck,
  LucideIcon,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import TestimonialsSection from "./TestimonialsSection";
import { STATS, WHY_CARDS, LEADERSHIP, HERO_IMAGES, WELCOME_MESSAGE } from "@/lib/site-data";

const ICONS: Record<string, LucideIcon> = { Users, Globe, Trophy, Shield };

// Quick facts shown in the hero side panel — no photography, just clean
// iconography so the panel reads as credentials rather than decoration.
const QUICK_FACTS = [
  { icon: GraduationCap, label: "Nursery to Senior Secondary (SSS 3)" },
  { icon: BadgeCheck, label: "WAEC & NECO Approved Curriculum" },
  { icon: CalendarCheck, label: "Admissions Open — 2026/2027 Session" },
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const proprietress = LEADERSHIP.find((p) => p.role === "Proprietress");

  useEffect(() => {
    slideRef.current = setInterval(() => setActiveSlide((p) => (p + 1) % HERO_IMAGES.length), 3000);
    return () => clearInterval(slideRef.current!);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-[68px] overflow-hidden bg-blue-950">
        {/* Rotating background carousel */}
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.img
              key={activeSlide}
              src={HERO_IMAGES[activeSlide]}
              alt=""
              aria-hidden
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
        </div>

        {/* Carousel progress indicators */}
        <div className="absolute bottom-6 right-6 sm:right-10 z-20 hidden sm:flex items-center gap-1.5">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === activeSlide ? 28 : 14, background: i === activeSlide ? "#fb923c" : "rgba(255,255,255,0.35)" }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-24">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
            {/* Copy column */}
            <div className="text-white">
              {/* <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
              >
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                Sowing the Seed of Merit &amp; Excellence
              </motion.div> */}

              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="font-black text-white leading-[1.1] tracking-tight mb-5"
                style={{ fontSize: "clamp(2.1rem,5vw,3.4rem)" }}
              >
                Welcome to <span className="text-orange-400">God&apos;s Way</span>
                <br />
                Model Schools
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-[480px]"
              >
                Nurturing the leaders of tomorrow through academic excellence, moral values, and spiritual growth —
                from Nursery to Senior Secondary.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link
                  href="/admissions"
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/30"
                >
                  Start Admission Inquiry <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/about"
                  className="flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all backdrop-blur-sm"
                >
                  Explore More <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.42 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg"
              >
                {STATS.map((s) => (
                  <div key={s.label} className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-xl px-3 py-4 text-center">
                    <div className="text-orange-400 font-black text-xl sm:text-2xl leading-none">{s.value}</div>
                    <div className="text-white/55 text-[11px] mt-1 leading-snug">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Credentials panel — replaces the previous floating pupils graphic */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -top-10 -right-8 w-56 h-56 bg-orange-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-8 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl" />

              <div className="relative bg-white/[0.07] border border-white/15 backdrop-blur-md rounded-2xl p-7 shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-orange-400" />
                  </div>
                  <p className="text-white font-extrabold text-sm">Why Families Choose Us</p>
                </div>

                <ul className="space-y-4">
                  {QUICK_FACTS.map((f) => (
                    <li key={f.label} className="flex items-start gap-3">
                      <span className="mt-0.5 w-7 h-7 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                        <f.icon className="w-4 h-4 text-orange-400" />
                      </span>
                      <span className="text-white/80 text-sm leading-snug">{f.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="h-px bg-white/10 my-6" />

                <p className="text-white/55 text-xs leading-relaxed">
                  Submit an inquiry and our admissions team responds on WhatsApp within one business day.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WELCOME ADDRESS */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-14 items-center">
            <div className="relative mx-auto lg:mx-0 max-w-xs w-full">
              <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-blue-50">
                <img
                  src={proprietress?.photo}
                  alt={proprietress?.name}
                  className="w-full aspect-[4/5] object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-blue-800 text-white rounded-xl px-4 py-2.5 shadow-lg">
                <p className="text-[11px] font-bold leading-tight">{proprietress?.name}</p>
                <p className="text-[10px] text-white/70 leading-tight">{proprietress?.role}</p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                A Word From Our Proprietress
              </span>
              <Quote className="w-9 h-9 text-orange-500 mb-4" />
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">{WELCOME_MESSAGE.message}</p>
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-blue-300" />
                <p className="font-extrabold text-gray-900 text-sm">{proprietress?.name}</p>
              </div>
              <p className="text-gray-400 text-xs mt-1 ml-[52px]">{proprietress?.role}, God&apos;s Way Schools</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-blue-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Why God&apos;s Way Schools?</h2>
            <p className="text-gray-500">We give every child the tools to flourish — academically, spiritually, and personally.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_CARDS.map((c) => {
              const Icon = ICONS[c.icon];
              return (
                <div
                  key={c.title}
                  className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm mb-2">{c.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MEET OUR LEADERSHIP */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Meet Our Leadership</h2>
            <p className="text-gray-500">
              The people guiding God&apos;s Way Schools — committed to excellence in every classroom and every decision.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {LEADERSHIP.map((p) => (
              <div
                key={p.role}
                className="bg-blue-50 rounded-2xl overflow-hidden text-center hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-blue-100"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold text-gray-900 text-sm">{p.name}</h3>
                  <p className="text-blue-600 text-xs font-semibold mt-0.5">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADMISSIONS TEASER */}
      <section className="bg-blue-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-3xl p-8 sm:p-12 text-white grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                 Admissions Open
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mb-3">Join the God&apos;s Way Family Today</h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Admissions are open for Nursery through SSS 3. Submit a quick inquiry and our admissions team will
                reach out on WhatsApp within one business day.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold text-sm px-7 py-3.5 rounded-xl transition-all"
              >
                Start Admission Inquiry <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* FINAL CTA */}
      <div className="relative overflow-hidden bg-blue-900">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative z-10 py-20 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-white font-black mb-3" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
              Ready to Get Started?
            </h2>
            <p className="text-white/65 text-base mb-8 max-w-md mx-auto">
              Access the school portal to view results, or begin your child&apos;s admission journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-orange-500/30"
              >
                Sign In to Portal <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admissions"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-800 font-bold px-8 py-4 rounded-xl transition-all"
              >
                Apply for Admission
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { motion, AnimatePresence, Variants } from "framer-motion";
// import { useState, useEffect, useRef } from "react";
// import {
//   Users,
//   Award,
//   Shield,
//   ChevronRight,
//   Star,
//   CheckCircle,
//   Menu,
//   X,
//   Globe,
//   TrendingUp,
//   Bell,
//   FileText,
//   ArrowRight,
//   Phone,
//   Mail,
//   MapPin,
//   BookOpen,
//   Quote,
//   ChevronLeft,
//   GraduationCap,
//   Layers,
//   Target,
//   Eye,
//   Heart,
//   Handshake,
//   Lightbulb,
//   Calendar,
//   Camera,
//   Newspaper,
//   Building2,
//   FlaskConical,
//   Palette,
//   Trophy,
//   Brain,
// } from "lucide-react";

// // ─── CONSTANTS ───────────────────────────────────────────────────────────────

// const SCHOOL_LOGO =
//   "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

// const NAV_LINKS = [
//   { label: "About", href: "#about" },
//   { label: "Academics", href: "#academics" },
//   { label: "Admissions", href: "#admissions" },
//   { label: "Student Portal", href: "#portal" },
//   { label: "News & Events", href: "#news" },
//   { label: "Gallery", href: "#gallery" },
//   { label: "Contact", href: "#contact" },
// ];

// const STATS = [
//   { value: "2,000+", label: "Students" },
//   { value: "80+", label: "Teachers" },
//   { value: "15+", label: "Years of Excellence" },
//   { value: "20+", label: "Awards Won" },
// ];

// const WHY_CARDS = [
//   {
//     icon: Users,
//     title: "Experienced Faculty",
//     desc: "Rigorous academics designed for success, with qualified teachers who genuinely care about each student's growth.",
//   },
//   {
//     icon: Globe,
//     title: "Global Exposure",
//     desc: "Preparing students for global futures with modern curricula aligned to international educational standards.",
//   },
//   {
//     icon: Trophy,
//     title: "Co-Curricular",
//     desc: "Sports, arts, debate, and clubs develop teamwork and leadership qualities far beyond the classroom.",
//   },
//   {
//     icon: Shield,
//     title: "Character Building",
//     desc: "Faith, integrity, and moral excellence baked into everything we do — our motto lived every day.",
//   },
// ];

// const CORE_VALUES = [
//   { icon: Shield, label: "Integrity", desc: "We do what is right, even when no one is watching." },
//   { icon: Heart, label: "Respect", desc: "We honour every individual's dignity and worth." },
//   { icon: Star, label: "Excellence", desc: "We pursue the highest standards in everything we do." },
//   { icon: Handshake, label: "Responsibility", desc: "We take ownership of our actions and their impact." },
//   { icon: Lightbulb, label: "Empathy", desc: "We care deeply for the needs of those around us." },
// ];

// const PROGRAMS = [
//   {
//     level: "Primary School",
//     icon: "🌱",
//     badge: "6 Classes",
//     img: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=700&q=80",
//     alt: "Primary school students in classroom",
//     desc: "A nurturing foundation that builds lifelong learners with strong academic and moral values from the earliest years.",
//     tags: ["Nursery 1 & 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"],
//   },
//   {
//     level: "Junior Secondary",
//     icon: "📚",
//     badge: "3 Classes",
//     img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=80",
//     alt: "Junior secondary students studying",
//     desc: "Expanding minds with a broad curriculum that prepares students for senior secondary studies and BECE exams.",
//     tags: ["JSS 1", "JSS 2", "JSS 3"],
//   },
//   {
//     level: "Senior Secondary",
//     icon: "🎓",
//     badge: "3 Classes",
//     img: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=700&q=80",
//     alt: "Senior secondary students in science lab",
//     desc: "Specialized departments — Science, Arts & Commercial — tailored for WAEC, NECO success and university readiness.",
//     tags: ["SSS 1", "SSS 2", "SSS 3", "Science", "Arts", "Commercial"],
//   },
// ];

// const CURRICULUM = [
//   { icon: FlaskConical, title: "STEM Focus", desc: "Science, technology, engineering and math woven into every level of learning." },
//   { icon: Palette, title: "Arts & Creative", desc: "Developing imagination, design thinking and creative expression in students." },
//   { icon: Trophy, title: "Sports & Health", desc: "Physical education, inter-house sports, and comprehensive wellness programs." },
//   { icon: Brain, title: "Critical Thinking", desc: "Debate clubs, problem-solving competitions and real-world project work." },
// ];

// const ADMISSION_STEPS = [
//   { n: "1", title: "Inquiry", desc: "Submit an inquiry online or visit our campus to get started on your journey." },
//   { n: "2", title: "Application", desc: "Fill out the application form and submit all required documents." },
//   { n: "3", title: "Assessment", desc: "Student assessment and interaction with our academic team (if applicable)." },
//   { n: "4", title: "Confirmation", desc: "Receive your offer letter and complete the enrollment process." },
// ];

// const PORTAL_FEATURES = [
//   { icon: FileText, title: "Digital Report Cards", desc: "QR-code secured report cards available online. Parents notified instantly when results are ready." },
//   { icon: TrendingUp, title: "Automatic Promotion", desc: "Tracks student performance across all three terms and handles class promotions automatically." },
//   { icon: Users, title: "Parent Portal", desc: "Parents stay connected with results, report downloads, and full academic history." },
//   { icon: Bell, title: "Smart Notifications", desc: "Automated alerts via WhatsApp and email for approvals, results, and school announcements." },
//   { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security with role-based access. Every action is audited and traceable." },
// ];

// const NEWS_ITEMS = [
//   {
//     tag: "Event",
//     tagColor: "bg-orange-500",
//     date: "May 12, 2024",
//     title: "Annual Sports Day 2024",
//     desc: "A day of excitement, teamwork and sporting achievement as our students compete across all houses.",
//     img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
//     alt: "Sports day",
//   },
//   {
//     tag: "News",
//     tagColor: "bg-blue-700",
//     date: "April 28, 2024",
//     title: "Science Exhibition Showcase",
//     desc: "Students showcased innovative projects and scientific ideas at our annual science fair.",
//     img: "https://images.unsplash.com/photo-1532094349884-543559059b10?w=500&q=80",
//     alt: "Science exhibition",
//   },
//   {
//     tag: "Notice",
//     tagColor: "bg-blue-700",
//     date: "April 19, 2024",
//     title: "Holiday Notice — Term Break",
//     desc: "School will remain closed from April 28 to May 6 for Term Break. Portal remains accessible.",
//     img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&q=80",
//     alt: "Notice board",
//   },
// ];

// const GALLERY_IMGS = [
//   { src: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=400&q=80", alt: "Students" },
//   { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80", alt: "Classroom" },
//   { src: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&q=80", alt: "Science Lab" },
//   { src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=80", alt: "Library" },
//   { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", alt: "Sports" },
//   { src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80", alt: "Events" },
//   { src: "https://images.unsplash.com/photo-1532094349884-543559059b10?w=400&q=80", alt: "Science Fair" },
//   { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80", alt: "Campus" },
// ];

// const GALLERY_TABS = ["All", "Campus", "Events", "Activities", "Sports"];
// const NEWS_TABS = ["All", "News", "Events"];

// const TESTIMONIALS = [
//   { name: "Mrs. Funmilayo Adeyemi", role: "Parent of JSS 2 Student", initials: "FA", color: "#F97316", stars: 5, text: "The parent portal has completely transformed how I stay involved in my daughter's education. I can check her results, download reports, and get notified immediately. God's Way Schools is truly ahead of its time." },
//   { name: "Mr. Oluwaseun Bakare", role: "Parent of Primary 4 & SSS 1 Students", initials: "OB", color: "#2563EB", stars: 5, text: "I have two children in this school and the digital report card system makes everything so easy. No more waiting for end-of-term visits. The teachers are excellent and the management is highly professional." },
//   { name: "Solomon", role: "SSS 3 Graduate, 2023", initials: "OS", color: "#0EA5E9", stars: 5, text: "God's Way gave me the foundation I needed to excel in my WAEC exams. The teachers genuinely cared about our success. I finished with distinctions in 7 subjects and I'm now at university — grateful forever." },
//   { name: "Engr. Taiwo Olamide", role: "Parent & Community Leader", initials: "TO", color: "#F97316", stars: 5, text: "What sets God's Way apart is the combination of moral values with academic excellence. My son has grown not just intellectually but in character. This school truly lives up to its motto." },
//   { name: "Mrs. Grace Nwosu", role: "Parent of Three Students", initials: "GN", color: "#2563EB", stars: 5, text: "All three of my children attend God's Way and I couldn't be prouder. The school portal keeps me updated at all times. The staff is responsive and the environment is safe and nurturing." },
// ];

// // ─── SECTION BANNER ──────────────────────────────────────────────────────────

// function SectionBanner({ img, alt, breadcrumb, title }: { img: string; alt: string; breadcrumb: string; title: string }) {
//   return (
//     <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
//       <img src={img} alt={alt} className="absolute inset-0 w-full h-full object-cover object-center" />
//       <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-900/85" />
//       <div className="absolute bottom-0 left-0 right-0 pb-7 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-6xl mx-auto">
//           <p className="text-white/60 text-xs mb-1.5">
//             Home &rsaquo; <span className="text-white">{breadcrumb}</span>
//           </p>
//           <h2 className="text-white font-black text-2xl sm:text-3xl md:text-4xl leading-tight">{title}</h2>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

// export default function LandingPage() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [activeT, setActiveT] = useState(0);
//   const [barWidth, setBarWidth] = useState(0);
//   const [activeNewsTab, setActiveNewsTab] = useState("All");
//   const [activeGalleryTab, setActiveGalleryTab] = useState("All");
//   const [formSent, setFormSent] = useState(false);
//   const tIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const barIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   // scroll shadow on nav
//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   // testimonial auto-advance + progress bar
//   const startBar = () => {
//     clearInterval(barIntervalRef.current!);
//     setBarWidth(0);
//     let w = 0;
//     barIntervalRef.current = setInterval(() => {
//       w += 100 / 50;
//       setBarWidth(Math.min(w, 100));
//       if (w >= 100) clearInterval(barIntervalRef.current!);
//     }, 100);
//   };

//   const startAutoT = () => {
//     clearInterval(tIntervalRef.current!);
//     tIntervalRef.current = setInterval(() => {
//       setActiveT((p) => (p + 1) % TESTIMONIALS.length);
//     }, 5000);
//   };

//   useEffect(() => {
//     startBar();
//     startAutoT();
//     return () => {
//       clearInterval(tIntervalRef.current!);
//       clearInterval(barIntervalRef.current!);
//     };
//   }, [activeT]);

//   const goToT = (i: number) => { setActiveT(i); startBar(); startAutoT(); };
//   const nextT = () => goToT((activeT + 1) % TESTIMONIALS.length);
//   const prevT = () => goToT((activeT - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

//   // animation variants
//   const fadeUp: Variants = {
//     hidden: { opacity: 0, y: 32 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
//   };
//   const stagger: Variants = {
//     hidden: {},
//     visible: { transition: { staggerChildren: 0.1 } },
//   };

//   return (
//     <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">

//       {/* ── NAV ───────────────────────────────────────────────── */}
//       <motion.nav
//         className="fixed top-0 left-0 right-0 z-50 transition-shadow duration-300"
//         style={{ background: "#172554", boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,.25)" : "none" }}
//         initial={{ y: -80 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.55, ease: "easeOut" }}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-[68px]">
//             {/* Logo */}
//             <Link href="/" className="flex items-center gap-3 shrink-0">
//               <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-white/20 bg-white/10">
//                 <img src={SCHOOL_LOGO} alt="Logo" className="w-9 h-9 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
//               </div>
//               <div>
//                 <p className="text-white font-extrabold text-sm leading-tight">God&apos;s Way Schools</p>
//                 <p className="text-white/55 text-[11px] leading-tight">Model Groups of Schools</p>
//               </div>
//             </Link>

//             {/* Desktop links */}
//             <div className="hidden lg:flex items-center gap-1">
//               {NAV_LINKS.map((l) => (
//                 <a key={l.label} href={l.href} className="text-white/75 hover:text-white hover:bg-white/10 text-[13px] font-semibold px-3 py-2 rounded-md transition-all">
//                   {l.label}
//                 </a>
//               ))}
//             </div>

//             {/* CTA + hamburger */}
//             <div className="flex items-center gap-3">
//               <Link href="wa.me/2348147445983?text=HelloGodsWay" className="hidden sm:inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5">
//                 Apply Now <ArrowRight className="w-4 h-4" />
//               </Link>
//               <button className="lg:hidden text-white p-1.5" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
//                 {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Mobile menu */}
//         <AnimatePresence>
//           {menuOpen && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               className="lg:hidden border-t border-white/10 bg-blue-900/98"
//             >
//               <div className="px-4 py-4 flex flex-col gap-1">
//                 {NAV_LINKS.map((l) => (
//                   <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 text-sm font-semibold px-3 py-3 rounded-lg transition-all">
//                     {l.label}
//                   </a>
//                 ))}
//                 <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3.5 rounded-xl text-sm">
//                   Apply Now <ArrowRight className="w-4 h-4" />
//                 </Link>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.nav>

//       {/* ── HERO ──────────────────────────────────────────────── */}
//       <section className="relative min-h-screen flex items-center pt-[68px] overflow-hidden">
//         <div className="absolute inset-0">
//           <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80" alt="" aria-hidden className="w-full h-full object-cover object-center" />
//           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/85 to-blue-800/70" />
//         </div>
//         <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-20">
//           <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
//             {/* Left */}
//             <div className="text-white">
//               <motion.div
//                 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
//                 className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
//               >
//                 <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
//                 Sowing the Seed of Merit &amp; Excellence
//               </motion.div>

//               <motion.h1
//                 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}
//                 className="font-black text-white leading-[1.08] tracking-tight mb-5"
//                 style={{ fontSize: "clamp(2.2rem,5.5vw,3.8rem)" }}
//               >
//                 Welcome to<br />
//                 <span className="text-orange-400">God&apos;s Way</span><br />
//                 Model Groups<br />of Schools
//               </motion.h1>

//               <motion.p
//                 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
//                 className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-[480px]"
//               >
//                 Nurturing the leaders of tomorrow through academic excellence, moral values, and spiritual growth — from Nursery to Senior Secondary.
//               </motion.p>

//               <motion.div
//                 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
//                 className="flex flex-col sm:flex-row gap-3 mb-10"
//               >
//                 <Link href="/sign-in" className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/30">
//                   Access Student Portal <ArrowRight className="w-4 h-4" />
//                 </Link>
//                 <a href="#about" className="flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all backdrop-blur-sm">
//                   Explore More <ChevronRight className="w-4 h-4" />
//                 </a>
//               </motion.div>

//               {/* Stats grid */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.42 }}
//                 className="grid grid-cols-2 sm:grid-cols-4 gap-3"
//               >
//                 {STATS.map((s, i) => (
//                   <motion.div
//                     key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
//                     className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-xl px-3 py-4 text-center"
//                   >
//                     <div className="text-orange-400 font-black text-xl sm:text-2xl leading-none">{s.value}</div>
//                     <div className="text-white/55 text-[11px] mt-1 leading-snug">{s.label}</div>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </div>

//             {/* Right — cards (hidden on mobile to keep hero clean) */}
//             <motion.div
//               initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
//               className="hidden lg:flex flex-col gap-4"
//             >
//               <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm">
//                 <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80" alt="Students in class" className="w-full h-44 object-cover" />
//                 <div className="p-4">
//                   <h4 className="text-white font-bold text-sm mb-1">📚 World-Class Education</h4>
//                   <p className="text-white/55 text-xs">Rigorous curriculum from Nursery through Senior Secondary School</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 {[
//                   { icon: "🏆", title: "Academic Excellence", sub: "Top WAEC & NECO results every year" },
//                   { icon: "👨‍👩‍👧", title: "Parent Portal", sub: "Stay connected with your child" },
//                 ].map((c) => (
//                   <div key={c.title} className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm flex items-start gap-3">
//                     <div className="w-9 h-9 bg-orange-500/25 rounded-lg flex items-center justify-center text-lg shrink-0">{c.icon}</div>
//                     <div>
//                       <h5 className="text-white text-xs font-bold">{c.title}</h5>
//                       <p className="text-white/50 text-[11px] mt-0.5">{c.sub}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* ── STATS BAR ─────────────────────────────────────────── */}
//       <div className="bg-blue-950 py-7">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/15">
//             {STATS.map((s) => (
//               <div key={s.label} className="text-center py-2 px-4">
//                 <div className="text-orange-400 font-black text-2xl sm:text-3xl leading-none">{s.value}</div>
//                 <div className="text-white/60 text-xs sm:text-sm mt-1 font-medium">{s.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── ABOUT ─────────────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80" alt="School building" breadcrumb="About School" title="About School" />
//       <section id="about" className="bg-white py-16 sm:py-20 lg:py-24">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
//             {/* Image stack */}
//             <motion.div variants={fadeUp} className="relative">
//               <div className="rounded-2xl overflow-hidden shadow-2xl">
//                 <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=80" alt="Students studying" className="w-full h-72 sm:h-80 lg:h-96 object-cover" />
//               </div>
//               <div className="absolute -bottom-5 -right-4 w-44 rounded-xl overflow-hidden border-4 border-white shadow-xl hidden sm:block">
//                 <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=300&q=80" alt="Happy students" className="w-full h-28 object-cover" />
//               </div>
//               <div className="absolute -top-5 -left-4 bg-orange-500 text-white rounded-xl px-4 py-3 shadow-xl hidden sm:block">
//                 <div className="text-2xl font-black leading-none">15+</div>
//                 <div className="text-[11px] font-semibold mt-0.5 opacity-90">Years of<br/>Excellence</div>
//               </div>
//             </motion.div>

//             {/* Text */}
//             <motion.div variants={fadeUp}>
//               <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">📖 About Us</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
//                 Building Tomorrow&apos;s <span className="text-blue-600">Leaders</span> Today
//               </h2>
//               <p className="text-gray-500 leading-relaxed mb-5">
//                 God&apos;s Way Model Groups of Schools has been a beacon of educational excellence, providing a holistic education that develops the mind, character, and spirit of every student — from Nursery through Senior Secondary.
//               </p>

//               {/* Mission / Vision */}
//               <div className="grid sm:grid-cols-2 gap-3 mb-6">
//                 {[
//                   { icon: Target, label: "Our Mission", text: "To provide a transformative education that empowers students to excel academically, think critically and contribute positively to society." },
//                   { icon: Eye, label: "Our Vision", text: "To be a leading school recognized for excellence in education, innovation and character building across Nigeria and beyond." },
//                 ].map((mv) => (
//                   <div key={mv.label} className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
//                     <h4 className="text-blue-800 text-xs font-extrabold mb-2 flex items-center gap-1.5">
//                       <mv.icon className="w-3.5 h-3.5" /> {mv.label}
//                     </h4>
//                     <p className="text-gray-600 text-xs leading-relaxed">{mv.text}</p>
//                   </div>
//                 ))}
//               </div>

//               <ul className="space-y-2.5 mb-7">
//                 {["Qualified and dedicated teaching staff", "Individual student performance tracking", "Modern digital management system", "Strong parent–school communication", "Safe, nurturing and inclusive environment"].map((pt) => (
//                   <li key={pt} className="flex items-start gap-2.5 text-sm text-gray-600">
//                     <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> {pt}
//                   </li>
//                 ))}
//               </ul>

//               <div className="flex flex-wrap gap-3">
//                 <a href="#academics" className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all">Learn More</a>
//                 <a href="#contact" className="inline-flex items-center gap-2 border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all">Contact Us</a>
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── WHY CHOOSE US ─────────────────────────────────────── */}
//       <section id="why" className="bg-blue-50 py-16 sm:py-20">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
//             <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
//               <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">⭐ Why Choose Us</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Why God&apos;s Way Schools?</h2>
//               <p className="text-gray-500">We give every child the tools to flourish — academically, spiritually, and personally.</p>
//             </motion.div>
//             <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
//               {WHY_CARDS.map((c) => (
//                 <motion.div key={c.title} variants={fadeUp} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
//                   <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                     <c.icon className="w-7 h-7 text-blue-600" />
//                   </div>
//                   <h3 className="font-extrabold text-gray-900 text-sm mb-2">{c.title}</h3>
//                   <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── OUR STORY ─────────────────────────────────────────── */}
//       <section id="story" className="bg-white py-16 sm:py-20 lg:py-24">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
//             <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1">
//               <img src="https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=700&q=80" alt="Students in lab" className="w-full h-72 sm:h-80 lg:h-[420px] object-cover" />
//             </motion.div>
//             <motion.div variants={fadeUp} className="order-1 lg:order-2">
//               <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">📜 Our Story</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">A Legacy of Excellence Since Our Founding</h2>
//               <p className="text-gray-500 leading-relaxed mb-4">
//                 Founded with a vision to raise leaders, God&apos;s Way has grown from a small seed into a thriving institution serving over 2,000 students. Our commitment to blending innovative teaching with strong values has shaped thousands of lives.
//               </p>
//               <p className="text-gray-500 leading-relaxed mb-6">
//                 From humble beginnings, we built a reputation for producing top WAEC and NECO results, cultivating graduates who go on to lead in universities, business, and public service across Nigeria and beyond.
//               </p>
//               <div className="grid grid-cols-2 gap-3 mb-6">
//                 {[
//                   { n: "Est.", txt: "Founded with a vision to raise leaders of merit and excellence" },
//                   { n: "1st", txt: "Introduced digital report cards in our region" },
//                   { n: "98%", txt: "Consistent WAEC & NECO pass rate every year" },
//                   { n: "20+", txt: "Awards for academic and co-curricular excellence" },
//                 ].map((m) => (
//                   <div key={m.n} className="bg-blue-50 rounded-xl p-3.5 flex items-start gap-3">
//                     <span className="text-blue-600 font-black text-lg shrink-0">{m.n}</span>
//                     <p className="text-gray-600 text-xs leading-snug">{m.txt}</p>
//                   </div>
//                 ))}
//               </div>
//               <a href="#contact" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all">
//                 Get In Touch <ArrowRight className="w-4 h-4" />
//               </a>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── CORE VALUES ───────────────────────────────────────── */}
//       <section id="values" className="bg-blue-900 py-16 sm:py-20">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
//             <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
//               <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">💡 Our Values</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Core Values We Live By</h2>
//               <p className="text-white/60">Every decision, every lesson, every relationship at God&apos;s Way is guided by these principles.</p>
//             </motion.div>
//             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
//               {CORE_VALUES.map((v) => (
//                 <motion.div key={v.label} variants={fadeUp} className="bg-white/8 border border-white/12 rounded-2xl p-5 text-center hover:bg-white/14 hover:-translate-y-1 transition-all duration-300">
//                   <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
//                     <v.icon className="w-6 h-6 text-orange-400" />
//                   </div>
//                   <h3 className="text-white font-extrabold text-sm mb-1.5">{v.label}</h3>
//                   <p className="text-white/55 text-[11px] leading-snug">{v.desc}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── ACADEMICS ─────────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1400&q=80" alt="Students in library" breadcrumb="Academics" title="Academics" />
//       <section id="academics" className="bg-white py-16 sm:py-20 lg:py-24">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
//             <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
//               <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">📚 Academic Programs</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">From Nursery to Senior Secondary</h2>
//               <p className="text-gray-500">Three levels of excellence, each designed to meet students where they are and carry them further.</p>
//             </motion.div>

//             {/* Program cards */}
//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
//               {PROGRAMS.map((p, i) => (
//                 <motion.div key={p.level} variants={fadeUp} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
//                   <div className="relative h-48 overflow-hidden">
//                     <img src={p.img} alt={p.alt} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
//                     <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-900/80" />
//                     <span className="absolute top-3 right-3 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{p.badge}</span>
//                     <div className="absolute bottom-3 left-3 flex items-center gap-2">
//                       <span className="text-2xl">{p.icon}</span>
//                       <h3 className="text-white font-extrabold text-base">{p.level}</h3>
//                     </div>
//                   </div>
//                   <div className="p-5">
//                     <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
//                     <div className="flex flex-wrap gap-1.5">
//                       {p.tags.map((t) => (
//                         <span key={t} className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">{t}</span>
//                       ))}
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             {/* Curriculum grid */}
//             <motion.div variants={fadeUp}>
//               <h3 className="text-xl font-extrabold text-gray-900 text-center mb-6">Our Curriculum Highlights</h3>
//               <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {CURRICULUM.map((c) => (
//                   <div key={c.title} className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl p-5 transition-all">
//                     <c.icon className="w-6 h-6 text-blue-600 mb-3" />
//                     <h4 className="font-extrabold text-gray-900 text-sm mb-1.5">{c.title}</h4>
//                     <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── ADMISSIONS ────────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80" alt="Students" breadcrumb="Admissions" title="Admissions" />
//       <section id="admissions" className="bg-blue-50 py-16 sm:py-20 lg:py-24">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
//             <div className="grid lg:grid-cols-2 gap-12 items-start mb-10">
//               {/* Left */}
//               <motion.div variants={fadeUp}>
//                 <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">🎓 Join Our Family</span>
//                 <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">Join the God&apos;s Way Family</h2>
//                 <p className="text-gray-500 leading-relaxed mb-5 text-sm sm:text-base">
//                   We welcome passionate learners who are ready to explore, grow, and make a difference. Admissions are open for the 2024–25 academic session — limited seats available.
//                 </p>
//                 <div className="bg-white rounded-xl p-5 mb-5 border border-blue-100">
//                   <h4 className="font-extrabold text-gray-900 text-sm mb-3">📋 Eligibility</h4>
//                   <ul className="space-y-1.5">
//                     {["Nursery to Grade 12 applicants welcome", "Age-appropriate for the desired grade level", "Submission of all required documents", "Assessment may be required for certain grades"].map((e) => (
//                       <li key={e} className="text-gray-600 text-sm flex items-start gap-2 pl-1">
//                         <span className="text-blue-500 font-bold mt-0.5">•</span> {e}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//                 <Link href="/sign-in" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
//                   Apply Now <ArrowRight className="w-4 h-4" />
//                 </Link>
//               </motion.div>

//               {/* Right — process steps */}
//               <motion.div variants={fadeUp}>
//                 <h3 className="font-extrabold text-gray-900 text-base mb-5">Admission Process</h3>
//                 <div className="space-y-3">
//                   {ADMISSION_STEPS.map((s) => (
//                     <div key={s.n} className="bg-white rounded-xl p-4 flex items-start gap-4 shadow-sm border border-blue-50">
//                       <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center font-black text-base shrink-0">{s.n}</div>
//                       <div>
//                         <h4 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h4>
//                         <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             </div>

//             {/* Docs required */}
//             <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border border-blue-100 mb-7">
//               <h3 className="font-extrabold text-gray-900 text-base mb-4">Documents Required</h3>
//               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                 {["Birth Certificate", "Previous School Report (if applicable)", "Passport Size Photographs (4 copies)", "Proof of Address / Utility Bill", "Parent/Guardian ID Card", "Any other relevant documents"].map((d) => (
//                   <div key={d} className="flex items-center gap-2 text-gray-600 text-sm">
//                     <span className="text-blue-500">📄</span> {d}
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* CTA */}
//             <motion.div variants={fadeUp} className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-7 text-white text-center">
//               <h3 className="text-xl sm:text-2xl font-black mb-2">Admissions Open 2024–25</h3>
//               <p className="text-white/70 text-sm mb-5">Limited seats available. Don&apos;t miss your chance to be part of our school family.</p>
//               <Link href="/sign-in" className="inline-flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-bold text-sm px-7 py-3 rounded-xl transition-all">
//                 Apply Today <ArrowRight className="w-4 h-4" />
//               </Link>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── STUDENT PORTAL ────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1400&q=80" alt="Technology" breadcrumb="Student Portal" title="Student Portal" />
//       <section id="portal" className="bg-white py-16 sm:py-20 lg:py-24">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
//             <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
//               <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">🖥️ Platform Features</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Everything You Need, In One Place</h2>
//               <p className="text-gray-500">Our school management platform empowers administrators, teachers, and parents with powerful digital tools.</p>
//             </motion.div>

//             <div className="grid lg:grid-cols-2 gap-12 items-center">
//               {/* Feature list */}
//               <motion.div variants={fadeUp} className="space-y-3">
//                 {PORTAL_FEATURES.map((f) => (
//                   <div key={f.title} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
//                     <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
//                       <f.icon className="w-5 h-5 text-blue-600" />
//                     </div>
//                     <div>
//                       <h4 className="font-extrabold text-gray-900 text-sm mb-1">{f.title}</h4>
//                       <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </motion.div>

//               {/* Portal mockup */}
//               <motion.div variants={fadeUp}>
//                 <div className="bg-blue-50 rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
//                   {/* Browser bar */}
//                   <div className="bg-blue-800 px-4 py-3 flex items-center gap-2">
//                     <div className="flex gap-1.5">
//                       <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
//                       <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
//                       <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
//                     </div>
//                     <span className="text-white/60 text-[11px] font-medium ml-auto">God&apos;s Way Student Portal</span>
//                   </div>
//                   {/* Mockup body */}
//                   <div className="p-5">
//                     <p className="font-extrabold text-gray-900 text-sm mb-0.5">Welcome Back! 👋</p>
//                     <p className="text-gray-400 text-xs mb-4">View your assignments, results, and updates all in one place.</p>
//                     <div className="grid grid-cols-3 gap-2.5 mb-4">
//                       {[{ v: "87%", l: "Average Score" }, { v: "12", l: "Assignments" }, { v: "3rd", l: "Class Position" }].map((s) => (
//                         <div key={s.l} className="bg-white rounded-xl p-3 text-center shadow-sm">
//                           <div className="text-blue-600 font-black text-lg">{s.v}</div>
//                           <div className="text-gray-400 text-[10px] mt-0.5">{s.l}</div>
//                         </div>
//                       ))}
//                     </div>
//                     <div className="grid grid-cols-4 gap-2 mb-4">
//                       {[{ i: "📝", l: "Assignments" }, { i: "📅", l: "Timetable" }, { i: "📚", l: "Resources" }, { i: "✉️", l: "Messages" }].map((a) => (
//                         <div key={a.l} className="bg-white rounded-xl p-2.5 text-center shadow-sm">
//                           <div className="text-lg mb-1">{a.i}</div>
//                           <p className="text-[10px] text-gray-600 font-semibold leading-tight">{a.l}</p>
//                         </div>
//                       ))}
//                     </div>
//                     <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3">
//                       <p className="text-orange-600 text-[11px] font-bold">📢 Notice</p>
//                       <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">End of term report cards are ready. Check your inbox for the download link.</p>
//                     </div>
//                   </div>
//                 </div>
//                 <p className="text-center text-xs text-gray-400 mt-3">
//                   Need help? <a href="#contact" className="text-blue-600 font-semibold hover:underline">Contact School Admin</a>
//                 </p>
//               </motion.div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── NEWS & EVENTS ─────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80" alt="Events" breadcrumb="News & Events" title="News & Events" />
//       <section id="news" className="bg-blue-50 py-16 sm:py-20">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
//             <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
//               <div>
//                 <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3">📰 Latest Updates</span>
//                 <h2 className="text-3xl sm:text-4xl font-black text-gray-900">News &amp; Events</h2>
//               </div>
//               <div className="flex gap-1 bg-white rounded-xl p-1 border border-blue-100 self-start sm:self-auto">
//                 {NEWS_TABS.map((t) => (
//                   <button key={t} onClick={() => setActiveNewsTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeNewsTab === t ? "bg-blue-800 text-white" : "text-gray-500 hover:text-gray-700"}`}>
//                     {t}
//                   </button>
//                 ))}
//               </div>
//             </motion.div>

//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
//               {NEWS_ITEMS.map((n) => (
//                 <motion.div key={n.title} variants={fadeUp} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
//                   <div className="relative h-44 overflow-hidden">
//                     <img src={n.img} alt={n.alt} className="w-full h-full object-cover transition-transform duration-400 hover:scale-105" loading="lazy" />
//                     <span className={`absolute top-2.5 left-2.5 ${n.tagColor} text-white text-[11px] font-bold px-2.5 py-1 rounded-full`}>{n.tag}</span>
//                   </div>
//                   <div className="p-4">
//                     <p className="text-gray-400 text-[11px] mb-1.5">📅 {n.date}</p>
//                     <h4 className="font-extrabold text-gray-900 text-sm mb-1.5 leading-snug">{n.title}</h4>
//                     <p className="text-gray-500 text-xs leading-relaxed mb-3">{n.desc}</p>
//                     <a href="#" className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">Read More <ArrowRight className="w-3 h-3" /></a>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             <motion.div variants={fadeUp} className="text-center mt-9">
//               <a href="#" className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
//                 View All News &amp; Events <ArrowRight className="w-4 h-4" />
//               </a>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── GALLERY ───────────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80" alt="Gallery" breadcrumb="Gallery" title="Gallery" />
//       <section id="gallery" className="bg-white py-16 sm:py-20">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
//             <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
//               <div>
//                 <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3">📸 School Life</span>
//                 <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Life at God&apos;s Way</h2>
//               </div>
//               <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
//                 {GALLERY_TABS.map((t) => (
//                   <button key={t} onClick={() => setActiveGalleryTab(t)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeGalleryTab === t ? "bg-blue-800 text-white border-blue-800" : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"}`}>
//                     {t}
//                   </button>
//                 ))}
//               </div>
//             </motion.div>

//             <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//               {GALLERY_IMGS.map((g, i) => (
//                 <motion.div key={i} variants={fadeUp} className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer">
//                   <img src={g.src} alt={g.alt} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110" loading="lazy" />
//                   <div className="absolute inset-0 bg-blue-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
//                     <span className="text-white text-2xl">🔍</span>
//                   </div>
//                 </motion.div>
//               ))}
//             </motion.div>

//             <motion.div variants={fadeUp} className="text-center mt-8">
//               <a href="#" className="inline-flex items-center gap-2 border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
//                 Load More Photos
//               </a>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── TESTIMONIALS ──────────────────────────────────────── */}
//       <section id="testimonials" className="bg-blue-50 py-16 sm:py-20">
//         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
//             <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-12">
//               <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">💬 Testimonials</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
//                 Voices of Our <span className="text-blue-600">Community</span>
//               </h2>
//               <p className="text-gray-500">Hear from parents, students and alumni who have experienced the God&apos;s Way difference firsthand.</p>
//             </motion.div>

//             <motion.div variants={fadeUp} className="max-w-3xl mx-auto">
//               {/* Card */}
//               <div className="bg-white rounded-3xl p-7 sm:p-10 shadow-lg border border-gray-100 mb-5">
//                 {/* Progress bar */}
//                 <div className="h-0.5 bg-gray-200 rounded-full mb-7 overflow-hidden">
//                   <div className="h-full bg-gradient-to-r from-orange-500 to-blue-500 rounded-full transition-none" style={{ width: `${barWidth}%` }} />
//                 </div>
//                 <AnimatePresence mode="wait">
//                   <motion.div key={activeT} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
//                     <Quote className="w-8 h-8 text-orange-500 mb-4" />
//                     <div className="flex gap-1 mb-4">
//                       {Array.from({ length: TESTIMONIALS[activeT].stars }).map((_, i) => (
//                         <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
//                       ))}
//                     </div>
//                     <p className="text-gray-700 text-base sm:text-lg leading-relaxed italic mb-7">
//                       &ldquo;{TESTIMONIALS[activeT].text}&rdquo;
//                     </p>
//                     <div className="flex items-center gap-4">
//                       <div
//                         className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0"
//                         style={{ background: TESTIMONIALS[activeT].color }}
//                       >
//                         {TESTIMONIALS[activeT].initials}
//                       </div>
//                       <div className="flex-1">
//                         <p className="font-extrabold text-gray-900 text-sm">{TESTIMONIALS[activeT].name}</p>
//                         <p className="text-gray-400 text-xs mt-0.5">{TESTIMONIALS[activeT].role}</p>
//                       </div>
//                       <span className="text-gray-300 font-bold text-sm hidden sm:block">
//                         {String(activeT + 1).padStart(2, "0")} / {String(TESTIMONIALS.length).padStart(2, "0")}
//                       </span>
//                     </div>
//                   </motion.div>
//                 </AnimatePresence>
//               </div>

//               {/* Controls */}
//               <div className="flex items-center justify-between">
//                 <div className="flex gap-2">
//                   {TESTIMONIALS.map((_, i) => (
//                     <button
//                       key={i}
//                       onClick={() => goToT(i)}
//                       className="h-2 rounded-full transition-all duration-300"
//                       style={{ width: i === activeT ? 28 : 8, background: i === activeT ? "linear-gradient(90deg,#f97316,#2563eb)" : "#d1d5db" }}
//                     />
//                   ))}
//                 </div>
//                 <div className="flex gap-2">
//                   <button onClick={prevT} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
//                     <ChevronLeft className="w-4 h-4" />
//                   </button>
//                   <button onClick={nextT} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── CTA BAND ──────────────────────────────────────────── */}
//       <div className="relative overflow-hidden">
//         <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
//         <div className="absolute inset-0 bg-blue-900/90" />
//         <div className="relative z-10 py-20 text-center">
//           <div className="max-w-3xl mx-auto px-4 sm:px-6">
//             <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
//               <h2 className="text-white font-black mb-3" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>Ready to Get Started?</h2>
//               <p className="text-white/65 text-base mb-8 max-w-md mx-auto">Access the school portal to view results, manage classes, and stay connected with your child&apos;s academic progress.</p>
//               <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                 <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-orange-500/30">
//                   Sign In to Portal <ArrowRight className="w-4 h-4" />
//                 </Link>
//                 <a href="#admissions" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-800 font-bold px-8 py-4 rounded-xl transition-all">
//                   Apply for Admission
//                 </a>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* ── CONTACT ───────────────────────────────────────────── */}
//       <SectionBanner img="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1400&q=80" alt="Contact" breadcrumb="Contact Us" title="Contact Us" />
//       <section id="contact" className="bg-white py-16 sm:py-20 lg:py-24">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
//             <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mb-12">
//               <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">📍 Get In Touch</span>
//               <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">We&apos;d Love to Hear From You</h2>
//               <p className="text-gray-500 text-sm">Reach out for enquiries, visit our campus, or send us a message below.</p>
//             </motion.div>

//             <div className="grid lg:grid-cols-2 gap-10">
//               {/* Info */}
//               <motion.div variants={fadeUp}>
//                 <h3 className="font-extrabold text-gray-900 text-base mb-5">Get In Touch</h3>
//                 <div className="space-y-3 mb-5">
//                   {[
//                     { icon: Phone, label: "Phone", val: "08069825847 / 08067110930", href: "tel:+2348069825847" },
//                     { icon: Mail, label: "Email", val: "godswaygroupofschools@gmail.com", href: "mailto:godswaygroupofschools@gmail.com" },
//                     { icon: MapPin, label: "Address", val: "No 12 Siyanbola Street, Osogbo, Osun State", href: "#" },
//                   ].map((c) => (
//                     <a key={c.label} href={c.href} className="flex items-start gap-3.5 bg-blue-50 hover:bg-blue-100 rounded-xl p-4 transition-all group">
//                       <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center shrink-0">
//                         <c.icon className="w-4.5 h-4.5 text-white w-5 h-5" />
//                       </div>
//                       <div>
//                         <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{c.label}</p>
//                         <p className="text-gray-900 font-semibold text-sm leading-snug">{c.val}</p>
//                       </div>
//                     </a>
//                   ))}
//                 </div>
//                 <div className="bg-blue-50 rounded-xl p-5">
//                   <h4 className="font-extrabold text-gray-900 text-sm mb-3">School Hours</h4>
//                   <div className="space-y-2 divide-y divide-gray-200">
//                     {[["Monday – Friday", "7:50 AM – 4:00 PM", true], ["Saturday", "Closed", false], ["Sunday", "Closed", false]].map(([d, h, open]) => (
//                       <div key={d as string} className="flex justify-between text-sm pt-2 first:pt-0">
//                         <span className="text-gray-600">{d as string}</span>
//                         <span className={`font-bold ${open ? "text-gray-900" : "text-gray-400"}`}>{h as string}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="mt-4">
//                   <p className="text-xs font-bold text-gray-700 mb-2">Follow Us</p>
//                   <div className="flex gap-2">
//                     {["f", "𝕏", "📸", "▶", "in"].map((s) => (
//                       <a key={s} href="#" className="w-8 h-8 bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold transition-all">{s}</a>
//                     ))}
//                   </div>
//                 </div>
//               </motion.div>

//               {/* Form */}
//               <motion.div variants={fadeUp} className="bg-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
//                 <h3 className="font-extrabold text-gray-900 text-base mb-5">Send Us a Message</h3>
//                 <div className="grid sm:grid-cols-2 gap-3 mb-3">
//                   <div className="flex flex-col gap-1.5">
//                     <label className="text-xs font-semibold text-gray-700">Your Name</label>
//                     <input type="text" placeholder="Enter your name" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
//                   </div>
//                   <div className="flex flex-col gap-1.5">
//                     <label className="text-xs font-semibold text-gray-700">Your Email</label>
//                     <input type="email" placeholder="Enter your email" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
//                   </div>
//                 </div>
//                 <div className="flex flex-col gap-1.5 mb-3">
//                   <label className="text-xs font-semibold text-gray-700">Subject</label>
//                   <input type="text" placeholder="How can we help?" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
//                 </div>
//                 <div className="flex flex-col gap-1.5 mb-5">
//                   <label className="text-xs font-semibold text-gray-700">Message</label>
//                   <textarea rows={4} placeholder="Type your message here..." className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none" />
//                 </div>
//                 <button
//                   onClick={() => { setFormSent(true); setTimeout(() => setFormSent(false), 5000); }}
//                   className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
//                 >
//                   Send Message →
//                 </button>
//                 <AnimatePresence>
//                   {formSent && (
//                     <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold text-center py-3 rounded-xl">
//                       ✅ Message sent! We&apos;ll get back to you soon.
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </motion.div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── FOOTER ────────────────────────────────────────────── */}
//       <footer className="bg-blue-950 text-white">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
//             {/* Brand */}
//             <div className="sm:col-span-2 lg:col-span-1">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="w-10 h-10 bg-white/8 border border-white/12 rounded-lg flex items-center justify-center">
//                   <img src={SCHOOL_LOGO} alt="Logo" className="w-9 h-9 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
//                 </div>
//                 <div>
//                   <p className="text-white font-extrabold text-sm leading-tight">God&apos;s Way Schools</p>
//                   <p className="text-white/40 text-[11px]">Model Groups of Schools</p>
//                 </div>
//               </div>
//               <p className="text-white/45 text-xs leading-relaxed mb-4">
//                 Empowering students to achieve their highest potential through merit, excellence, and strong moral values.
//               </p>
//               <div className="flex gap-2">
//                 {["f", "𝕏", "📸", "▶", "in"].map((s) => (
//                   <a key={s} href="#" className="w-8 h-8 bg-white/8 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold transition-all">{s}</a>
//                 ))}
//               </div>
//             </div>

//             {/* Quick Links */}
//             <div>
//               <h4 className="text-white font-extrabold text-sm mb-4">Quick Links</h4>
//               <ul className="space-y-2.5">
//                 {[["About School", "#about"], ["Academics", "#academics"], ["Admissions", "#admissions"], ["Student Portal", "#portal"], ["News & Events", "#news"], ["Gallery", "#gallery"]].map(([l, h]) => (
//                   <li key={l}><a href={h} className="text-white/45 hover:text-orange-400 text-xs transition-colors">{l}</a></li>
//                 ))}
//               </ul>
//             </div>

//             {/* Academics */}
//             <div>
//               <h4 className="text-white font-extrabold text-sm mb-4">Academics</h4>
//               <ul className="space-y-2.5">
//                 {["Primary School", "Junior Secondary", "Senior Secondary", "Science Department", "Arts Department", "Commercial"].map((l) => (
//                   <li key={l}><a href="#academics" className="text-white/45 hover:text-orange-400 text-xs transition-colors">{l}</a></li>
//                 ))}
//               </ul>
//             </div>

//             {/* Contact */}
//             <div>
//               <h4 className="text-white font-extrabold text-sm mb-4">Contact</h4>
//               <ul className="space-y-2.5">
//                 {["08069825847", "08067110930", "godswaygroupofschools@gmail.com", "No 12 Siyanbola Street, Osogbo, Osun State"].map((l) => (
//                   <li key={l}><a href="#contact" className="text-white/45 hover:text-orange-400 text-xs transition-colors">{l}</a></li>
//                 ))}
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
//             <p className="text-white/30 text-xs">© {new Date().getFullYear()} God&apos;s Way Model Groups of Schools. All rights reserved.</p>
//             <div className="flex gap-1.5">
//               <span className="w-2 h-2 rounded-full bg-blue-500" />
//               <span className="w-2 h-2 rounded-full bg-orange-500" />
//               <span className="w-2 h-2 rounded-full bg-white/40" />
//             </div>
//             <p className="text-white/30 text-xs">Merit &amp; Excellence</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }


// "use client";

// import Link from "next/link";
// import { motion, AnimatePresence, Variants } from "framer-motion";
// import { useState, useEffect, useRef } from "react";
// import {
//   Users,
//   Award,
//   Shield,
//   ChevronRight,
//   Star,
//   CheckCircle,
//   Menu,
//   X,
//   Globe,
//   TrendingUp,
//   Bell,
//   FileText,
//   ArrowRight,
//   Phone,
//   Mail,
//   MapPin,
//   BookOpen,
//   Quote,
//   ChevronLeft,
// } from "lucide-react";

// const SCHOOL_LOGO =
//   "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

// const NAV_LINKS = [
//   { label: "About", href: "#about" },
//   { label: "Features", href: "#features" },
//   { label: "Programs", href: "#programs" },
//   { label: "Testimonials", href: "#testimonials" },
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
//     description:
//       "Beautiful, QR-code secured report cards available online. Parents get instant notifications when results are ready.",
//   },
//   {
//     icon: TrendingUp,
//     title: "Automatic Promotion",
//     description:
//       "Intelligent system tracks student performance across all three terms and handles class promotions automatically.",
//   },
//   {
//     icon: Users,
//     title: "Parent Portal",
//     description:
//       "Parents stay connected with their children's academic journey. View results, download reports, track history.",
//   },
//   {
//     icon: Shield,
//     title: "Secure & Reliable",
//     description:
//       "Enterprise-grade security with role-based access control. Every action is audited and traceable.",
//   },
//   {
//     icon: Bell,
//     title: "Smart Notifications",
//     description:
//       "Automated email alerts for report approvals, result availability, and important school updates.",
//   },
//   {
//     icon: Globe,
//     title: "Multi-Level Management",
//     description:
//       "Seamlessly manages Primary, JSS, and SSS sections with department assignments for senior students.",
//   },
// ];

// const PROGRAMS = [
//   {
//     level: "Primary School",
//     classes: [
//       "Nurseries",
//       "Primary 1",
//       "Primary 2",
//       "Primary 3",
//       "Primary 4",
//       "Primary 5",
//     ],
//     description:
//       "A nurturing foundation that builds lifelong learners with strong academic and moral values.",
//     icon: "🌱",
//     accent: "#0ea5e9",
//     // Unsplash — young children in classroom — replace with real school photo later
//     image:
//       "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80",
//     imageAlt: "Primary school students in classroom",
//   },
//   {
//     level: "Junior Secondary",
//     classes: ["JSS 1", "JSS 2", "JSS 3"],
//     description:
//       "Expanding minds with a broad curriculum that prepares students for senior secondary studies.",
//     icon: "📚",
//     accent: "#f97316",
//     // Unsplash — secondary students studying — replace with real school photo later
//     image:
//       "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
//     imageAlt: "Junior secondary students in class",
//   },
//   {
//     level: "Senior Secondary",
//     classes: ["SSS 1", "SSS 2", "SSS 3"],
//     description:
//       "Specialized departments: Science, Arts & Commercial — tailored for university success.",
//     icon: "🎓",
//     accent: "#0ea5e9",
//     // Unsplash — students in science lab — replace with real school photo later
//     image:
//       "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&q=80",
//     imageAlt: "Senior secondary students in science lab",
//   },
// ];

// const TESTIMONIALS = [
//   {
//     name: "Mrs. Funmilayo Adeyemi",
//     role: "Parent of JSS 2 Student",
//     initials: "FA",
//     color: "#f97316",
//     stars: 5,
//     text: "The parent portal has completely transformed how I stay involved in my daughter's education. I can check her results, download reports, and get notified immediately. God's Way Schools is truly ahead of its time.",
//   },
//   {
//     name: "Mr. Oluwaseun Bakare",
//     role: "Parent of Primary 4 & SSS 1 Students",
//     initials: "OB",
//     color: "#0ea5e9",
//     stars: 5,
//     text: "I have two children in this school and the digital report card system makes everything so easy. No more waiting for end-of-term visits. The teachers are excellent and the management is highly professional.",
//   },
//   {
//     name: "Solomon",
//     role: "SSS 3 Graduate, 2023",
//     initials: "OS",
//     color: "#7dd3fc",
//     stars: 5,
//     text: "God's Way gave me the foundation I needed to excel in my WAEC exams. The teachers genuinely cared about our success. I finished with distinctions in 7 subjects and I'm now at university — grateful forever.",
//   },
//   {
//     name: "Engr. Taiwo Olamide",
//     role: "Parent & Community Leader",
//     initials: "MA",
//     color: "#f97316",
//     stars: 5,
//     text: "What sets God's Way apart is the combination of moral values with academic excellence. My son has grown not just intellectually but in character. This school truly lives up to its motto.",
//   },
//   {
//     name: "Mrs. Grace",
//     role: "Parent of Three Students",
//     initials: "GN",
//     color: "#0ea5e9",
//     stars: 5,
//     text: "All three of my children attend God's Way and I couldn't be prouder. The school portal keeps me updated at all times. The staff is responsive and the environment is safe and nurturing.",
//   },
// ];

// export default function LandingPage() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [activeTestimonial, setActiveTestimonial] = useState(0);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   useEffect(() => {
//     const handleScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const startInterval = () => {
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     intervalRef.current = setInterval(() => {
//       setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
//     }, 5000);
//   };

//   useEffect(() => {
//     startInterval();
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, []);

//   function goToNext() {
//     setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
//     startInterval();
//   }
//   function goToPrev() {
//     setActiveTestimonial(
//       (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length,
//     );
//     startInterval();
//   }
//   function goTo(i: number) {
//     setActiveTestimonial(i);
//     startInterval();
//   }

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
//   };

//   const itemVariants: Variants = {
//     hidden: { opacity: 0, y: 30 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.6, ease: "easeOut" },
//     },
//   };

//   return (
//     <div
//       className="min-h-screen overflow-x-hidden font-sans"
//       style={{ background: "#0a1d3b", color: "#f5f0e8" }}
//     >
//       {/* ── Navigation ─────────────────────────────────────────────── */}
//       <motion.nav
//         className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
//         style={{
//           background: scrolled ? "rgba(8,22,50,0.97)" : "transparent",
//           backdropFilter: scrolled ? "blur(20px)" : "none",
//           borderBottom: scrolled ? "1px solid rgba(14,165,233,0.15)" : "none",
//           boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
//         }}
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.7, ease: "easeOut" }}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16 lg:h-20">
//             <Link href="/" className="flex items-center gap-3 group">
//               <div
//                 className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
//                 style={{
//                   background: "rgba(255,255,255,0.12)",
//                   border: "1px solid rgba(255,255,255,0.25)",
//                 }}
//               >
//                 <img
//                   src={SCHOOL_LOGO}
//                   alt="God's Way Schools Logo"
//                   className="w-9 h-9 object-contain"
//                   onError={(e) => {
//                     e.currentTarget.style.display = "none";
//                   }}
//                 />
//               </div>
//               <div>
//                 <p
//                   className="text-sm font-bold leading-tight tracking-tight"
//                   style={{ color: "#f5f0e8" }}
//                 >
//                   God&apos;s Way
//                 </p>
//                 <p
//                   className="text-xs leading-tight"
//                   style={{ color: "#7ab8d4" }}
//                 >
//                   Model Groups of Schools
//                 </p>
//               </div>
//             </Link>

//             <div className="hidden md:flex items-center gap-6 lg:gap-8">
//               {NAV_LINKS.map((link) => (
//                 <a
//                   key={link.label}
//                   href={link.href}
//                   className="text-sm font-semibold relative group transition-colors"
//                   style={{ color: "rgba(245,240,232,0.7)" }}
//                   onMouseEnter={(e) =>
//                     (e.currentTarget.style.color = "#f5f0e8")
//                   }
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.color = "rgba(245,240,232,0.7)")
//                   }
//                 >
//                   {link.label}
//                   <span
//                     className="absolute -bottom-0.5 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 rounded-full"
//                     style={{ background: "#f97316" }}
//                   />
//                 </a>
//               ))}
//             </div>

//             <div className="hidden md:flex items-center gap-3">
//               <Link
//                 href="/sign-in"
//                 className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
//                   color: "#fff",
//                   boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
//                 }}
//               >
//                 Portal Access
//               </Link>
//             </div>

//             <button
//               className="md:hidden p-2 rounded-lg"
//               style={{ color: "#f5f0e8" }}
//               onClick={() => setMenuOpen(!menuOpen)}
//             >
//               {menuOpen ? (
//                 <X className="w-5 h-5" />
//               ) : (
//                 <Menu className="w-5 h-5" />
//               )}
//             </button>
//           </div>
//         </div>

//         <AnimatePresence>
//           {menuOpen && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               style={{
//                 background: "rgba(8,22,50,0.99)",
//                 borderTop: "1px solid rgba(14,165,233,0.15)",
//               }}
//             >
//               <div className="px-4 py-4 space-y-2">
//                 {NAV_LINKS.map((link) => (
//                   <a
//                     key={link.label}
//                     href={link.href}
//                     className="block py-3 px-3 rounded-lg font-medium"
//                     style={{ color: "rgba(245,240,232,0.75)" }}
//                     onClick={() => setMenuOpen(false)}
//                   >
//                     {link.label}
//                   </a>
//                 ))}
//                 <Link
//                   href="/sign-in"
//                   className="block py-3 px-4 rounded-xl text-white font-bold text-center mt-2"
//                   style={{
//                     background:
//                       "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
//                   }}
//                 >
//                   Portal Access
//                 </Link>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.nav>

//       {/* ── Hero ───────────────────────────────────────────────────── */}
//       <section className="relative min-h-screen flex items-center overflow-hidden">
//         {/* ── School building background image ── */}
//         <div className="absolute inset-0">
//           <img
//             src="https://res.cloudinary.com/dvgfumpoj/image/upload/v1774005298/school_ref_fuxat8.jpg"
//             alt=""
//             aria-hidden="true"
//             className="w-full h-full object-cover object-center"
//             style={{ opacity: 0.13, filter: "grayscale(30%) sepia(20%)" }}
//           />
//         </div>
//         {/* Dark overlay on top of building image */}
//         <div
//           className="absolute inset-0"
//           style={{
//             background:
//               "linear-gradient(150deg, rgba(7,20,40,0.97) 0%, rgba(10,29,59,0.93) 40%, rgba(12,35,72,0.92) 70%, rgba(10,29,59,0.97) 100%)",
//           }}
//         />
//         <div
//           className="absolute top-0 left-0 right-0 h-1"
//           style={{
//             background:
//               "linear-gradient(90deg, #f97316 0%, #0ea5e9 50%, #f97316 100%)",
//           }}
//         />
//         <div
//           className="absolute top-1/4 rounded-full pointer-events-none"
//           style={{
//             left: "-10%",
//             width: 600,
//             height: 600,
//             background:
//               "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 65%)",
//             filter: "blur(80px)",
//           }}
//         />
//         <div
//           className="absolute bottom-0 rounded-full pointer-events-none"
//           style={{
//             right: "-5%",
//             width: 500,
//             height: 500,
//             background:
//               "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 60%)",
//             filter: "blur(100px)",
//           }}
//         />
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{ opacity: 0.03 }}
//         >
//           {Array.from({ length: 20 }).map((_, i) => (
//             <div
//               key={i}
//               className="absolute left-0 right-0 h-px"
//               style={{ top: `${5 + i * 5}%`, background: "#7ab8d4" }}
//             />
//           ))}
//         </div>
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.85 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 2.5, ease: "easeOut" }}
//           >
//             <img
//               src={SCHOOL_LOGO}
//               alt=""
//               aria-hidden="true"
//               className="object-contain"
//               style={{
//                 width: "680px",
//                 height: "680px",
//                 opacity: 0.07,
//                 filter: "blur(0.5px) sepia(20%)",
//               }}
//             />
//           </motion.div>
//         </div>

//         <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-20">
//           <div className="flex flex-col items-center text-center">
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6 }}
//               className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm mb-8 font-semibold"
//               style={{
//                 border: "1px solid rgba(14,165,233,0.4)",
//                 background: "rgba(14,165,233,0.1)",
//                 color: "#7ab8d4",
//                 backdropFilter: "blur(8px)",
//               }}
//             >
//               <span
//                 style={{
//                   fontSize: 11,
//                   letterSpacing: "0.18em",
//                   fontWeight: 600,
//                   textTransform: "uppercase",
//                 }}
//               >
//                 Sowing the Seed of Merit and Excellence
//               </span>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, scale: 0.7 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
//               className="mb-9"
//             >
//               <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
//                 <div
//                   className="absolute inset-0 rounded-full blur-2xl scale-125"
//                   style={{
//                     background:
//                       "radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)",
//                   }}
//                 />
//                 <div
//                   className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
//                   style={{
//                     border: "2px solid rgba(245,240,232,0.2)",
//                     background: "rgba(255,255,255,0.07)",
//                     backdropFilter: "blur(12px)",
//                     boxShadow:
//                       "0 8px 40px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
//                   }}
//                 >
//                   <img
//                     src={SCHOOL_LOGO}
//                     alt="God's Way Model Schools Logo"
//                     className="w-[100%] h-[100%] object-contain"
//                     style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
//                   />
//                 </div>
//                 <motion.div
//                   animate={{ rotate: 360 }}
//                   transition={{
//                     duration: 18,
//                     repeat: Infinity,
//                     ease: "linear",
//                   }}
//                   className="absolute rounded-full"
//                   style={{
//                     inset: "-7px",
//                     background:
//                       "conic-gradient(from 0deg, transparent 55%, rgba(249,115,22,0.6) 70%, rgba(14,165,233,0.5) 85%, transparent 100%)",
//                   }}
//                 />
//               </div>
//             </motion.div>

//             <motion.h1
//               className="font-bold mb-3 leading-[1.05] tracking-tight"
//               style={{
//                 fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
//                 color: "#f5f0e8",
//               }}
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.2 }}
//             >
//               God&apos;s Way{" "}
//               <span
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #0ea5e9 100%)",
//                   WebkitBackgroundClip: "text",
//                   WebkitTextFillColor: "transparent",
//                   backgroundClip: "text",
//                 }}
//               >
//                 Model
//               </span>
//             </motion.h1>
//             <motion.h1
//               className="font-bold mb-6 leading-[1.05] tracking-tight"
//               style={{
//                 fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
//                 color: "rgba(245,240,232,0.85)",
//               }}
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.28 }}
//             >
//               Groups of Schools
//             </motion.h1>

//             <motion.p
//               className="text-base sm:text-lg lg:text-xl max-w-2xl mb-10 leading-relaxed"
//               style={{ color: "rgba(245,240,232,0.5)" }}
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.38 }}
//             >
//               A world-class educational institution nurturing the leaders of
//               tomorrow through academic excellence, moral values, and spiritual
//               growth.
//             </motion.p>

//             <motion.div
//               className="flex flex-col sm:flex-row items-center gap-4 mb-16"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.7, delay: 0.48 }}
//             >
//               <Link
//                 href="/sign-in"
//                 className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-1 w-full sm:w-auto justify-center"
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
//                   boxShadow: "0 6px 30px rgba(249,115,22,0.4)",
//                 }}
//               >
//                 Access Student Portal{" "}
//                 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//               </Link>
//               <a
//                 href="#about"
//                 className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center"
//                 style={{
//                   border: "1.5px solid rgba(14,165,233,0.35)",
//                   color: "#7ab8d4",
//                   background: "rgba(14,165,233,0.07)",
//                   backdropFilter: "blur(8px)",
//                 }}
//               >
//                 Discover More <ChevronRight className="w-4 h-4" />
//               </a>
//             </motion.div>

//             <motion.div
//               className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.7, delay: 0.58 }}
//             >
//               {STATS.map((stat, i) => (
//                 <motion.div
//                   key={stat.label}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.5, delay: 0.65 + i * 0.1 }}
//                   className="rounded-2xl p-4 sm:p-5 text-center"
//                   style={{
//                     border: "1px solid rgba(14,165,233,0.2)",
//                     background: "rgba(14,165,233,0.06)",
//                     backdropFilter: "blur(8px)",
//                   }}
//                 >
//                   <div
//                     className="text-2xl sm:text-3xl font-bold mb-1"
//                     style={{ color: "#f97316" }}
//                   >
//                     {stat.value}
//                   </div>
//                   <div
//                     className="text-xs leading-snug"
//                     style={{ color: "rgba(245,240,232,0.45)" }}
//                   >
//                     {stat.label}
//                   </div>
//                 </motion.div>
//               ))}
//             </motion.div>
//           </div>
//         </div>
//         <div
//           className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
//           style={{
//             background: "linear-gradient(to top, #0a1d3b, transparent)",
//           }}
//         />
//       </section>

//       {/* ── About ──────────────────────────────────────────────────── */}
//       <section
//         id="about"
//         className="py-24 px-4 relative"
//         style={{ background: "#0a1d3b" }}
//       >
//         <div
//           className="absolute top-0 left-0 right-0 h-px"
//           style={{
//             background:
//               "linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)",
//           }}
//         />
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, margin: "-100px" }}
//             className="grid lg:grid-cols-2 gap-16 items-center"
//           >
//             <motion.div variants={itemVariants}>
//               <span
//                 className="text-sm font-bold tracking-widest uppercase mb-4 block"
//                 style={{ color: "#f97316" }}
//               >
//                 About Us
//               </span>
//               <h2
//                 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight"
//                 style={{ color: "#f5f0e8" }}
//               >
//                 Building Tomorrow&apos;s{" "}
//                 <span style={{ color: "#0ea5e9" }}>Leaders</span> Today
//               </h2>
//               <p
//                 className="text-lg leading-relaxed mb-6"
//                 style={{ color: "rgba(245,240,232,0.6)" }}
//               >
//                 God&apos;s Way Model Groups of Schools has been a beacon of
//                 educational excellence, providing a holistic education that
//                 develops the mind, character, and spirit of every student.
//               </p>
//               <p
//                 className="leading-relaxed mb-8"
//                 style={{ color: "rgba(245,240,232,0.38)" }}
//               >
//                 From Primary to Senior Secondary, our students benefit from
//                 experienced educators, modern facilities, and a proven
//                 curriculum that prepares them for national examinations and
//                 beyond.
//               </p>
//               <div className="space-y-3">
//                 {[
//                   "Qualified and dedicated teaching staff",
//                   "Individual student performance tracking",
//                   "Modern digital management system",
//                   "Strong parent-school communication",
//                 ].map((point) => (
//                   <div key={point} className="flex items-center gap-3">
//                     <CheckCircle
//                       className="w-5 h-5 flex-shrink-0"
//                       style={{ color: "#f97316" }}
//                     />
//                     <span style={{ color: "rgba(245,240,232,0.65)" }}>
//                       {point}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//             <motion.div variants={itemVariants} className="relative">
//               <div className="grid grid-cols-2 gap-4">
//                 {[
//                   {
//                     icon: BookOpen,
//                     title: "Academics",
//                     desc: "Rigorous curriculum from Primary to SSS",
//                   },
//                   {
//                     icon: Award,
//                     title: "Awards",
//                     desc: "Consistent top performers in WAEC & NECO",
//                   },
//                   {
//                     icon: Users,
//                     title: "Community",
//                     desc: "A family of students, staff & parents",
//                   },
//                   {
//                     icon: Star,
//                     title: "Values",
//                     desc: "Faith, integrity and moral excellence",
//                   },
//                 ].map((item) => (
//                   <div
//                     key={item.title}
//                     className="rounded-2xl p-5 transition-all group cursor-default"
//                     style={{
//                       background: "rgba(14,165,233,0.06)",
//                       border: "1px solid rgba(14,165,233,0.18)",
//                     }}
//                     onMouseEnter={(e) => {
//                       (e.currentTarget as HTMLElement).style.border =
//                         "1px solid rgba(249,115,22,0.4)";
//                       (e.currentTarget as HTMLElement).style.background =
//                         "rgba(249,115,22,0.07)";
//                     }}
//                     onMouseLeave={(e) => {
//                       (e.currentTarget as HTMLElement).style.border =
//                         "1px solid rgba(14,165,233,0.18)";
//                       (e.currentTarget as HTMLElement).style.background =
//                         "rgba(14,165,233,0.06)";
//                     }}
//                   >
//                     <div
//                       className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
//                       style={{
//                         background: "rgba(14,165,233,0.15)",
//                         border: "1px solid rgba(14,165,233,0.25)",
//                       }}
//                     >
//                       <item.icon
//                         className="w-5 h-5"
//                         style={{ color: "#0ea5e9" }}
//                       />
//                     </div>
//                     <h4 className="font-bold mb-1" style={{ color: "#f5f0e8" }}>
//                       {item.title}
//                     </h4>
//                     <p
//                       className="text-sm"
//                       style={{ color: "rgba(245,240,232,0.40)" }}
//                     >
//                       {item.desc}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── Features ───────────────────────────────────────────────── */}
//       <section
//         id="features"
//         className="py-24 px-4 relative"
//         style={{
//           background:
//             "linear-gradient(180deg, #0a1d3b 0%, #091829 50%, #0a1d3b 100%)",
//         }}
//       >
//         <div
//           className="absolute top-0 left-0 right-0 h-px"
//           style={{
//             background:
//               "linear-gradient(90deg, transparent, rgba(245,240,232,0.08), transparent)",
//           }}
//         />
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//             className="text-center mb-16"
//           >
//             <span
//               className="text-sm font-bold tracking-widest uppercase mb-4 block"
//               style={{ color: "#f97316" }}
//             >
//               Platform Features
//             </span>
//             <h2
//               className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
//               style={{ color: "#f5f0e8" }}
//             >
//               Everything You Need, In One Place
//             </h2>
//             <p
//               className="text-lg max-w-2xl mx-auto"
//               style={{ color: "rgba(245,240,232,0.45)" }}
//             >
//               Our enterprise school management platform empowers administrators,
//               teachers, and parents with powerful tools designed for modern
//               education.
//             </p>
//           </motion.div>

//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true, margin: "-50px" }}
//             className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
//           >
//             {FEATURES.map((feature) => (
//               <motion.div
//                 key={feature.title}
//                 variants={itemVariants}
//                 className="group relative rounded-2xl p-6 transition-all duration-300 overflow-hidden cursor-default"
//                 style={{
//                   background: "rgba(255,255,255,0.03)",
//                   border: "1px solid rgba(14,165,233,0.15)",
//                 }}
//                 onMouseEnter={(e) => {
//                   (e.currentTarget as HTMLElement).style.border =
//                     "1px solid rgba(14,165,233,0.45)";
//                   (e.currentTarget as HTMLElement).style.background =
//                     "rgba(14,165,233,0.07)";
//                 }}
//                 onMouseLeave={(e) => {
//                   (e.currentTarget as HTMLElement).style.border =
//                     "1px solid rgba(14,165,233,0.15)";
//                   (e.currentTarget as HTMLElement).style.background =
//                     "rgba(255,255,255,0.03)";
//                 }}
//               >
//                 <div
//                   className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
//                   style={{
//                     background:
//                       "linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0.08) 100%)",
//                     border: "1px solid rgba(14,165,233,0.3)",
//                   }}
//                 >
//                   <feature.icon
//                     className="w-6 h-6"
//                     style={{ color: "#0ea5e9" }}
//                   />
//                 </div>
//                 <h3
//                   className="text-lg font-bold mb-2"
//                   style={{ color: "#f5f0e8" }}
//                 >
//                   {feature.title}
//                 </h3>
//                 <p
//                   className="text-sm leading-relaxed"
//                   style={{ color: "rgba(245,240,232,0.45)" }}
//                 >
//                   {feature.description}
//                 </p>
//                 <div
//                   className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
//                   style={{
//                     background:
//                       "linear-gradient(90deg, transparent, #f97316, transparent)",
//                   }}
//                 />
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* ── Programs ───────────────────────────────────────────────── */}
//       <section
//         id="programs"
//         className="py-24 px-4 relative"
//         style={{ background: "#0a1d3b" }}
//       >
//         <div
//           className="absolute top-0 left-0 right-0 h-px"
//           style={{
//             background:
//               "linear-gradient(90deg, transparent, rgba(14,165,233,0.2), transparent)",
//           }}
//         />
//         <div className="max-w-6xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="text-center mb-16"
//           >
//             <span
//               className="text-sm font-bold tracking-widest uppercase mb-4 block"
//               style={{ color: "#f97316" }}
//             >
//               Academic Programs
//             </span>
//             <h2
//               className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
//               style={{ color: "#f5f0e8" }}
//             >
//               From Nursery to Senior Secondary
//             </h2>
//             <p
//               className="text-lg max-w-xl mx-auto"
//               style={{ color: "rgba(245,240,232,0.45)" }}
//             >
//               Three levels of excellence, each designed to meet students exactly
//               where they are.
//             </p>
//           </motion.div>

//           <div className="grid md:grid-cols-3 gap-5">
//             {PROGRAMS.map((program, i) => (
//               <motion.div
//                 key={program.level}
//                 initial={{ opacity: 0, y: 40 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ duration: 0.6, delay: i * 0.12 }}
//                 className="relative group rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300"
//                 style={{ border: `1px solid ${program.accent}30` }}
//                 onMouseEnter={(e) => {
//                   (e.currentTarget as HTMLElement).style.border =
//                     `1px solid ${program.accent}65`;
//                 }}
//                 onMouseLeave={(e) => {
//                   (e.currentTarget as HTMLElement).style.border =
//                     `1px solid ${program.accent}30`;
//                 }}
//               >
//                 {/* ── Image ── */}
//                 <div className="relative h-52 overflow-hidden">
//                   <img
//                     src={program.image}
//                     alt={program.imageAlt}
//                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
//                     loading="lazy"
//                   />
//                   {/* Gradient overlay — dark at bottom so text is readable */}
//                   <div
//                     className="absolute inset-0"
//                     style={{
//                       background:
//                         "linear-gradient(to bottom, rgba(7,20,40,0.2) 0%, rgba(7,20,40,0.9) 100%)",
//                     }}
//                   />

//                   {/* Top accent line */}
//                   <div
//                     className="absolute top-0 left-0 right-0 h-1"
//                     style={{
//                       background: `linear-gradient(90deg, transparent, ${program.accent}, transparent)`,
//                       opacity: 0.9,
//                     }}
//                   />

//                   {/* Icon + level name overlaid on image */}
//                   <div className="absolute bottom-4 left-5 flex items-center gap-2.5">
//                     <span className="text-3xl drop-shadow-lg">
//                       {program.icon}
//                     </span>
//                     <h3
//                       className="text-lg font-bold drop-shadow-lg"
//                       style={{ color: "#f5f0e8" }}
//                     >
//                       {program.level}
//                     </h3>
//                   </div>

//                   {/* Student count badge top-right */}
//                   <div
//                     className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold"
//                     style={{
//                       background: `${program.accent}25`,
//                       border: `1px solid ${program.accent}50`,
//                       color: program.accent,
//                       backdropFilter: "blur(8px)",
//                     }}
//                   >
//                     {program.classes.length} Classes
//                   </div>
//                 </div>

//                 {/* ── Content ── */}
//                 <div
//                   className="p-6"
//                   style={{ background: "rgba(7,20,40,0.97)" }}
//                 >
//                   <p
//                     className="text-sm mb-5 leading-relaxed"
//                     style={{ color: "rgba(245,240,232,0.55)" }}
//                   >
//                     {program.description}
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {program.classes.map((cls) => (
//                       <span
//                         key={cls}
//                         className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
//                         style={{
//                           background: `${program.accent}15`,
//                           border: `1px solid ${program.accent}35`,
//                           color: program.accent,
//                         }}
//                       >
//                         {cls}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── Testimonials ───────────────────────────────────────────── */}
//       <section
//         id="testimonials"
//         className="py-24 px-4 relative overflow-hidden"
//         style={{
//           background:
//             "linear-gradient(180deg, #0a1d3b 0%, #091829 60%, #0a1d3b 100%)",
//         }}
//       >
//         <div
//           className="absolute top-0 left-0 right-0 h-px"
//           style={{
//             background:
//               "linear-gradient(90deg, transparent, rgba(249,115,22,0.35), transparent)",
//           }}
//         />
//         <div
//           className="absolute pointer-events-none rounded-full"
//           style={{
//             top: "15%",
//             left: "-8%",
//             width: 500,
//             height: 500,
//             background:
//               "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 65%)",
//             filter: "blur(70px)",
//           }}
//         />
//         <div
//           className="absolute pointer-events-none rounded-full"
//           style={{
//             bottom: "10%",
//             right: "-8%",
//             width: 500,
//             height: 500,
//             background:
//               "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)",
//             filter: "blur(70px)",
//           }}
//         />

//         <div className="max-w-5xl mx-auto relative">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="text-center mb-14"
//           >
//             <span
//               className="text-sm font-bold tracking-widest uppercase mb-4 block"
//               style={{ color: "#f97316" }}
//             >
//               Testimonials
//             </span>
//             <h2
//               className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
//               style={{ color: "#f5f0e8" }}
//             >
//               Voices of Our <span style={{ color: "#0ea5e9" }}>Community</span>
//             </h2>
//             <p
//               className="text-lg max-w-xl mx-auto"
//               style={{ color: "rgba(245,240,232,0.45)" }}
//             >
//               Hear from parents, students, and alumni who have experienced the
//               God&apos;s Way difference firsthand.
//             </p>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//           >
//             <div
//               className="relative rounded-3xl overflow-hidden mb-6"
//               style={{
//                 background: "rgba(255,255,255,0.03)",
//                 border: "1px solid rgba(14,165,233,0.18)",
//               }}
//             >
//               <div
//                 className="absolute top-0 left-0 right-0 h-0.5"
//                 style={{ background: "rgba(255,255,255,0.06)", zIndex: 10 }}
//               >
//                 <motion.div
//                   key={`progress-${activeTestimonial}`}
//                   initial={{ width: "0%" }}
//                   animate={{ width: "100%" }}
//                   transition={{ duration: 5, ease: "linear" }}
//                   style={{
//                     height: "100%",
//                     background: "linear-gradient(90deg, #f97316, #0ea5e9)",
//                   }}
//                 />
//               </div>

//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={activeTestimonial}
//                   initial={{ opacity: 0, x: 50 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   exit={{ opacity: 0, x: -50 }}
//                   transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
//                   className="p-8 sm:p-10 lg:p-12"
//                 >
//                   <div className="flex flex-col sm:flex-row gap-8 items-start">
//                     <div className="flex-1">
//                       <div
//                         className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
//                         style={{
//                           background: "rgba(249,115,22,0.12)",
//                           border: "1px solid rgba(249,115,22,0.3)",
//                         }}
//                       >
//                         <Quote
//                           className="w-5 h-5"
//                           style={{ color: "#f97316" }}
//                         />
//                       </div>
//                       <div className="flex gap-1 mb-5">
//                         {Array.from({
//                           length: TESTIMONIALS[activeTestimonial].stars,
//                         }).map((_, i) => (
//                           <Star
//                             key={i}
//                             className="w-4 h-4 fill-current"
//                             style={{ color: "#f97316" }}
//                           />
//                         ))}
//                       </div>
//                       <p
//                         className="text-lg sm:text-xl leading-relaxed mb-8"
//                         style={{
//                           color: "rgba(245,240,232,0.85)",
//                           fontStyle: "italic",
//                         }}
//                       >
//                         &ldquo;{TESTIMONIALS[activeTestimonial].text}&rdquo;
//                       </p>
//                       <div className="flex items-center gap-4">
//                         <div
//                           className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
//                           style={{
//                             background: `linear-gradient(135deg, ${TESTIMONIALS[activeTestimonial].color} 0%, ${TESTIMONIALS[activeTestimonial].color}88 100%)`,
//                             boxShadow: `0 4px 16px ${TESTIMONIALS[activeTestimonial].color}40`,
//                           }}
//                         >
//                           {TESTIMONIALS[activeTestimonial].initials}
//                         </div>
//                         <div>
//                           <p
//                             className="font-bold text-sm"
//                             style={{ color: "#f5f0e8" }}
//                           >
//                             {TESTIMONIALS[activeTestimonial].name}
//                           </p>
//                           <p
//                             className="text-xs mt-0.5"
//                             style={{ color: "rgba(245,240,232,0.45)" }}
//                           >
//                             {TESTIMONIALS[activeTestimonial].role}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="hidden sm:flex flex-col items-center justify-center gap-2 self-center">
//                       <div
//                         className="w-16 h-16 rounded-2xl flex items-center justify-center"
//                         style={{
//                           background: "rgba(14,165,233,0.06)",
//                           border: "1px solid rgba(14,165,233,0.15)",
//                         }}
//                       >
//                         <span
//                           className="font-bold text-2xl"
//                           style={{ color: "rgba(14,165,233,0.4)" }}
//                         >
//                           {String(activeTestimonial + 1).padStart(2, "0")}
//                         </span>
//                       </div>
//                       <span
//                         className="text-xs"
//                         style={{ color: "rgba(245,240,232,0.2)" }}
//                       >
//                         of {String(TESTIMONIALS.length).padStart(2, "0")}
//                       </span>
//                     </div>
//                   </div>
//                 </motion.div>
//               </AnimatePresence>
//             </div>

//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-2">
//                 {TESTIMONIALS.map((_, i) => (
//                   <button
//                     key={i}
//                     onClick={() => goTo(i)}
//                     style={{
//                       width: i === activeTestimonial ? 28 : 8,
//                       height: 8,
//                       borderRadius: 4,
//                       border: "none",
//                       cursor: "pointer",
//                       transition: "all 0.3s ease",
//                       background:
//                         i === activeTestimonial
//                           ? "linear-gradient(90deg, #f97316, #0ea5e9)"
//                           : "rgba(245,240,232,0.15)",
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={goToPrev}
//                   className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
//                   style={{
//                     background: "rgba(14,165,233,0.08)",
//                     border: "1px solid rgba(14,165,233,0.2)",
//                     color: "#7ab8d4",
//                   }}
//                   onMouseEnter={(e) => {
//                     (e.currentTarget as HTMLElement).style.background =
//                       "rgba(14,165,233,0.18)";
//                     (e.currentTarget as HTMLElement).style.transform =
//                       "translateX(-2px)";
//                   }}
//                   onMouseLeave={(e) => {
//                     (e.currentTarget as HTMLElement).style.background =
//                       "rgba(14,165,233,0.08)";
//                     (e.currentTarget as HTMLElement).style.transform =
//                       "translateX(0)";
//                   }}
//                 >
//                   <ChevronLeft className="w-4 h-4" />
//                 </button>
//                 <button
//                   onClick={goToNext}
//                   className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
//                   style={{
//                     background: "rgba(249,115,22,0.12)",
//                     border: "1px solid rgba(249,115,22,0.3)",
//                     color: "#f97316",
//                   }}
//                   onMouseEnter={(e) => {
//                     (e.currentTarget as HTMLElement).style.background =
//                       "rgba(249,115,22,0.22)";
//                     (e.currentTarget as HTMLElement).style.transform =
//                       "translateX(2px)";
//                   }}
//                   onMouseLeave={(e) => {
//                     (e.currentTarget as HTMLElement).style.background =
//                       "rgba(249,115,22,0.12)";
//                     (e.currentTarget as HTMLElement).style.transform =
//                       "translateX(0)";
//                   }}
//                 >
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── CTA ────────────────────────────────────────────────────── */}
//       <section
//         className="py-24 px-4 relative overflow-hidden"
//         style={{
//           background:
//             "linear-gradient(135deg, #0c2348 0%, #0a1d3b 50%, #0d1f40 100%)",
//         }}
//       >
//         <div
//           className="absolute top-0 left-0 right-0 h-1"
//           style={{
//             background: "linear-gradient(90deg, #f97316, #0ea5e9, #f97316)",
//           }}
//         />
//         <div
//           className="absolute bottom-0 right-0 rounded-full pointer-events-none"
//           style={{
//             width: 400,
//             height: 400,
//             background:
//               "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)",
//             filter: "blur(60px)",
//             transform: "translate(5%, 0)",
//           }}
//         />
//         <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none">
//           <img
//             src={SCHOOL_LOGO}
//             alt=""
//             aria-hidden="true"
//             className="object-contain grayscale"
//             style={{
//               width: "360px",
//               height: "360px",
//               opacity: 0.05,
//               marginRight: "-40px",
//             }}
//           />
//         </div>
//         <div className="relative max-w-3xl mx-auto text-center">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             whileInView={{ opacity: 1, scale: 1 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//           >
//             <div
//               className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 overflow-hidden"
//               style={{
//                 background: "rgba(255,255,255,0.08)",
//                 border: "1px solid rgba(255,255,255,0.18)",
//               }}
//             >
//               <img
//                 src={SCHOOL_LOGO}
//                 alt="School Logo"
//                 className="w-36 h-36 object-contain"
//               />
//             </div>
//             <h2
//               className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
//               style={{ color: "#f5f0e8" }}
//             >
//               Ready to Get Started?
//             </h2>
//             <p
//               className="text-lg mb-10 max-w-xl mx-auto"
//               style={{ color: "rgba(245,240,232,0.50)" }}
//             >
//               Access the school management portal to view results, manage
//               classes, and stay connected with your child&apos;s academic
//               progress.
//             </p>
//             <Link
//               href="/sign-in"
//               className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:-translate-y-0.5"
//               style={{
//                 background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
//                 boxShadow: "0 8px 40px rgba(249,115,22,0.4)",
//               }}
//               onMouseEnter={(e) =>
//                 (e.currentTarget.style.boxShadow =
//                   "0 12px 50px rgba(249,115,22,0.55)")
//               }
//               onMouseLeave={(e) =>
//                 (e.currentTarget.style.boxShadow =
//                   "0 8px 40px rgba(249,115,22,0.4)")
//               }
//             >
//               Sign In to Portal <ArrowRight className="w-5 h-5" />
//             </Link>
//           </motion.div>
//         </div>
//       </section>

//       {/* ── Contact ────────────────────────────────────────────────── */}
//       <section
//         id="contact"
//         className="py-24 px-4 relative"
//         style={{ background: "#0a1d3b" }}
//       >
//         <div
//           className="absolute top-0 left-0 right-0 h-px"
//           style={{
//             background:
//               "linear-gradient(90deg, transparent, rgba(14,165,233,0.3), transparent)",
//           }}
//         />
//         <div className="max-w-5xl mx-auto">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="text-center mb-12"
//           >
//             <h2
//               className="text-3xl font-bold mb-2"
//               style={{ color: "#f5f0e8" }}
//             >
//               Get In Touch
//             </h2>
//             <p style={{ color: "rgba(245,240,232,0.4)" }}>
//               We&apos;d love to hear from you
//             </p>
//           </motion.div>

//           <div className="grid md:grid-cols-3 gap-4">
//             {[
//               {
//                 icon: Phone,
//                 label: "Phone",
//                 value: "08069825847, 08067110930",
//                 href: "tel:+2348069825847",
//               },
//               {
//                 icon: Mail,
//                 label: "Email",
//                 value: "godswaygroupofschools@gmail.com",
//                 href: "mailto:godswaygroupofschools@gmail.com",
//               },
//               {
//                 icon: MapPin,
//                 label: "Address",
//                 value: "No 12 Siyanbola Street, Osogbo, Osun-State",
//                 href: "#",
//               },
//             ].map((contact) => (
//               <motion.a
//                 key={contact.label}
//                 href={contact.href}
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 className="group flex flex-col items-center text-center p-6 rounded-2xl transition-all"
//                 style={{
//                   background: "rgba(14,165,233,0.05)",
//                   border: "1px solid rgba(14,165,233,0.2)",
//                 }}
//                 onMouseEnter={(e) => {
//                   (e.currentTarget as HTMLElement).style.border =
//                     "1px solid rgba(249,115,22,0.4)";
//                   (e.currentTarget as HTMLElement).style.background =
//                     "rgba(249,115,22,0.06)";
//                 }}
//                 onMouseLeave={(e) => {
//                   (e.currentTarget as HTMLElement).style.border =
//                     "1px solid rgba(14,165,233,0.2)";
//                   (e.currentTarget as HTMLElement).style.background =
//                     "rgba(14,165,233,0.05)";
//                 }}
//               >
//                 <div
//                   className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
//                   style={{
//                     background: "rgba(14,165,233,0.12)",
//                     border: "1px solid rgba(14,165,233,0.25)",
//                   }}
//                 >
//                   <contact.icon
//                     className="w-5 h-5"
//                     style={{ color: "#0ea5e9" }}
//                   />
//                 </div>
//                 <div
//                   className="text-sm mb-1 font-medium"
//                   style={{ color: "rgba(245,240,232,0.35)" }}
//                 >
//                   {contact.label}
//                 </div>
//                 <div
//                   className="text-sm font-semibold"
//                   style={{ color: "#f5f0e8" }}
//                 >
//                   {contact.value}
//                 </div>
//               </motion.a>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── Footer ─────────────────────────────────────────────────── */}
//       <footer
//         className="py-10 px-4"
//         style={{
//           borderTop: "1px solid rgba(14,165,233,0.15)",
//           background: "#071428",
//         }}
//       >
//         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div
//               className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
//               style={{
//                 background: "rgba(255,255,255,0.08)",
//                 border: "1px solid rgba(255,255,255,0.15)",
//               }}
//             >
//               <img
//                 src={SCHOOL_LOGO}
//                 alt="Logo"
//                 className="w-20 h-20 object-contain"
//               />
//             </div>
//             <span
//               className="text-sm font-medium"
//               style={{ color: "rgba(245,240,232,0.45)" }}
//             >
//               God&apos;s Way Model Groups of Schools
//             </span>
//           </div>
//           <div className="hidden md:flex items-center gap-1">
//             <div
//               className="w-3 h-3 rounded-full"
//               style={{ background: "#0ea5e9" }}
//             />
//             <div
//               className="w-3 h-3 rounded-full"
//               style={{ background: "#f97316" }}
//             />
//             <div
//               className="w-3 h-3 rounded-full"
//               style={{ background: "#f5f0e8" }}
//             />
//           </div>
//           <p className="text-sm" style={{ color: "rgba(245,240,232,0.25)" }}>
//             &copy; {new Date().getFullYear()} All rights reserved. Merit &amp;
//             Excellence
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }
