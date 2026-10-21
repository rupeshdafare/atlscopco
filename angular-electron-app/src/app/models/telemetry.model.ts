export interface HistoryPoint {
  time: string;
  value: number;
}

export interface MetricResponse {
  value: number;
  unit: string;
  history: HistoryPoint[];
}

export interface DashboardResponse {
  timestamp: string;
  velocity: MetricResponse;
  pressure: MetricResponse;
  temperature: MetricResponse;
}
