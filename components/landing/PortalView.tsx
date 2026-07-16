import Link from "next/link";
import { FileText, TrendingUp, Users, Bell, Shield, ArrowRight, LucideIcon } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import { PORTAL_FEATURES } from "@/lib/site-data";

const ICONS: Record<string, LucideIcon> = { FileText, TrendingUp, Users, Bell, Shield };

export default function PortalView() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1400&q=80"
        alt="Technology"
        breadcrumb="Student Portal"
        title="Student Portal"
      />

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
              🖥️ Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Everything You Need, In One Place</h2>
            <p className="text-gray-500">
              Our school management platform empowers administrators, teachers, and parents with powerful digital
              tools.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-3">
              {PORTAL_FEATURES.map((f) => {
                const Icon = ICONS[f.icon];
                return (
                  <div key={f.title} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm mb-1">{f.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all mt-2"
              >
                Sign In to Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <div className="bg-blue-50 rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
                <div className="bg-blue-800 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-white/60 text-[11px] font-medium ml-auto">God&apos;s Way Student Portal</span>
                </div>
                <div className="p-5">
                  <p className="font-extrabold text-gray-900 text-sm mb-0.5">Welcome Back! 👋</p>
                  <p className="text-gray-400 text-xs mb-4">View your assignments, results, and updates all in one place.</p>
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      { v: "87%", l: "Average Score" },
                      { v: "12", l: "Assignments" },
                      { v: "3rd", l: "Class Position" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white rounded-xl p-3 text-center shadow-sm">
                        <div className="text-blue-600 font-black text-lg">{s.v}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { i: "📝", l: "Assignments" },
                      { i: "📅", l: "Timetable" },
                      { i: "📚", l: "Resources" },
                      { i: "✉️", l: "Messages" },
                    ].map((a) => (
                      <div key={a.l} className="bg-white rounded-xl p-2.5 text-center shadow-sm">
                        <div className="text-lg mb-1">{a.i}</div>
                        <p className="text-[10px] text-gray-600 font-semibold leading-tight">{a.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3">
                    <p className="text-orange-600 text-[11px] font-bold">📢 Notice</p>
                    <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">
                      End of term report cards are ready. Check your inbox for the download link.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                Need help?{" "}
                <Link href="/contact" className="text-blue-600 font-semibold hover:underline">
                  Contact School Admin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
