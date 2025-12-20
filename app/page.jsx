"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header.jsx";
import { useTestSession } from "./context/TestSessionContext.jsx";
import { sendTelemetry } from "@/lib/telemetryClient.js";

const logo3d = "/assets/logo_3d.png";

export default function StartPage() {
  const router = useRouter();
  const { resetSession } = useTestSession();
  const hasTrackedHomeRef = useRef(false);

  useEffect(() => {
    resetSession();
  }, [resetSession]);

  useEffect(() => {
    if (hasTrackedHomeRef.current) return;
    hasTrackedHomeRef.current = true;
    const trackHomeView = async () => {
      const result = await sendTelemetry(
        {
          eventType: "feature_used",
          metadata: { feature: "home_view", entry_point: "home" },
        },
        { debug: true }
      );
      if (!result?.ok) {
        console.warn("[telemetry] 홈 화면 추적 실패", result);
      }
    };
    trackHomeView();
  }, []);

  const handleStart = () => {
    router.push("/task-set");
  };

  return (
    <>
      <Header />
      <div id="start_intro_container">
        <h2 id="start_highlight">똑똑한 영어문제 출제 AI</h2>
        <h1 id="start_title">매일 새로운 영어문제</h1>
        <p id="start_text">
          하루 5분 10문제,
          <br />
          꾸준한 문제풀이 습관을 도와드릴게요!
        </p>
      </div>
      <div className="container">
        <img src={logo3d} alt="logo_3d" id="start_logo" />
        <button id="start_button" onClick={handleStart}>
          시작하기
        </button>
      </div>
    </>
  );
}
