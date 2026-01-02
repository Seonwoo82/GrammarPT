import { NextResponse } from "next/server";
import { isMobileUserAgent } from "./lib/device";

const DESKTOP_ALLOWLIST_PREFIXES = [
  "/landing",
  "/backoffice",
  "/api",
  "/_next",
  "/assets",
  "/fonts",
  "/favicon.ico",
  "/loading_videos.csv",
  "/robots.txt",
  "/sitemap.xml",
];

function isDesktopAllowlisted(pathname) {
  return DESKTOP_ALLOWLIST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile = isMobileUserAgent(userAgent);
  const { pathname } = request.nextUrl;

  if (isMobile || isDesktopAllowlisted(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/landing";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/:path*",
};
