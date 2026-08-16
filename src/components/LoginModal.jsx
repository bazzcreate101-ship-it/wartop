import React, { useEffect, useState } from 'react';
import { brandMark, icons } from '../assets/images';

const emptyForm = {
  identifier: '',
  username: '',
  email: '',
  password: '',
};

export default function LoginModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMemberError('');
    setGoogleError('');
    setMemberLoading(false);
    setGoogleLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMemberError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMemberError('');
    setGoogleError('');
  };

  const handleMemberAuth = async (event) => {
    event.preventDefault();
    if (memberLoading) return;
    setMemberLoading(true);
    setMemberError('');

    try {
      const payload = mode === 'register'
        ? {
          action: 'register',
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        }
        : {
          action: 'login',
          identifier: form.identifier.trim(),
          password: form.password,
        };
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.user) {
        throw new Error(data.error || 'Akun belum dapat diproses. Silakan coba lagi.');
      }
      setForm(emptyForm);
      onAuthenticated?.(data.user);
      onClose();
    } catch (error) {
      setMemberError(error.message || 'Akun belum dapat diproses. Silakan coba lagi.');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setGoogleError('');
    await new Promise((resolve) => setTimeout(resolve, 2400));
    setGoogleLoading(false);
    setGoogleError('Login Google gagal. Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat.');
  };

  return (
    <div
      className="modal fade show d-block auth-modal-backdrop"
      tabIndex="-1"
      onClick={(event) => {
        if (event.target === event.currentTarget && !googleLoading) onClose();
      }}
    >
      {googleLoading && (
        <div className="google-outage-overlay" role="status" aria-live="polite">
          <div className="google-outage-overlay__card">
            <span className="google-outage-spinner" aria-hidden="true"></span>
            <strong>Menghubungkan akun Google</strong>
            <span>Mohon tunggu, kami sedang memeriksa layanan...</span>
          </div>
        </div>
      )}

      <div className="modal-dialog modal-dialog-centered auth-modal__dialog">
        <div className="modal-content auth-modal">
          <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Tutup" disabled={googleLoading}>
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>

          <div className="auth-modal__grid">
            <section className="auth-modal__intro" aria-labelledby="modalTitle">
              <div>
                <div className="auth-modal__brand">
                  <span className="auth-modal__brand-mark"><img src={brandMark} alt="" /></span>
                  <strong>Wartop ID</strong>
                </div>
                <span className="auth-modal__eyebrow">Member Area</span>
                <h2 className="auth-modal__title" id="modalTitle">Satu akun untuk semua transaksi.</h2>
                <p className="auth-modal__subtitle">Masuk dengan akun Wartop agar riwayat, saldo, pesanan, dan bantuan tersimpan dalam satu tempat.</p>
              </div>

              <div className="auth-modal__identity-card">
                <span className="auth-modal__identity-label">Yang kamu dapatkan</span>
                <ul className="auth-modal__perks">
                  <li className="auth-modal__perk">
                    <span className="auth-modal__perk-icon"><img src={icons.article} alt="" /></span>
                    <p className="auth-modal__perk-text"><strong>Riwayat tertata</strong><span>Cek pesanan dan invoice tanpa mencari ulang.</span></p>
                  </li>
                  <li className="auth-modal__perk">
                    <span className="auth-modal__perk-icon"><img src={icons.gift} alt="" /></span>
                    <p className="auth-modal__perk-text"><strong>Benefit member</strong><span>Akses promo serta poin dari transaksi berhasil.</span></p>
                  </li>
                  <li className="auth-modal__perk">
                    <span className="auth-modal__perk-icon"><img src={icons.phone} alt="" /></span>
                    <p className="auth-modal__perk-text"><strong>Bantuan lebih cepat</strong><span>Rena dan tim CS mengenali konteks akunmu.</span></p>
                  </li>
                </ul>
              </div>
            </section>

            <section className="auth-modal__cta" aria-label="Login atau daftar akun Wartop">
              <div className="auth-modal__cta-header">
                <span className="auth-modal__step">AKSES MEMBER</span>
                <h3 className="auth-modal__cta-title">{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun Wartop'}</h3>
                <p className="auth-modal__cta-desc">
                  {mode === 'login' ? 'Gunakan email atau username yang sudah terdaftar.' : 'Daftar memakai email, username, dan password pilihanmu.'}
                </p>
              </div>

              <div className="auth-mode-switch" role="tablist" aria-label="Pilih login atau daftar">
                <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>Masuk</button>
                <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => switchMode('register')}>Daftar</button>
              </div>

              <form className="member-auth-form" onSubmit={handleMemberAuth}>
                {mode === 'register' ? (
                  <>
                    <label className="member-auth-field">
                      <span>Username</span>
                      <div className="member-auth-control">
                        <i className="bi bi-person" aria-hidden="true"></i>
                        <input name="username" value={form.username} onChange={updateField} minLength="3" maxLength="24" autoComplete="username" placeholder="contoh: bagas.store" required />
                      </div>
                    </label>
                    <label className="member-auth-field">
                      <span>Email</span>
                      <div className="member-auth-control">
                        <i className="bi bi-envelope" aria-hidden="true"></i>
                        <input name="email" type="email" value={form.email} onChange={updateField} maxLength="160" autoComplete="email" placeholder="nama@email.com" required />
                      </div>
                    </label>
                  </>
                ) : (
                  <label className="member-auth-field">
                    <span>Email atau username</span>
                    <div className="member-auth-control">
                      <i className="bi bi-person" aria-hidden="true"></i>
                      <input name="identifier" value={form.identifier} onChange={updateField} maxLength="160" autoComplete="username" placeholder="Email atau username" required />
                    </div>
                  </label>
                )}

                <label className="member-auth-field">
                  <span>Password</span>
                  <div className="member-auth-control">
                    <i className="bi bi-shield-lock" aria-hidden="true"></i>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={updateField}
                      minLength="8"
                      maxLength="72"
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      placeholder="Minimal 8 karakter"
                      required
                    />
                    <button type="button" className="member-auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                </label>

                {memberError && <div className="auth-notice auth-notice--error" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true"></i><span>{memberError}</span></div>}

                <button type="submit" className="member-auth-submit" disabled={memberLoading}>
                  {memberLoading ? <span className="spinner-border spinner-border-sm" role="status" aria-label="Memproses"></span> : <span>{mode === 'login' ? 'Masuk ke Wartop' : 'Buat akun sekarang'}</span>}
                  {!memberLoading && <i className="bi bi-arrow-right" aria-hidden="true"></i>}
                </button>
              </form>

              <div className="auth-provider-divider"><span>atau lanjutkan dengan</span></div>

              <button type="button" className="google-signin-btn" onClick={handleGoogleLogin} disabled={googleLoading} id="btn-google-signin">
                <img src={icons.google} alt="" width="20" height="20" />
                <span>Masuk dengan Google</span>
              </button>

              {googleError && <div className="auth-notice auth-notice--google" role="alert"><i className="bi bi-wifi-off" aria-hidden="true"></i><span>{googleError}</span></div>}

              <p className="auth-modal__terms">
                Dengan melanjutkan, kamu menyetujui <a href="/page/terms">Syarat dan Ketentuan</a> serta <a href="/page/privacy">Kebijakan Privasi</a> Wartop.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
