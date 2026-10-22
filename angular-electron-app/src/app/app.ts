import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ElectronService, PlatformInfo } from './services/electron.service';
import { TelemetryApiService } from './services/telemetry-api.service';
import { TelemetryExportService } from './services/telemetry-export.service';
import { DashboardResponse } from './models/telemetry.model';
import {
  UnitConverter,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  ParameterThresholds
} from './services/unit-converter';
import { TrendChartComponent, ChartDataPoint } from './components/trend-chart/trend-chart.component';
import { CircularGaugeComponent } from './components/circular-gauge/circular-gauge.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatTooltipModule,
    TrendChartComponent,
    CircularGaugeComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  // Live Backend Telemetry State
  public liveTelemetry: DashboardResponse | null = null;
  public backendConnected = false;
  public isInitialLoading = true;
  public lastTelemetryUpdate: string | null = null;
  public lastUpdateFull: string = '';
  private telemetrySub?: Subscription;

  // Theme & Navigation
  public isDarkMode = true;
  public activeTab: 'dashboard' | 'settings' | 'about' = 'dashboard';

  // Selected Units
  public velocityUnit: VelocityUnit = 'cm/s';
  public pressureUnit: PressureUnit = 'mbar';
  public tempUnit: TemperatureUnit = '°C';

  // Desktop / Platform Info
  public isDesktop = false;
  public platformDetails: PlatformInfo = { platform: 'unknown', arch: '', version: '' };
  public appVersion = '1.0.0';

  constructor(
    private electronService: ElectronService,
    private telemetryApi: TelemetryApiService,
    private exportService: TelemetryExportService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  public async ngOnInit(): Promise<void> {
    this.isDesktop = this.electronService.isElectron;
    this.platformDetails = await this.electronService.getPlatformDetails();
    this.appVersion = await this.electronService.getAppVersion();
    this.cdr.detectChanges();

    // Check saved theme
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'light') {
      this.isDarkMode = false;
      document.body.classList.add('light-theme');
    } else {
      this.isDarkMode = true;
      document.body.classList.remove('light-theme');
    }

    // Connect to 1-second live telemetry stream
    this.connectBackendTelemetry();
  }

  public ngOnDestroy(): void {
    if (this.telemetrySub) {
      this.telemetrySub.unsubscribe();
    }
  }

  public toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('app-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('app-theme', 'light');
    }
  }

  public connectBackendTelemetry(): void {
    if (this.telemetrySub) {
      this.telemetrySub.unsubscribe();
    }

    this.telemetrySub = this.telemetryApi.streamDashboardData(1000).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.isInitialLoading = false;
          if (data) {
            this.liveTelemetry = data;
            this.backendConnected = true;
            const now = new Date();
            this.lastTelemetryUpdate = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.lastUpdateFull = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${this.lastTelemetryUpdate}`;
          } else {
            this.backendConnected = false;
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isInitialLoading = false;
          this.backendConnected = false;
          console.warn('Backend API connection warning:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  public refreshTelemetry(): void {
    this.telemetryApi.getDashboardData().subscribe({
      next: (data) => {
        this.liveTelemetry = data;
        this.backendConnected = true;
        const now = new Date();
        this.lastTelemetryUpdate = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.lastUpdateFull = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${this.lastTelemetryUpdate}`;
        this.snackBar.open('Telemetry synchronized successfully', 'Dismiss', { duration: 2000 });
      },
      error: () => {
        this.backendConnected = false;
        this.snackBar.open('Could not reach backend at localhost:8080', 'Dismiss', { duration: 2500 });
      }
    });
  }

  // --- CONVERTED VALUES (Current scalar) ---
  public getConvertedVelocity(): number {
    const raw = this.liveTelemetry?.velocity?.value ?? 0;
    return UnitConverter.convertVelocity(raw, this.velocityUnit);
  }

  public getConvertedPressure(): number {
    const raw = this.liveTelemetry?.pressure?.value ?? 0;
    return UnitConverter.convertPressure(raw, this.pressureUnit);
  }

  public getConvertedTemp(): number {
    const raw = this.liveTelemetry?.temperature?.value ?? 0;
    return UnitConverter.convertTemperature(raw, this.tempUnit);
  }

  // --- DYNAMIC THRESHOLDS PER UNIT ---
  public get velocityThresholds(): ParameterThresholds {
    return UnitConverter.getVelocityThresholds(this.velocityUnit);
  }

  public get pressureThresholds(): ParameterThresholds {
    return UnitConverter.getPressureThresholds(this.pressureUnit);
  }

  public get tempThresholds(): ParameterThresholds {
    return UnitConverter.getTemperatureThresholds(this.tempUnit);
  }

  // --- STATUS EVALUATION (Canonical baseline) ---
  public getVelocityStatus(): { label: string; class: string } {
    const val = this.liveTelemetry?.velocity?.value ?? 0;
    if (val > 250) return { label: 'Critical', class: 'status-critical' };
    if (val > 200) return { label: 'Warning', class: 'status-warning' };
    return { label: 'Normal', class: 'status-normal' };
  }

  public getPressureStatus(): { label: string; class: string } {
    const val = this.liveTelemetry?.pressure?.value ?? 0;
    if (val < 900 || val > 1100) return { label: 'Critical', class: 'status-critical' };
    if (val < 950 || val > 1050) return { label: 'Warning', class: 'status-warning' };
    return { label: 'Normal', class: 'status-normal' };
  }

  public getTempStatus(): { label: string; class: string } {
    const val = this.liveTelemetry?.temperature?.value ?? 0;
    if (val > 50) return { label: 'Critical', class: 'status-critical' };
    if (val >= 40) return { label: 'Warning', class: 'status-warning' };
    return { label: 'Normal', class: 'status-normal' };
  }

  public getOverallSystemStatus(): { title: string; subtitle: string; isNormal: boolean } {
    const v = this.getVelocityStatus();
    const p = this.getPressureStatus();
    const t = this.getTempStatus();

    if (v.label === 'Critical' || p.label === 'Critical' || t.label === 'Critical') {
      return {
        title: 'System Alert',
        subtitle: 'One or more telemetry parameters exceed normal operational thresholds.',
        isNormal: false
      };
    }
    if (v.label === 'Warning' || p.label === 'Warning' || t.label === 'Warning') {
      return {
        title: 'System Warning',
        subtitle: 'Parameters approaching upper tolerance bounds.',
        isNormal: false
      };
    }
    return {
      title: 'Normal',
      subtitle: 'All telemetry parameters are within normal safe ranges.',
      isNormal: true
    };
  }

  // --- CONVERTED HISTORICAL DATA FOR CHARTS ---
  public get velocityChartData(): ChartDataPoint[] {
    const history = this.liveTelemetry?.velocity?.history || [];
    return history.map(pt => ({
      time: pt.time,
      value: +UnitConverter.convertVelocity(pt.value, this.velocityUnit).toFixed(2)
    }));
  }

  public get pressureChartData(): ChartDataPoint[] {
    const history = this.liveTelemetry?.pressure?.history || [];
    return history.map(pt => ({
      time: pt.time,
      value: +UnitConverter.convertPressure(pt.value, this.pressureUnit).toFixed(2)
    }));
  }

  public get tempChartData(): ChartDataPoint[] {
    const history = this.liveTelemetry?.temperature?.history || [];
    return history.map(pt => ({
      time: pt.time,
      value: +UnitConverter.convertTemperature(pt.value, this.tempUnit).toFixed(2)
    }));
  }

  // --- DATA EXPORTS ---
  public exportCsv(): void {
    if (!this.liveTelemetry) {
      this.snackBar.open('No telemetry data available to export', 'Dismiss', { duration: 2500 });
      return;
    }
    const rows = this.exportService.generateExportRows(
      this.liveTelemetry,
      this.velocityUnit,
      this.pressureUnit,
      this.tempUnit
    );
    this.exportService.exportCsv(rows, `telemetry_export_${Date.now()}.csv`);
    this.snackBar.open(`Exported ${rows.length} telemetry samples to CSV`, 'Dismiss', { duration: 2500 });
  }

  public exportExcel(): void {
    if (!this.liveTelemetry) {
      this.snackBar.open('No telemetry data available to export', 'Dismiss', { duration: 2500 });
      return;
    }
    const rows = this.exportService.generateExportRows(
      this.liveTelemetry,
      this.velocityUnit,
      this.pressureUnit,
      this.tempUnit
    );
    this.exportService.exportExcelXml(rows, `telemetry_export_${Date.now()}.xlsx`);
    this.snackBar.open(`Exported ${rows.length} telemetry samples to Excel (.xlsx)`, 'Dismiss', { duration: 2500 });
  }
}
