"use client";

import { useRouter } from "next/navigation";

const assets = {
  headerLogo: "/assets/logo_x4.png",
  footerLogo: "/assets/footer_logo.png",
  landingFirst: "/assets/landing_top.png",
  experienceLeft: "/assets/landing_man.png",
  landingSecond: "/assets/landing_training.png",
  checker: "/assets/checker.png",
  midBanner: "/assets/landing_mid_banner.png",
  mockup1: "/assets/mockup_1.png",
  mockup2: "/assets/mockup_2.png",
  bottomMidBanner: "/assets/bottom_mid_banner.png",
};

export default function LandingPage() {
  const router = useRouter();

  const handleStartFree = () => {
    router.push("/task-set");
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-logo">
          <img src={assets.headerLogo} alt="headerLogo" className="header__logo" />
        </div>
        <button className="start-free-button" onClick={handleStartFree}>
          <p>무료로 시작하기</p>
        </button>
      </header>

      <div className="landing-content">
        <section className="landing-first-section">
          <div className="landing-first-section-left">
            <h1 className="landing-first-section-title">
              당신만을 위한 영문법 트레이너
              <br />
              GrammarPT
            </h1>
            <p className="landing-first-section-subtitle">
              생성형 AI와 GrammarPT의 결합, 하루 다섯문제로 해결하는 영문법 트레이닝 솔루션
            </p>
            <button className="start-free-button" onClick={handleStartFree}>
              PT 시작하기
              <svg
                className="arrow-icon"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" />
              </svg>
            </button>
          </div>
          <div className="landing-first-section-right">
            <img
              src={assets.landingFirst}
              alt="landing-first-section-image"
              className="landing-first-section-image"
            />
          </div>
        </section>
      </div>

      <section className="landing-second-section">
        <div className="landing-content">
          <h2 className="landing-second-section-title">
            혹시 <span className="highlight"><span>이런 경험</span></span>을 해보셨나요?
          </h2>
          <div className="experience-box">
            <div className="experience-left">
              <p className="experience-category">중·고등학생</p>
              <h3 className="experience-title">
                반복되는 문제풀이가
                <br />
                지루해요
              </h3>
              <img
                src={assets.experienceLeft}
                alt="experience-left-image"
                className="experience-left-image"
                style={{ maxWidth: "220px" }}
              />
            </div>

            <div className="experience-right">
              <div className="experience-highlight-box">
                <p className="experience-highlight-text">같은 문제집과 기출문제 반복풀이</p>
              </div>
              <div className="experience-detail-box">
                <p className="experience-detail-text">
                  문제는 많이 푸는데 매 시험마다
                  <br />
                  똑같은 문법 문제를 반복해서 틀려요.
                </p>
              </div>
              <div className="experience-detail-box">
                <p className="experience-detail-text">
                  같은 유형의 문제를 반복 연습했는데
                  <br />
                  조금만 유형이 바뀌어도 혼란스러워요.
                </p>
              </div>
              <div className="experience-detail-box">
                <p className="experience-detail-text">
                  매일 똑같은 문제집 반복 풀이가 지루해요.
                  <br />
                  새로운 문제를 다양하게 풀고 싶어요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="where-section">
        <div className="landing-content">
          <h2 className="where-title">
            언제 어디서나
            <br />
            <span className="where-subtitle">문법 트레이닝이 필요하다면?</span>
          </h2>

          <div className="where-content">
            <div className="where-image">
              <img
                src={assets.landingSecond}
                alt="landing-second-section-image"
                className="landing-second-section-image"
              />
            </div>

            <div className="where-points">
              <img src={assets.checker} alt="checker" className="point-icon" />

              <div className="point-item">학교가는 길에도</div>
              <div className="point-item">학원 셔틀에서도</div>
              <div className="point-item bold-text">GrammarPT로 끝내는 중고등 영문법.</div>
            </div>
          </div>
          <div className="service-banner">
            GrammarGPT엔진/기술을 사용한 <strong>문법 AI 서비스, GrammarPT</strong>
          </div>
        </div>
      </section>

      <div className="mid-banner-container">
        <div className="banner-text-container">
          <p className="banner-text-primary">비효율적인 시간을 50% 줄이세요.</p>
          <p className="banner-text-secondary">
            딱 세번의 클릭으로 공부하고자 하는 영문법 챕터의 문제를 받아보세요.
          </p>
        </div>
        <img src={assets.midBanner} alt="mid-banner" className="mid-banner-image" />
      </div>
      <section className="mockup-section">
        <div className="landing-content">
          <div className="mockup-content">
            <div className="mockup-left">
              <button className="customizing-button">문제 커스터마이징</button>
              <p className="mockup-description">
                내가 원하는 패턴의
                <br />
                문제를 직접 고를 수 있어요.
              </p>
            </div>
            <div className="mockup-right">
              <img src={assets.mockup1} alt="mockup" className="mockup-image" />
            </div>
          </div>
        </div>
      </section>
      <section className="mockup-section2">
        <div className="landing-content">
          <div className="mockup-content">
            <div className="mockup-right">
              <img src={assets.mockup2} alt="mockup" className="mockup-image" />
            </div>
            <div className="mockup-left">
              <button className="customizing-button">AI 문제 생성 및 해설</button>
              <p className="mockup-description">
                생성형 AI 기반으로
                <br />
                매번 다양한 문제와 디테일한 해설을!
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="recommend-section">
        <p className="recommend-small-text">
          <span className="highlight-text">'5분'</span>만 있다면 GrammarPT를 이용해보세요.
        </p>

        <h2 className="recommend-title">이런 분들에게 추천드려요!</h2>

        <div className="divider-line"></div>

        <p className="recommend-tag">#Recommended</p>

        <div className="recommend-boxes">
          <div className="recommend-box">
            <img src={assets.checker} alt="checker" className="recommend-checker" />
            <p className="recommend-text">
              기초부터 수능까지 다양한 문법 패턴을 학습하고 싶은 <strong>학생</strong>
            </p>
          </div>

          <div className="recommend-box">
            <img src={assets.checker} alt="checker" className="recommend-checker" />
            <p className="recommend-text">
              내신에 자주 출제되는 문법을 반복 학습하고 싶은 <strong>학생</strong>
            </p>
          </div>

          <div className="recommend-box">
            <img src={assets.checker} alt="checker" className="recommend-checker" />
            <p className="recommend-text">
              같은 문제 반복풀이 그만! 다양한 문제를 풀고 싶은 <strong>학생</strong>
            </p>
          </div>
        </div>
      </section>
      <div className="mid-banner-container">
        <div className="banner-text-container">
          <p className="banner-text-secondary">GrammarPT와 함께 문법 트레이닝을 해보세요.</p>
        </div>
        <img src={assets.bottomMidBanner} alt="mid-banner" className="mid-banner-image" />
      </div>

      <div className="bottom-service-banner">
        <div className="bottom-service-content">
          <div className="banner-text-group">
            <h3 className="banner-title">더 궁금한 점이 있으신가요?</h3>
            <p className="banner-subtitle">
              상담을 통해 GrammarPT에 대해 더 자세히 알아보실 수 있어요.
            </p>
          </div>
          <button className="inquiry-button">이용문의</button>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <img src={assets.footerLogo} alt="GrammarPT" className="footer-logo" />
          <p className="footer-time">운영시간: 평일 09:00~18:00 (점심: 12:00~13:00)</p>
          <p className="footer-info">
            (주)코어잉글리시 | 대표. 홍길동 | 대표번호 02-123-4560 | 사업자등록번호 123-45-67890 |
            이메일 test@net.com | 주소. 서울특별시 강남구 강남로 123, 3층
          </p>
          <p className="footer-copyright">
            Copyright © CoreEnglish. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
