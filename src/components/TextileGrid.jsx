import { useRef, useState } from 'react';
import { TEXTILES } from '../data/textiles.js';

const BASE = import.meta.env.BASE_URL;
const pad = (n) => String(n).padStart(2, '0');

/* One swatch: a square window onto a textile photograph. The photograph sits
   in an over-scanned layer that pans with the pointer, and breathes (a very
   slow scale) on its own clock, so the fabric feels alive. */
function Tile({ tile, index, number, onActivate, onLoaded, active }) {
  const [state, setState] = useState('pending'); // pending | ready | missing
  const pan = useRef(null);
  const raf = useRef(0);

  const track = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      pan.current?.style.setProperty('--px', px.toFixed(3));
      pan.current?.style.setProperty('--py', py.toFixed(3));
    });
  };
  const rest = () => {
    cancelAnimationFrame(raf.current);
    pan.current?.style.setProperty('--px', '0');
    pan.current?.style.setProperty('--py', '0');
  };

  // every tile breathes at its own pace and phase, so they never move in step
  const style = {
    '--i': index,
    '--dur': `${17 + ((index * 5) % 9)}s`,
    '--delay': `${-((index * 7) % 13)}s`
  };

  return (
    <figure
      className={`tile${active ? ' is-active' : ''}${state === 'ready' ? ' has-image' : ''}`}
      style={style}
      tabIndex={0}
      aria-label={`${pad(number)}, ${tile.name}, ${tile.note}`}
      onPointerEnter={() => onActivate(tile)}
      onPointerLeave={() => { onActivate(null); rest(); }}
      onPointerMove={track}
      onFocus={() => onActivate(tile)}
      onBlur={() => onActivate(null)}
    >
      <span className="tile-ph" aria-hidden="true">
        <span className="tile-ph-file">{tile.file}</span>
      </span>
      <div className="tile-pan" ref={pan}>
        {state !== 'missing' && (
          <img
            src={`${BASE}textiles/${tile.file}`}
            alt={tile.alt}
            draggable="false"
            style={{ objectPosition: tile.focus ?? '50% 50%' }}
            onLoad={() => { setState('ready'); onLoaded(); }}
            onError={() => setState('missing')}
          />
        )}
      </div>
    </figure>
  );
}

function Grid({ side, tiles, offset, onActivate, activeId }) {
  const [loaded, setLoaded] = useState(0);
  return (
    <div className={`tgrid tgrid-${side}`} data-empty={loaded === 0 ? 'true' : 'false'} role="group" aria-label={`${side} swatches`}>
      {tiles.map((tile, i) => (
        <Tile
          key={tile.id}
          tile={tile}
          index={offset + i}
          number={offset + i + 1}
          active={activeId === tile.id}
          onActivate={onActivate}
          onLoaded={() => setLoaded((n) => n + 1)}
        />
      ))}
    </div>
  );
}

/* The Tactile Archive Grid: two 2 x 2 grids of textile macro photographs
   framed by wide, evenly balanced margins. Hovering (or focusing) a swatch
   recedes the other seven and brings the chosen one forward. */
export default function TextileGrid() {
  const [active, setActive] = useState(null);
  const all = [...TEXTILES.left, ...TEXTILES.right];
  const index = active ? all.findIndex((t) => t.id === active.id) : -1;

  return (
    <section className="archive" data-active={active ? 'true' : undefined} aria-label="Textile archive">
      <Grid side="left" tiles={TEXTILES.left} offset={0} onActivate={setActive} activeId={active?.id} />
      <Grid side="right" tiles={TEXTILES.right} offset={TEXTILES.left.length} onActivate={setActive} activeId={active?.id} />

      <div className="caps">
        <p className="cap cap-left">Textile archive<br />Menswear styling</p>
        <div className="cap cap-center" aria-live="polite">
          {active ? (
            <>
              <span className="cap-count">{pad(index + 1)} / {pad(all.length)}</span>
              <strong key={active.id} className="cap-name">{active.name}</strong>
              <span className="cap-note">{active.note}</span>
            </>
          ) : (
            <span className="cap-note">
              <span className="hint-hover">Hover a swatch</span>
              <span className="hint-touch">Tap a swatch</span>
            </span>
          )}
        </div>
        <span />
      </div>
    </section>
  );
}
