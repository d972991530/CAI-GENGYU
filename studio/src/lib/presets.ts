import type { ProjectFormat, StylePreset } from '../types';

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'guoman', name: '国漫厚涂', tag: '漫剧爆款', swatch: ['#c2410c', '#1e1b4b'],
    prompt: 'Chinese donghua style, thick painterly digital painting, rich saturated colors, dramatic rim light, detailed costume, high-end webtoon cover quality' },
  { id: 'anime', name: '日系动画', tag: '清新', swatch: ['#38bdf8', '#fde68a'],
    prompt: 'Japanese anime style, clean cel shading, crisp lineart, soft gradient sky, Makoto Shinkai inspired lighting' },
  { id: 'cinematic', name: '写实电影', tag: '真人感', swatch: ['#78350f', '#0c0a09'],
    prompt: 'photorealistic cinematic film still, 35mm anamorphic lens, shallow depth of field, film grain, teal and orange color grade, natural skin texture' },
  { id: 'pixar', name: '3D 卡通', tag: '合家欢', swatch: ['#f97316', '#22d3ee'],
    prompt: '3D animated feature film style, Pixar-like stylized characters, subsurface scattering, soft global illumination, expressive faces' },
  { id: 'ink', name: '水墨国风', tag: '古风仙侠', swatch: ['#e7e5e4', '#292524'],
    prompt: 'traditional Chinese ink wash painting, xieyi brushstrokes, rice paper texture, misty mountains, restrained palette with vermilion accents' },
  { id: 'cyber', name: '赛博霓虹', tag: '科幻', swatch: ['#e11d48', '#4f46e5'],
    prompt: 'cyberpunk neon noir, rain-soaked streets, magenta and cyan neon reflections, volumetric fog, blade runner atmosphere' },
  { id: 'manhwa', name: '韩漫条漫', tag: '霸总甜宠', swatch: ['#f9a8d4', '#fef3c7'],
    prompt: 'Korean manhwa webtoon style, glossy soft shading, beautiful idealized characters, pastel bloom lighting, romance drama mood' },
  { id: 'clay', name: '黏土定格', tag: '趣味', swatch: ['#a16207', '#65a30d'],
    prompt: 'claymation stop-motion style, handmade plasticine textures, fingerprints visible, miniature set, warm practical lighting' },
];

export const FORMATS: { id: ProjectFormat; name: string; hint: string }[] = [
  { id: 'short-drama', name: '真人短剧', hint: '竖屏多集，强钩子、快节奏' },
  { id: 'comic-drama', name: 'AI 漫剧', hint: '动态漫画，画风统一' },
  { id: 'film', name: '电影短片', hint: '横屏单片，镜头语言优先' },
];

export const GENRES = ['都市逆袭', '古风仙侠', '悬疑惊悚', '甜宠恋爱', '科幻末日', '家庭伦理', '喜剧', '奇幻冒险'];

export const SHOT_SCALES = ['远景', '全景', '中景', '近景', '特写', '大特写'];
export const CAMERA_MOVES = ['固定', '推镜', '拉镜', '摇镜', '移镜', '跟拍', '升降', '手持', '环绕'];

export const VOICES = [
  { id: 'Kore', name: '沉稳女声' },
  { id: 'Puck', name: '活泼男声' },
  { id: 'Charon', name: '低沉男声' },
  { id: 'Aoede', name: '温柔女声' },
  { id: 'Fenrir', name: '激昂男声' },
  { id: 'Leda', name: '少女音' },
];

export const styleById = (id: string) => STYLE_PRESETS.find((s) => s.id === id) ?? STYLE_PRESETS[0];
