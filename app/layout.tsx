import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import Script from "next/script";

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
  metadataBase: new URL("https://gods-way-app.vercel.app"),
  title: {
    default: "God's Way Model Groups of Schools",
    template: "%s | GWMGS",
  },
  description:
    "A world-class school management system for God's Way Model Groups of Schools. Excellence, Integrity, and Faith.",
  keywords: [
    "school management",
    "education",
    "Nigeria",
    "Gods way",
    "GWMGS",
    "school results",
    "report cards",
    "student management",
  ],
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

  // ── Open Graph (Facebook, WhatsApp, LinkedIn, Telegram) ──
  openGraph: {
    title: "God's Way Model Groups of Schools",
    description:
      "A world-class school management system for God's Way Model Groups of Schools. Excellence, Integrity, and Faith.",
    url: "https://gods-way-app.vercel.app",
    siteName: "God's Way Model Groups of Schools",
    images: [
      {
        url: "https://gods-way-app.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "God's Way Model Groups of Schools",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // ── Twitter / X ──
  twitter: {
    card: "summary_large_image",
    title: "God's Way Model Groups of Schools",
    description:
      "A world-class school management system for God's Way Model Groups of Schools. Excellence, Integrity, and Faith.",
    images: ["https://gods-way-app.vercel.app/og-image.png"],
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
          {/* Tawk.to Live Chat Widget */}
          {/* <Script
            id="tawk-to"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
Tawk_API.customStyle = {
  visibility: {
    desktop: {
      position: 'br',
      xOffset: 0,
      yOffset: 80
    },
    mobile: {
      position: 'br',
      xOffset: 0,
      yOffset: 80
    }
  }
};
(function(){
  var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
  s1.async=true;
  s1.src='https://embed.tawk.to/69a40450a8b9521c367287f5/1jikb1mv3';
  s1.charset='UTF-8';
  s1.setAttribute('crossorigin','*');
  s0.parentNode.insertBefore(s1,s0);
})();
    `,
            }}
          /> */}
          {/* End of Tawk.to Script */}
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
