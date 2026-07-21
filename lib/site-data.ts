// lib/site-data.ts
// Single source of truth for site copy, links and content.
// Edit values here and every page that uses them updates automatically.

export const SCHOOL = {
  name: "God's Way Model Schools",
  fullName: "God's Way Model Schools",
  motto: "Sowing the Seed of Merit & Excellence",
  logo: "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784632470/ChatGPT_Image_Jul_21_2026_09_12_05_AM_1_qyhf63.png",
  phone1: "08069825847",
  phone2: "08067110930",
  email: "osuolaleolalek7@gmail.com",
  address: "No 12 Siyanbola Street, Osogbo, Osun State",
  // Used to build wa.me links for the admission inquiry form.
  // Set NEXT_PUBLIC_SCHOOL_WHATSAPP in your .env to override without a code change.
  whatsappNumber: process.env.NEXT_PUBLIC_SCHOOL_WHATSAPP || "2348147445983",
};

export const NAV_LINKS = [
    { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Admissions", href: "/admissions" },
  { label: "Portal", href: "/portal" },
//   { label: "News & Events", href: "/news" },
//   { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export const STATS = [
  { value: "2,000+", label: "Students" },
  { value: "80+", label: "Teachers" },
  { value: "15+", label: "Years of Excellence" },
  { value: "20+", label: "Awards Won" },
];

export const WHY_CARDS = [
  {
    icon: "Users",
    title: "Experienced Faculty",
    desc: "Rigorous academics designed for success, with qualified teachers who genuinely care about each student's growth.",
  },
  {
    icon: "Globe",
    title: "Global Exposure",
    desc: "Preparing students for global futures with modern curricula aligned to international educational standards.",
  },
  {
    icon: "Trophy",
    title: "Co-Curricular",
    desc: "Sports, arts, debate, and clubs develop teamwork and leadership qualities far beyond the classroom.",
  },
  {
    icon: "Shield",
    title: "Character Building",
    desc: "Faith, integrity, and moral excellence baked into everything we do — our motto lived every day.",
  },
];

// Placeholder photos — swap the `photo` value for each person with the real
// image URL when you have it. Everything else (name/title/message) is safe
// to edit right away.
export const LEADERSHIP = [
  {
    role: "Proprietor",
    name: "Osuntayo A.O",
    photo: "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784070200/ChatGPT_Image_Jul_14_2026_11_44_13_PM_1_hv7umk.jpg",
  },
  {
    role: "Proprietress",
    name: "Adewunmi Abolade",
    photo: "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784070200/ChatGPT_Image_Jul_14_2026_11_54_09_PM_1_tnph8u.jpg",
    // Shown in the "Welcome Address" section on the home page.
    // Replace with her real words whenever you're ready — this is a
    // professional-sounding placeholder so the section isn't empty.
    message:
      "It is with great joy that I welcome you to God's Way Model Schools. For over fifteen years, we have committed ourselves to nurturing not just academically excellent students, but young people of strong character, faith and purpose. Every child who walks through our gates is known, valued and given every opportunity to discover their potential. Whether you are a parent considering our school for the first time or a member of our extended school family, thank you for placing your trust in us. We look forward to walking this journey of growth and excellence with you and your child.",
  },
  {
    role: "Principal",
    name: "Oguntunde S.O",
    photo: "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784070199/ChatGPT_Image_Jul_14_2026_11_52_48_PM_1_h79opw.jpg",
  },
  {
    role: "Vice Principal",
    name: "Oluwaseun O.M",
    photo: "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784070200/ChatGPT_Image_Jul_14_2026_11_53_35_PM_1_fc9yvq.jpg",
  },
//   {
//     role: "Head Teacher",
//     name: "Name Here",
//     photo: "https://images.unsplash.com/photo-1573165231977-3f0e27806045?w=400&q=80",
//   },
];

// Background images the hero section crossfades through every few seconds.
// Swap these for real campus photography whenever you have it — same
// pattern as everything else in this file.
export const HERO_CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80",
  "https://images.unsplash.com/photo-1588072432836-e10032774350?w=1600&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80",
  "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=1600&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80",
];

