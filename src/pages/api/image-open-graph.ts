export const prerender = false;

import { ImageResponse } from "@vercel/og";
import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

export const config = {
  runtime: "edge",
};

export const GET: APIRoute = ({ request }) => {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get("title");
  const page = searchParams.get("page");

  if (!title || !page) {
    return new Response("Missing title or page", { status: 400 });
  }

  const link = page.replace("https://", "").replace("http://", "");

  // using custom font files
  const DmSansBold = fs.readFileSync(
    path.resolve("./public/assets/fonts/DMSans-Bold.ttf"),
  );
  const DmSansReqular = fs.readFileSync(
    path.resolve("./public/assets/fonts/DMSans-Regular.ttf"),
  );

  const html = {
    type: "div",
    props: {
      children: [
        {
          type: "div",
          props: {
            tw: "w-[200px] h-[200px] flex rounded-3xl overflow-hidden",
            children: [
              {
                type: "img",
                props: {
                  src: `https://${import.meta.env.SITE_URL}/assets/images/logo.png`,
                  key: "logo",
                },
              },
            ],
            key: "logo-container",
          },
        },
        {
          type: "div",
          props: {
            tw: "pl-10 shrink flex text-white",
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "48px",
                    fontFamily: "DM Sans Bold",
                  },
                  children: title,
                  key: "title",
                },
              },
            ],
            key: "title-container",
          },
        },
        {
          type: "div",
          props: {
            tw: "absolute right-[40px] bottom-[40px] flex items-center",
            children: [
              {
                type: "div",
                props: {
                  tw: "text-purple-400 text-3xl",
                  style: {
                    fontFamily: "DM Sans Bold",
                  },
                  children: link,
                  key: "link",
                },
              },
              {
                type: "div",
                props: {
                  tw: "px-2 text-3xl text-white",
                  style: {
                    fontSize: "30px",
                  },
                  children: "|",
                  key: "divider",
                },
              },
              {
                type: "div",
                props: {
                  tw: "text-3xl text-white",
                  children: `${import.meta.env.FIRST_NAME} ${import.meta.env.LAST_NAME}`,
                  key: "author",
                },
              },
            ],
            key: "footer",
          },
        },
      ],
      tw: "w-full h-full flex items-center justify-center relative px-22",
      style: {
        background: "rgb(0 0 0 / var(--tw-bg-opacity, 1))",
        fontFamily: "DM Sans Regular",
      },
      key: "root",
    },
  };

  return new ImageResponse(html, {
    width: 1200,
    height: 600,
    fonts: [
      {
        name: "DM Sans Bold",
        data: DmSansBold.buffer,
        style: "normal",
      },
      {
        name: "DM Sans Regular",
        data: DmSansReqular.buffer,
        style: "normal",
      },
    ],
  });
};
