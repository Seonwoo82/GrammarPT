"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header.jsx";
import { useTestSession } from "./context/TestSessionContext.jsx";

const logo3d = "/assets/logo_3d.png";

export default function StartPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);
  const { resetSession } = useTestSession();

  useEffect(() => {
    resetSession();
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      setIsMobile(/android|iPad|iPhone|iPod/i.test(userAgent));
    };

    checkMobile();
  }, [resetSession]);

  const handleStart = () => {
    router.push("/task-set");
  };

  return (
    <>
      <Header />
      {!isMobile && (
        <div className="popup-overlay">
          <div className="popup-dialog">
            <h2 className="popup-title">모바일 환경에서 접속해주세요.</h2>
            <p className="popup-text">
              GrammarPT는 모바일 환경에 최적화되어 있습니다.
              <br />
              모바일이 아닌 환경에서는 화면이 정상적으로 노출되지 않을 수 있습니다.
            </p>
            <div className="popup-button-container">
              <button className="popup-button" onClick={() => setIsMobile(true)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      <div id="start_intro_container">
        <h2 id="start_highlight">똑똑한 영어문제 출제 AI</h2>
        <h1 id="start_title">매일 새로운 영어문제</h1>
        <p id="start_text">
          하루 5개씩,
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
