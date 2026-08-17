import React, { useState, useEffect, useRef } from 'react';
import { brandWordmark } from '../assets/images';
import { readStorageList } from '../lib/storage';
import { getWalletBalance } from '../lib/walletService';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export default function Header({
  currentView,
  onNavigate,
  onSearchOpen: onToggleSearch,
  isSearchOpen,
  onLoginOpen: onOpenLogin,
  user,
  onLogout
}) {
  const isLoggedIn = !!user;
  const userProfile = user;
  const userTransactions = isLoggedIn ? readStorageList('wartop_transactions').filter((tx) => normalizeEmail(tx.userEmail) === normalizeEmail(user.email)) : [];
  const successTransactions = userTransactions.filter((tx) => tx.status === 'success');
  const userPoints = successTransactions.reduce((sum, tx) => sum + Number(tx.points || 0), 0);
  const walletBalance = isLoggedIn ? getWalletBalance(user.email) : 0;
  const displayName = userProfile?.name || userProfile?.username || 'Member Wartop';
  const profilePicture = userProfile?.picture || '';
  const profileInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'W';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside dropdown logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view, e) => {
    e.preventDefault();
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header id="header" className="header-sticky">
      <nav className="navbar navbar-expand-lg navbar-dark glass-nav py-2 px-0" role="navigation" aria-label="Main Navigation">
        <div className="container col-md-8 col-12 d-flex align-items-center justify-content-between">

          {/* BRAND */}
          <a href="/" onClick={(e) => handleNavClick('home', e)} className="navbar-brand flex-shrink-1 d-flex align-items-center" style={{ textDecoration: 'none' }}>
            <span className="brand-wordmark-window">
              <img src={brandWordmark} alt="Wartop" className="img-logo" onError={(event) => { event.currentTarget.src = '/wartop-wordmark.png'; }} />
            </span>
          </a>

          {/* MENU UTAMA */}
          <div className={`collapse navbar-collapse gv-main-nav order-lg-1 ms-lg-3 ${mobileMenuOpen ? 'show' : ''}`} id="mainNav">
            <ul className="navbar-nav gv-nav-list ms-lg-0 me-auto mb-0 align-items-lg-stretch">
              <li className="nav-item">
                <a
                  href="/"
                  onClick={(e) => handleNavClick('home', e)}
                  className={`nav-link ${currentView === 'home' ? 'active-link' : ''}`}
                >
                  <i className="bx bx-home-alt nav__icon"></i><span>Home</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="/transactions"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isLoggedIn) {
                      handleNavClick('transactions', e);
                    } else {
                      onOpenLogin();
                    }
                  }}
                  className={`nav-link ${currentView === 'transactions' ? 'active-link' : ''}`}
                >
                  <i className="bx bx-history nav__icon"></i><span>Transaksi</span>
                </a>
              </li>
            </ul>
          </div>

          {/* ACTIONS: Search + Profile/Login + Toggler */}
          <div className="navbar-actions d-flex align-items-center ms-auto order-lg-3 gap-2">

            {/* Search Trigger */}
            <div className="navbar-live-search-trigger me-1 d-inline-flex">
              <button
                id="openSearchBar"
                type="button"
                className="btn btn-sm d-inline-flex align-items-center gap-1"
                onClick={onToggleSearch}
                aria-label="Buka pencarian"
              >
                <i className={`bi ${isSearchOpen ? 'bi-x-lg' : 'bi-search'}`}></i>
                <span className="d-none d-md-inline">{isSearchOpen ? 'Tutup' : 'Cari'}</span>
                <span className="d-none d-lg-inline ms-1 kbd-hint">/</span>
              </button>
            </div>

            {/* Profile or Login */}
            {isLoggedIn ? (
              <div className="dropdown wartop-profile-anchor" ref={dropdownRef}>
                <button
                  className="wartop-profile-trigger"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={profileDropdownOpen}
                  aria-label="Buka profil akun"
                >
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt=""
                      className="wartop-profile-avatar wartop-profile-avatar--trigger"
                      onError={(event) => { event.currentTarget.src = '/wartop-mark.png'; }}
                    />
                  ) : (
                    <span className="wartop-profile-avatar wartop-profile-avatar--trigger" aria-hidden="true">{profileInitials}</span>
                  )}
                  <span className="wartop-profile-trigger__copy d-none d-lg-flex">
                    <small>Akun</small>
                    <strong>{displayName}</strong>
                  </span>
                  <i className={`bx bx-chevron-down wartop-profile-trigger__chevron d-none d-lg-inline ${profileDropdownOpen ? 'is-open' : ''}`} aria-hidden="true"></i>
                </button>

                {profileDropdownOpen && (
                  <div className="dropdown-menu wartop-profile-panel show d-block" role="dialog" aria-label="Ringkasan profil">
                    <div className="wartop-profile-panel__topline" aria-hidden="true"></div>

                    <div className="wartop-profile-panel__identity">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt=""
                          className="wartop-profile-avatar wartop-profile-avatar--panel"
                          onError={(event) => { event.currentTarget.src = '/wartop-mark.png'; }}
                        />
                      ) : (
                        <span className="wartop-profile-avatar wartop-profile-avatar--panel" aria-hidden="true">{profileInitials}</span>
                      )}
                      <div className="wartop-profile-panel__user">
                        <span className="wartop-profile-panel__name">{displayName}</span>
                        <span className="wartop-profile-panel__email">{userProfile?.email}</span>
                      </div>
                      <span className="wartop-profile-panel__member" title="Member Wartop">
                        <i className="bi bi-patch-check-fill" aria-hidden="true"></i>
                        Member
                      </span>
                    </div>

                    <a
                      href="/wallet"
                      className="wartop-profile-balance"
                      onClick={(event) => { handleNavClick('wallet', event); setProfileDropdownOpen(false); }}
                    >
                      <span className="wartop-profile-balance__icon"><i className="bx bx-wallet" aria-hidden="true"></i></span>
                      <span className="wartop-profile-balance__copy">
                        <small>Saldo tersedia</small>
                        <strong>Rp{walletBalance.toLocaleString('id-ID')}</strong>
                      </span>
                      <span className="wartop-profile-balance__arrow"><i className="bi bi-arrow-up-right" aria-hidden="true"></i></span>
                    </a>

                    <div className="wartop-profile-metrics" aria-label="Statistik akun">
                      <div>
                        <span>Poin</span>
                        <strong>{userPoints.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span>Pesanan</span>
                        <strong>{userTransactions.length}</strong>
                      </div>
                      <div>
                        <span>Berhasil</span>
                        <strong>{successTransactions.length}</strong>
                      </div>
                    </div>

                    <nav className="wartop-profile-shortcuts" aria-label="Menu akun">
                      <a href="/wallet" onClick={(event) => { handleNavClick('wallet', event); setProfileDropdownOpen(false); }}>
                        <i className="bx bx-wallet" aria-hidden="true"></i>
                        <span><strong>Dompet</strong><small>Atur saldo</small></span>
                      </a>
                      <a href="/transactions" onClick={(event) => { handleNavClick('transactions', event); setProfileDropdownOpen(false); }}>
                        <i className="bx bx-receipt" aria-hidden="true"></i>
                        <span><strong>Pesanan</strong><small>Lihat riwayat</small></span>
                      </a>
                    </nav>

                    <button
                      type="button"
                      className="wartop-profile-logout"
                      onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                    >
                      <span><i className="bx bx-log-out" aria-hidden="true"></i> Keluar dari akun</span>
                      <i className="bi bi-arrow-right" aria-hidden="true"></i>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm d-inline-flex"
                  onClick={onOpenLogin}
                >
                  Login
                </button>
              </>
            )}

            {/* Mobile Hamburger Toggler */}
            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
