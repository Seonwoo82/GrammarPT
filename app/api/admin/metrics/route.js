import { NextResponse } from "next/server";
import { validateSessionToken } from "@/lib/auth/validateAccessCode";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

const SESSION_COOKIE = "backoffice_session";

const fetchData = async (label, queryPromise) => {
  const { data, error } = await queryPromise;
  if (error) {
    throw new Error(`[${label}] ${error.message}`);
  }
  return data || [];
};

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const getDummyMetrics = () => {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const days = [...Array(7).keys()].map((i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return iso(d);
  });

  return {
    kpiSnapshot: {
      snapshot_date: iso(today),
      dau: 18,
      wau: 42,
      mau: 120,
      dau_wau_ratio: 18 / 42,
      wau_mau_ratio: 42 / 120,
    },
    stickinessTrend: days.map((date, idx) => ({
      snapshot_date: date,
      dau: [18, 22, 16, 20, 24, 19, 15][idx] || 12,
      wau: 42,
      mau: 120,
      dau_wau_ratio: 0.3 + idx * 0.01,
      wau_mau_ratio: 0.35 + idx * 0.005,
    })),
    persistence: days.map((date, idx) => ({
      week_start: date,
      streak_ratio: 0.45 + idx * 0.02,
      streak_users: 40 + idx * 3,
      total_active: 90 + idx * 4,
    })),
    voluntaryReuse: days.map((date, idx) => ({
      week_start: date,
      voluntary_ratio: 0.2 + idx * 0.015,
      voluntary_sessions: 25 + idx * 2,
      total_sessions: 80 + idx * 3,
    })),
    effortUplift: days.map((date, idx) => ({
      week_start: date,
      uplift_ratio: 0.35 + idx * 0.01,
      uplift_users: 30 + idx * 2,
      total_users: 90 + idx * 3,
    })),
    featureStickiness: days.map((date, idx) => ({
      usage_date: date,
      feature_key: "오답노트",
      feature_ratio: 0.25 + idx * 0.01,
      feature_dau: 20 + idx * 2,
      dau: 80 + idx * 3,
    })),
    shareRates: days.map((date, idx) => ({
      week_start: date,
      share_ratio: 0.12 + idx * 0.01,
      organic_shares: 10 + idx,
      active_users: 80 + idx * 2,
    })),
    cohortRetention: [
      { cohort_week: 24, grade: 3, week_offset: 4, active_users: 80, retained_users: 60 },
      { cohort_week: 24, grade: 3, week_offset: 8, active_users: 80, retained_users: 52 },
      { cohort_week: 25, grade: 4, week_offset: 4, active_users: 90, retained_users: 68 },
      { cohort_week: 25, grade: 4, week_offset: 8, active_users: 90, retained_users: 61 },
    ],
    selfCorrection: [
      { skill_id: "문법-시제", attempts: 120, self_correction_rate: 0.42, median_latency_seconds: 12 },
      { skill_id: "문법-조동사", attempts: 95, self_correction_rate: 0.38, median_latency_seconds: 15 },
      { skill_id: "독해-어휘", attempts: 80, self_correction_rate: 0.33, median_latency_seconds: 10 },
    ],
  };
};

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await validateSessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const useDummy =
      process.env.USE_DUMMY_METRICS === "true" ||
      request.nextUrl?.searchParams?.get("dummy") === "true";

    const rawFrom = request.nextUrl?.searchParams?.get("from");
    const rawTo = request.nextUrl?.searchParams?.get("to");
    const fromDate = normalizeDate(rawFrom);
    const toDate = normalizeDate(rawTo);

    if ((rawFrom && !fromDate) || (rawTo && !toDate)) {
      return NextResponse.json({ error: "날짜 파라미터가 올바르지 않습니다. (예: 2025-01-01)" }, { status: 400 });
    }
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      return NextResponse.json({ error: "시작일이 종료일 이후입니다." }, { status: 400 });
    }

    const withinRange = (dateStr) => {
      if (!dateStr) return true;
      const isoDate = normalizeDate(dateStr);
      if (!isoDate) return false;
      if (fromDate && isoDate < fromDate) return false;
      if (toDate && isoDate > toDate) return false;
      return true;
    };

    const applyDateFilter = (query, column) => {
      let q = query;
      if (fromDate) q = q.gte(column, fromDate);
      if (toDate) q = q.lte(column, toDate);
      return q;
    };

    if (useDummy) {
      const metrics = getDummyMetrics();
      const filterByRange = (arr, field) => arr.filter((item) => withinRange(item[field]));
      if (fromDate || toDate) {
        metrics.stickinessTrend = filterByRange(metrics.stickinessTrend, "snapshot_date");
        metrics.persistence = filterByRange(metrics.persistence, "week_start");
        metrics.voluntaryReuse = filterByRange(metrics.voluntaryReuse, "week_start");
        metrics.effortUplift = filterByRange(metrics.effortUplift, "week_start");
        metrics.featureStickiness = filterByRange(metrics.featureStickiness, "usage_date");
        metrics.shareRates = filterByRange(metrics.shareRates, "week_start");
      }
      return NextResponse.json(metrics);
    }

    const supabase = getSupabaseAdminClient();

    const kpiRows = await fetchData(
      "kpiSnapshot",
      applyDateFilter(
        supabase.from("daily_kpi_snapshots").select("*"),
        "snapshot_date"
      )
        .order("snapshot_date", { ascending: false })
        .limit(1)
    );
    const stickinessTrend = await fetchData(
      "stickinessTrend",
      applyDateFilter(
        supabase.from("daily_kpi_snapshots").select("*"),
        "snapshot_date"
      )
        .order("snapshot_date", { ascending: false })
        .limit(90)
    );
    const persistence = await fetchData(
      "sessionPersistence",
      applyDateFilter(
        supabase.from("admin_session_persistence_view").select("*"),
        "week_start"
      )
        .order("week_start", { ascending: false })
        .limit(24)
    );
    const voluntaryReuse = await fetchData(
      "voluntaryReuse",
      applyDateFilter(
        supabase.from("admin_voluntary_reuse_view").select("*"),
        "week_start"
      )
        .order("week_start", { ascending: false })
        .limit(24)
    );
    const effortUplift = await fetchData(
      "effortUplift",
      applyDateFilter(
        supabase.from("admin_effort_uplift_view").select("*"),
        "week_start"
      )
        .order("week_start", { ascending: false })
        .limit(24)
    );
    const featureStickiness = await fetchData(
      "featureStickiness",
      applyDateFilter(
        supabase.from("admin_feature_stickiness_view").select("*"),
        "usage_date"
      )
        .order("usage_date", { ascending: false })
        .limit(40)
    );
    const shareRates = await fetchData(
      "shareRates",
      applyDateFilter(
        supabase.from("admin_share_rate_view").select("*"),
        "week_start"
      )
        .order("week_start", { ascending: false })
        .limit(24)
    );
    const cohortRetention = await fetchData(
      "cohortRetention",
      applyDateFilter(
        supabase.from("retention_cohort_snapshots").select("*"),
        "snapshot_date"
      )
        .order("cohort_week", { ascending: false })
        .order("week_offset", { ascending: true })
        .limit(80)
    );
    const selfCorrection = await fetchData(
      "selfCorrection",
      supabase
        .from("admin_self_correction_view")
        .select("*")
        .order("self_correction_rate", { ascending: false })
        .limit(20)
    );

    return NextResponse.json({
      kpiSnapshot: kpiRows?.[0] || null,
      stickinessTrend,
      persistence,
      voluntaryReuse,
      effortUplift,
      featureStickiness,
      shareRates,
      cohortRetention,
      selfCorrection,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
