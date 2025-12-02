"use client";

export default function HomeBottomSheet({ onQuit, onClose, handleOutsideClick }) {
  return (
    <div className="quit-bottom-sheet" onClick={handleOutsideClick}>
      <div className="quit-bottom-sheet-content">
        <h2>처음 화면으로 이동하시겠어요?</h2>
        <p>페이지를 벗어나면 결과를 다시 확인할 수 없어요.</p>
        <div className="button-container">
          <button className="quit-button" onClick={onQuit}>
            처음 화면으로 이동
          </button>
          <button className="close-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
