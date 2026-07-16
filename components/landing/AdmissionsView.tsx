import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import AdmissionInquiryForm from "@/components/landing/AdmissionInquiryForm";
import { ADMISSION_STEPS, ADMISSION_ELIGIBILITY, ADMISSION_DOCUMENTS } from "@/lib/site-data";

export default function AdmissionsView() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80"
        alt="Students"
        breadcrumb="Admissions"
        title="Admissions"
      />

      <section className="bg-blue-50 py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro + eligibility + process */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-10">
            <div>
              {/* <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                🎓 Join Our Family
              </span> */}
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
                Join the God&apos;s Way Family
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5 text-sm sm:text-base">
                We welcome passionate learners who are ready to explore, grow, and make a difference. Admissions are
                open for the current academic session — limited seats available.
              </p>
              <div className="bg-white rounded-xl p-5 mb-5 border border-blue-100">
                <h4 className="font-extrabold text-gray-900 text-sm mb-3">📋 Eligibility</h4>
                <ul className="space-y-1.5">
                  {ADMISSION_ELIGIBILITY.map((e) => (
                    <li key={e} className="text-gray-600 text-sm flex items-start gap-2 pl-1">
                      <span className="text-blue-500 font-bold mt-0.5">•</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-gray-900 text-base mb-5">Admission Process</h3>
              <div className="space-y-3">
                {ADMISSION_STEPS.map((s) => (
                  <div key={s.n} className="bg-white rounded-xl p-4 flex items-start gap-4 shadow-sm border border-blue-50">
                    <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center font-black text-base shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents required */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 mb-14">
            <h3 className="font-extrabold text-gray-900 text-base mb-4">Documents Required</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ADMISSION_DOCUMENTS.map((d) => (
                <div key={d} className="flex items-center gap-2 text-gray-600 text-sm">
                  <span className="text-blue-500">📄</span> {d}
                </div>
              ))}
            </div>
          </div>

          {/* Inquiry form */}
          <div id="inquiry-form" className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                💬 Step 1
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Admission Inquiry Form</h3>
              <p className="text-gray-500 text-sm">
                This is the fastest way to reach us. Fill it in and we&apos;ll open a WhatsApp chat pre-filled with your
                details, straight to our admissions desk.
              </p>
            </div>
            <AdmissionInquiryForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
