import { Equipment } from '../models/equipment.model';

export const INITIAL_EQUIPMENT_DATA: Equipment[] = [
  {
    id: 'EQ-1001',
    name: 'GA 90+ VSD Oil-Injected Rotary Screw',
    category: 'Air Compressor',
    modelNumber: 'GA-90-VSD-PLUS',
    operatingPressureBar: 7.5,
    flowRateCfm: 580,
    status: 'Operational',
    lastServiceDate: '2026-08-15',
    temperatureCelsius: 68.4,
    runtimeHours: 4210
  },
  {
    id: 'EQ-1002',
    name: 'ZR 160 Oil-Free Multistage Compressor',
    category: 'Air Compressor',
    modelNumber: 'ZR-160-VSD',
    operatingPressureBar: 8.6,
    flowRateCfm: 920,
    status: 'Operational',
    lastServiceDate: '2026-09-02',
    temperatureCelsius: 72.1,
    runtimeHours: 6350
  },
  {
    id: 'EQ-1003',
    name: 'GHS 730 VSD+ Oil-Sealed Rotary Screw',
    category: 'Vacuum Pump',
    modelNumber: 'GHS-730-VSDP',
    operatingPressureBar: 0.8,
    flowRateCfm: 430,
    status: 'Maintenance Due',
    lastServiceDate: '2026-03-10',
    temperatureCelsius: 82.0,
    runtimeHours: 8120
  },
  {
    id: 'EQ-1004',
    name: 'Tensor IxB Intelligent Transducerized Tool',
    category: 'Industrial Tool',
    modelNumber: 'ITB-61-08-10',
    operatingPressureBar: 6.0,
    flowRateCfm: 45,
    status: 'Operational',
    lastServiceDate: '2026-09-28',
    temperatureCelsius: 41.5,
    runtimeHours: 1280
  },
  {
    id: 'EQ-1005',
    name: 'QAS 150 On-Site Mobile Diesel Generator',
    category: 'Power Technique',
    modelNumber: 'QAS-150-EU5',
    operatingPressureBar: 4.2,
    flowRateCfm: 120,
    status: 'Standby',
    lastServiceDate: '2026-07-19',
    temperatureCelsius: 38.0,
    runtimeHours: 940
  },
  {
    id: 'EQ-1006',
    name: 'ZT 45 Classic Oil-Free Tooth Compressor',
    category: 'Air Compressor',
    modelNumber: 'ZT-45-STD',
    operatingPressureBar: 7.0,
    flowRateCfm: 280,
    status: 'Offline',
    lastServiceDate: '2026-02-14',
    temperatureCelsius: 24.0,
    runtimeHours: 11450
  }
];