// Transparent-background cutout used in the hero's foreground.
export const HERO_STUDENTS_IMAGE =
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784211889/ChatGPT_Image_Jul_16_2026_03_21_41_PM_1_af3bj7.png";

// Background images for the rotating hero carousel. Add/remove/reorder
// freely — the hero cycles through whatever is in this array.
export const HERO_IMAGES = [
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784210598/file_000000000168722f890879379854b2a1_cmkv7r.png",
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784210598/IMG-20260715-WA0009_a1onbd.jpg",
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784210597/IMG-20260715-WA0005_rtpmpo.jpg",
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784210597/IMG-20260715-WA0006_cp2nxp.jpg",
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784210597/IMG-20260715-WA0003_iinzyy.jpg",
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784210597/IMG-20260715-WA0007_jrapc4.jpg"
];

// The cutout image of two students used as the hero's foreground graphic.
export const HERO_PUPILS_IMAGE =
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784211889/ChatGPT_Image_Jul_16_2026_03_21_41_PM_1_af3bj7.png";

// Welcome address from the Proprietress. Photo/name are pulled from
// LEADERSHIP below (role: "Proprietress") — edit the message text here.
export const WELCOME_MESSAGE = {
  message:
    "It is with immense pleasure that I welcome you to God's Way Model Schools. For over fifteen years, we have remained committed to nurturing not just academically sound students, but young people of strong character, deep faith, and genuine curiosity about the world around them. Every child who walks through our gates is seen, known, and guided because we believe education is as much about who a child becomes as what a child learns. I invite you to explore what makes God's Way a true home for learning, and I look forward to welcoming your family into ours.",
};

export const CORE_VALUES = [
  { icon: "Shield", label: "Integrity", desc: "We do what is right, even when no one is watching." },
  { icon: "Heart", label: "Respect", desc: "We honour every individual's dignity and worth." },
  { icon: "Star", label: "Excellence", desc: "We pursue the highest standards in everything we do." },
  { icon: "Handshake", label: "Responsibility", desc: "We take ownership of our actions and their impact." },
  { icon: "Lightbulb", label: "Empathy", desc: "We care deeply for the needs of those around us." },
];

export const PROGRAMS = [
  {
    level: "Primary School",
    icon: "",
    badge: "6 Classes",
    img: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=700&q=80",
    alt: "Primary school students in classroom",
    desc: "A nurturing foundation that builds lifelong learners with strong academic and moral values from the earliest years.",
    tags: ["Nursery 1 & 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"],
  },
  {
    level: "Junior Secondary",
    icon: "",
    badge: "3 Classes",
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=80",
    alt: "Junior secondary students studying",
    desc: "Expanding minds with a broad curriculum that prepares students for senior secondary studies and BECE exams.",
    tags: ["JSS 1", "JSS 2", "JSS 3"],
  },
  {
    level: "Senior Secondary",
    icon: "",
    badge: "3 Classes",
    img: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=700&q=80",
    alt: "Senior secondary students in science lab",
    desc: "Specialized departments — Science, Arts & Commercial — tailored for WAEC, NECO success and university readiness.",
    tags: ["SSS 1", "SSS 2", "SSS 3", "Science", "Arts", "Commercial"],
  },
];

export const CURRICULUM = [
  { icon: "FlaskConical", title: "STEM Focus", desc: "Science, technology, engineering and math woven into every level of learning." },
  { icon: "Palette", title: "Arts & Creative", desc: "Developing imagination, design thinking and creative expression in students." },
  { icon: "Trophy", title: "Sports & Health", desc: "Physical education, inter-house sports, and comprehensive wellness programs." },
  { icon: "Brain", title: "Critical Thinking", desc: "Debate clubs, problem-solving competitions and real-world project work." },
];

export const ADMISSION_STEPS = [
  { n: "1", title: "Inquiry", desc: "Submit the inquiry form below. It goes straight to our admissions team on WhatsApp." },
  { n: "2", title: "Application", desc: "We send you the full application form and required-documents checklist." },
  { n: "3", title: "Assessment", desc: "A short student assessment and interaction with our academic team (if applicable)." },
  { n: "4", title: "Confirmation", desc: "Receive your offer letter and complete the enrollment process." },
];

