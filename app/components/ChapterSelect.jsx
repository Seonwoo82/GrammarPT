"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "../data/chapters.js";
import ChapterCard from "./ChapterCard.jsx";
import GrammarToast from "./GrammarToast.jsx";

export default function ChapterSelect({ onNext, initialSelectedChapter }) {
  const [selectedChapter, setSelectedChapter] = useState(initialSelectedChapter);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setSelectedChapter(initialSelectedChapter);
  }, [initialSelectedChapter]);

  const handleNext = () => {
    if (selectedChapter) {
      onNext(selectedChapter);
    } else {
      setShowNotification(true);
    }
  };

  return (
    <div className="chapter-select">
      <div className="chapter-select-title">
        <h1>챕터를 선택해주세요.</h1>
      </div>

      <div className="chapters">
        {CHAPTERS.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            image={chapter.image}
            title={chapter.title}
            tags={chapter.tags}
            className={selectedChapter && selectedChapter.id === chapter.id ? "onSelected" : ""}
            onSelect={() => setSelectedChapter(chapter)}
          />
        ))}
      </div>

      <button className={`next-button ${!selectedChapter ? "disabled" : ""}`} onClick={handleNext}>
        다음
      </button>
      {showNotification && (
        <GrammarToast
          text="챕터를 선택해주세요."
          onClose={() => setShowNotification(false)}
          style={{ marginBottom: "84px" }}
        />
      )}
    </div>
  );
}
