import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MODULE_LIST } from './design/shared/modules';

const s = {
  page: { fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', maxWidth: 1100, margin: '0 auto' },
  logo: { fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: '#1E1B4B', textDecoration: 'none' },
  navLinks: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { color: '#1E1B4B', textDecoration: 'none', fontWeight: 500 },
  btn: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#1E1B4B', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, display: 'inline-block', boxShadow: '0 4px 15px rgba(240,147,251,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' },
  btnLight: { background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, display: 'inline-block', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', transition: 'transform 0.2s, background 0.2s' },
  hero: { maxWidth: 1100, margin: '0 auto', padding: '48px 24px', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' },
  heroText: { flex: '1 1 420px' },
  h1: { fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1, margin: '0 0 16px', color: '#1E1B4B' },
  lead: { fontSize: 18, color: '#3B0764', lineHeight: 1.6, margin: '0 0 28px' },
  cta: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  img: { flex: '1 1 420px', maxWidth: '100%', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'float 6s ease-in-out infinite' },
  features: { maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
  card: { background: 'rgba(255,255,255,0.55)', borderRadius: 14, padding: 24, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.6)', transition: 'transform 0.3s, box-shadow 0.3s', animation: 'pulse 4s ease-in-out infinite', ':hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 30px rgba(255,255,255,0.3)' } },
  h2: { fontFamily: 'Poppins, sans-serif', fontSize: 18, margin: '0 0 8px', color: '#3B0764' },
  p: { margin: 0, color: '#3B0764', lineHeight: 1.6 },
  footer: { textAlign: 'center', padding: 32, color: '#3B0764', fontSize: 14 },
};

const tabStyle = { padding: '8px 12px', borderRadius: 8, color: '#3B0764', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)', transition: 'background 0.3s' };

export default function Landing({ isAuthenticated }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const homePath = isEn ? '/en' : '/';

  const gradientStyle = {
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #f093fb, #f5576c)',
    backgroundSize: '400% 400%',
    animation: 'gradient 20s ease infinite'
  };

  const glowStyle = {
    boxShadow: '0 0 60px rgba(255,255,255,0.3), 0 0 100px rgba(240,147,251,0.3)',
    animation: 'glow 3s ease-in-out infinite alternate'
  };

  return (
    <div style={{ ...s.page, ...gradientStyle }}>
      <style>{`
        @keyframes gradient {
          0% { backgroundPosition: 0% 50%; }
          50% { backgroundPosition: 100% 50%; }
          100% { backgroundPosition: 0% 50%; }
        }
        @keyframes glow {
          from { boxShadow: 0 0 60px rgba(255,255,255,0.3), 0 0 100px rgba(240,147,251,0.3); }
          to { boxShadow: 0 0 80px rgba(255,255,255,0.5), 0 0 120px rgba(168,85,247,0.5); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { backgroundPosition: -200% center; }
          100% { backgroundPosition: 200% center; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      <div style={{ background: 'rgba(30,27,75,0.85)', color: '#fff', textAlign: 'center', padding: '6px 12px', fontWeight: 700, letterSpacing: '0.5px', fontSize: 12, backdropFilter: 'blur(10px)', animation: 'pulse 3s ease-in-out infinite', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {t('landing.promoBanner')}
      </div>
      <header style={s.nav}>
        <Link to={homePath} style={s.logo}>MaCarte</Link>
        <nav style={s.navLinks}>
          <Link to="/templates" style={s.link}>{t('landing.templatesTitle')}</Link>
          {isAuthenticated ? (
            <Link to="/people" style={{ ...s.btn, background: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)' }}>{t('nav.dashboard')}</Link>
          ) : (
            <>
              <Link to="/login" style={s.link}>{t('auth.login')}</Link>
              <Link to="/register" style={{ ...s.btn, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>{t('auth.register')}</Link>
            </>
          )}
          <Link to={isEn ? '/' : '/en'} style={{ ...s.link, background: 'rgba(255,255,255,0.55)', padding: '8px 16px', borderRadius: 8, backdropFilter: 'blur(10px)' }} className="ml-2 font-bold">
            {isEn ? 'FR' : 'EN'}
          </Link>
        </nav>
      </header>
      <nav aria-label="Rubriques" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-start', gap: 4, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.4)', fontSize: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="scrollbar-horizontal">
        <Link to="/templates" style={{ ...tabStyle, flexShrink: 0 }}>
          {t('nav.printableCard')}
        </Link>
        {MODULE_LIST.map((m) => (
          <Link key={m.type} to={isAuthenticated ? `/studio/${m.slug}` : `/modeles/${m.slug}`} style={{ ...tabStyle, flexShrink: 0 }}>
            {m.label}
          </Link>
        ))}
      </nav>

      <main>
        <section style={s.hero}>
          <div style={s.heroText}>
            <h1 style={s.h1}>{t('landing.heroTitle')}</h1>
            <p style={s.lead}>
              {t('landing.heroDescription')}
            </p>
            <div style={s.cta}>
              <Link to="/register" style={{ ...s.btn, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', boxShadow: '0 4px 20px rgba(240,147,251,0.5)', animation: 'scale 2s ease-in-out infinite' }}>{t('landing.getStartedFree')}</Link>
              <Link to="/templates" style={{ ...s.btnLight, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderColor: 'rgba(255,255,255,0.4)', animation: 'scale 2s ease-in-out infinite 0.5s' }}>{t('landing.seeTemplates')}</Link>
            </div>
          </div>
          <div style={{ position: 'relative', flex: '1 1 420px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(240,147,251,0.3) 0%, rgba(102,126,234,0.3) 50%, transparent 70%)', borderRadius: 16, animation: 'pulse 3s ease-in-out infinite' }} />
            <img src="/cards.jpg" alt={t('landing.cardsAlt')} style={s.img} width="1200" height="630" />
          </div>
        </section>

        <section style={s.features}>
          <div style={s.card}>
            <h2 style={{ ...s.h2, color: '#7F1D1D' }}>{t('landing.digitalCard')}</h2>
            <p style={s.p}>{t('landing.digitalCardDesc')}</p>
          </div>
          <div style={s.card}>
            <h2 style={{ ...s.h2, color: '#14532D' }}>{t('landing.qrCode')}</h2>
            <p style={s.p}>{t('landing.qrCodeDesc')}</p>
          </div>
          <div style={s.card}>
            <h2 style={{ ...s.h2, color: '#4C1D95' }}>{t('landing.printReady')}</h2>
            <p style={s.p}>{t('landing.printReadyDesc')}</p>
          </div>
        </section>
      </main>

      <footer style={s.footer}>© {new Date().getFullYear()} MaCarte. {t('common.allRightsReserved')}</footer>
    </div>
  );
}