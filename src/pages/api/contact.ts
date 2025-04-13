import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const message = formData.get("message")?.toString().trim();
    const locale = formData.get("locale")?.toString().trim() || "en";
    const recaptchaToken = formData.get("g-recaptcha-response")?.toString();

    // Verify reCAPTCHA token
    const recaptchaSecret = import.meta.env.RECAPTCHA_SECRET_KEY;
    const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

    const recaptchaResponse = await fetch(recaptchaVerifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: recaptchaToken || "",
      }),
    });

    const recaptchaResult = await recaptchaResponse.json();
    if (!recaptchaResult.success) {
      console.error("reCAPTCHA verification failed:", recaptchaResult);
      return createErrorResponse(locale, "reCAPTCHA verification failed", 400);
    }

    // Basic checks
    if (!name || !email || !message) {
      return createErrorResponse(
        locale,
        "Missing fields: name, email, or message",
        400,
      );
    }

    // Email blacklist validation using external API
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain) {
      return createErrorResponse(locale, "Invalid email domain", 400);
    }

    // Using a more comprehensive external API to check for spam/phishing domains
    const spamCheckApiUrl = `https://api.usercheck.com/domain/${emailDomain}`;
    try {
      const spamCheckResponse = await fetch(spamCheckApiUrl);
      if (spamCheckResponse.ok) {
        const spamCheckResult = await spamCheckResponse.json();
        if (spamCheckResult.spam === "true") {
          return createErrorResponse(
            locale,
            "Email domain is flagged as spam or phishing",
            400,
          );
        }
      } else {
        console.warn("Spam check API failed:", await spamCheckResponse.text());
      }
    } catch (error) {
      console.error("Error while checking spam API:", error);
    }

    // Manual blacklist check for known spam domains
    const manualBlacklist = ["searchindex.site"];
    if (manualBlacklist.includes(emailDomain)) {
      return createErrorResponse(
        locale,
        "Email domain is manually flagged as spam or phishing",
        400,
      );
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(locale, "Invalid email format", 400);
    }

    // Discord webhook recovery
    const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL as
      | string
      | undefined;
    if (!webhookUrl) {
      return createErrorResponse(locale, "Discord webhook not configured", 500);
    }

    const colorRandom: number = Math.floor(Math.random() * 16777215);
    const webhookBody = {
      username: `[${import.meta.env.DOMAIN_NAME}] Contact`,
      content: `<@${import.meta.env.DISCORD_USER_ID}>`,
      embeds: [
        {
          title: "New message from the contact form",
          color: colorRandom,
          fields: [
            { name: "Name", value: name, inline: true },
            { name: "E-mail address", value: email, inline: true },
            { name: "Message content", value: message },
            { name: "Lang", value: locale, inline: true },
            {
              name: "reCaptcha",
              value: recaptchaResult.success || "Not provided",
              inline: true,
            },
            {
              name: "Time",
              value: new Date().toLocaleString(locale, {
                timeZone: "UTC",
                hour12: false,
              }),
              inline: true,
            },
          ],
          footer: {
            text: `2025 © ${import.meta.env.DOMAIN_NAME} by ${import.meta.env.FIRST_NAME} ${import.meta.env.LAST_NAME}`,
          },
          url: `https://${import.meta.env.DOMAIN_NAME}/${locale}/contact`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookBody),
    });

    if (!res.ok) {
      const errorMessage = await res.text();
      console.error("Discord webhook error:", errorMessage);
      return createErrorResponse(
        locale,
        "Failed to send Discord notification",
        500,
      );
    }

    // Determining the redirect URL according to language
    const redirectUrl = `/${locale}/contact/success`;

    // Creation of a cookie to secure the success page
    const successCookie = `contactSuccess=1; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Set-Cookie": successCookie,
      },
    });
  } catch (error) {
    console.error("Error in contact API:", error);
    return createErrorResponse("en", "Internal Server Error", 500);
  }
};

/**
 * Utility function to handle errors and redirect to error page.
 */
function createErrorResponse(locale: string, message: string, status: number) {
  const redirectUrl = `/${locale}/contact/error`;
  const errorCookie = `contactError=${encodeURIComponent(message)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": errorCookie,
    },
  });
}
