import { Suspense, lazy, useState } from 'react';
import Header from './components/Header.jsx';
import ProjectSheet from './components/ProjectSheet.jsx';
import TextileGrid from './components/TextileGrid.jsx';

// The archived 3D rack hero, available at ?hero=rack (see src/archive/rack).
const RackHero = lazy(() => import('./archive/rack/RackHero.jsx'));
const showRack = new URLSearchParams(window.location.search).get('hero') === 'rack';

export default function App() {
  const [menu, setMenu] = useState(null); // 'work' | 'about' | null
  const [project, setProject] = useState(null);

  const openProject = (id) => {
    setMenu(null);
    setProject(id);
  };

  return (
    <>
      <h1 className="visually-hidden">Vision, menswear personal stylist</h1>
      <Header menu={menu} setMenu={setMenu} onOpenProject={openProject} />
      <main className={`stage${menu ? ' is-dimmed' : ''}`}>
        {showRack ? (
          <Suspense fallback={null}>
            <RackHero inactive={Boolean(menu || project)} />
          </Suspense>
        ) : (
          <TextileGrid />
        )}
      </main>
      <ProjectSheet id={project} onChange={setProject} onClose={() => setProject(null)} />
    </>
  );
}
