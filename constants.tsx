
import { ProductionStage, WorkflowStep } from './types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'planning-1',
    stage: ProductionStage.PLANNING,
    title: '创意核心与梗概',
    titleKr: '아이템 및 로그라인 선정',
    description: '确定核心“钩子”（Hook）及商业可行性。侧重于“全球化 K-内容”的潜力挖掘。',
    keyDeliverables: ['核心梗概 (Logline)', '概念计划书', '初步预算评估'],
    koreanStandard: '专注于适用于 OTT 平台（如 Netflix/Disney+）及院线发行的“高概念”内容。'
  },
  {
    id: 'planning-2',
    stage: ProductionStage.PLANNING,
    title: '剧本创作与大纲',
    titleKr: '시나리오 및 트리트먼트',
    description: '开发详细的叙事结构。在韩国，这通常涉及多个“编剧室”协作完成。',
    keyDeliverables: ['剧本大纲 (Treatment)', '人物小传', '初稿剧本 (v1)'],
    koreanStandard: '深度关注“新派”情感共鸣（Shin-pa）与现代类型片的颠覆式结合。'
  },
  {
    id: 'planning-3',
    stage: ProductionStage.PLANNING,
    title: '剧本分镜化 (Storyboard)',
    titleKr: '시나리오 스토리보드화',
    description: '将文学剧本转化为视觉分镜脚本。这是韩国工业化流程中连接导演意志与摄影执行的关键环节。',
    keyDeliverables: ['分镜脚本', '摄影机位图', '关键帧插画'],
    koreanStandard: '强调动线设计（Blocking）与镜头调度（Mise-en-scène）的精确配合。'
  },
  {
    id: 'planning-4',
    stage: ProductionStage.PLANNING,
    title: '分镜可视化 (Visual Pre-vis)',
    titleKr: '스토리보드 시각화',
    description: '通过 AI 技术将文字分镜直接转化为图像和动态预演视频。大幅降低后期补拍风险，提升拍摄现场沟通效率。',
    keyDeliverables: ['关键帧插图', '动态预演视频 (Pre-vis)', '氛围参考图'],
    koreanStandard: '在韩国大制作中，Pre-vis 已成为控制 VFX 成本和动作片安全性的必备步骤。'
  },
  {
    id: 'pre-1',
    stage: ProductionStage.PRE_PRODUCTION,
    title: '选角与明星系统',
    titleKr: '캐스팅 및 스타 시스템',
    description: '将顶级演员与投资者匹配。在韩国，演员阵容往往决定了投资规模。',
    keyDeliverables: ['演员意向名单', '投资合同'],
    koreanStandard: '针对一线明星（A-list stars）的“票房号召力”精准分析。'
  },
  {
    id: 'pre-2',
    stage: ProductionStage.PRE_PRODUCTION,
    title: '勘景与艺术设计',
    titleKr: '로케이션 및 프로덕션 디자인',
    description: '细致入微的世界观构建。韩国电影以高质量的艺术指导和美术设计著称。',
    keyDeliverables: ['勘景报告', '艺术概念板', '场景搭建计划'],
    koreanStandard: '将传统美学与现代或粗犷的都市设定进行工业化整合。'
  },
  {
    id: 'production-1',
    stage: ProductionStage.PRODUCTION,
    title: '主体拍摄',
    titleKr: '크랭크인 및 촬영',
    description: '正式拍摄阶段。韩国采用高效的“模块化拍摄”技术。',
    keyDeliverables: ['每日素材 (Dailies)', '通告单 (Call Sheets)'],
    koreanStandard: '严格遵守每周 52 小时工时制，同时保持极高的执行效率。'
  },
  {
    id: 'post-1',
    stage: ProductionStage.POST_PRODUCTION,
    title: '视觉特效 (VFX)',
    titleKr: 'VFX 및 CG 작업',
    description: '世界级的视觉特效集成（如 Dexter Studios, Westworld）。',
    keyDeliverables: ['特效拆解表', '渲染样片'],
    koreanStandard: '无论是奇幻题材还是写实正剧，都追求极高的视觉真实感。'
  },
  {
    id: 'post-2',
    stage: ProductionStage.POST_PRODUCTION,
    title: '声音设计与配乐',
    titleKr: '사운드 믹싱 및 OST',
    description: '韩国影视行业将原声带（OST）视为重要的二次营收渠道。',
    keyDeliverables: ['大师级 OST', '全景声混音'],
    koreanStandard: '通过专业声音设计创造深度“情感回响”。'
  },
  {
    id: 'dist-1',
    stage: ProductionStage.DISTRIBUTION,
    title: '营销策略',
    titleKr: '배급 및 마케팅 전략',
    description: '病毒式营销与全国范围内的影院“映后见面会”巡演。',
    keyDeliverables: ['预告片', '海报', '社交媒体策略'],
    koreanStandard: '极具攻击性的档期管理及全球化的 K-Drama 社交媒体引流战术。'
  }
];
