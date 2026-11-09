import React from 'react';
import { Link } from 'react-router-dom';

const s = {
  page: { fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a', background: '#ffffff', minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', maxWidth: 1100, margin: '0 auto' },
  logo: { fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: '#0f766e', textDecoration: 'none' },
  navLinks: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { color: '#334155', textDecoration: 'none', fontWeight: 500 },
  btn: { background: '#0f766e', color: '#fff', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, display: 'inline-block' },
  btnLight: { background: '#f1f5f9', color: '#0f172a', padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, display: 'inline-block' },
  hero: { maxWidth: 1100, margin: '0 auto', padding: '48px 24px', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' },
  heroText: { flex: '1 1 420px' },
  h1: { fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1, margin: '0 0 16px' },
  lead: { fontSize: 18, color: '#475569', lineHeight: 1.6, margin: '0 0 28px' },
  cta: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  img: { flex: '1 1 420px', maxWidth: '100%', borderRadius: 16, boxShadow: '0 20px 50px rgba(15,23,42,.15)' },
  features: { maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#f8fafc', borderRadius: 14, padding: 24 },
  h2: { fontFamily: 'Poppins, sans-serif', fontSize: 18, margin: '0 0 8px' },
  p: { margin: 0, color: '#475569', lineHeight: 1.6 },
  footer: { textAlign: 'center', padding: 32, color: '#64748b', fontSize: 14 },
};

export default function Landing() {
  return (
    <div style={s.page}>
      <header style={s.nav}>
        <Link to="/" style={s.logo}>MaCarte</Link>
        <nav style={s.navLinks}>
          <Link to="/templates" style={s.link}>Modèles</Link>
          <Link to="/login" style={s.link}>Connexion</Link>
          <Link to="/register" style={s.btn}>Créer ma carte</Link>
        </nav>
      </header>

      <main>
        <section style={s.hero}>
          <div style={s.heroText}>
            <h1 style={s.h1}>Votre carte de visite numérique avec QR code</h1>
            <p style={s.lead}>
              Créez votre carte professionnelle, partagez-la en un scan et téléchargez
              un design prêt à imprimer en PDF. Simple, rapide et élégant.
            </p>
            <div style={s.cta}>
              <Link to="/register" style={s.btn}>Commencer gratuitement</Link>
              <Link to="/templates" style={s.btnLight}>Voir les modèles</Link>
            </div>
          </div>
          <img src="/cards.jpg" alt="Cartes de visite créées avec MaCarte" style={s.img} width="1200" height="630" />
        </section>

        <section style={s.features}>
          <div style={s.card}>
            <h2 style={s.h2}>Carte numérique</h2>
            <p style={s.p}>Une page personnelle avec vos coordonnées, vos liens et vos réseaux, accessible partout.</p>
          </div>
          <div style={s.card}>
            <h2 style={s.h2}>QR code intégré</h2>
            <p style={s.p}>Vos contacts scannent le code et enregistrent vos informations en quelques secondes.</p>
          </div>
          <div style={s.card}>
            <h2 style={s.h2}>Prêt à imprimer</h2>
            <p style={s.p}>Choisissez parmi nos modèles professionnels et exportez en PNG, SVG ou PDF.</p>
          </div>
        </section>
      </main>

      <footer style={s.footer}>© {new Date().getFullYear()} MaCarte. Tous droits réservés.</footer>
    </div>
  );
}