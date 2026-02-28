import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "God's Way Model Groups of Schools",
    template: "%s | GWMGS",
  },
  description:
    "A world-class school management system for God's Way Model Groups of Schools. Excellence, Integrity, and Faith.",
  keywords: ["school management", "education", "Nigeria", "Gods way", "GWMGS", "school results", "report cards", "student management"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GWMGS",
  },
  icons: {
    icon: [
      {
        rel: "icon",
        url: "/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        rel: "apple-touch-icon",
        url: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "apple-touch-icon",
        url: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },

  openGraph: {
    title: "God's Way Model Groups of Schools",
    description:
      "A world-class school management system for God's Way Model Groups of Schools. Excellence, Integrity, and Faith.",
    url: "https://www.gwmgs.com",
    siteName: "GWMGS",
    images: [
      {
        url: "/icons/icon/favicon-16x16.png",
        width: 1200,
        height: 630,
        alt: "God's Way Model Groups of Schools",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1e3a5f" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} font-body antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: { fontFamily: "var(--font-body)" },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}

// import type { Metadata } from "next";
// import { Playfair_Display, DM_Sans } from "next/font/google";
// import "./globals.css";
// import { Toaster } from "sonner";
// import { SessionProvider } from "@/components/providers/SessionProvider";

// const displayFont = Playfair_Display({
//   subsets: ["latin"],
//   variable: "--font-display",
//   display: "swap",
// });

// const bodyFont = DM_Sans({
//   subsets: ["latin"],
//   variable: "--font-body",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   title: {
//     default: "God's Way Model Groups of Schools",
//     template: "%s | GWMGS",
//   },
//   description:
//     "A world-class school management system for God's Way Model Groups of Schools. Excellence, Integrity, and Faith.",
//   keywords: ["school management", "education", "Nigeria"],
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body
//         className={`${displayFont.variable} ${bodyFont.variable} font-body antialiased bg-background text-foreground`}
//       >
//         <SessionProvider>
//           {children}
//           <Toaster
//             richColors
//             position="top-right"
//             toastOptions={{
//               style: { fontFamily: "var(--font-body)" },
//             }}
//           />
//         </SessionProvider>
//       </body>
//     </html>
//   );
// }
