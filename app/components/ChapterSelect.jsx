"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "../data/chapters.js";
import ChapterCard from "./ChapterCard.jsx";

export default function ChapterSelect({ onNext, initialSelectedChapter }) {
  const [selectedChapter, setSelectedChapter] = useState(initialSelectedChapter);

  useEffect(() => {
    setSelectedChapter(initialSelectedChapter);
  }, [initialSelectedChapter]);

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    onNext(chapter);
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
            onSelect={() => handleChapterSelect(chapter)}
          />
        ))}
      </div>
    </div>
  );
}
