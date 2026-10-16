import type { Project } from '../types';
export function coverKey(p: Project) {
  for (const e of p.episodes) for (const s of e.shots) if (s.imageKey) return s.imageKey;
  return p.scenes.find((s) => s.imageKey)?.imageKey ?? p.characters.find((c) => c.imageKey)?.imageKey;
}
export function projectStats(p: Project) {
  const shots = p.episodes.flatMap((e) => e.shots);
  return {
    episodes: p.episodes.length,
    shots: shots.length,
    images: shots.filter((s) => s.imageKey).length,
    videos: shots.filter((s) => s.videoKey).length,
    seconds: shots.reduce((a, s) => a + s.duration, 0),
  };
}
