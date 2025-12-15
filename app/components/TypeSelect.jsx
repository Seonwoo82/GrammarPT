"use client";

import { useEffect, useState } from "react";

const background = "/assets/types_side_logo.png";

export default function TypeSelect({ onNext, types = [], initialSelectedType }) {
  const [selectedType, setSelectedType] = useState(initialSelectedType);

  const handleTypeSelection = (type) => {
    setSelectedType(type);
    onNext(type);
  };

  useEffect(() => {
    setSelectedType(initialSelectedType);
  }, [initialSelectedType]);

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
    </div>
  );
}
