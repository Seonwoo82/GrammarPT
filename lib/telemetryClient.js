const USER_STORAGE_KEY = "grammarpt_user_id";
const SESSION_STORAGE_KEY = "grammarpt_session_id";

const safeRandomUUID = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      // RFC4122 v4 variant conversion
      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;
      const toHex = (n) => n.toString(16).padStart(2, "0");
      const segments = [
        [...buf.slice(0, 4)].map(toHex).join(""),
        [...buf.slice(4, 6)].map(toHex).join(""),
        [...buf.slice(6, 8)].map(toHex).join(""),
        [...buf.slice(8, 10)].map(toHex).join(""),
        [...buf.slice(10, 16)].map(toHex).join(""),
      ];
      return segments.join("-");
    }
  } catch (error) {
    console.warn("safeRandomUUID 실패, timestamp fallback 사용", error);
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getOrCreateUserId = () => {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(USER_STORAGE_KEY);
  if (existing) return existing;
  const generated = safeRandomUUID();
  window.localStorage.setItem(USER_STORAGE_KEY, generated);
  return generated;
};

const getOrCreateSessionId = () => {
  if (typeof window === "undefined") return null;
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const generated = safeRandomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
};

export const createSessionId = () => safeRandomUUID();

export const sendTelemetry = async (payload) => {
  try {
    const fallbackSessionId = getOrCreateSessionId();
    const sessionId = payload.sessionId || fallbackSessionId;
    const userId = payload.userId || getOrCreateUserId() || sessionId || safeRandomUUID();
    const body = { ...payload, userId, sessionId };
    const response = await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn("telemetry send 실패: bad response", { status: response.status, body: errorText });
    }
  } catch (error) {
    // 베스트 에포트: 사용자 동선을 막지 않음
    console.warn("telemetry send 실패:", error);
  }
};
