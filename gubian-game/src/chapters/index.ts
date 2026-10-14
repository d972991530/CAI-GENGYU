import type { Game } from '../game/game';
import type { ChapterData } from './types';
import { ch1 as d1 } from './data/ch1';
import { ch2 as d2 } from './data/ch2';
import { ch3 as d3 } from './data/ch3';
import { ch4 as d4 } from './data/ch4';
import { ch5 as d5 } from './data/ch5';
import { ch6 as d6 } from './data/ch6';
import { ch7 as d7 } from './data/ch7';
import { ch8 as d8 } from './data/ch8';
import { ch1 } from './ch1';
import { ch2 } from './ch2';
import { ch3 } from './ch3';
import { ch4 } from './ch4';
import { ch5 } from './ch5';
import { ch6 } from './ch6';
import { ch7 } from './ch7';
import { ch8 } from './ch8';

export interface Chapter {
  data: ChapterData;
  run: (g: Game) => Promise<void>;
}

export const CHAPTERS: Chapter[] = [
  { data: d1, run: ch1 }, { data: d2, run: ch2 }, { data: d3, run: ch3 }, { data: d4, run: ch4 },
  { data: d5, run: ch5 }, { data: d6, run: ch6 }, { data: d7, run: ch7 }, { data: d8, run: ch8 },
];
