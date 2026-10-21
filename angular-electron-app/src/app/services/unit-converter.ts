export type VelocityUnit = 'mm/s' | 'cm/s' | 'm/s' | 'km/h' | 'ft/s';
export type PressureUnit = 'Pa' | 'kPa' | 'mbar' | 'bar' | 'psi' | 'atm';
export type TemperatureUnit = '°C' | '°F' | 'K';

export interface ParameterThresholds {
  min: number;
  max: number;
  warningLow?: number;
  warningHigh: number;
  criticalLow?: number;
  criticalHigh: number;
}

/**
 * Canonical backend units:
 * - Velocity: cm/s
 * - Pressure: mbar
 * - Temperature: °C
 */
export class UnitConverter {
  // --- VELOCITY (Canonical: cm/s) ---
  // 1 cm/s = 10 mm/s
  // 1 cm/s = 0.01 m/s
  // 1 cm/s = 0.036 km/h
  // 1 cm/s = 0.0328084 ft/s
  public static convertVelocity(valCmPerSec: number, targetUnit: VelocityUnit): number {
    switch (targetUnit) {
      case 'mm/s':
        return valCmPerSec * 10;
      case 'cm/s':
        return valCmPerSec;
      case 'm/s':
        return valCmPerSec * 0.01;
      case 'km/h':
        return valCmPerSec * 0.036;
      case 'ft/s':
        return valCmPerSec * 0.0328084;
      default:
        return valCmPerSec;
    }
  }

  // --- PRESSURE (Canonical: mbar) ---
  // 1 mbar = 100 Pa
  // 1 mbar = 0.1 kPa
  // 1 mbar = 1 mbar
  // 1 mbar = 0.001 bar
  // 1 mbar = 0.01450377 psi
  // 1 mbar = 0.000986923 atm
  public static convertPressure(valMbar: number, targetUnit: PressureUnit): number {
    switch (targetUnit) {
      case 'Pa':
        return valMbar * 100;
      case 'kPa':
        return valMbar * 0.1;
      case 'mbar':
        return valMbar;
      case 'bar':
        return valMbar * 0.001;
      case 'psi':
        return valMbar * 0.01450377;
      case 'atm':
        return valMbar * 0.000986923;
      default:
        return valMbar;
    }
  }

  // --- TEMPERATURE (Canonical: °C) ---
  // °F = (°C * 9/5) + 32
  // K = °C + 273.15
  public static convertTemperature(valCelsius: number, targetUnit: TemperatureUnit): number {
    switch (targetUnit) {
      case '°C':
        return valCelsius;
      case '°F':
        return (valCelsius * 9) / 5 + 32;
      case 'K':
        return valCelsius + 273.15;
      default:
        return valCelsius;
    }
  }

  // --- THRESHOLD SCALING FOR GAUGES & STATUS ---
  // Canonical ranges:
  // Velocity (cm/s): Range 0-300, Warning > 200, Critical > 250
  public static getVelocityThresholds(unit: VelocityUnit): ParameterThresholds {
    return {
      min: UnitConverter.convertVelocity(0, unit),
      max: UnitConverter.convertVelocity(300, unit),
      warningHigh: UnitConverter.convertVelocity(200, unit),
      criticalHigh: UnitConverter.convertVelocity(250, unit)
    };
  }

  // Pressure (mbar): Range 900-1100, Normal 950-1050, Warning < 950 or > 1050, Critical < 900 or > 1100
  public static getPressureThresholds(unit: PressureUnit): ParameterThresholds {
    return {
      min: UnitConverter.convertPressure(900, unit),
      max: UnitConverter.convertPressure(1100, unit),
      warningLow: UnitConverter.convertPressure(950, unit),
      warningHigh: UnitConverter.convertPressure(1050, unit),
      criticalLow: UnitConverter.convertPressure(900, unit),
      criticalHigh: UnitConverter.convertPressure(1100, unit)
    };
  }

  // Temperature (°C): Range 20-50, Normal < 40, Warning 40-50, Critical > 50
  public static getTemperatureThresholds(unit: TemperatureUnit): ParameterThresholds {
    return {
      min: UnitConverter.convertTemperature(20, unit),
      max: UnitConverter.convertTemperature(50, unit),
      warningHigh: UnitConverter.convertTemperature(40, unit),
      criticalHigh: UnitConverter.convertTemperature(50, unit)
    };
  }
}
