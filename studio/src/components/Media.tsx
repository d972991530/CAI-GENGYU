import { useEffect, useState, type ImgHTMLAttributes, type VideoHTMLAttributes } from 'react';
import { mediaUrl } from '../lib/db';

export function useMediaUrl(key?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let alive = true;
    if (!key) { setUrl(undefined); return; }
    mediaUrl(key).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [key]);
  return url;
}

export function MediaImg({ k, ...rest }: { k?: string } & ImgHTMLAttributes<HTMLImageElement>) {
  const url = useMediaUrl(k);
  if (!url) return null;
  return <img src={url} {...rest} />;
}

export function MediaVideo({ k, ...rest }: { k?: string } & VideoHTMLAttributes<HTMLVideoElement>) {
  const url = useMediaUrl(k);
  if (!url) return null;
  return <video src={url} {...rest} />;
}
