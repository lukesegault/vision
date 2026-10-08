import { Suspense, lazy, useState } from 'react';
import Header from './components/Header.jsx';
import TextileGrid from './components/TextileGrid.jsx';

// The archived 3D rack hero, available at ?hero=rack (see src/archive/rack).
const RackHero = lazy(() => import('./archive/rack/RackHero.jsx'));
const showRack = new URLSearchParams(window.location.search).get('hero') === 'rack';

export default function App() {
  const [menu, setMenu] = useState(null); // 'services' | 'about' | null

  return (
    <>
      <h1 className="visually-hidden">Luke Segault, Styling + Curation</h1>
      <Header menu={menu} setMenu={setMenu} />
      <main className={`stage${menu ? ' is-dimmed' : ''}`}>
        {showRack ? (
          <Suspense fallback={null}>
            <RackHero inactive={Boolean(menu)} />
          </Suspense>
        ) : (
          <TextileGrid />
        )}
      </main>
    </>
  );
}
