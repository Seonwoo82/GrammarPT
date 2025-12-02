import "./globals.css";
import { Providers } from "./providers.jsx";

export const metadata = {
  title: "GrammarPT",
  description: "영문법 AI 트레이닝 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
