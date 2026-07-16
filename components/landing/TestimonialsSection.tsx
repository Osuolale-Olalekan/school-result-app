"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { TESTIMONIALS } from "@/lib/site-data";

const AUTO_ADVANCE_MS = 6000;
const TICK_MS = 60;

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (i: number) => {
    setActive((i + TESTIMONIALS.length) % TESTIMONIALS.length);
    setProgress(0);
  };
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current!);
      return;
    }
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const nextP = p + (TICK_MS / AUTO_ADVANCE_MS) * 100;
        if (nextP >= 100) {
          setActive((a) => (a + 1) % TESTIMONIALS.length);
          return 0;
        }
        return nextP;
      });
    }, TICK_MS);
    return () => clearInterval(intervalRef.current!);
  }, [active, paused]);

  const t = TESTIMONIALS[active];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          {/* <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
            💬 Testimonials
          </span> */}
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Voices of Our <span className="text-blue-600">Community</span>
          </h2>
        </div>

        <div
          className="relative bg-white rounded-3xl p-7 sm:p-10 shadow-xl border border-gray-100 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Decorative background quote mark */}
          <Quote className="absolute -top-6 -right-6 w-44 h-44 text-blue-50 rotate-6 pointer-events-none" strokeWidth={1} />

          {/* Auto-advance progress bar */}
          <div className="relative z-10 h-1 bg-gray-100 rounded-full mb-7 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-blue-500 rounded-full"
              style={{ width: `${progress}%`, transition: paused ? "none" : `width ${TICK_MS}ms linear` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed italic mb-7 min-h-[6rem] sm:min-h-[5rem]">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{t.role}</p>
                  </div>
                </div>
                <span className="text-gray-300 font-bold text-sm hidden sm:block">
                  {String(active + 1).padStart(2, "0")} / {String(TESTIMONIALS.length).padStart(2, "0")}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + prev/next controls */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Show testimonial ${i + 1}`}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 28 : 8,
                  background: i === active ? "linear-gradient(90deg,#f97316,#2563eb)" : "#d1d5db",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}