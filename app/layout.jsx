import "./globals.css";
import { headers } from "next/headers";
import { isMobileUserAgent } from "@/lib/device.js";
import { Providers } from "./providers.jsx";

export const metadata = {
  title: "GrammarPT",
  description: "영문법 AI 트레이닝 서비스",
};

export default function RootLayout({ children }) {
  const userAgent = headers().get("user-agent") || "";
  const isMobile = isMobileUserAgent(userAgent);

  return (
    <html lang="ko">
      <body>
        <div className={isMobile ? "mobile-shell" : ""}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
