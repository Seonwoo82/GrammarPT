"use client";

import { useState } from "react";

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
  const [openIndex, setOpenIndex] = useState(null);
  const [isOpenBetaModalOpen, setIsOpenBetaModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    title: "",
    name: "",
    contact: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState({
    sending: false,
    success: false,
    error: null,
  });

  const faqs = [
    {
      question: "GrammarPT도 문제은행 방식인가요?",
      answer:
        "아닙니다. GrammarPT는 모든 문장을 AI가 생성하며, 자체 출제 검증 엔진(특허출원 제 4-1-2025-5372016-42호)으로 검증-채점-해설이 이루어지는 순수 생성형 AI문항 시스템입니다.",
    },
    {
      question: "오픈베타는 언제까지인가요?",
      answer:
        "현재는 오픈베타로 운영 중이며, 2026년 3월 정식 전환을 목표로 준비하고 있습니다. 일정은 변동될 수 있으며 변동 시 사전 공지합니다.",
    },
    {
      question: "정식 전환 후에 무엇이 달라지나요?",
      answer:
        "학원용 운영 기능과 지원 체계를 정식 제공 형태로 정리합니다. 오픈베타에서 제공하던 기능은 정식 정책에 맞춰 범위와 조건을 확정하며, 학생용 무료 이용 범위/조건은 추후 확정합니다.",
    },
    {
      question: "요금제는 언제 공개되나요?",
      answer:
        "정식 전환 전까지 도입 상담/데모를 통해 운영 규모에 맞는 방식(예: API 실비 등)으로 안내드리고, 정식 전환 시점에 요금 정책을 확정 공지합니다. (공개 시점/플랜 구조는 추후 결정)",
    },
    {
      question: "학원에서 도입하면 어떤 형태로 사용하나요?",
      answer:
        "기본은 반/회차 단위 운영을 기준으로 문항 구성 → 배포 → 결과 확인 흐름으로 사용합니다. 실제 운영 방식은 학원 커리큘럼에 맞춰 정식 서비스 시 조정합니다.",
    },
    {
      question: "문항 품질은 어떻게 담보하나요?",
      answer:
        "GrammarPT는 AI 문항 생성에서 끝내지 않고, 자체 ‘검증 엔진’을 통해 오류 가능성을 줄이는 방향으로 설계합니다. 다만 AI 한계로 일부 오류가 발생할 확률은 존재합니다.",
    },
    {
      question: "학생 데이터/개인정보는 어떻게 처리하나요?",
      answer:
        "개인정보 처리방침에 따라 최소 수집·목적 내 사용 원칙으로 운영합니다. 정식 전환 시점에 저장 항목, 보관 기간, 삭제 요청 프로세스를 명확히 고지합니다. (보관 기간/삭제 정책은 추후 확정)",
    },
    {
      question: "도입까지 얼마나 걸리나요?",
      answer:
        "기본은 데모 확인 후, 학원 운영 방식(반 구성/과제 루틴)에 맞춰 온보딩을 진행합니다. 세부 일정은 학원 상황에 따라 조정됩니다.",
    },
    {
      question: "교재/커리큘럼에 맞춤 적용이 가능한가요?",
      answer:
        "학원 운영 기준(학년/난이도/유형/목표 문법 포인트)에 맞춰 적용 범위를 협의할 수 있습니다. 합의된 범위는 정식 전환 정책과 함께 확정됩니다.",
    },
    {
      question: "도입 문의는 어디로 하면 되나요?",
      answer:
        "페이지 상/하단의 도입 문의 버튼 또는 공식 문의 채널(전화/이메일)로 연락 주시면 됩니다.",
    },
  ];

  const handleInquiryOpen = () => {
    setIsContactModalOpen(true);
    setContactStatus({ sending: false, success: false, error: null });
  };

  const handleInquiryClose = () => {
    setIsContactModalOpen(false);
    setContactForm({ title: "", name: "", contact: "", message: "" });
  };

  const handleContactChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    if (contactStatus.sending) return;
    setContactStatus({ sending: true, success: false, error: null });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "문의 전송에 실패했습니다.");
      }
      setContactStatus({ sending: false, success: true, error: null });
    } catch (error) {
      setContactStatus({
        sending: false,
        success: false,
        error: error?.message || "문의 전송에 실패했습니다.",
      });
    }
  };

  const handleOpenBetaModal = () => setIsOpenBetaModalOpen(true);
  const handleCloseBetaModal = () => setIsOpenBetaModalOpen(false);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-logo">
          <img src={assets.headerLogo} alt="headerLogo" className="header__logo" />
        </div>
        <button className="start-free-button" onClick={handleInquiryOpen}>
          <p>도입문의</p>
        </button>
      </header>

      <div className="landing-content">
        <section className="landing-first-section">
          <div className="landing-first-section-left">
            <h1 className="landing-first-section-title">
              당신만을 위한 1:1 영문법 트레이너
              <br />
              GrammarPT
            </h1>
            <p className="landing-first-section-subtitle">
              AI 검증엔진이 문법 문제 출제-채점-해설을 한번에
            </p>
            <button className="start-free-button" onClick={handleOpenBetaModal}>
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
            더 이상 <span className="highlight"><span>문제 찾아 "삼만리" </span></span>하지 마세요.
          </h2>
          <div className="experience-box">
            <div className="experience-left">
              <p className="experience-category">중·고등학생</p>
              <h3 className="experience-title">
                똑같은 문법 문제 풀다가 지쳐요.
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
                <p className="experience-highlight-text">선생님 이런 생각 해보신 적 없나요?</p>
              </div>
              <div className="experience-detail-box">
                <p className="experience-detail-text">
                  내신 때 'To부정사'만 100문제 '더' 풀리고 싶은데...
                </p>
              </div>
              <div className="experience-detail-box">
                <p className="experience-detail-text">
                  좋은 문제 찾느라 '검색 시간'이 더 길다...
                </p>
              </div>
              <div className="experience-detail-box">
                <p className="experience-detail-text">
                  직접 AI로 출제했더니 오류가 있어 수정이 더 걸린다...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="where-section">
        <div className="landing-content">
          <h2 className="where-title">
            선생님은 클릭만,
            <br />
            <span className="where-subtitle">출제-채점-해설은 GrammarPT가 한번에</span>
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
              <div className="point-item">학원/자습 시간에도</div>
              <div className="point-item bold-text">한번 클릭으로 매번 새로운 문법 문제 생성</div>
            </div>
          </div>
          <div className="service-banner">
            GrammarPT의 검증된 AI엔진이 '클릭'만으로 출제-채점-해설을 '자동화'합니다.
          </div>
          <p className="service-subtext">
            AI 출제 검증 엔진 특허출원 (제 4-1-2025-5372016-42호)
          </p>
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
                '딱' 필요한 유형만
                <br />
                골라서 출제할 수 있어요!
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
                검증된 AI가 다양한 문제 출제와
                <br />
                해설을 한번에 제공합니다!
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="recommend-section">
        <p className="recommend-small-text">
          <em className="recommend-small-text-italic">
            시중 자료의 한계, AI의 막연한 불안감... 그 틈을 메우기 위해 시작했습니다.<br/>
            기존 AI의 한계를 넘어, 직접 검증하고 설계한 엔진입니다.
          </em>
          <span className="recommend-small-text-note">
            GrammarPT의 가장 까다로운 첫 사용자는 바로 저였습니다.
          </span>
        </p>

        <div className="divider-line"></div>

        <p className="recommend-tag">#Recommended</p>

        <div className="recommend-boxes">
          <div className="recommend-box">
            <img src={assets.checker} alt="checker" className="recommend-checker" />
            <p className="recommend-text">
              <strong>수업 준비 업무 감소:</strong> 문항 제작, 과제구성, 채점, 오답 정리 흐름 단축
            </p>
          </div>

          <div className="recommend-box">
            <img src={assets.checker} alt="checker" className="recommend-checker" />
            <p className="recommend-text">
              <strong>품질 일관성: </strong>오류 없는 난이도/유형/문법 포인트 시스템 자동화
            </p>
          </div>

          <div className="recommend-box">
            <img src={assets.checker} alt="checker" className="recommend-checker" />
            <p className="recommend-text">
              <strong>운영 데이터화: </strong>반/학생 단위 내신 및 취약 포인트를 집중 반복 훈련
            </p>
          </div>
        </div>
      </section>
      <div className="mid-banner-container">
        <div className="banner-text-container">
          <p className="banner-text-secondary">'검증엔진'으로 완성한 영문법 솔루션, GrammarPT</p>
          <button className="mid-banner-inquiry-button" onClick={handleInquiryOpen}>
            도입문의
          </button>
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
          <button className="inquiry-button" onClick={handleInquiryOpen}>
            문의 (Q&amp;A)
          </button>
        </div>
      </div>

      <section className="faq-section">
        <div className="landing-content">
          <h3 className="faq-title">FAQ</h3>
          <div className="faq-accordion">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.question} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    className="faq-question"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div id={`faq-panel-${index}`} className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {isContactModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleInquiryClose}>
          <div className="modal-content modal-contact" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleInquiryClose} aria-label="닫기">
              ×
            </button>
            <h4 className="modal-title">도입 문의</h4>
            <p className="modal-description">빠르게 연락드릴 수 있도록 정보를 남겨주세요.</p>
            <form className="contact-form" onSubmit={handleSubmitContact}>
              <label className="contact-label">
                <span className="contact-label-text">
                  Title <span className="required">*</span>
                </span>
                <input
                  type="text"
                  value={contactForm.title}
                  onChange={(e) => handleContactChange("title", e.target.value)}
                  required
                />
              </label>
              <label className="contact-label">
                <span className="contact-label-text">
                  이름/소속 <span className="required">*</span>
                </span>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => handleContactChange("name", e.target.value)}
                  required
                />
              </label>
              <label className="contact-label">
                <span className="contact-label-text">
                  연락처 <span className="required">*</span>
                </span>
                <input
                  type="text"
                  value={contactForm.contact}
                  onChange={(e) => handleContactChange("contact", e.target.value)}
                  required
                />
              </label>
              <label className="contact-label">
                <span className="contact-label-text">
                  문의 사항 <span className="required">*</span>
                </span>
                <textarea
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => handleContactChange("message", e.target.value)}
                  required
                />
              </label>
              {contactStatus.error && <p className="contact-status error">{contactStatus.error}</p>}
              {contactStatus.success && <p className="contact-status success">문의가 접수되었습니다. 빠르게 연락드리겠습니다.</p>}
              <div className="modal-actions">
                <button className="modal-button" type="submit" disabled={contactStatus.sending}>
                  {contactStatus.sending ? "전송 중..." : "문의 보내기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <img src={assets.footerLogo} alt="GrammarPT" className="footer-logo" />
          <p className="footer-time">운영시간: 평일 09:00~18:00 (점심: 12:00~13:00)</p>
          <p className="footer-info">
            (주)그래머피티 | 대표. 김균학
          </p>
          <p className="footer-copyright">
            Copyright © GrammarPT. All rights reserved.
          </p>
        </div>
      </footer>

      {isOpenBetaModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleCloseBetaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseBetaModal} aria-label="닫기">
              ×
            </button>
            <h4 className="modal-title">오픈베타 안내</h4>
            <p className="modal-description">
              오픈베타 기간에는 모바일 문제풀이만 가능합니다.
            </p>
            <div className="modal-qr">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://grammarpt.com"
                alt="https://grammarpt.com QR 코드"
              />
              <span className="modal-qr-caption">https://grammarpt.com</span>
            </div>
            <div className="modal-actions">
              <button className="modal-button" onClick={handleCloseBetaModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
