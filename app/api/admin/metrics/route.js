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

const getDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const buildFallbackKpiFromEvents = (events, fromDate, toDate) => {
  if (!events || events.length === 0) return { kpiSnapshot: null, trend: [] };
  const dayMap = new Map();
  events.forEach((evt) => {
    const key = getDateKey(evt.occurred_at);
    if (!dayMap.has(key)) dayMap.set(key, new Set());
    dayMap.get(key).add(evt.user_id);
  });

  const dates = Array.from(dayMap.keys()).sort(); // ascending
  const trend = [];
  dates.forEach((date) => {
    const dateObj = new Date(date);
    const dauSet = dayMap.get(date);

    const wauWindowStart = new Date(dateObj);
    wauWindowStart.setDate(wauWindowStart.getDate() - 6);
    const mauWindowStart = new Date(dateObj);
    mauWindowStart.setDate(mauWindowStart.getDate() - 29);

    const wauSet = new Set();
    const mauSet = new Set();
    dates.forEach((d) => {
      const dObj = new Date(d);
      if (dObj >= wauWindowStart && dObj <= dateObj) {
        dayMap.get(d).forEach((u) => wauSet.add(u));
      }
      if (dObj >= mauWindowStart && dObj <= dateObj) {
        dayMap.get(d).forEach((u) => mauSet.add(u));
      }
    });

    const dau = dauSet.size;
    const wau = wauSet.size;
    const mau = mauSet.size;
    trend.push({
      snapshot_date: date,
      dau,
      wau,
      mau,
      dau_wau_ratio: wau ? dau / wau : 0,
      wau_mau_ratio: mau ? wau / mau : 0,
    });
  });

  // 최신 날짜 선택
  const latest = trend[trend.length - 1] || null;
  return { kpiSnapshot: latest, trend };
};

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await validateSessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

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
    const selfCorrection = await fetchData(
      "selfCorrection",
      supabase
        .from("admin_self_correction_view")
        .select("*")
        .order("self_correction_rate", { ascending: false })
        .limit(20)
    );

    let kpiSnapshot = kpiRows?.[0] || null;
    let stickinessTrend = stickinessTrendRaw;

    // Fallback: behavior_events에서 session_start로 DAU/WAU/MAU 추정
    if (!kpiSnapshot || Number(kpiSnapshot.dau || 0) === 0) {
      const fallbackFrom = fromDate || getDateKey(daysAgo(30));
      const fallbackTo = toDate || getDateKey(new Date());
      const beQuery = supabase
        .from("behavior_events")
        .select("user_id, occurred_at")
        .eq("event_type", "session_start")
        .gte("occurred_at", fallbackFrom)
        .lte("occurred_at", fallbackTo)
        .order("occurred_at", { ascending: true })
        .limit(5000);
      const { data: beData, error: beError } = await beQuery;
      if (!beError && beData) {
        const fallback = buildFallbackKpiFromEvents(beData, fallbackFrom, fallbackTo);
        if (fallback.kpiSnapshot) {
          kpiSnapshot = fallback.kpiSnapshot;
          stickinessTrend = fallback.trend.reverse(); // 최신순 정렬과 맞춤
        }
      }
    }

    return NextResponse.json({
      kpiSnapshot,
      stickinessTrend,
      persistence,
      voluntaryReuse,
      effortUplift,
      featureStickiness,
      // 기능 미수집으로 빈 배열 반환
      shareRates: shareRates || [],
      cohortRetention: [],
      selfCorrection,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
