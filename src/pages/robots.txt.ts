import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Disallow: /docs/
Disallow: /*.pdf$
Disallow: /docs/*.pdf$
Disallow: /*.psd$
Disallow: /docs/*.psd$
Disallow: /_*
Allow: /api/image-open-graph
Disallow: /api/*

User-agent: Googlebot
Disallow: /docs/
Disallow: /*.pdf$
Disallow: /docs/*.pdf$
Disallow: /*.psd$
Disallow: /docs/*.psd$
Disallow: /_*
Allow: /api/image-open-graph
Disallow: /api/*

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = () => {
  const sitemapURL = new URL(
    "sitemap-index.xml",
    `https://${import.meta.env.SITE_URL}`,
  );
  return new Response(getRobotsTxt(sitemapURL));
};
