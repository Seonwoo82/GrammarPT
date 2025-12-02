"use client";

const headerLogo = "/assets/logo_x4.png";

export default function Header() {
  return (
    <header className="header">
      <img src={headerLogo} alt="headerLogo" className="header__logo" />
    </header>
  );
}
