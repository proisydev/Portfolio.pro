import { defineMiddleware } from "astro:middleware";
import { allowedLocales } from "./utils/i18n/locale";

export const onRequest = defineMiddleware(async ({ request, locals }, next) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Ignore API or other prefixes
    if (path.includes("/api/")) {
      return next();
    }
    const ignorePrefixes = ["/_", "/assets/"];
    if (ignorePrefixes.some((prefix) => path.startsWith(prefix))) {
      return next();
    }

    // 2. Ignore exact paths (like /sitemap-index.xml)
    const ignorePaths = ["/sitemap-index.xml", "/robots.txt"];
    if (ignorePaths.includes(path)) {
      const response = await next();
      if (response.status === 200) {
        // If fallback is 200, redirect to 404 with user’s preferred language
        const acceptLanguage = request.headers.get("accept-language") || "";
        const preferredLang = acceptLanguage.toLowerCase().includes("fr")
          ? "fr"
          : "en";
        const notFoundUrl = new URL(`/${preferredLang}/404`, request.url);
        return new Response(null, {
          status: 302,
          headers: { Location: notFoundUrl.toString() },
        });
      }
      return response;
    }

    // 3. Check if path is already localized
    const isLocalePath = allowedLocales.some(
      (locale) => path.startsWith(`/${locale}/`) || path === `/${locale}`,
    );

    // 4. If it's not localized
    if (!isLocalePath) {
      // We have some "legacy routes" that we want to redirect (ex: /projects => /en/projects)
      const legacyRoutes = ["/projects", "/contact", "/about", "/"];
      if (legacyRoutes.some((route) => path.startsWith(route))) {
        // Deduce the preferred language
        const acceptLanguage = request.headers.get("accept-language") || "";
        const preferredLang = acceptLanguage.toLowerCase().includes("fr")
          ? "fr"
          : "en";
        const newUrl = new URL(
          `/${preferredLang}${path === "/" ? "" : path}`,
          request.url,
        );
        return new Response(null, {
          status: 302,
          headers: { Location: newUrl.toString() },
        });
      } else {
        // For unrecognized route => redirect to the 404 page with user’s preferred language
        const acceptLanguage = request.headers.get("accept-language") || "";
        const preferredLang = acceptLanguage.toLowerCase().includes("fr")
          ? "fr"
          : "en";
        const notFoundUrl = new URL(`/${preferredLang}/404`, request.url);
        return new Response(null, {
          status: 302,
          headers: { Location: notFoundUrl.toString() },
        });
      }
    }

    // 5. If the URL is already localized, let it pass
    return next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
