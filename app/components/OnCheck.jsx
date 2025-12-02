"use client";

import { useEffect, useState } from "react";

const logo = "/assets/symbol_3d.png";

export default function OnCheck() {
  const [visibleDots, setVisibleDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleDots((prev) => (prev + 1) % 4);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="oncheck-container">
      <img className="oncheck-logo" src={logo} alt="logo" />
      <div className="oncheck-text-container">
        <p className="oncheck-text-title">
          채점 중
          <span style={{ color: visibleDots > 0 ? "inherit" : "transparent" }}>.</span>
          <span style={{ color: visibleDots > 1 ? "inherit" : "transparent" }}>.</span>
          <span style={{ color: visibleDots > 2 ? "inherit" : "transparent" }}>.</span>
        </p>
        <p className="oncheck-text">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}
