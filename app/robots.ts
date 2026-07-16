import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/portal/", "/admin/", "/sign-in", "/sign-up", "/forgot-password"],
      },
    ],
    sitemap: "https://godswayschool.com/sitemap.xml",
  };
}