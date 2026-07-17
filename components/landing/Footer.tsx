"use client"

import Link from "next/link";
import { SCHOOL } from "@/lib/site-data";

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/8 border border-white/12 rounded-lg flex items-center justify-center">
                <img
                  src={SCHOOL.logo}
                  alt="Logo"
                  className="w-36 h-36 object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
              <div>
                <p className="text-white font-extrabold text-sm leading-tight">{SCHOOL.name}</p>
                {/* <p className="text-white/40 text-[11px]">Model Schools</p> */}
              </div>
            </div>
            <p className="text-white/45 text-xs leading-relaxed mb-4">
              Empowering students to achieve their highest potential through merit, excellence, and strong moral
              values.
            </p>
            {/* <div className="flex gap-2">
              {["f", "𝕏", "📸", "▶", "in"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 bg-white/8 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                >
                  {s}
                </a>
              ))}
            </div> */}
          </div>

          <div>
            <h4 className="text-white font-extrabold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                ["About School", "/about"],
                ["Academics", "/academics"],
                ["Admissions", "/admissions"],
                ["Student Portal", "/portal"],
                // ["News & Events", "/news"],
                ["Gallery", "/gallery"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link href={h} className="text-white/45 hover:text-orange-400 text-xs transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* <div>
            <h4 className="text-white font-extrabold text-sm mb-4">Academics</h4>
            <ul className="space-y-2.5">
              {["Primary School", "Junior Secondary", "Senior Secondary", "Science Department", "Arts Department", "Commercial"].map(
                (l) => (
                  <li key={l}>
                    <Link href="/academics" className="text-white/45 hover:text-orange-400 text-xs transition-colors">
                      {l}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div> */}

          <div>
            <h4 className="text-white font-extrabold text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li>
                <a href={`tel:+${SCHOOL.phone1}`} className="text-white/45 hover:text-orange-400 text-xs transition-colors">
                  {SCHOOL.phone1}
                </a>
              </li>
              <li>
                <a href={`tel:+${SCHOOL.phone2}`} className="text-white/45 hover:text-orange-400 text-xs transition-colors">
                  {SCHOOL.phone2}
                </a>
              </li>
              <li>
                <a href={`mailto:${SCHOOL.email}`} className="text-white/45 hover:text-orange-400 text-xs transition-colors">
                  {SCHOOL.email}
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-white/45 hover:text-orange-400 text-xs transition-colors">
                  {SCHOOL.address}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} {SCHOOL.fullName}. All rights reserved.</p>
          {/* <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
          </div> */}
          <p className="text-white/30 text-xs">Sowing the Seed of Merit &amp; Excellence</p>
        </div>
      </div>
    </footer>
  );
}
