import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { EquipmentService, EquipmentSummary } from './services/equipment.service';
import { ElectronService, PlatformInfo } from './services/electron.service';
import { TelemetryApiService } from './services/telemetry-api.service';
import { Equipment, EquipmentFilter } from './models/equipment.model';
import { DashboardResponse } from './models/telemetry.model';
import { EquipmentDialogComponent } from './components/equipment-dialog/equipment-dialog.component';

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
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressBarModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  public displayedColumns: string[] = [
    'id',
    'name',
    'category',
    'operatingPressureBar',
    'temperatureCelsius',
    'runtimeHours',
    'status',
    'actions'
  ];

  public allEquipment: Equipment[] = [];
  public filteredEquipment: Equipment[] = [];
  public currentFilter: EquipmentFilter = 'ALL';
  public searchQuery = '';
  public summary: EquipmentSummary = {
    total: 0,
    operational: 0,
    maintenanceDue: 0,
    offline: 0,
    standby: 0,
    avgTemperature: 0
  };

  // Live Backend Telemetry State
  public liveTelemetry: DashboardResponse | null = null;
  public backendConnected = false;
  public lastTelemetryUpdate: string | null = null;
  public lastUpdateFull: string = '';
  private telemetrySub?: Subscription;

  // Theme & Navigation
  public isDarkMode = true;
  public activeTab: 'dashboard' | 'settings' | 'about' = 'dashboard';

  // Time range filters for graphs (1H, 6H, 24H)
  public velocityTimeRange: '1H' | '6H' | '24H' = '1H';
  public pressureTimeRange: '1H' | '6H' | '24H' = '1H';
  public tempTimeRange: '1H' | '6H' | '24H' = '1H';

  // Unit conversions / selectors
  public velocityUnit: string = 'cm/s';
  public pressureUnit: string = 'mbar';
  public tempUnit: string = '°C';

  public isDesktop = false;
  public platformDetails: PlatformInfo = { platform: 'unknown', arch: '', version: '' };
  public appVersion = '1.0.0';

  constructor(
    private equipmentService: EquipmentService,
    private electronService: ElectronService,
    private telemetryApi: TelemetryApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  public async ngOnInit(): Promise<void> {
    this.isDesktop = this.electronService.isElectron;
    this.platformDetails = await this.electronService.getPlatformDetails();
    this.appVersion = await this.electronService.getAppVersion();

    // Check saved theme
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'light') {
      this.isDarkMode = false;
      document.body.classList.add('light-theme');
    } else {
      this.isDarkMode = true;
      document.body.classList.remove('light-theme');
    }

    // Subscribe to equipment stream
    this.equipmentService.items$.subscribe(items => {
      this.allEquipment = items;
      this.applyFilter();
    });

    // Subscribe to real-time computed metrics
    this.equipmentService.summary$.subscribe(sum => {
      this.summary = sum;
    });

    // Connect to the running Spring Boot Backend API (polls every 1500ms)
    this.connectBackendTelemetry();
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

  public ngOnDestroy(): void {
    if (this.telemetrySub) {
      this.telemetrySub.unsubscribe();
    }
  }

  public connectBackendTelemetry(): void {
    this.telemetrySub = this.telemetryApi.streamDashboardData(1500).subscribe({
      next: (data) => {
        if (data) {
          this.liveTelemetry = data;
          this.backendConnected = true;
          const now = new Date();
          this.lastTelemetryUpdate = now.toLocaleTimeString();
          this.lastUpdateFull = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString()}`;
        } else {
          this.backendConnected = false;
        }
      },
      error: (err) => {
        console.warn('Backend API connection warning:', err);
        this.backendConnected = false;
      }
    });
  }

  public refreshTelemetry(): void {
    this.telemetryApi.getDashboardData().subscribe({
      next: (data) => {
        this.liveTelemetry = data;
        this.backendConnected = true;
        const now = new Date();
        this.lastTelemetryUpdate = now.toLocaleTimeString();
        this.lastUpdateFull = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString()}`;
        this.snackBar.open('Telemetry synchronized successfully', 'Dismiss', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Could not reach backend at localhost:8080', 'Dismiss', { duration: 2500 });
      }
    });
  }

  // Value conversions
  public getConvertedVelocity(): number {
    const raw = this.liveTelemetry?.velocity?.value ?? 0;
    if (this.velocityUnit === 'mm/s') return raw * 10;
    if (this.velocityUnit === 'in/s') return raw * 0.3937;
    return raw;
  }

  public getConvertedPressure(): number {
    const raw = this.liveTelemetry?.pressure?.value ?? 0;
    if (this.pressureUnit === 'bar') return raw / 1000;
    if (this.pressureUnit === 'psi') return raw * 0.0145038;
    return raw;
  }

  public getConvertedTemp(): number {
    const raw = this.liveTelemetry?.temperature?.value ?? 0;
    if (this.tempUnit === '°F') return (raw * 9) / 5 + 32;
    if (this.tempUnit === 'K') return raw + 273.15;
    return raw;
  }

  // Status checks for cards
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
        subtitle: 'One or more machine telemetry metrics have exceeded safe operational limits.',
        isNormal: false
      };
    }
    if (v.label === 'Warning' || p.label === 'Warning' || t.label === 'Warning') {
      return {
        title: 'System Warning',
        subtitle: 'Parameters approaching upper tolerance thresholds.',
        isNormal: false
      };
    }
    return {
      title: 'Normal',
      subtitle: 'All parameters are within normal range.',
      isNormal: true
    };
  }

  // Semi-circular gauge arc calculation
  // Total arc circumference for radius 65 over 180 degrees = PI * 65 ≈ 204.2
  public getGaugeOffset(value: number, min: number, max: number): number {
    const totalLength = 204.2;
    const clamped = Math.max(min, Math.min(max, value));
    const ratio = (clamped - min) / (max - min);
    return totalLength * (1 - ratio);
  }

  // SVG Trend Line path generator
  public getSparklinePoints(history: { time: string; value: number }[] | undefined, minVal: number, maxVal: number): string {
    if (!history || history.length === 0) {
      return '0,50 300,50';
    }
    const width = 300;
    const height = 90;
    const padding = 10;
    const effHeight = height - padding * 2;
    const step = width / Math.max(history.length - 1, 1);

    return history.map((pt, i) => {
      const x = (i * step).toFixed(1);
      const ratio = Math.max(0, Math.min(1, (pt.value - minVal) / (maxVal - minVal)));
      const y = (height - padding - ratio * effHeight).toFixed(1);
      return `${x},${y}`;
    }).join(' ');
  }

  // Area fill under trend line
  public getSparklineArea(history: { time: string; value: number }[] | undefined, minVal: number, maxVal: number): string {
    const pts = this.getSparklinePoints(history, minVal, maxVal);
    return `${pts} 300,100 0,100`;
  }

  // Exports
  public exportCsv(): void {
    if (!this.liveTelemetry) {
      this.snackBar.open('No telemetry data available to export', 'Dismiss', { duration: 2500 });
      return;
    }
    const rows = [
      ['Metric', 'Current Value', 'Unit', 'Status', 'Timestamp'],
      ['Velocity', this.liveTelemetry.velocity.value, this.liveTelemetry.velocity.unit, this.getVelocityStatus().label, this.liveTelemetry.timestamp],
      ['Pressure', this.liveTelemetry.pressure.value, this.liveTelemetry.pressure.unit, this.getPressureStatus().label, this.liveTelemetry.timestamp],
      ['Temperature', this.liveTelemetry.temperature.value, this.liveTelemetry.temperature.unit, this.getTempStatus().label, this.liveTelemetry.timestamp]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open('CSV export downloaded', 'Dismiss', { duration: 2500 });
  }

  public exportExcel(): void {
    if (!this.liveTelemetry) {
      this.snackBar.open('No telemetry data available to export', 'Dismiss', { duration: 2500 });
      return;
    }
    // XML Spreadsheet format supported universally by MS Excel & LibreOffice
    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Telemetry">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Metric</Data></Cell>
    <Cell><Data ss:Type="String">Value</Data></Cell>
    <Cell><Data ss:Type="String">Unit</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Timestamp</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Velocity</Data></Cell>
    <Cell><Data ss:Type="Number">${this.liveTelemetry.velocity.value}</Data></Cell>
    <Cell><Data ss:Type="String">${this.liveTelemetry.velocity.unit}</Data></Cell>
    <Cell><Data ss:Type="String">${this.getVelocityStatus().label}</Data></Cell>
    <Cell><Data ss:Type="String">${this.liveTelemetry.timestamp}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Pressure</Data></Cell>
    <Cell><Data ss:Type="Number">${this.liveTelemetry.pressure.value}</Data></Cell>
    <Cell><Data ss:Type="String">${this.liveTelemetry.pressure.unit}</Data></Cell>
    <Cell><Data ss:Type="String">${this.getPressureStatus().label}</Data></Cell>
    <Cell><Data ss:Type="String">${this.liveTelemetry.timestamp}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Temperature</Data></Cell>
    <Cell><Data ss:Type="Number">${this.liveTelemetry.temperature.value}</Data></Cell>
    <Cell><Data ss:Type="String">${this.liveTelemetry.temperature.unit}</Data></Cell>
    <Cell><Data ss:Type="String">${this.getTempStatus().label}</Data></Cell>
    <Cell><Data ss:Type="String">${this.liveTelemetry.timestamp}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telemetry_data_${Date.now()}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.snackBar.open('Excel report generated and downloaded', 'Dismiss', { duration: 2500 });
  }

  public setFilter(status: EquipmentFilter): void {
    this.currentFilter = status;
    this.applyFilter();
  }

  public onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    let list = this.allEquipment;

    if (this.currentFilter !== 'ALL') {
      list = list.filter(item => item.status === this.currentFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.modelNumber.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    this.filteredEquipment = list;
  }

  public openCreateDialog(): void {
    const ref = this.dialog.open(EquipmentDialogComponent, {
      width: '560px',
      data: null
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.equipmentService.addEquipment(result);
        this.snackBar.open(`Equipment "${result.name}" created successfully!`, 'Dismiss', {
          duration: 3500
        });
      }
    });
  }

  public openEditDialog(item: Equipment): void {
    const ref = this.dialog.open(EquipmentDialogComponent, {
      width: '560px',
      data: item
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.equipmentService.updateEquipment({ ...result, id: item.id });
        this.snackBar.open(`Asset "${item.id}" updated successfully!`, 'Dismiss', {
          duration: 3500
        });
      }
    });
  }

  public deleteItem(item: Equipment): void {
    if (confirm(`Are you sure you want to delete ${item.name} (${item.id})?`)) {
      this.equipmentService.deleteEquipment(item.id);
      this.snackBar.open(`Asset ${item.id} removed.`, 'Dismiss', {
        duration: 3500
      });
    }
  }

  public resetMockData(): void {
    this.equipmentService.resetToDefault();
    this.snackBar.open('Dataset reset to original factory mock state.', 'Dismiss', {
      duration: 3000
    });
  }

  public getStatusClass(status: string): string {
    switch (status) {
      case 'Operational':
        return 'status-operational';
      case 'Maintenance Due':
        return 'status-maintenance';
      case 'Standby':
        return 'status-standby';
      case 'Offline':
        return 'status-offline';
      default:
        return '';
    }
  }
}
