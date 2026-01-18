
export enum ProductionStage {
  PLANNING = '策划与开发 (Planning)',
  PRE_PRODUCTION = '前期筹备 (Pre-Production)',
  PRODUCTION = '正式拍摄 (Production)',
  POST_PRODUCTION = '后期制作 (Post-Production)',
  DISTRIBUTION = '发行与营销 (Distribution)'
}

export interface WorkflowStep {
  id: string;
  stage: ProductionStage;
  title: string;
  titleKr: string;
  description: string;
  keyDeliverables: string[];
  koreanStandard: string;
}

export interface ProjectState {
  currentStage: ProductionStage;
  stepsCompleted: string[];
  scriptDraft: string;
  logs: string[];
}
