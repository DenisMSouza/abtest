export interface Experiment {
  id: string;
  name: string;
  description?: string;
  version?: string;
  isActive: boolean;
  variations: Variation[];
}

export interface Variation {
  id: string;
  name: string;
  weight: number;
  isBaseline: boolean;
}

export interface ExperimentStats {
  experiment: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
  variations: {
    id: string;
    name: string;
    weight: number;
    isBaseline: boolean;
    userCount: number;
    successCount: number;
    successRate: number;
    percentage: number;
  }[];
  totalUsers: number;
}

export interface ExperimentFormData {
  name: string;
  description?: string;
  version: string;
  startDate?: string;
  endDate?: string;
  successMetric?: {
    type: "click" | "conversion" | "custom";
    target?: string;
    value?: number;
  };
  variations: {
    name: string;
    weight: number;
    isBaseline: boolean;
  }[];
}

export type StatusFilter = "all" | "active" | "inactive";
