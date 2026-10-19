// 构建时决定平台：电脑版只有键鼠/手柄界面，手机版只有触屏界面，两者互不混用
export const PLATFORM: 'desktop' | 'mobile' = import.meta.env.VITE_PLATFORM === 'mobile' ? 'mobile' : 'desktop';
export const IS_MOBILE = PLATFORM === 'mobile';
export const SAVE_KEY = `gubian.${PLATFORM}.save.v2`;
