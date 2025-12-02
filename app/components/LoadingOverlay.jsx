"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import Header from "./Header.jsx";
import shining from "../../public/assets/shining.json";

const check1 = "/assets/check_1.png";
const check2 = "/assets/check_2.png";

export default function LoadingOverlay() {
  const [secondCheckOngoing, setSecondCheckOngoing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSecondCheckOngoing(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleStopButton = () => {
    router.push("/");
  };

  return (
    <>
      <Header />
      <div className="loading-overlay">
        <div className="loading-anim">
          <Lottie
            className="loading-anim-lottie"
            animationData={shining}
            loop
            autoplay
            style={{ width: 200, height: 200 }}
          />
        </div>
        <p className="loading-text">잠시만 기다려주세요.</p>
        <h1 className="loading-title">AI가 열심히 문제를 출제중이에요!</h1>
        <div className="loading-progress-container">
          <div className="loading-progress-check first ongoing">
            <img className="loading-progress-img" src={check1} alt="check_1" />
            <p className="loading-progress-text">패턴 - 유형별 문제 생성중</p>
          </div>
          <div className={`loading-progress-check second ${secondCheckOngoing ? "ongoing" : ""}`}>
            <img
              className="loading-progress-img"
              src={secondCheckOngoing ? check1 : check2}
              alt="check"
            />
            <p className="loading-progress-text">난이도별 문제 정리중</p>
          </div>
        </div>
        <div className="stop-container">
          <button className="stop-button" onClick={handleStopButton}>
            문제출제 멈추기
          </button>
        </div>
      </div>
    </>
  );
}
