import { useState } from 'react';
import { ArrowRight, Check, ImagePlus } from 'lucide-react';
import { useStore } from '../store/store';
import { getProvider } from '../services/ai';
import { putMedia } from '../lib/db';
import { STYLE_PRESETS, styleById } from '../lib/presets';
import { go } from '../lib/router';
import { Button, Label, Panel, SectionTitle, Segmented } from '../components/ui';
import { MediaImg } from '../components/Media';
import type { Aspect } from '../types';
import type { StepProps } from './Workspace';

export default function StylePage({ p }: StepProps) {
  const patch = useStore((s) => s.patch);
  const settings = useStore((s) => s.settings);
  const toast = useStore((s) => s.toast);
  const [sample, setSample] = useState<string>();
  const [busy, setBusy] = useState(false);
  const style = styleById(p.styleId);

  const trySample = async () => {
    setBusy(true);
    try {
      const subject = p.logline || p.idea || 'a lone hero standing on a rooftop at dusk, city skyline behind';
      const blob = await getProvider(settings).image(`Art style: ${style.prompt}${p.styleExtra ? ', ' + p.styleExtra : ''}.\nScene content: ${subject}\nKey visual poster frame, no text.`, p.aspect, []);
      setSample(await putMedia(blob));
    } catch (e) {
      toast(`样张生成失败：${(e as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  return (
    <>
      <SectionTitle no="02 / LOOK" title="画风与画幅" desc="画风会作为全局视觉基调注入到每一张定妆图、分镜图和视频提示词中，保证全片风格统一。"
        right={<Button variant="primary" onClick={() => go(`/p/${p.id}/assets`)} icon={<ArrowRight className="size-4" />}>下一步：资产</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {STYLE_PRESETS.map((s) => {
            const on = s.id === p.styleId;
            return (
              <button key={s.id} onClick={() => patch(p.id, (x) => (x.styleId = s.id))}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border text-left transition ${on ? 'border-amber ring-2 ring-amber/30' : 'border-line hover:border-dim'}`}>
                <div className="relative aspect-[4/3]" style={{ background: `radial-gradient(circle at 70% 30%, ${s.swatch[0]}, ${s.swatch[1]} 70%)` }}>
                  <span className="absolute bottom-2 left-3 font-serif text-3xl font-black text-white/90 drop-shadow">{s.name.slice(0, 2)}</span>
                  {on && <Check className="absolute right-2 top-2 size-6 rounded-full bg-amber p-1 text-ink-0" />}
                </div>
                <div className="bg-ink-1 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="rounded-full bg-ink-3 px-2 py-0.5 text-[10px] text-dim">{s.tag}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-faint">{s.prompt}</p>
                </div>
              </button>
            );
          })}
        </div>
        <Panel className="h-fit space-y-5 p-5">
          <div>
            <Label>画幅</Label>
            <Segmented value={p.aspect} onChange={(v: Aspect) => patch(p.id, (x) => (x.aspect = v))}
              options={[{ id: '9:16', name: '9:16' }, { id: '16:9', name: '16:9' }, { id: '1:1', name: '1:1' }]} />
          </div>
          <div>
            <Label hint="英文效果更佳">追加风格描述</Label>
            <textarea className="field min-h-24 text-sm" value={p.styleExtra} placeholder="如：muted colors, rainy mood, 1990s Hong Kong film"
              onChange={(e) => patch(p.id, (x) => (x.styleExtra = e.target.value))} />
          </div>
          <div>
            <Label>画风样张</Label>
            <div className="grid place-items-center overflow-hidden rounded-xl border border-line bg-ink-0" style={{ aspectRatio: p.aspect.replace(':', '/') }}>
              {busy ? <div className="shimmer size-full" /> : sample ? <MediaImg k={sample} className="size-full object-cover" /> : <span className="text-xs text-faint">用当前画风试生成一张</span>}
            </div>
            <Button className="mt-3 w-full" loading={busy} icon={<ImagePlus className="size-4" />} onClick={trySample}>生成样张</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
