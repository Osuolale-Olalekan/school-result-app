import Link from "next/link";
import { CheckCircle, Target, Eye, Shield, Heart, Star, Handshake, Lightbulb, LucideIcon } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import { CORE_VALUES } from "@/lib/site-data";

const ICONS: Record<string, LucideIcon> = { Shield, Heart, Star, Handshake, Lightbulb };

export default function AboutView() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80"
        alt="School building"
        breadcrumb="About School"
        title="About School"
      />

      {/* ABOUT */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=80"
                  alt="Students studying"
                  className="w-full h-72 sm:h-80 lg:h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -right-4 w-44 rounded-xl overflow-hidden border-4 border-white shadow-xl hidden sm:block">
                <img
                  src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=300&q=80"
                  alt="Happy students"
                  className="w-full h-28 object-cover"
                />
              </div>
              <div className="absolute -top-5 -left-4 bg-orange-500 text-white rounded-xl px-4 py-3 shadow-xl hidden sm:block">
                <div className="text-2xl font-black leading-none">15+</div>
                <div className="text-[11px] font-semibold mt-0.5 opacity-90">
                  Years of
                  <br />
                  Excellence
                </div>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                📖 About Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
                Building Tomorrow&apos;s <span className="text-blue-600">Leaders</span> Today
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                God&apos;s Way Model Schools has been a beacon of educational excellence, providing a
                holistic education that develops the mind, character, and spirit of every student — from Nursery
                through Senior Secondary.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  {
                    icon: Target,
                    label: "Our Mission",
                    text: "To provide a transformative education that empowers students to excel academically, think critically and contribute positively to society.",
                  },
                  {
                    icon: Eye,
                    label: "Our Vision",
                    text: "To be a leading school recognized for excellence in education, innovation and character building across Nigeria and beyond.",
                  },
                ].map((mv) => (
                  <div key={mv.label} className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                    <h4 className="text-blue-800 text-xs font-extrabold mb-2 flex items-center gap-1.5">
                      <mv.icon className="w-3.5 h-3.5" /> {mv.label}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed">{mv.text}</p>
                  </div>
                ))}
              </div>

              <ul className="space-y-2.5 mb-7">
                {[
                  "Qualified and dedicated teaching staff",
                  "Individual student performance tracking",
                  "Modern digital management system",
                  "Strong parent–school communication",
                  "Safe, nurturing and inclusive environment",
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/academics"
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all"
                >
                  Explore Academics
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="bg-blue-50 py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=700&q=80"
                alt="Students in lab"
                className="w-full h-72 sm:h-80 lg:h-[420px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                📜 Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
                A Legacy of Excellence Since Our Founding
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Founded with a vision to raise leaders, God&apos;s Way has grown from a small seed into a thriving
                institution serving over 2,000 students. Our commitment to blending innovative teaching with strong
                values has shaped thousands of lives.
              </p>
              <p className="text-gray-500 leading-relaxed mb-6">
                From humble beginnings, we built a reputation for producing top WAEC and NECO results, cultivating
                graduates who go on to lead in universities, business, and public service across Nigeria and beyond.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { n: "Est.", txt: "Founded with a vision to raise leaders of merit and excellence" },
                  { n: "1st", txt: "Introduced digital report cards in our region" },
                  { n: "98%", txt: "Consistent WAEC & NECO pass rate every year" },
                  { n: "20+", txt: "Awards for academic and co-curricular excellence" },
                ].map((m) => (
                  <div key={m.n} className="bg-white rounded-xl p-3.5 flex items-start gap-3">
                    <span className="text-blue-600 font-black text-lg shrink-0">{m.n}</span>
                    <p className="text-gray-600 text-xs leading-snug">{m.txt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="bg-blue-900 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
              💡 Our Values
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Core Values We Live By</h2>
            <p className="text-white/60">
              Every decision, every lesson, every relationship at God&apos;s Way is guided by these principles.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CORE_VALUES.map((v) => {
              const Icon = ICONS[v.icon];
              return (
                <div
                  key={v.label}
                  className="bg-white/8 border border-white/12 rounded-2xl p-5 text-center hover:bg-white/14 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-white font-extrabold text-sm mb-1.5">{v.label}</h3>
                  <p className="text-white/55 text-[11px] leading-snug">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
