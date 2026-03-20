
export enum Section {
  DASHBOARD = 'dashboard',
  WATER = 'water',
  SALES = 'sales',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

export interface CoinData {
  p1: number;
  p5: number;
  p10: number;
}

export interface SystemAlert {
  id: string;
  created_at: string;
  unit_id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  is_acknowledged: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string;
  p1: number;
  p5: number;
  p10: number;
  total: number;
}

export interface VendoState {
  insertedCoins: CoinData;
  changeBank: { p1: number; p5: number };
  waterLevel: number;
  systemAlerts: string;
  lastUpdated: string;
  lastSeen: string | null;
  history: HistoryEntry[];
  alerts: SystemAlert[];

}
