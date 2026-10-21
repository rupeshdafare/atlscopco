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
  private telemetrySub?: Subscription;

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
          this.lastTelemetryUpdate = new Date().toLocaleTimeString();
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
