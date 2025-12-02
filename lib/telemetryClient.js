const STORAGE_KEY = "grammarpt_user_id";

const getOrCreateUserId = () => {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
};

export const createSessionId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);

export const sendTelemetry = async (payload) => {
  try {
    const userId = payload.userId || getOrCreateUserId();
    const body = {
      ...payload,
      userId,
    };
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // 베스트 에포트: 사용자 동선을 막지 않음
    console.warn("telemetry send 실패:", error);
  }
};
