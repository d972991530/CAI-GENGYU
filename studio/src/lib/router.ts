import { useEffect, useState } from 'react';

export function useHash() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => {
    const h = () => setHash(location.hash.slice(1) || '/');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return hash;
}

export const go = (path: string) => { location.hash = path; };
