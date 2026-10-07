import { useEffect, useRef } from 'react';
import { PROJECTS } from '../data/projects.js';
import { ABOUT } from '../data/about.js';

const Caret = () => (
  <svg className="caret" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
    <path d="M1 1.2h10L6 7z" fill="currentColor" />
  </svg>
);

function WorkTable({ onOpen }) {
  return (
    <table className="work-table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Title</th>
          <th scope="col">Categories</th>
          <th scope="col">Year</th>
        </tr>
      </thead>
      <tbody>
        {PROJECTS.map((p, i) => (
          <tr key={p.id} onClick={() => onOpen(p.id)}>
            <td>{String(i + 1).padStart(2, '0')}</td>
            <td>
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}>
                {p.title}
              </button>
            </td>
            <td>{p.categories.join(', ')}</td>
            <td>{p.year}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AboutPanel() {
  return (
    <div className="about-grid">
      <section className="about-info">
        <h2>Information</h2>
        <p>{ABOUT.information}</p>
      </section>
      <section>
        <h2>Services</h2>
        <ul>{ABOUT.services.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>
      <section>
        <h2>Selected clients</h2>
        <ul>{ABOUT.clients.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>
      <section>
        <h2>Collaborators</h2>
        <ul>{ABOUT.collaborators.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>
      <section className="about-contact">
        <h2>Contact</h2>
        <ul>
          <li><a href={`mailto:${ABOUT.contact.email}`}>{ABOUT.contact.email}</a></li>
          <li><a href={ABOUT.contact.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li>{ABOUT.contact.location}</li>
        </ul>
      </section>
    </div>
  );
}

export default function Header({ menu, setMenu, onOpenProject }) {
  const workBtn = useRef(null);
  const aboutBtn = useRef(null);

  // Escape closes the menu and returns focus to its button
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        (menu === 'work' ? workBtn : aboutBtn).current?.focus();
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
            <a className="wordmark" href="./" aria-label="Vision, home">Vision</a>
            <span className="tagline">Menswear Styling + Creative Direction</span>
          </div>
          <button
            ref={workBtn}
            type="button"
            className="pill pill-nav"
            aria-expanded={menu === 'work'}
            aria-controls="panel-work"
            onClick={() => toggle('work')}
          >
            Work <Caret />
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

        <div id="panel-work" className={`panel panel-work${menu === 'work' ? ' is-open' : ''}`} inert={menu !== 'work'}>
          <WorkTable onOpen={onOpenProject} />
        </div>
        <div id="panel-about" className={`panel panel-about${menu === 'about' ? ' is-open' : ''}`} inert={menu !== 'about'}>
          <AboutPanel />
        </div>
      </header>
    </>
  );
}
