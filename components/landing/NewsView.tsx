"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import { NEWS_ITEMS, NEWS_TABS } from "@/lib/site-data";

export default function NewsView() {
  const [activeTab, setActiveTab] = useState("All");
  const filtered = activeTab === "All" ? NEWS_ITEMS : NEWS_ITEMS.filter((n) => n.tag === activeTab);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80"
        alt="Events"
        breadcrumb="News & Events"
        title="News & Events"
      />

      <section className="bg-blue-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3">
                📰 Latest Updates
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">News &amp; Events</h2>
            </div>
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-blue-100 self-start sm:self-auto">
              {NEWS_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === t ? "bg-blue-800 text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((n) => (
              <div
                key={n.title}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={n.img} alt={n.alt} className="w-full h-full object-cover transition-transform duration-400 hover:scale-105" loading="lazy" />
                  <span className={`absolute top-2.5 left-2.5 ${n.tagColor} text-white text-[11px] font-bold px-2.5 py-1 rounded-full`}>
                    {n.tag}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-gray-400 text-[11px] mb-1.5">📅 {n.date}</p>
                  <h4 className="font-extrabold text-gray-900 text-sm mb-1.5 leading-snug">{n.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed mb-3">{n.desc}</p>
                  <a href="#" className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No {activeTab.toLowerCase()} items yet — check back soon.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
