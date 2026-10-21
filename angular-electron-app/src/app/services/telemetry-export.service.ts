import { Injectable } from '@angular/core';
import { DashboardResponse } from '../models/telemetry.model';
import { UnitConverter, VelocityUnit, PressureUnit, TemperatureUnit } from './unit-converter';

export interface ExportRow {
  timestamp: string;
  velocity: number;
  velocityUnit: string;
  pressure: number;
  pressureUnit: string;
  temperature: number;
  temperatureUnit: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryExportService {
  /**
   * Aligns historical samples across velocity, pressure, and temperature.
   * Exports in user-selected display units.
   */
  public generateExportRows(
    telemetry: DashboardResponse,
    vUnit: VelocityUnit,
    pUnit: PressureUnit,
    tUnit: TemperatureUnit
  ): ExportRow[] {
    const vHist = telemetry.velocity.history || [];
    const pHist = telemetry.pressure.history || [];
    const tHist = telemetry.temperature.history || [];

    const maxLen = Math.max(vHist.length, pHist.length, tHist.length);
    const rows: ExportRow[] = [];

    for (let i = 0; i < maxLen; i++) {
      const vPt = vHist[i];
      const pPt = pHist[i];
      const tPt = tHist[i];

      const timestamp = vPt?.time || pPt?.time || tPt?.time || telemetry.timestamp;

      const rawV = vPt ? vPt.value : telemetry.velocity.value;
      const rawP = pPt ? pPt.value : telemetry.pressure.value;
      const rawT = tPt ? tPt.value : telemetry.temperature.value;

      rows.push({
        timestamp,
        velocity: +UnitConverter.convertVelocity(rawV, vUnit).toFixed(2),
        velocityUnit: vUnit,
        pressure: +UnitConverter.convertPressure(rawP, pUnit).toFixed(2),
        pressureUnit: pUnit,
        temperature: +UnitConverter.convertTemperature(rawT, tUnit).toFixed(2),
        temperatureUnit: tUnit
      });
    }

    return rows;
  }

  public exportCsv(rows: ExportRow[], filename = 'telemetry_export.csv'): void {
    if (!rows || rows.length === 0) return;

    const headers = [
      'Timestamp',
      `Velocity (${rows[0].velocityUnit})`,
      `Pressure (${rows[0].pressureUnit})`,
      `Temperature (${rows[0].temperatureUnit})`
    ];

    const csvLines = [headers.join(',')];
    for (const r of rows) {
      csvLines.push(`"${r.timestamp}",${r.velocity},${r.pressure},${r.temperature}`);
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Generates Excel XML format (.xlsx compatible XML spreadsheet readable directly by Excel and spreadsheet apps)
   */
  public exportExcelXml(rows: ExportRow[], filename = 'telemetry_export.xlsx'): void {
    if (!rows || rows.length === 0) return;

    const vUnit = rows[0].velocityUnit;
    const pUnit = rows[0].pressureUnit;
    const tUnit = rows[0].temperatureUnit;

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="DataTime">
   <Alignment ss:Horizontal="Left"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Telemetry Data">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell><Data ss:Type="String">Velocity (${vUnit})</Data></Cell>
    <Cell><Data ss:Type="String">Pressure (${pUnit})</Data></Cell>
    <Cell><Data ss:Type="String">Temperature (${tUnit})</Data></Cell>
   </Row>`;

    for (const r of rows) {
      xml += `
   <Row>
    <Cell ss:StyleID="DataTime"><Data ss:Type="String">${r.timestamp}</Data></Cell>
    <Cell ss:StyleID="Data"><Data ss:Type="Number">${r.velocity}</Data></Cell>
    <Cell ss:StyleID="Data"><Data ss:Type="Number">${r.pressure}</Data></Cell>
    <Cell ss:StyleID="Data"><Data ss:Type="Number">${r.temperature}</Data></Cell>
   </Row>`;
    }

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, filename);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
