export interface Equipment {
  id: string;
  name: string;
  category: 'Air Compressor' | 'Vacuum Pump' | 'Industrial Tool' | 'Power Technique';
  modelNumber: string;
  operatingPressureBar: number;
  flowRateCfm: number;
  status: 'Operational' | 'Maintenance Due' | 'Offline' | 'Standby';
  lastServiceDate: string;
  temperatureCelsius: number;
  runtimeHours: number;
}

export type EquipmentFilter = 'ALL' | 'Operational' | 'Maintenance Due' | 'Offline' | 'Standby';
