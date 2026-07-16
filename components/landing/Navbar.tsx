"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { SCHOOL, NAV_LINKS } from "@/lib/site-data";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  // useEffect(() => setMenuOpen(true), [pathname]);

   const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);
  

 
  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-shadow duration-300"
      style={{ background: "#172554", boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,.25)" : "none" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-white/20 bg-white/10"> */}
              <img
                src={SCHOOL.logo}
                alt="Logo"
                className="w-14 h-14 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            {/* </div> */}
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">{SCHOOL.name}</p>
              {/* <p className="text-white/55 text-[11px] leading-tight">Model Groups of Schools</p> */}
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={`text-[13px] font-semibold px-3 py-2 rounded-md transition-all ${
                    active ? "text-white bg-white/15" : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admissions"
              className="hidden sm:inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="lg:hidden text-white p-1.5" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-blue-900/98">
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-white/80 hover:text-white hover:bg-white/10 text-sm font-semibold px-3 py-3 rounded-lg transition-all"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/admissions"
              className="mt-2 flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3.5 rounded-xl text-sm"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

