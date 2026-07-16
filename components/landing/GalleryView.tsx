"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import { GALLERY_IMGS, GALLERY_TABS } from "@/lib/site-data";

export default function GalleryView() {
  const [activeTab, setActiveTab] = useState("All");
  const filtered = activeTab === "All" ? GALLERY_IMGS : GALLERY_IMGS.filter((g) => g.cat === activeTab);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80"
        alt="Gallery"
        breadcrumb="Gallery"
        title="Gallery"
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3">
                📸 School Life
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Life at God&apos;s Way</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
              {GALLERY_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    activeTab === t ? "bg-blue-800 text-white border-blue-800" : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((g, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer">
                <img src={g.src} alt={g.alt} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-blue-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-2xl">🔍</span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No photos in this category yet.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