export const ADMISSION_ELIGIBILITY = [
  "Nursery to SSS 3 applicants welcome",
  "Age-appropriate for the desired class",
  "Submission of all required documents",
  "Assessment may be required for certain classes",
];

export const ADMISSION_DOCUMENTS = [
  "Birth Certificate",
  "Previous School Report (if applicable)",
  "Passport Size Photographs (4 copies)",
  "Proof of Address / Utility Bill",
  "Parent/Guardian ID Card",
  "Any other relevant documents",
];

// Classes offered — feeds the dropdown on the admission inquiry form.
export const CLASS_OPTIONS = [
  "Nursery 1",
  "Nursery 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

export const PORTAL_FEATURES = [
  { icon: "FileText", title: "Digital Report Cards", desc: "QR-code secured report cards available online. Parents notified instantly when results are ready." },
  { icon: "TrendingUp", title: "Automatic Promotion", desc: "Tracks student performance across all three terms and handles class promotions automatically." },
  { icon: "Users", title: "Parent Portal", desc: "Parents stay connected with results, report downloads, and full academic history." },
  { icon: "Bell", title: "Smart Notifications", desc: "Automated alerts via WhatsApp and email for approvals, results, and school announcements." },
  { icon: "Shield", title: "Secure & Reliable", desc: "Enterprise-grade security with role-based access. Every action is audited and traceable." },
];

export const NEWS_ITEMS = [
  {
    tag: "Event",
    tagColor: "bg-orange-500",
    date: "May 12, 2024",
    title: "Annual Sports Day 2024",
    desc: "A day of excitement, teamwork and sporting achievement as our students compete across all houses.",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
    alt: "Sports day",
  },
  {
    tag: "News",
    tagColor: "bg-blue-700",
    date: "April 28, 2024",
    title: "Science Exhibition Showcase",
    desc: "Students showcased innovative projects and scientific ideas at our annual science fair.",
    img: "https://images.unsplash.com/photo-1532094349884-543559059b10?w=500&q=80",
    alt: "Science exhibition",
  },
  {
    tag: "Notice",
    tagColor: "bg-blue-700",
    date: "April 19, 2024",
    title: "Holiday Notice — Term Break",
    desc: "School will remain closed from April 28 to May 6 for Term Break. Portal remains accessible.",
    img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&q=80",
    alt: "Notice board",
  },
];

export const GALLERY_IMGS = [
  { src: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=400&q=80", alt: "Students", cat: "Campus" },
  { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80", alt: "Classroom", cat: "Campus" },
  { src: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&q=80", alt: "Science Lab", cat: "Activities" },
  { src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=80", alt: "Library", cat: "Campus" },
  { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", alt: "Sports", cat: "Sports" },
  { src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80", alt: "Events", cat: "Events" },
  { src: "https://images.unsplash.com/photo-1532094349884-543559059b10?w=400&q=80", alt: "Science Fair", cat: "Activities" },
  { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80", alt: "Campus", cat: "Campus" },
];

export const GALLERY_TABS = ["All", "Campus", "Events", "Activities", "Sports"];
export const NEWS_TABS = ["All", "News", "Events"];

export const TESTIMONIALS = [
  { name: "Mrs. Funmilayo Adeyemi", role: "Parent of JSS 2 Student", initials: "FA", color: "#F97316", stars: 5, text: "The parent portal has completely transformed how I stay involved in my daughter's education. I can check her results, download reports, and get notified immediately." },
  { name: "Mr. Oluwaseun Bakare", role: "Parent of Primary 4 & SSS 1 Students", initials: "OB", color: "#2563EB", stars: 5, text: "I have two children in this school and the digital report card system makes everything so easy. The teachers are excellent and the management is highly professional." },
  { name: "Solomon", role: "SSS 3 Graduate, 2023", initials: "OS", color: "#0EA5E9", stars: 5, text: "God's Way gave me the foundation I needed to excel in my WAEC exams. I finished with distinctions in 7 subjects and I'm now at university — grateful forever." },
];