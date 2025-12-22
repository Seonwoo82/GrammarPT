"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import HomeBottomSheet from "../components/HomeBottomSheet.jsx";
import ReBottomSheet from "../components/ReBottomSheet.jsx";
import { useTestSession } from "../context/TestSessionContext.jsx";
import { createSessionId, sendTelemetry } from "@/lib/telemetryClient.js";

const assets = {
  logo: "/assets/logo_x4.png",
  homeIcon: "/assets/home.png",
  faceIcons: [
    "/assets/emoji_score01.png",
    "/assets/emoji_score02.png",
    "/assets/emoji_score03.png",
    "/assets/emoji_score04.png",
    "/assets/emoji_score05.png",
    "/assets/emoji_score06.png",
  ],
  rightAnswerIcon: "/assets/right_answer.png",
  wrongAnswerIcon: "/assets/wrong_answer.png",
  rightAnswerMark: "/assets/right_check.png",
  wrongAnswerMark: "/assets/wrong_check.png",
  saveIcon: "/assets/save.png",
};

const ScoreGauge = ({ value = 0, total = 10 }) => {
  const clampedTotal = total || 10;
  const pct = Math.max(0, Math.min(value / clampedTotal, 1));
  const radius = 70;
  const stroke = 12;
  const cx = 100;
  const cy = 100;
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;
  const arcLength = Math.PI * radius;
  const dashArray = arcLength;
  const dashOffset = arcLength * (1 - pct);
  const label = value === clampedTotal ? "만점" : `${value}/${clampedTotal}`;

  return (
    <div className="score-gauge">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0f1f3" />
            <stop offset="100%" stopColor="#e6e8ec" />
          </linearGradient>
        </defs>
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="url(#gaugeTrack)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="#E66041"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
        />
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill="#E66041"
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

const ResultBadge = ({ correct = 0, total = 0 }) => {
  const safeTotal = total || 1;
  const ratio = Math.max(0, Math.min(correct / safeTotal, 1));
  const radius = 80;
  const strokeWidth = 14;
  const viewBoxWidth = 220;
  const viewBoxHeight = 130;
  const cx = viewBoxWidth / 2;
  const cy = 110;
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;
  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - ratio);

  return (
    <div className="result-gauge">
      <svg
        className="result-gauge-arc"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        role="img"
        aria-label={`정답 ${correct} / ${safeTotal}`}
      >
        <defs>
          <linearGradient id="resultGaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F2F2F2" />
            <stop offset="100%" stopColor="#EDEDED" />
          </linearGradient>
          <linearGradient id="resultGaugeFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E77955" />
            <stop offset="100%" stopColor="#E3573F" />
          </linearGradient>
        </defs>
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="url(#resultGaugeTrack)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="url(#resultGaugeFill)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="result-gauge-label">
        {correct}/{safeTotal}
      </div>
    </div>
  );
};

export default function ResultPage() {
  const router = useRouter();
  const {
    questions,
    results,
    selectedAnswers,
    testInfo,
    sessionId,
    sessionStartedAt,
    resetSession,
    setSession,
  } = useTestSession();
  const [completeSent, setCompleteSent] = useState(false);
  const [testInfoString, setTestInfoString] = useState("");
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showQuitSheet, setShowQuitSheet] = useState(false);
  const [showReSheet, setShowReSheet] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const imgSaveAreaRef = useRef(null);
  const captureAreaRef = useRef(null);

  const sanitizeText = (text = "") =>
    String(text || "").replace(/<br\s*\/?>/gi, " ").replace(/\*\*/g, "");

  const renderOptionText = (text) => {
    const clean = sanitizeText(text);
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

  const handleSaveResult = () => {
    if (imgSaveAreaRef.current) {
      html2canvas(imgSaveAreaRef.current).then((canvas) => {
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement("a");
        link.download = `test_result_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = image;
        link.click();
      });
      if (captureAreaRef.current) {
        html2canvas(captureAreaRef.current, {
          logging: false,
          useCORS: true,
          scale: 2,
        }).then((canvas) => {
          const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
          const link = document.createElement("a");
          link.download = `test_result_${new Date().toISOString().slice(0, 10)}_share.png`;
          link.href = image;
          link.click();
        });
      }
      sendTelemetry({
        eventType: "share_sent",
        sessionId,
        metadata: { channel: "download", type: "result_image" },
      });
      sendTelemetry({
        eventType: "feature_used",
        sessionId,
        metadata: { feature: "save_result" },
      });
    }
  };

  useEffect(() => {
    if (isExiting) return;
    if (!questions || !results || !selectedAnswers || !testInfo) {
      router.replace("/error");
      return;
    }

    const { chapter, type, difficulty } = testInfo;
    let chapterString = "";
    switch (String(chapter)) {
      case "1":
        chapterString = "내신 꿀팁";
        break;
      case "2":
        chapterString = "문법 : 첫걸음";
        break;
      case "3":
        chapterString = "코어 문법 강화";
        break;
      default:
        chapterString = `Chapter ${chapter}`;
    }
    setTestInfoString(`${chapterString} - ${type} | 난이도 ${difficulty}`);

    let correct = 0;
    let incorrect = 0;
    let unknown = 0;

    results.forEach((result, index) => {
      if (selectedAnswers[index] === "모르겠어요") {
        unknown += 1;
      } else if (result.isCorrect) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    });

    setCorrectCount(correct);
    setIncorrectCount(incorrect);
    setUnknownCount(unknown);

    const startedAtMs =
      typeof sessionStartedAt === "number"
        ? sessionStartedAt
        : sessionStartedAt
          ? new Date(sessionStartedAt).getTime()
          : null;
    const completedAtMs = Date.now();
    const sessionDurationMs = startedAtMs ? Math.max(0, completedAtMs - startedAtMs) : null;

    if (!completeSent) {
      sendTelemetry({
        eventType: "session_complete",
        sessionId,
        metadata: {
          chapter,
          type,
          difficulty,
          correct_count: correct,
          incorrect_count: incorrect,
          unknown_count: unknown,
          total_questions: results.length,
          session_started_at: startedAtMs ? new Date(startedAtMs).toISOString() : undefined,
          session_completed_at: new Date(completedAtMs).toISOString(),
          session_duration_ms: sessionDurationMs,
        },
      });
      setCompleteSent(true);
    }

  }, [questions, results, selectedAnswers, testInfo, router, sessionId, sessionStartedAt, completeSent, isExiting]);

  if (!questions || !results || !selectedAnswers || !testInfo) {
    return null;
  }

  const totalQuestions = questions.length || 0;
  const normalizedScore = Math.max(0, Math.min(totalQuestions ? correctCount / totalQuestions : 0, 1));
  const faceIconIndex = Math.min(
    assets.faceIcons.length - 1,
    Math.floor(normalizedScore * assets.faceIcons.length)
  );
  const faceIcon = assets.faceIcons[faceIconIndex];

  const handleConfirmRetry = async () => {
    console.log("[result] retry clicked", {
      questionsLength: questions?.length,
      hasResults: Boolean(results),
      hasSelected: Boolean(selectedAnswers),
      sessionId,
    });
    const newSessionId = createSessionId();
    const startedAt = Date.now();
    setSession({
      questions: questions || [],
      testInfo: testInfo || null,
      results: null,
      selectedAnswers: new Array((questions || []).length).fill(null),
      sessionId: newSessionId,
      sessionStartedAt: startedAt,
    });
    sendTelemetry({
      eventType: "feature_used",
      sessionId,
      metadata: { feature: "retry" },
    });
    const telemetryResult = await sendTelemetry(
      {
        eventType: "session_start",
        sessionId: newSessionId,
        occurredAt: new Date(startedAt).toISOString(),
        metadata: {
          chapter: testInfo?.chapter,
          type: testInfo?.type,
          difficulty: testInfo?.difficulty,
          entry_point: "retry",
          question_count: questions?.length || 0,
          session_started_at: new Date(startedAt).toISOString(),
        },
      },
      { debug: true }
    );
    if (!telemetryResult?.ok) {
      console.warn("[telemetry] session_start (retry) 실패", telemetryResult);
    }
    setShowReSheet(false);
    // ensure state is updated before navigation
    setTimeout(() => router.push("/ontest"), 0);
  };

  const handleConfirmQuit = () => {
    setIsExiting(true);
    setShowQuitSheet(false);
    resetSession();
    router.push("/");
  };

  return (
    <>
      <header className="result-header">
        <img src={assets.homeIcon} alt="Home" className="home-icon" onClick={() => setShowQuitSheet(true)} />
        <h1>채점 결과</h1>
      </header>
      <div className="img-save-area" ref={imgSaveAreaRef}>
        <div className="result-page top-padding">
          <div className="result-page-img-save-area" ref={captureAreaRef}>
            <div className="result-page-top-content">
              <div className="result-page-top-content-left invisible">
                <img src={assets.logo} alt="Logo" className="img-logo" />
                <ScoreGauge value={correctCount} total={questions.length || 10} />
                <div className="result-data-container">
                  <div className="result-data-item-container border-right">
                    <div className="result-data-container-left">
                      <p className="result-data-item-title">틀린 문제</p>
                      <p className="black-text">{incorrectCount} / {questions.length}</p>
                    </div>
                  </div>
                  <div className="result-data-item-container">
                    <div className="result-data-container-right">
                      <p className="result-data-item-title">모르는 문제</p>
                      <p className="black-text">{unknownCount} / {questions.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="result-page-top-content-right">
                <ScoreGauge value={correctCount} total={questions.length || 10} />
              </div>
            </div>
            <div className="hidden-capture-black-area">
              <p>{testInfoString}</p>
              <div className="date-container">
                <p className="date">{new Date().toISOString().slice(0, 10)}</p>
              </div>
            </div>
          </div>
          <div className="result-page-top-content">
            <div className="result-page-top-content-left">
              <div className="result-icon-container">
                <ResultBadge correct={correctCount} total={questions.length || 1} />
              </div>
              <div className="result-data-container">
                <div className="result-data-item-container border-right">
                  <div className="result-data-container-left">
                    <p className="result-data-item-title">틀린 문제</p>
                    <p className="black-text">{incorrectCount} / {questions.length}</p>
                  </div>
                </div>
                <div className="result-data-item-container">
                  <div className="result-data-container-right">
                    <p className="result-data-item-title">모르는 문제</p>
                    <p className="black-text">{unknownCount} / {questions.length}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="result-page-top-content-right">
              <img src={faceIcon} alt="Face Icon" className="face-icon" />
            </div>
          </div>
          <div className="result-page-mid-content">
            <div className="result-page-mid-content-left">
              <span>정답 {correctCount} / {questions.length}</span>
            </div>
            <div className="result-page-mid-content-right" onClick={handleSaveResult} role="button" tabIndex={0}>
              <span>
                결과 저장
                <img src={assets.saveIcon} alt="save" className="save-icon" />
              </span>
            </div>
          </div>
          <div className="test-info">
            <p>{testInfoString}</p>
            <p className="light-text">{new Date().toISOString().slice(0, 10)}</p>
          </div>
          <div className="result-title">문항별 해설</div>
          <div className="result-page-container">
            {questions.map((question, index) => {
              const isCorrect = results[index]?.isCorrect;
              const isUnknown = selectedAnswers[index] === "모르겠어요";
              return (
                <div
                  key={question.index}
                  className={`question-result ${index === questions.length - 1 ? "last-result" : ""}`}
                >
                  <div className="question-result-header">
                    <img
                      src={isCorrect ? assets.rightAnswerMark : assets.wrongAnswerMark}
                      alt={isCorrect ? "right" : "wrong"}
                      className="answer-mark"
                    />
                    <h3 className="result-title">
                      {question.index}. {renderOptionText(question.question || "")}
                    </h3>
                  </div>
                  {question.passage && (
                    <div className="passage-container">
                      <p className="passage">{renderOptionText(question.passage)}</p>
                      {question.passage_kor && (
                        <p className="passage-kor">{renderOptionText(question.passage_kor)}</p>
                      )}
                    </div>
                  )}

                  <div className="options-container">
                    {question.options.map((option, optionIdx) => {
                      const optionKey = `${question.index}-${optionIdx}`;
                      const optionLabel = optionIdx < 4 ? String.fromCharCode(65 + optionIdx) : "?";
                      return (
                        <button
                          key={optionKey}
                          className={`option-button ${
                            option === question.answer ? "right-answer" : ""
                          } ${selectedAnswers[index] === option && !isCorrect ? "wrong-answer" : ""}`}
                          disabled
                        >
                          <span className="option-number">{optionLabel}</span>
                          <span className="option-text">{renderOptionText(option)}</span>
                          {selectedAnswers[index] === option && isCorrect && (
                            <img src={assets.rightAnswerIcon} alt="정답" className="right-answer-icon" />
                          )}
                          {selectedAnswers[index] === option && !isCorrect && !isUnknown && (
                            <img src={assets.wrongAnswerIcon} alt="오답" className="wrong-answer-icon" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {question.vocabulary && typeof question.vocabulary === "string" && question.vocabulary.trim() !== "" && (
                    <div className="vocabulary-container">
                      <p className="vocabulary-title">어휘 설명</p>
                      <p className="vocabulary-content">{renderOptionText(question.vocabulary)}</p>
                    </div>
                  )}
                  <div className="explanation-container">
                    <div className="explanation-container-left-border"></div>
                    <p className="explanation-title">문제 해설</p>
                    <p className="explanation-content">{renderOptionText(question.explanation || "")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showQuitSheet && (
        <HomeBottomSheet
          onQuit={handleConfirmQuit}
          onClose={() => setShowQuitSheet(false)}
          handleOutsideClick={() => setShowQuitSheet(false)}
        />
      )}
      {showReSheet && (
        <ReBottomSheet
          onRetry={handleConfirmRetry}
          onClose={() => setShowReSheet(false)}
          handleOutsideClick={() => setShowReSheet(false)}
        />
      )}
      <div className="next-button-container">
        <button className="next-button-test" onClick={() => setShowReSheet(true)}>
          다시 풀기
        </button>
      </div>
    </>
  );
}
