"use client";

export default function QuitBottomSheet({ onQuit, onClose, handleOutsideClick }) {
  return (
    <div className="quit-bottom-sheet" onClick={handleOutsideClick}>
      <div className="quit-bottom-sheet-content">
        <h2>문제를 그만 푸시겠어요?</h2>
        <p>문제는 저장되지 않습니다.</p>
        <div className="button-container">
          <button className="quit-button" onClick={onQuit}>
            그만풀기
          </button>
          <button className="close-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
