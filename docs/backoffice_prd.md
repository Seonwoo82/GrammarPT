# GrammarPT 백오피스(Tailwind 기반) PRD (현실화 버전)

## 1. 목적 및 현재 상태 점검
- 운영팀이 실제로 수집되는 데이터만으로 학습 현황을 파악할 수 있는 최소 대시보드를 유지한다.
- 현재 구현: 단일 대시보드 + 기간(Date Picker) 필터, Supabase access code 세션 기반 인증.
- 데이터 현실: 이벤트는 `session_start`, `question_answered`, `session_complete`, `share_sent` 위주로 `behavior_events`에만 적재된다. `student_sessions`, `feature_usage_daily`, `session_problem_attempts` 등 파생 테이블은 채워지지 않아 기존 stickiness/재사용/고착도/자기 수정 지표는 계산 불가 상태다.
- 익명 사용자 식별은 로컬스토리지 기반 `user_id`이므로 디바이스가 바뀌면 동일인 식별이 깨질 수 있다(리텐션 해석 시 주의).

## 2. 사용자 및 1차 니즈
| 사용자 | 현실적인 니즈 |
| --- | --- |
| 교육 운영 매니저 | 기간별 활성도, 세션 완료율, 정답/모름 비율을 보고 운영 캠페인 타이밍을 정함 |
| 콘텐츠/커리큘럼 팀 | 챕터·난이도별 정답률/모름률 분포를 보고 문항 품질 보완 |
| 경영진 | DAU/WAU/MAU 및 기본 stickiness 추세, 공유/저장 이벤트 추이를 주간으로 확인 |

## 3. 정보 아키텍처 (현재 UI)
1. 상단 헤더 + 기간 필터(시작일/종료일 Date Picker) + Refresh.
2. 대시보드: KPI 카드(DAU, WAU, DAU/WAU 등) + 트렌드 그래프 + 테이블.
3. 미구현/개선 필요: 탭 네비게이션, 세션/사용자 검색·필터, 세션 상세 드릴다운, 접근성/반응형 최적화.

## 4. 핵심 지표 (실측 가능 범위로 축소)
| 카테고리 | 지표 | 정의/공식 | 데이터 소스(필드) | UI/인터랙션 |
| --- | --- | --- | --- | --- |
| 활성/Stickiness | DAU/WAU/MAU, DAU/WAU | 기간 내 `session_start` 고유 `user_id` 집계 | `behavior_events.event_type='session_start'`, `user_id`, `occurred_at` | KPI 카드 + 라인/바 트렌드, 기간 필터 반영 |
| 세션 완료/소요시간 | 완료 세션 수, 중앙/평균 소요시간 | `session_complete` 건수, `session_duration_ms` 분포 | `session_complete.metadata.session_duration_ms`, `session_started_at` | KPI + 분포(바/박스), 기간 필터 |
| 정답 품질 | 평균 정답률, 모름률, 챕터/난이도별 정답률 | `question_answered` 기준 `is_correct`/`is_unknown` 비율 | `question_answered` 메타데이터: `chapter`, `type`, `difficulty`, `is_correct`, `is_unknown` | 테이블 + 스택 바, 필터: 챕터/난이도 |
| 콘텐츠 믹스 | 챕터/난이도별 세션 비중 | `session_start` 건수의 분포 | `session_start.metadata.chapter/type/difficulty` | 파이/바 차트 |
| 공유/저장 | 결과 저장/공유 이벤트 수 | `share_sent` 건수 및 채널 비중 | `share_sent.metadata.channel`, `type` | 파이/바 + 로그 테이블 |
| 재방문(단순) | 주차별 2회 이상 방문 사용자 비율 | 주차 내 2회 이상 `session_start` 사용자를 활성 사용자로 나눈 값 | `session_start` | 표/바 차트 (익명 ID 특성 감안) |

