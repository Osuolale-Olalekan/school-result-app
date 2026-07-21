import Link from "next/link";
import { FlaskConical, Palette, Trophy, Brain, ArrowRight, LucideIcon } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import { PROGRAMS, CURRICULUM } from "@/lib/site-data";

const ICONS: Record<string, LucideIcon> = { FlaskConical, Palette, Trophy, Brain };

export default function AcademicsView() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1400&q=80"
        alt="Students in library"
        breadcrumb="Academics"
        title="Academics"
      />

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
              Academic Programs
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">From Nursery to Senior Secondary</h2>
            <p className="text-gray-500">
              Three levels of excellence, each designed to meet students where they are and carry them further.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {PROGRAMS.map((p) => (
              <div
                key={p.level}
                className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={p.img} alt={p.alt} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-900/80" />
                  <span className="absolute top-3 right-3 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {p.badge}
                  </span>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-2xl">{p.icon}</span>
                    <h3 className="text-white font-extrabold text-base">{p.level}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-gray-900 text-center mb-6">Our Curriculum Highlights</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CURRICULUM.map((c) => {
                const Icon = ICONS[c.icon];
                return (
                  <div key={c.title} className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl p-5 transition-all">
                    <Icon className="w-6 h-6 text-blue-600 mb-3" />
                    <h4 className="font-extrabold text-gray-900 text-sm mb-1.5">{c.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-14">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-all"
            >
              Apply for a Class <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
