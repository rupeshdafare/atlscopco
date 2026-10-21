import { describe, it, expect } from 'vitest';
import { UnitConverter } from './unit-converter';

describe('UnitConverter', () => {
  it('converts velocity correctly from canonical cm/s', () => {
    const raw = 100; // cm/s
    expect(UnitConverter.convertVelocity(raw, 'cm/s')).toBe(100);
    expect(UnitConverter.convertVelocity(raw, 'mm/s')).toBe(1000);
    expect(UnitConverter.convertVelocity(raw, 'm/s')).toBe(1);
    expect(UnitConverter.convertVelocity(raw, 'km/h')).toBe(3.6);
    expect(+UnitConverter.convertVelocity(raw, 'ft/s').toFixed(3)).toBe(3.281);
  });

  it('converts pressure correctly from canonical mbar', () => {
    const raw = 1000; // mbar
    expect(UnitConverter.convertPressure(raw, 'mbar')).toBe(1000);
    expect(UnitConverter.convertPressure(raw, 'Pa')).toBe(100000);
    expect(UnitConverter.convertPressure(raw, 'kPa')).toBe(100);
    expect(UnitConverter.convertPressure(raw, 'bar')).toBe(1);
    expect(+UnitConverter.convertPressure(raw, 'psi').toFixed(2)).toBe(14.50);
    expect(+UnitConverter.convertPressure(raw, 'atm').toFixed(3)).toBe(0.987);
  });

  it('converts temperature correctly from canonical °C with offsets', () => {
    const zero = 0; // °C
    expect(UnitConverter.convertTemperature(zero, '°C')).toBe(0);
    expect(UnitConverter.convertTemperature(zero, '°F')).toBe(32);
    expect(UnitConverter.convertTemperature(zero, 'K')).toBe(273.15);

    const boiling = 100; // °C
    expect(UnitConverter.convertTemperature(boiling, '°F')).toBe(212);
    expect(UnitConverter.convertTemperature(boiling, 'K')).toBe(373.15);
  });
});
