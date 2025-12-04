"use client";

export default function QuestionComponent({ question, selectedAnswer, onAnswerSelect }) {
  const stripLeadingNumbering = (text = "") =>
    text.replace(/^\s*(?:[①-⑳㉑-㉟]|[1-9]|10)[.)]?\s+/, "");

  const sanitizeText = (text = "") =>
    text.replace(/<br\s*\/?>/gi, " ").replace(/\*\*/g, "");

  const renderOptionText = (text = "") => {
    const clean = stripLeadingNumbering(sanitizeText(text));
    if (clean.includes("<u>")) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: clean,
          }}
          className="underlined-text"
        />
      );
    }
    return clean;
  };

  return (
    <div className="question-container">
      <div className="question-title">
        <h2>
          Q{question.index}
          <span>/10</span>
        </h2>
      </div>

      {question.question && (
        <div className="question-text-container">
          <p className="question-text">{renderOptionText(question.question)}</p>
        </div>
      )}

      {question.passage && (
        <div className="question-passage-container">
          <p className="passage">{renderOptionText(question.passage)}</p>
        </div>
      )}

      <div className="options-container">
        {question.options.map((option, index) => (
          <button
            key={option}
            className={`option-button ${selectedAnswer === option ? "selected" : ""}`}
            onClick={() => onAnswerSelect(option)}
          >
            <span className="option-number">{index < 4 ? String.fromCharCode(65 + index) : "?"}</span>
            <span className="option-text">{renderOptionText(option)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
