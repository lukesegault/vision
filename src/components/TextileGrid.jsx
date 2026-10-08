import { useEffect, useRef, useState } from 'react';
import { TEXTILES } from '../data/textiles.js';
import { createTextileSurface } from '../lib/textileGL.js';

const BASE = import.meta.env.BASE_URL;
const pad = (n) => String(n).padStart(2, '0');

/* One swatch: a square window onto a textile photograph. The photograph sits
   in an over-scanned layer that pans with the pointer, and breathes (a very
   slow scale) on its own clock, so the fabric feels alive.

   The photograph is drawn by a small WebGL surface (src/lib/textileGL.js) that
   makes it react to the pointer like the real material. If WebGL is not
   available, or the system asks for reduced motion, the plain <img> underneath
   is shown instead.

   A tile can also carry real footage (`video` in src/data/textiles.js). The
   still shows at rest; on hover the film plays once over it and holds its last
   frame, and on leave it fades back to the still. The footage replaces the
   shader on that tile. */
function Tile({ tile, index, number, onActivate, onLoaded, active }) {
  const [state, setState] = useState('pending'); // pending | ready | missing
  const [live, setLive] = useState(false);       // the WebGL surface is showing
  const pan = useRef(null);
  const canvas = useRef(null);
  const surface = useRef(null);
  const raf = useRef(0);
  const film = useRef(null);
  const filmTimer = useRef(0);
  const [playing, setPlaying] = useState(false);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const startFilm = () => {
    const v = film.current;
    if (!v || reduced()) return;
    clearTimeout(filmTimer.current);
    if (v.paused) v.currentTime = 0;
    const p = v.play();
    if (p?.catch) p.catch(() => {});
    setPlaying(true);
  };
  const stopFilm = () => {
    const v = film.current;
    if (!v) return;
    setPlaying(false);
    // let it fade out first, then rewind so the next hover starts from the still
    clearTimeout(filmTimer.current);
    filmTimer.current = setTimeout(() => { v.pause(); v.currentTime = 0; }, 800);
  };
  useEffect(() => () => clearTimeout(filmTimer.current), []);

  // Whenever the grid releases this tile (another tile tapped, or a tap on the
  // empty page), let go of the film and the live surface too.
  useEffect(() => {
    if (!active) {
      stopFilm();
      surface.current?.leave();
      rest();
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tile.video || reduced()) return undefined;
    const s = createTextileSurface(canvas.current, {
      src: `${BASE}textiles/${tile.file}`,
      focus: tile.focus,
      fx: tile.fx,
      onReady: () => setLive(true),
      onFail: () => setLive(false)
    });
    surface.current = s;
    return () => {
      s?.dispose();
      surface.current = null;
      setLive(false);
    };
  }, [tile]);

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
      className={`tile${active ? ' is-active' : ''}${state === 'ready' ? ' has-image' : ''}${live ? ' has-gl' : ''}${playing ? ' is-playing' : ''}`}
      style={style}
      tabIndex={0}
      aria-label={`${pad(number)}, ${tile.name}, ${tile.note}`}
      onPointerEnter={(e) => { onActivate(tile); surface.current?.enter(e); startFilm(); }}
      onPointerLeave={(e) => {
        // A finger has no hover: a touched swatch stays active until the next
        // tap elsewhere, so a quick tap still plays the film.
        if (e.pointerType === 'touch') return;
        onActivate(null); rest(); surface.current?.leave(); stopFilm();
      }}
      onPointerMove={(e) => { track(e); surface.current?.move(e); }}
      onFocus={() => { onActivate(tile); startFilm(); }}
      onBlur={() => { onActivate(null); stopFilm(); }}
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
        {tile.video && state === 'ready' && (
          <video
            ref={film}
            className="tile-film"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={`${BASE}textiles/${tile.video}.webm`} type="video/webm" />
            <source src={`${BASE}textiles/${tile.video}.mp4`} type="video/mp4" />
          </video>
        )}
        <canvas ref={canvas} aria-hidden="true" />
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

  // Touch: tapping anywhere that is not a swatch releases the active one
  useEffect(() => {
    const release = (e) => {
      if (e.pointerType === 'touch' && !e.target.closest?.('.tile')) setActive(null);
    };
    document.addEventListener('pointerdown', release);
    return () => document.removeEventListener('pointerdown', release);
  }, []);

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
