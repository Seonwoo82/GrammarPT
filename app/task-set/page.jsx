"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChapterSelect from "../components/ChapterSelect.jsx";
import TypeSelect from "../components/TypeSelect.jsx";
import DiffSelect from "../components/DiffSelect.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";
import { useTestSession } from "../context/TestSessionContext.jsx";
import { createSessionId, sendTelemetry } from "@/lib/telemetryClient.js";

const backBtn = "/assets/left_btn.png";

export default function TaskSetPage() {
  const router = useRouter();
  const { setSession } = useTestSession();
  const [currentStep, setCurrentStep] = useState("chapter");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDiff, setSelectedDiff] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (currentStep === "type") {
      setCurrentStep("chapter");
    } else if (currentStep === "diff") {
      setCurrentStep("type");
    } else {
      router.push("/");
    }
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setCurrentStep("type");
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setCurrentStep("diff");
  };

  const handleDiffSelect = async (diff) => {
    setSelectedDiff(diff);
    setCurrentStep("final");
    setIsLoading(true);

    const testInfo = {
      chapter: selectedChapter.id,
      type: selectedType,
      difficulty: diff,
    };

    const payload = {
      user_input: [
        selectedChapter.id,
        selectedChapter.types.find((typeItem) => typeItem.name === selectedType)?.name || selectedType,
        diff,
      ],
      test_info: testInfo,
    };

    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sessionId = createSessionId();
      const sessionStartedAt = Date.now();
      setSession({
        questions: data,
        testInfo,
        results: null,
        selectedAnswers: null,
        sessionId,
        sessionStartedAt,
      });
      await sendTelemetry({
        eventType: "session_start",
        sessionId,
        occurredAt: new Date(sessionStartedAt).toISOString(),
        metadata: {
          chapter: selectedChapter.id,
          type: selectedType,
          difficulty: diff,
          entry_point: "self",
          question_count: Array.isArray(data) ? data.length : 0,
          session_started_at: new Date(sessionStartedAt).toISOString(),
        },
      });
      router.push("/ontest");
    } catch (error) {
      console.error("오류 발생:", error);
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        if (window.confirm("서버에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.")) {
          router.push("/");
        }
      } else if (window.confirm("오류가 발생했습니다. 잠시 후 다시 시도해주세요.")) {
        router.push("/");
      }
      setCurrentStep("diff");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <div id="back_header_container">
        <div id="back_header" onClick={handleBack} tabIndex={0} aria-label="이전 페이지로 이동">
          <img src={backBtn} alt="backBtn" id="backBtn" />
          <p>이전</p>
        </div>
      </div>
      <div className="app-container">
        {currentStep === "chapter" && (
          <ChapterSelect onNext={handleChapterSelect} initialSelectedChapter={selectedChapter} />
        )}
        {currentStep === "type" && selectedChapter && (
          <TypeSelect
            onNext={handleTypeSelect}
            selectedType={selectedType}
            initialSelectedType={selectedType}
            types={selectedChapter.types}
          />
        )}
        {currentStep === "diff" && selectedType && (
          <DiffSelect onNext={handleDiffSelect} difficulty={["높음", "보통", "낮음"]} selectedType={selectedType} />
        )}
      </div>
    </>
  );
}
