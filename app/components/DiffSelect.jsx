"use client";

import { useState } from "react";
import { CHAPTERS } from "../data/chapters.js";
import YoutubeFrame from "./YoutubeFrame.jsx";

const diffIcons = {
  낮음: "/assets/diff_easy.png",
  보통: "/assets/diff_mid.png",
  높음: "/assets/diff_hard.png",
};

const diffIntro = {
  낮음: "중등 단어",
  보통: "고등일반 단어",
  높음: "수능 단어",
};

export default function DiffSelect({ onNext, difficulty = [], selectedType }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState("보통");

  const handleDifficultySelect = (diff) => {
    setSelectedDifficulty(diff);
    onNext(diff);
  };

  const getVideoUrl = (diff) => {
    if (selectedType && typeof selectedType === "object" && selectedType.videos) {
      return selectedType.videos[diff];
    }

    if (typeof selectedType === "string") {
      const chapter = CHAPTERS.find((chapterItem) =>
        chapterItem.types.some((type) => type.name === selectedType)
      );

      const type = chapter?.types.find((typeItem) => typeItem.name === selectedType);
      return type?.videos?.[diff] || "";
    }

    return "";
  };

  return (
    <div className="diff-select">
      <div className="diff-select-title">
        <h1>난이도를 선택해주세요.</h1>
      </div>
      <div className="diffs">
        {difficulty.map((diff) => (
          <div
            key={diff}
            className={`diff-card ${selectedDifficulty === diff ? "onSelected" : ""} diff${diff}`}
            onClick={() => handleDifficultySelect(diff)}
            tabIndex={0}
            aria-label={`난이도 ${diff} 선택`}
          >
            <div className="diff-content">
              <h2>{diff}</h2>
              <img className="diff-icon" src={diffIcons[diff]} alt={`${diff} 난이도 아이콘`} />
            </div>
            <div className={`diff-intro ${diff}`}>{diffIntro[diff]}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
        <YoutubeFrame videoId={getVideoUrl(selectedDifficulty)} />
      </div>
    </div>
  );
}
