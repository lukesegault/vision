import { useEffect, useRef } from 'react';
import { SERVICES } from '../data/services.js';
import { ABOUT } from '../data/about.js';

const Caret = () => (
  <svg className="caret" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
    <path d="M1 1.2h10L6 7z" fill="currentColor" />
  </svg>
);

function ServicesTable() {
  return (
    <table className="services-table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Service</th>
          <th scope="col">Details</th>
        </tr>
      </thead>
      <tbody>
        {SERVICES.map((s, i) => (
          <tr key={s.title}>
            <td>{String(i + 1).padStart(2, '0')}</td>
            <td>{s.title}</td>
            <td>{s.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AboutPanel() {
  const c = ABOUT.contact;
  return (
    <div className="about-grid">
      <section className="about-info">
        <h2>About</h2>
        <p>{ABOUT.information}</p>
      </section>
      <section className="about-contact">
        <h2>Contact</h2>
        <ul>
          <li><a href={c.phoneHref}>{c.phone}</a></li>
          <li><a href={`mailto:${c.email}`}>{c.email}</a></li>
          <li><a href={c.instagramUrl} target="_blank" rel="noopener noreferrer">{c.instagram}</a></li>
          <li>{c.location}</li>
        </ul>
      </section>
    </div>
  );
}

export default function Header({ menu, setMenu }) {
  const servicesBtn = useRef(null);
  const aboutBtn = useRef(null);

  // Escape closes the menu and returns focus to its button
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        (menu === 'services' ? servicesBtn : aboutBtn).current?.focus();
        setMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, setMenu]);

  const toggle = (name) => setMenu(menu === name ? null : name);

  return (
    <>
      {menu && <button type="button" className="scrim" aria-hidden="true" tabIndex={-1} onClick={() => setMenu(null)} />}
      <header className="site-header">
        <div className="pills">
          <div className="pill pill-brand">
            <a className="wordmark" href="./" aria-label="Luke Segault, home">Luke Segault</a>
            <span className="tagline">Styling &amp; Curation</span>
          </div>
          <button
            ref={servicesBtn}
            type="button"
            className="pill pill-nav"
            aria-expanded={menu === 'services'}
            aria-controls="panel-services"
            onClick={() => toggle('services')}
          >
            Services <Caret />
          </button>
          <button
            ref={aboutBtn}
            type="button"
            className="pill pill-nav"
            aria-expanded={menu === 'about'}
            aria-controls="panel-about"
            onClick={() => toggle('about')}
          >
            About <Caret />
          </button>
        </div>

        <div id="panel-services" className={`panel panel-services${menu === 'services' ? ' is-open' : ''}`} inert={menu !== 'services'}>
          <ServicesTable />
        </div>
        <div id="panel-about" className={`panel panel-about${menu === 'about' ? ' is-open' : ''}`} inert={menu !== 'about'}>
          <AboutPanel />
        </div>
      </header>
    </>
  );
}
