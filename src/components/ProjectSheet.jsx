import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects.js';

const BASE = import.meta.env.BASE_URL;

// A photo slot: shows a wireframe placeholder that names the file it is
// waiting for, and swaps in the real image as soon as the file exists.
function Slot({ file, alt }) {
  const [ok, setOk] = useState(false);
  const [gone, setGone] = useState(false);
  return (
    <figure className={`slot${ok ? ' has-image' : ''}`}>
      <div className="slot-frame">
        <span className="slot-file">{file}</span>
        {!gone && (
          <img
            src={`${BASE}projects/${file}`}
            alt={alt}
            loading="lazy"
            onLoad={() => setOk(true)}
            onError={() => setGone(true)}
          />
        )}
      </div>
    </figure>
  );
}

export default function ProjectSheet({ id, onChange, onClose }) {
  const ref = useRef(null);
  const index = PROJECTS.findIndex((p) => p.id === id);
  const project = PROJECTS[index];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (id && !d.open) d.showModal();
    if (!id && d.open) d.close();
  }, [id]);

  const step = (dir) => onChange(PROJECTS[(index + dir + PROJECTS.length) % PROJECTS.length].id);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      }}
    >
      {project && (
        <div className="sheet-inner" key={project.id}>
          <div className="sheet-top">
            <span className="sheet-count">
              {String(index + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
            </span>
            <button type="button" className="pill pill-btn" onClick={() => ref.current?.close()}>
              Close
            </button>
          </div>

          <div className="sheet-body">
            <div className="sheet-text">
              <h2 id="sheet-title">{project.title}</h2>
              <p className="sheet-meta">
                {project.categories.join(', ')} <span aria-hidden="true">/</span> {project.year}
              </p>
              <p className="sheet-role">{project.role}</p>
              <p className="sheet-desc">{project.description}</p>
              <dl className="sheet-credits">
                {Object.entries(project.credits).map(([role, name]) => (
                  <div key={role}>
                    <dt>{role}</dt>
                    <dd>{name}</dd>
                  </div>
                ))}
              </dl>
              <div className="sheet-nav">
                <button type="button" className="pill pill-btn" onClick={() => step(-1)}>Previous</button>
                <button type="button" className="pill pill-btn" onClick={() => step(1)}>Next</button>
              </div>
            </div>
            <div className="sheet-images">
              {project.images.map((file, i) => (
                <Slot key={file} file={file} alt={`${project.title}, image ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
