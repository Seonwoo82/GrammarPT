"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TestHeader from "../components/TestHeader.jsx";
import QuestionComponent from "../components/QuestionComponent.jsx";
import OnCheck from "../components/OnCheck.jsx";
import { useTestSession } from "../context/TestSessionContext.jsx";
import { sendTelemetry } from "@/lib/telemetryClient.js";

const submitIcon = "/assets/check.png";

export default function TestPage() {
  const router = useRouter();
  const { questions, testInfo, setSession, sessionId, sessionStartedAt } = useTestSession();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [answerMeta, setAnswerMeta] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnCheck, setShowOnCheck] = useState(false);
  const [questionStartAt, setQuestionStartAt] = useState(Date.now());

  useEffect(() => {
    if (!questions || !Array.isArray(questions)) {
      console.warn("[ontest] no questions found, redirecting to /error", {
        hasQuestions: Boolean(questions),
        isArray: Array.isArray(questions),
        sessionId,
      });
      if (!sessionId) {
        router.replace("/");
      } else {
        router.replace("/error");
      }
      return;
    }

    setSelectedAnswers(new Array(questions.length).fill(null));
    setAnswerMeta(new Array(questions.length).fill(null).map(() => ({
      firstSelectedAt: null,
      lastSelectedAt: null,
      firstAnswer: null,
      changed: false,
    })));
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
      const meta = answerMeta?.[questionIdx] || {};
      const dwellMs = meta.lastSelectedAt && meta.firstSelectedAt ? Math.max(0, meta.lastSelectedAt - meta.firstSelectedAt) : null;

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
          first_answer: meta.firstAnswer,
          first_selected_at: meta.firstSelectedAt ? new Date(meta.firstSelectedAt).toISOString() : undefined,
          last_selected_at: meta.lastSelectedAt ? new Date(meta.lastSelectedAt).toISOString() : undefined,
          dwell_ms: dwellMs,
        },
      });

      sendTelemetry({
        eventType: "self_correction",
        sessionId,
        metadata: {
          question_index: question.index ?? questionIdx + 1,
          changed_before_submit: Boolean(meta.changed),
          first_answer: meta.firstAnswer,
          final_answer: answer,
          correction_duration_ms: dwellMs,
          total_questions: questions.length,
          chapter: testInfo?.chapter,
          type: testInfo?.type,
          difficulty: testInfo?.difficulty,
        },
      });
      if (meta.changed && dwellMs != null) {
        sendTelemetry({
          eventType: "correction_duration",
          sessionId,
          metadata: {
            question_index: question.index ?? questionIdx + 1,
            duration_ms: dwellMs,
            chapter: testInfo?.chapter,
            type: testInfo?.type,
            difficulty: testInfo?.difficulty,
          },
        });
      }
    },
    [answerMeta, currentQuestionIndex, questionStartAt, questions, selectedAnswers, sessionId, testInfo]
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
    setAnswerMeta((prev) => {
      const now = Date.now();
      const meta = [...prev];
      const current = { ...(meta[currentQuestionIndex] || {}) };
      if (!current.firstSelectedAt) {
        current.firstSelectedAt = now;
        current.firstAnswer = answer;
      } else if (current.firstAnswer && current.firstAnswer !== answer) {
        current.changed = true;
      }
      current.lastSelectedAt = now;
      meta[currentQuestionIndex] = current;
      return meta;
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

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isNextDisabled = !selectedAnswers[currentQuestionIndex];

  return (
    <div className="test-page">
      <TestHeader />
      <div className="test-body">
        <div className="question-nav-bar">
          <div className="nav-prev">
            {currentQuestionIndex > 0 ? (
              <button className="nav-text-button" onClick={handleBack} aria-label="이전 문제로 이동">
                &lt; 이전
              </button>
            ) : (
              <span />
            )}
          </div>
          <button
            onClick={handleNext}
            className="nav-text-button nav-text-button-primary"
            disabled={isNextDisabled}
            aria-label={isLastQuestion ? "제출하기" : "다음 문제로 이동"}
          >
            {isLastQuestion ? (
              <span className="nav-submit-label">
                제출
                <img src={submitIcon} alt="제출" className="submit-icon" />
              </span>
            ) : (
              "다음 >"
            )}
          </button>
        </div>
        <QuestionComponent
          key={currentQuestionIndex}
          question={questions[currentQuestionIndex]}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
        />
      </div>
    </div>
  );
}
