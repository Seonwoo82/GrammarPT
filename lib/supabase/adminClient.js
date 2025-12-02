import { createClient } from "@supabase/supabase-js";

let adminClient = null;

export const getSupabaseAdminClient = () => {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 필요합니다.");
  }

  adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

  return adminClient;
};