## 5. 삭제/보류 지표 (데이터 미존재)
- 자발적 재사용(알림/교사 vs 자발) : 알림/교사 유입을 기록하지 않아 분모/분자 모두 부정확 → 제외.
- 노력 상승률(easy→hard) : 세션 내 난이도 전환 이벤트 수집·문항 난이도 태깅 없음 → 제외.
- 기능 고착도(feature_usage_daily) : 기능 사용 이벤트 미수집 → 제외.
- 자기 수정률/수정 소요시간 : 수정 여부/시간 미수집 → 제외.
- 교사/부모 공유율 : 공유 recipient 타입/채널 미수집 → 제외.
- 학년/플랜/코호트 리텐션 : 가입/학년 메타데이터 미수집 → 제외.

## 6. 데이터 수집 & 파이프라인
- 수집 이벤트(`app/api/telemetry/route.js` → `behavior_events`):
  - `session_start`: `sessionId`, `chapter`, `type`, `difficulty`, `entry_point=self`, `question_count`, `session_started_at`.
  - `question_answered`: `question_index`, `selected_answer`, `correct_answer`, `is_correct`, `is_unknown`, `duration_ms`, `total_questions`, `chapter/type/difficulty`.
  - `session_complete`: `correct/incorrect/unknown_count`, `total_questions`, `session_started_at`, `session_completed_at`, `session_duration_ms`.
  - `share_sent`: `channel`(download 등), `type`.
- 알 수 없는 데이터: grade/plan/디바이스/알림 채널/teacher prompt 없음.
- ETL 필요: `behavior_events` → `student_sessions`, `session_problem_attempts`, `share_events`, `daily_kpi_snapshots`를 채우는 배치가 없다. 뷰(`admin_*`)와 백오피스 API는 현재 테이블 비어 있을 경우 빈 응답을 반환하므로, 최소 하루 배치 또는 실시간 function을 추가해야 한다.
- `/api/admin/metrics`는 `?from=YYYY-MM-DD&to=YYYY-MM-DD` 기간 필터를 지원하며 `daily_kpi_snapshots`, `admin_session_persistence_view`, `admin_voluntary_reuse_view`, `admin_effort_uplift_view`, `admin_feature_stickiness_view`, `admin_share_rate_view`, `retention_cohort_snapshots`에 필터를 적용한다.

## 7. 백오피스 공통 추적 항목(실제 수집 기준)
- 익명 사용자 ID(localStorage), `session_id`.
- 세션: `session_started_at`, `session_completed_at`, `session_duration_ms`, 챕터/타입/난이도, 총 문항 수.
- 문항: `question_index`, `selected_answer`, `correct_answer`, `is_correct`, `is_unknown`, `duration_ms`.
- 공유: 채널, 타입(download 등).
- (미수집) 학년/학교/플랜/디바이스/유입 채널, 알림/교사 유입 여부.

## 8. 권한/보안
- Supabase `access_codes` + `access_code_sessions` 기반 쿠키 세션. 활성 코드 해시(`Grammarpt2026!` 기본)와 12시간 만료.
- 서비스 키만 사용, 학생 이름 등 PII는 현재 미수집. 이후 PII 수집 시 마스킹/내보내기 권한 분리 필요.

## 9. 일정(재정렬)
| 주차 | 산출물 |
| --- | --- |
| W1 | 텔레메트리 확장(문항 이벤트, 세션 duration) 및 ETL 설계 |
| W2 | Supabase ETL/뷰 보완, 대시보드 쿼리 실제 데이터 연동 |
| W3 | UI 다중 탭/필터, QA & 접근성, 운영 가이드 |

## 10. 오픈 이슈
1. `behavior_events` → 파생 테이블/뷰로 채우는 job 미구현: stickiness/재방문/정답률 계산을 위해 필수.
2. 익명 `user_id`가 디바이스 전환 시 달라짐: 리텐션/재방문 해석 시 왜곡 가능. 안정적인 계정 ID 필요.
3. 공유 이벤트를 채널/수신자별로 확장하려면 UI+텔레메트리 추가가 필요하다.교사/부모 분리 수집 대기.
