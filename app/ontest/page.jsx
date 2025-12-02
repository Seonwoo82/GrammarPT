"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TestHeader from "../components/TestHeader.jsx";
import QuestionComponent from "../components/QuestionComponent.jsx";
import OnCheck from "../components/OnCheck.jsx";
import { useTestSession } from "../context/TestSessionContext.jsx";
import { sendTelemetry } from "@/lib/telemetryClient.js";

const backBtn = "/assets/left_btn.png";
const submitIcon = "/assets/check.png";

export default function TestPage() {
  const router = useRouter();
  const { questions, testInfo, setSession, sessionId, sessionStartedAt } = useTestSession();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnCheck, setShowOnCheck] = useState(false);
  const [questionStartAt, setQuestionStartAt] = useState(Date.now());

  useEffect(() => {
    if (!questions || !Array.isArray(questions)) {
      router.replace("/error");
      return;
    }

    setSelectedAnswers(new Array(questions.length).fill(null));
    setIsLoading(false);
  }, [questions, router]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      setQuestionStartAt(Date.now());
    }
  }, [questions]);

  useEffect(() => {
    setQuestionStartAt(Date.now());
  }, [currentQuestionIndex]);

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  };

  const logQuestionAnswer = useCallback(
    (index) => {
      const questionIdx = typeof index === "number" ? index : currentQuestionIndex;
      const question = questions?.[questionIdx];
      const answer = selectedAnswers?.[questionIdx];
      if (!question || !answer || !sessionId) return;

      const durationMs = Math.max(0, Date.now() - questionStartAt);

      sendTelemetry({
        eventType: "question_answered",
        sessionId,
        metadata: {
          question_index: question.index ?? questionIdx + 1,
          selected_answer: answer,
          correct_answer: question.answer,
          is_correct: answer === question.answer,
          is_unknown: answer === "모르겠어요",
          duration_ms: durationMs,
          total_questions: questions.length,
          chapter: testInfo?.chapter,
          type: testInfo?.type,
          difficulty: testInfo?.difficulty,
        },
      });
    },
    [currentQuestionIndex, questionStartAt, questions, selectedAnswers, sessionId, testInfo]
  );

  const handleNext = () => {
    logQuestionAnswer(currentQuestionIndex);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setQuestionStartAt(Date.now());
    } else {
      submitAnswers();
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  const submitAnswers = () => {
    const results = questions.map((question, index) => {
      const selectedAnswer = selectedAnswers[index];
      const correctAnswer = question.answer;
      return {
        isCorrect: selectedAnswer === correctAnswer,
        selectedAnswer,
        correctAnswer,
      };
    });

    setSession({
      results,
      selectedAnswers,
      testInfo,
      questions,
      sessionStartedAt,
    });
    setShowOnCheck(true);

    setTimeout(() => {
      setShowOnCheck(false);
      router.push("/result");
    }, 2700);
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (showOnCheck) {
    return <OnCheck />;
  }

  if (!questions || !Array.isArray(questions) || currentQuestionIndex >= questions.length) {
    return null;
  }

  return (
    <div className="test-page">
      <TestHeader />
      {currentQuestionIndex > 0 && (
        <div id="back_header_container">
          <div id="back_header" onClick={handleBack} tabIndex={0} aria-label="이전 문제로 이동">
            <img src={backBtn} alt="backBtn" id="backBtn" />
            <p>이전</p>
          </div>
        </div>
      )}
      <QuestionComponent
        key={currentQuestionIndex}
        question={questions[currentQuestionIndex]}
        selectedAnswer={selectedAnswers[currentQuestionIndex]}
        onAnswerSelect={handleAnswerSelect}
      />
      <div className="next-button-container">
        <button
          onClick={handleNext}
          className="next-button-test"
          disabled={!selectedAnswers[currentQuestionIndex]}
        >
          {currentQuestionIndex < questions.length - 1 ? (
            "다음 문제"
          ) : (
            <span>
              제출
              <img src={submitIcon} alt="제출" className="submit-icon" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
