import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

let cachedAccessCode = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const fetchActiveAccessCode = async () => {
  const now = Date.now();
  if (cachedAccessCode && now - cachedAt < CACHE_TTL_MS) {
    return cachedAccessCode;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("access_codes")
    .select("id, code_hash, is_active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`액세스 코드 정보를 불러오지 못했습니다: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  cachedAccessCode = data;
  cachedAt = now;
  return data;
};

export const verifyAccessCode = async (codeInput) => {
  if (!codeInput) {
    return null;
  }

  const activeCode = await fetchActiveAccessCode();
  if (!activeCode || !activeCode.is_active) {
    return null;
  }

  const isMatch = await bcrypt.compare(codeInput, activeCode.code_hash);
  return isMatch ? activeCode.id : null;
};

export const issueSessionToken = async (codeId) => {
  if (!codeId) {
    throw new Error("유효하지 않은 코드 ID입니다.");
  }
  const supabase = getSupabaseAdminClient();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("access_code_sessions").insert({
    token,
    code_id: codeId,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`세션 토큰 발급에 실패했습니다: ${error.message}`);
  }

  return { token, expiresAt };
};

export const validateSessionToken = async (token) => {
  if (!token) {
    return null;
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("access_code_sessions")
    .select("id, code_id, expires_at, revoked_at")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.revoked_at) {
    return null;
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return data;
};

export const revokeSessionToken = async (token) => {
  if (!token) {
    return;
  }
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("access_code_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token", token);
};
