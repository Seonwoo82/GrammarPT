"use client";

import { useEffect, useState } from "react";
import GrammarToast from "./GrammarToast.jsx";

const background = "/assets/types_side_logo.png";

export default function TypeSelect({ onNext, types = [], initialSelectedType }) {
  const [selectedType, setSelectedType] = useState(initialSelectedType);
  const [showNotification, setShowNotification] = useState(false);

  const handleTypeSelection = (type) => {
    setSelectedType(type);
  };

  useEffect(() => {
    setSelectedType(initialSelectedType);
  }, [initialSelectedType]);

  const handleNext = () => {
    if (selectedType) {
      onNext(selectedType);
    } else {
      setShowNotification(true);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  return (
    <div className="type-select">
      <div className="type-select-title">
        <h1>유형을 선택해주세요.</h1>
      </div>
      <div className="types">
        {types.map((type) => (
          <div
            key={type.name}
            className={`type-card ${selectedType === type.name ? "onSelected" : ""}`}
            onClick={() => handleTypeSelection(type.name)}
            tabIndex={0}
            aria-label={`유형 ${type.name} 선택`}
          >
            <h2>{type.name}</h2>
          </div>
        ))}
      </div>
      <img className="types-bg" src={background} alt="background" />
      <button className={`next-button ${!selectedType ? "disabled" : ""}`} onClick={handleNext}>
        다음
      </button>
      {showNotification && (
        <GrammarToast
          text="유형을 선택해주세요."
          onClose={handleCloseNotification}
          style={{ marginBottom: "84px" }}
        />
      )}
    </div>
  );
}
