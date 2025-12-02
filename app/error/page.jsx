"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header.jsx";

const symbol3d = "/assets/symbol_3d.png";

export default function ErrorPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Header />
      <div className="error-page">
        <div className="error-text-container">
          <p className="error-text-title">잘못된 접근입니다.</p>
          <p className="error-text">잠시 후 메인화면으로 이동합니다..</p>
        </div>

        <img className="error-logo" src={symbol3d} alt="logo" />
      </div>
    </>
  );
}
