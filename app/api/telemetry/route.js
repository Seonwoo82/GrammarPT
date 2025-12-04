import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

const ALLOWED_EVENT_TYPES = new Set([
  "session_start",
  "session_complete",
  "question_answered",
  "difficulty_progression",
  "feature_used",
  "share_sent",
  "self_correction",
  "correction_duration",
  "notification_sent",
  "notification_engaged",
  "cohort_snapshot",
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const makeServerUuid = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (error) {
    console.warn("[telemetry] server uuid 생성 실패, fallback 사용", error);
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const normalizeUuid = (value) => {
  const trimmed = value?.toString().trim();
  if (!trimmed || !UUID_REGEX.test(trimmed)) return null;
  return trimmed;
};

const normalizePayload = (body) => {
  const eventType = String(body?.eventType || "").trim();
  const rawUserId = body?.userId;
  const rawSessionId = body?.sessionId;
  const occurredAt = body?.occurredAt ? new Date(body.occurredAt).toISOString() : new Date().toISOString();
  const metadata = body?.metadata && typeof body.metadata === "object" ? { ...body.metadata } : {};

  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    throw new Error(`eventType이 필요하거나 허용되지 않았습니다. (허용 값: ${[...ALLOWED_EVENT_TYPES].join(", ")})`);
  }

  const normalizedSessionId = normalizeUuid(rawSessionId);
  const normalizedUserId = normalizeUuid(rawUserId) || normalizedSessionId || makeServerUuid();
  const sessionId = normalizedSessionId || normalizedUserId;

  if (!normalizedSessionId && rawSessionId) {
    metadata._client_session_id = rawSessionId;
  }
  if (!normalizeUuid(rawUserId) && rawUserId) {
    metadata._client_user_id = rawUserId;
  }

  return {
    event_type: eventType,
    user_id: normalizedUserId,
    session_id: sessionId,
    occurred_at: occurredAt,
    metadata,
  };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const eventRow = normalizePayload(body);
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("behavior_events").insert(eventRow).select("id").single();

    if (error) {
      console.error("[telemetry] insert 실패", error);
      throw error;
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    const message = error?.message || "telemetry 기록 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
