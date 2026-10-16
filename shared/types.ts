// 前后端共享类型
export interface ComicPanel {
  panelNumber: number;
  sceneDescription: string;
  caption?: string;
  dialogue?: { character: string; line: string }[];
}

export interface PrevisConfig { style: string; pace: string; transition: string }

export interface PrevisJob {
  id: string;
  status: 'running' | 'done' | 'error';
  error?: string;
}
