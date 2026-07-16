export default function SchoolSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "School",
    name: "God's Way Model Schools",
    description:
      "A world-class school management system for God's Way Model Schools.",
    url: "https://godswayschool.com",
    logo: "https://godswayschool.com/icons/icon-512x512.png",
    image: "https://godswayschool.com/og-image.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "No 12 Siyanbola Street, Osogbo",
      addressLocality: "Osogbo",
      addressRegion: "Osun State",
      addressCountry: "NG",
    },
    telephone: "08069825847",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}