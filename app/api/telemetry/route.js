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

const normalizePayload = (body) => {
  const eventType = String(body?.eventType || "").trim();
  const userId = body?.userId?.toString().trim();
  const sessionId = body?.sessionId?.toString().trim() || null;
  const occurredAt = body?.occurredAt ? new Date(body.occurredAt).toISOString() : new Date().toISOString();
  const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    throw new Error(`eventType이 필요하거나 허용되지 않았습니다. (허용 값: ${[...ALLOWED_EVENT_TYPES].join(", ")})`);
  }

  if (!userId) {
    throw new Error("userId가 필요합니다.");
  }

  return {
    event_type: eventType,
    user_id: userId,
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
