export enum AgentRole {
  PLANNER = 'PLANNER',
  MANAGER = 'MANAGER',
  DATA_GATHERER = 'DATA_GATHERER',
  ENV_SETUP = 'ENV_SETUP',
  CODE_GENERATOR = 'CODE_GENERATOR',
  RESULT_ANALYZER = 'RESULT_ANALYZER',
  DOCUMENTATION = 'DOCUMENTATION',
}

export interface PlanStep {
  id: string;
  description: string;
  assignedAgent: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

export interface Artifact {
  type: 'plan' | 'data' | 'code' | 'env' | 'analysis' | 'doc';
  title: string;
  content: string;
  language?: string;
}

export interface LogMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  agentRole?: AgentRole;
  content: string;
  timestamp: number;
}

export interface AppState {
  isProcessing: boolean;
  currentStepId: string | null;
  logs: LogMessage[];
  plan: PlanStep[];
  artifacts: Artifact[];
}
