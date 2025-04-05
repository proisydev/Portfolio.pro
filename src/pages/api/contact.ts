import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const message = formData.get("message")?.toString().trim();
    const locale = formData.get("locale")?.toString().trim() || "en";

    // Basic checks
    if (!name || !email || !message) {
      return createErrorResponse(
        locale,
        "Missing fields: name, email, or message",
        400,
      );
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
      username: `[${import.meta.env.SITE_URL}] Contact`,
      content: `<@${import.meta.env.DISCORD_USER_ID}>`,
      embeds: [
        {
          title: "New message from the contact form",
          color: colorRandom,
          fields: [
            { name: "Name", value: name, inline: true },
            { name: "E-mail address", value: email, inline: true },
            { name: "Lang", value: locale, inline: true },
            { name: "Message content", value: message },
          ],
          footer: {
            text: `2025 © ${import.meta.env.SITE_URL} by ${import.meta.env.FIRST_NAME} ${import.meta.env.LAST_NAME}`,
          },
          url: `https://${import.meta.env.SITE_URL}/${locale}/contact`,
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
