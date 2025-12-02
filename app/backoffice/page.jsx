"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const fmt = new Intl.NumberFormat("ko-KR");
const pct = (v) => (v == null ? "-" : `${(v * 100).toFixed(1)}%`);
const dateFmt = (v) => v ? new Date(v).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "-";

const useMetrics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const load = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const qs = params ? `?${params.toString()}` : "";
      const res = await fetch(`/api/admin/metrics${qs}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  return { loading, error, data, load };
};

export default function BackofficeDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [rangeError, setRangeError] = useState("");
  const defaultTo = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, []);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const { data, loading, error, load } = useMetrics();
  const initialParams = useMemo(() => {
    const params = new URLSearchParams();
    if (defaultFrom) params.set("from", defaultFrom);
    if (defaultTo) params.set("to", defaultTo);
    return params;
  }, [defaultFrom, defaultTo]);

  const buildRangeParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    return params;
  }, [dateFrom, dateTo]);

  const reloadWithRange = useCallback(() => {
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      setRangeError("시작일이 종료일보다 늦습니다.");
      return;
    }
    setRangeError("");
    return load(buildRangeParams());
  }, [buildRangeParams, dateFrom, dateTo, load]);

  useEffect(() => {
    (async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/admin/access", { credentials: "include" });
        const json = await res.json();
        if (json.authorized) { setAuthorized(true); load(initialParams); }
      } finally { setChecking(false); }
    })();
  }, [initialParams, load]);

  const login = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setAuthErr("코드를 입력하세요"); return; }
    setAuthLoading(true); setAuthErr("");
    try {
      const res = await fetch("/api/admin/access", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ code })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "인증 실패");
      setAuthorized(true); setCode(""); load();
    } catch (e) { setAuthErr(e.message); }
    finally { setAuthLoading(false); }
  };

  const logout = async () => {
    await fetch("/api/admin/access", { method: "DELETE", credentials: "include" });
    setAuthorized(false);
  };

  const snap = data?.kpiSnapshot;
  const trend = useMemo(() => (data?.stickinessTrend || []).slice().reverse(), [data]);
  const dauData = useMemo(() => trend.map(t => t.dau || 0), [trend]);
  const voluntary = useMemo(() => (data?.voluntaryReuse || []).slice(0, 5), [data]);
  const volData = useMemo(() => voluntary.slice().reverse().map(v => v.voluntary_sessions || 0), [voluntary]);
  const share = useMemo(() => (data?.shareRates || []).slice().reverse(), [data]);
  const shareData = useMemo(() => share.map(s => (s.share_ratio || 0) * 100), [share]);
  const persist = useMemo(() => (data?.persistence || []).slice(0, 5), [data]);
  const effort = useMemo(() => (data?.effortUplift || []).slice(0, 5), [data]);
  const features = useMemo(() => (data?.featureStickiness || []).slice(0, 5), [data]);
  const selfCorr = useMemo(() => (data?.selfCorrection || []).slice(0, 5), [data]);
  const cohort = useMemo(() => {
    if (!data?.cohortRetention) return [];
    const map = new Map();
    data.cohortRetention.forEach(item => {
      const k = `${item.cohort_week}-${item.grade}`;
      if (!map.has(k)) map.set(k, { cohort_week: item.cohort_week, grade: item.grade, w4: "-", w8: "-" });
      const e = map.get(k);
      const r = item.active_users ? item.retained_users / item.active_users : 0;
      if (item.week_offset === 4) e.w4 = pct(r);
      if (item.week_offset === 8) e.w8 = pct(r);
    });
    return Array.from(map.values()).sort((a, b) => b.cohort_week - a.cohort_week).slice(0, 6);
  }, [data]);

  const dauWau = snap?.dau_wau_ratio ? snap.dau_wau_ratio * 100 : 0;
  const wauMau = snap?.wau_mau_ratio ? snap.wau_mau_ratio * 100 : 0;

  if (checking) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner} />
    </div>
  );

  if (!authorized) return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <div style={styles.loginLogo}>📊</div>
        <h1 style={styles.loginTitle}>GrammarPT Admin</h1>
        <form onSubmit={login}>
          <input
            type="password"
            placeholder="Access Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            style={styles.loginInput}
          />
          {authErr && <p style={styles.loginError}>{authErr}</p>}
          <button type="submit" disabled={authLoading} style={styles.loginButton}>
            {authLoading ? "..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );


  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>📊</div>
          <span style={styles.logoText}>GrammarPT Analytics</span>
        </div>
        <nav style={styles.nav}>
          <span style={styles.navItemActive}>Dashboard</span>
        </nav>
        <div style={styles.headerRight}>
          <button onClick={reloadWithRange} disabled={loading} style={styles.refreshBtn}>
            {loading ? "⏳" : "🔄"} Refresh
          </button>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}
      <div style={styles.filterBar}>
        <div style={styles.dateInputs}>
          <div style={styles.filterField}>
            <span style={styles.filterLabel}>시작일</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={styles.dateInput} />
          </div>
          <div style={styles.filterField}>
            <span style={styles.filterLabel}>종료일</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={styles.dateInput} />
          </div>
        </div>
        <div style={styles.filterActions}>
          {rangeError && <span style={styles.rangeError}>{rangeError}</span>}
          <button onClick={reloadWithRange} style={styles.applyBtn} disabled={loading}>기간 적용</button>
        </div>
      </div>

      <main style={styles.main}>
        {/* Row 1: KPI Cards */}
        <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Total DAU</span>
              <span style={styles.kpiIcon}>👤</span>
            </div>
            <div style={styles.kpiValue}>{fmt.format(snap?.dau || 0)}</div>
            <div style={styles.kpiSub}>일간 활성 사용자</div>
            <div style={styles.sparkContainer}>
              {dauData.slice(-7).map((v, i) => {
                const max = Math.max(...dauData.slice(-7)) || 1;
                return <div key={i} style={{...styles.sparkBar, height: `${Math.max((v/max)*100, 10)}%`, backgroundColor: '#E66041'}} />;
              })}
            </div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>WAU</span>
              <span style={styles.kpiIcon}>👥</span>
            </div>
            <div style={styles.kpiValue}>{fmt.format(snap?.wau || 0)}</div>
            <div style={styles.kpiSub}>주간 활성 사용자</div>
            <div style={styles.sparkContainer}>
              {volData.slice(-7).map((v, i) => {
                const max = Math.max(...volData.slice(-7)) || 1;
                return <div key={i} style={{...styles.sparkBar, height: `${Math.max((v/max)*100, 10)}%`, backgroundColor: '#F08A6E'}} />;
              })}
            </div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>DAU/WAU</span>
              <span style={styles.kpiIcon}>📈</span>
            </div>
            <div style={{...styles.kpiValue, color: '#E66041'}}>{pct(snap?.dau_wau_ratio)}</div>
            <div style={styles.kpiSub}>사용자 결속도</div>
            <Donut value={dauWau} color="#E66041" />
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>WAU/MAU</span>
              <span style={styles.kpiIcon}>📅</span>
            </div>
            <div style={{...styles.kpiValue, color: '#F08A6E'}}>{pct(snap?.wau_mau_ratio)}</div>
            <div style={styles.kpiSub}>월간 대비 주간</div>
            <Donut value={wauMau} color="#F08A6E" />
          </div>
        </div>

        {/* Row 2: Charts */}
        <div style={styles.chartRow}>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>DAU 추이</div>
            <div style={styles.chartSub}>최근 일간 활성 사용자 변화</div>
            <div style={styles.barChartContainer}>
              {dauData.map((v, i) => {
                const max = Math.max(...dauData) || 1;
                return (
                  <div key={i} style={styles.barWrapper}>
                    <div style={styles.barValue}>{v > 999 ? `${(v/1000).toFixed(0)}K` : v}</div>
                    <div style={{...styles.bar, height: `${Math.max((v/max)*100, 5)}%`, backgroundColor: '#E66041'}} />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>자발 세션</div>
            <div style={styles.chartSub}>사용자 주도 학습 세션</div>
            <div style={styles.barChartContainer}>
              {volData.map((v, i) => {
                const max = Math.max(...volData) || 1;
                return (
                  <div key={i} style={styles.barWrapper}>
                    <div style={styles.barValue}>{v > 999 ? `${(v/1000).toFixed(0)}K` : v}</div>
                    <div style={{...styles.bar, height: `${Math.max((v/max)*100, 5)}%`, backgroundColor: '#F08A6E'}} />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>공유율</div>
            <div style={styles.chartSub}>유기적 공유 비율 추이</div>
            <div style={styles.lineChartContainer}>
              <svg width="100%" height="140" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="shareGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E66041" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#E66041" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {shareData.length > 0 && (() => {
                  const max = Math.max(...shareData) || 1;
                  const min = Math.min(...shareData);
                  const range = max - min || 1;
                  const pts = shareData.map((v, i) => ({
                    x: 20 + (i / Math.max(shareData.length - 1, 1)) * 260,
                    y: 20 + (1 - (v - min) / range) * 100
                  }));
                  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const area = `${line} L ${pts[pts.length-1].x} 120 L ${pts[0].x} 120 Z`;
                  return (
                    <>
                      <path d={area} fill="url(#shareGrad)" />
                      <path d={line} fill="none" stroke="#E66041" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#E66041" strokeWidth="2.5" />)}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>


        {/* Row 3: Donut + Table */}
        <div style={styles.splitRow}>
          <div style={styles.donutCard}>
            <div style={styles.chartTitle}>결속도 지표</div>
            <div style={styles.donutRow}>
              <BigDonut value={dauWau} label="DAU/WAU" color="#E66041" />
              <BigDonut value={wauMau} label="WAU/MAU" color="#F08A6E" />
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div style={styles.chartTitle}>지속성 분석</div>
              <div style={styles.chartSub}>연속 4회 이상 학습 사용자</div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>주차</th>
                  <th style={styles.th}>연속 비율</th>
                  <th style={styles.th}>연속 이용자</th>
                  <th style={styles.th}>주간 활성</th>
                </tr>
              </thead>
              <tbody>
                {persist.map((r, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{dateFmt(r.week_start)}</td>
                    <td style={styles.td}>
                      <div style={styles.progressCell}>
                        <div style={styles.progressBg}>
                          <div style={{...styles.progressFill, width: `${(r.streak_ratio||0)*100}%`}} />
                        </div>
                        <span style={styles.progressText}>{pct(r.streak_ratio)}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{fmt.format(r.streak_users || 0)}</td>
                    <td style={styles.td}>{fmt.format(r.total_active || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: Two Progress Tables */}
        <div style={styles.twoColRow}>
          <div style={styles.progressCard}>
            <div style={styles.progressCardHeader}>
              <div>
                <div style={styles.chartTitle}>자발적 재사용</div>
                <div style={styles.chartSub}>사용자 주도 세션 비율</div>
              </div>
              <div style={styles.bigStat}>
                <div style={{...styles.bigStatValue, color: '#E66041'}}>{pct(voluntary[0]?.voluntary_ratio)}</div>
                <div style={styles.bigStatLabel}>최근 주</div>
              </div>
            </div>
            <div style={styles.progressList}>
              {voluntary.map((r, i) => (
                <div key={i} style={styles.progressItem}>
                  <span style={styles.progressLabel}>{dateFmt(r.week_start)}</span>
                  <div style={styles.progressBarBg}>
                    <div style={{...styles.progressBarFill, width: `${(r.voluntary_ratio||0)*100}%`, background: 'linear-gradient(90deg, #E66041, #F08A6E)'}}>
                      <span style={styles.progressBarText}>{fmt.format(r.voluntary_sessions||0)} / {fmt.format(r.total_sessions||0)}</span>
                    </div>
                  </div>
                  <span style={{...styles.progressPercent, color: '#E66041'}}>{pct(r.voluntary_ratio)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.progressCard}>
            <div style={styles.progressCardHeader}>
              <div>
                <div style={styles.chartTitle}>노력 상승률</div>
                <div style={styles.chartSub}>학습 강도 증가 사용자</div>
              </div>
              <div style={styles.bigStat}>
                <div style={{...styles.bigStatValue, color: '#F08A6E'}}>{pct(effort[0]?.uplift_ratio)}</div>
                <div style={styles.bigStatLabel}>최근 주</div>
              </div>
            </div>
            <div style={styles.progressList}>
              {effort.map((r, i) => (
                <div key={i} style={styles.progressItem}>
                  <span style={styles.progressLabel}>{dateFmt(r.week_start)}</span>
                  <div style={styles.progressBarBg}>
                    <div style={{...styles.progressBarFill, width: `${(r.uplift_ratio||0)*100}%`, background: 'linear-gradient(90deg, #F08A6E, #F5A88E)'}}>
                      <span style={styles.progressBarText}>{fmt.format(r.uplift_users||0)} / {fmt.format(r.total_users||0)}</span>
                    </div>
                  </div>
                  <span style={{...styles.progressPercent, color: '#F08A6E'}}>{pct(r.uplift_ratio)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 5: Two Tables */}
        <div style={styles.twoColRow}>
          <div style={styles.simpleTableCard}>
            <div style={styles.tableHeader}>
              <div style={styles.chartTitle}>기능 고착도</div>
              <div style={styles.chartSub}>기능별 DAU 점유율</div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>날짜</th>
                  <th style={styles.th}>기능</th>
                  <th style={styles.th}>고착도</th>
                  <th style={styles.th}>DAU</th>
                </tr>
              </thead>
              <tbody>
                {features.map((r, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{dateFmt(r.usage_date)}</td>
                    <td style={{...styles.td, fontWeight: 600}}>{r.feature_key}</td>
                    <td style={styles.td}><span style={styles.badge}>{pct(r.feature_ratio)}</span></td>
                    <td style={styles.td}>{fmt.format(r.feature_dau || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.simpleTableCard}>
            <div style={styles.tableHeader}>
              <div style={styles.chartTitle}>자기 수정률</div>
              <div style={styles.chartSub}>스킬별 자기 교정 현황</div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>스킬</th>
                  <th style={styles.th}>시도</th>
                  <th style={styles.th}>수정률</th>
                  <th style={styles.th}>시간</th>
                </tr>
              </thead>
              <tbody>
                {selfCorr.map((r, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={{...styles.td, fontWeight: 600}}>{r.skill_id || "미지정"}</td>
                    <td style={styles.td}>{fmt.format(r.attempts || 0)}</td>
                    <td style={styles.td}><span style={{...styles.badge, backgroundColor: '#FEE9E5', color: '#E66041'}}>{pct(r.self_correction_rate)}</span></td>
                    <td style={styles.td}>{r.median_latency_seconds ? `${r.median_latency_seconds.toFixed(1)}초` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}


// ============================================
// Components
// ============================================
function Donut({ value, color }) {
  const pctVal = Math.min(Math.max(value || 0, 0), 100);
  const r = 20, stroke = 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pctVal / 100) * circ;
  return (
    <svg width="50" height="50" style={{ marginTop: 8 }}>
      <circle cx="25" cy="25" r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s' }} />
    </svg>
  );
}

function BigDonut({ value, label, color }) {
  const pctVal = Math.min(Math.max(value || 0, 0), 100);
  const r = 50, stroke = 12;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pctVal / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="130" height="130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.7s' }} />
        <text x="65" y="65" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 24, fontWeight: 800, fill: '#1f2937' }}>
          {pctVal.toFixed(0)}%
        </text>
      </svg>
      <span style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{label}</span>
    </div>
  );
}

// ============================================
// Styles
// ============================================
const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#E66041',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loginBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  loginLogo: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 32,
  },
  loginInput: {
    width: '100%',
    padding: '14px 18px',
    fontSize: 16,
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    marginBottom: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  loginError: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
  },
  loginButton: {
    width: '100%',
    padding: '14px 18px',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#E66041',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  page: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#E66041',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1f2937',
  },
  nav: {
    display: 'flex',
    gap: 8,
  },
  navItem: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'all 0.2s',
  },
  navItemActive: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#E66041',
    borderRadius: 8,
    cursor: 'pointer',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  refreshBtn: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
  },
  errorBanner: {
    margin: '16px 24px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: 12,
    fontSize: 14,
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    margin: '0 24px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    flexWrap: 'wrap',
  },
  dateInputs: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
  },
  dateInput: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f8fafc',
  },
  filterActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  rangeError: {
    color: '#dc2626',
    fontSize: 12,
  },
  applyBtn: {
    padding: '10px 14px',
    backgroundColor: '#E66041',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  main: {
    padding: 24,
    maxWidth: 1600,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },

  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  kpiIcon: {
    fontSize: 20,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: 800,
    color: '#1f2937',
    lineHeight: 1.1,
  },
  kpiSub: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  sparkContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
    marginTop: 16,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 3,
    transition: 'height 0.3s',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1f2937',
  },
  chartSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  barChartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    height: 140,
    marginTop: 20,
  },
  barWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    backgroundColor: '#E66041',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.3s',
  },
  lineChartContainer: {
    marginTop: 20,
  },
  splitRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 20,
  },
  donutCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  donutRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#f8fafc',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '14px 16px',
    color: '#4b5563',
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  progressBg: {
    width: 80,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E66041',
    borderRadius: 4,
    transition: 'width 0.5s',
  },
  progressText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4b5563',
  },
  twoColRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  progressCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  bigStat: {
    textAlign: 'right',
  },
  bigStatValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#E66041',
  },
  bigStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressList: {
    padding: '16px 24px',
  },
  progressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 60,
    flexShrink: 0,
  },
  progressBarBg: {
    flex: 1,
    height: 28,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #E66041, #F08A6E)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'width 0.5s',
  },
  progressBarText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: 700,
    color: '#E66041',
    width: 50,
    textAlign: 'right',
    flexShrink: 0,
  },
  simpleTableCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: '#FEE9E5',
    color: '#E66041',
    borderRadius: 20,
  },
  fullWidthCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
};
