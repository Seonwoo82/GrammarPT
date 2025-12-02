"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuitBottomSheet from "./QuitBottomSheet.jsx";
import { useTestSession } from "../context/TestSessionContext.jsx";

const quitIcon = "/assets/quit.png";

export default function TestHeader() {
  const [seconds, setSeconds] = useState(0);
  const [showQuitSheet, setShowQuitSheet] = useState(false);
  const router = useRouter();
  const { resetSession } = useTestSession();

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const nextSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${nextSeconds.toString().padStart(2, "0")}`;
  };

  const handleConfirmQuit = () => {
    resetSession();
    router.push("/");
  };

  return (
    <>
      <div className="test-header-container">
        <header className="test-header">
          <div className="quit-section" onClick={() => setShowQuitSheet(true)}>
            <img src={quitIcon} alt="quit" className="header_quit" />
            <span>문제 그만풀기</span>
          </div>
          <span className="timer">{formatTime(seconds)}</span>
        </header>
      </div>
      {showQuitSheet && (
        <QuitBottomSheet
          onQuit={handleConfirmQuit}
          onClose={() => setShowQuitSheet(false)}
          handleOutsideClick={() => setShowQuitSheet(false)}
        />
      )}
    </>
  );
}
