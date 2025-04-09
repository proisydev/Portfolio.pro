import { defineMiddleware } from "astro:middleware";
import { allowedLocales } from "./utils/i18n/locale";
import { stat } from "fs/promises"; // Import to check if files exist
import { join } from "path"; // To construct absolute paths

export const onRequest = defineMiddleware(async ({ request }, next) => {
  try {
    const url = new URL(request.url);
    const path: string = url.pathname;

    // 1. Ignore API or other prefixes
    if (path.includes("/api/")) {
      return next();
    }
    const ignorePrefixes: string[] = ["/_", "/assets/"];
    if (ignorePrefixes.some((prefix) => path.startsWith(prefix))) {
      return next();
    }

    // 2. Handle specific paths (e.g., /sitemap-index.xml, /robots.txt)
    const ignorePaths: string[] = ["/sitemap-index.xml", "/robots.txt"];
    if (ignorePaths.includes(path)) {
      // Check if the file exists in the public folder or is dynamically generated
      const filePath = join(process.cwd(), "public", path); // Absolute path to the file in the public folder
      const srcPath = join(process.cwd(), "src/pages", `${path}.ts`); // Path to dynamically generated files
      try {
        await stat(filePath); // Check if the file exists in the public folder
        return next(); // Allow the request if the file exists
      } catch {
        try {
          await stat(srcPath); // Check if the file exists as a dynamic source
          return next(); // Allow the request if the dynamic file exists
        } catch {
          // Redirect to the localized 404 page if the file does not exist
          const acceptLanguage: string =
            request.headers.get("accept-language") || "";
          const preferredLang: string = acceptLanguage
            .toLowerCase()
            .includes("fr")
            ? "fr"
            : "en";
          const notFoundUrl = new URL(`/${preferredLang}/404`, request.url);
          return new Response(null, {
            status: 302,
            headers: { Location: notFoundUrl.toString() },
          });
        }
      }
    }

    // 3. Check if the path is already localized
    const isLocalePath: boolean = allowedLocales.some(
      (locale) => path.startsWith(`/${locale}/`) || path === `/${locale}`,
    );

    // 4. If the path is not localized
    if (!isLocalePath) {
      // Redirect legacy routes (e.g., /projects => /en/projects)
      const legacyRoutes: string[] = ["/projects", "/contact", "/about", "/"];
      const acceptLanguage: string =
        request.headers.get("accept-language") || "";
      const preferredLang: string = acceptLanguage.toLowerCase().includes("fr")
        ? "fr"
        : "en";

      if (legacyRoutes.some((route) => path.startsWith(route))) {
        const newUrl = new URL(
          `/${preferredLang}${path === "/" ? "" : path}`,
          request.url,
        );
        return new Response(null, {
          status: 302,
          headers: { Location: newUrl.toString() },
        });
      } else {
        // Redirect to the localized 404 page for unrecognized routes
        const notFoundUrl = new URL(`/${preferredLang}/404`, request.url);
        return new Response(null, {
          status: 302,
          headers: { Location: notFoundUrl.toString() },
        });
      }
    }

    // 5. If the URL is already localized, allow it to pass
    return next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
