"use client";

export default function ReBottomSheet({ onRetry, onClose, handleOutsideClick }) {
  return (
    <div className="quit-bottom-sheet" onClick={handleOutsideClick}>
      <div className="quit-bottom-sheet-content">
        <h2>다시 도전하시겠어요?</h2>
        <p>같은 챕터로 문제를 다시 풀 수 있어요.</p>
        <div className="button-container">
          <button className="quit-button" onClick={onRetry}>
            다시 풀기
          </button>
          <button className="close-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
