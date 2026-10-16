import { useEffect, useState } from 'react';
import { useStore } from './store/store';
import { useHash } from './lib/router';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import { SettingsModal } from './components/SettingsModal';
import { Toasts } from './components/Toasts';

export default function App() {
  const ready = useStore((s) => s.ready);
  const load = useStore((s) => s.load);
  const hash = useHash();
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => { load(); }, [load]);

  const m = hash.match(/^\/p\/([^/]+)(?:\/([^/?]+))?/);
  if (!ready) return <div className="grid h-full place-items-center text-dim">载入工作台…</div>;
  return (
    <>
      {m ? <Workspace pid={m[1]} step={m[2] ?? 'story'} onSettings={() => setSettingsOpen(true)} />
         : <Home onSettings={() => setSettingsOpen(true)} />}
      <SettingsModal key={String(settingsOpen)} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toasts />
    </>
  );
}
