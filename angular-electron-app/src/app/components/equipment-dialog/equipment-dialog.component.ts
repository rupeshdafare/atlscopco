import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Equipment } from '../../models/equipment.model';

@Component({
  selector: 'app-equipment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="dialog-title">
          <mat-icon>{{ isEditMode ? 'edit' : 'add_circle' }}</mat-icon>
          <h2>{{ isEditMode ? 'Edit Industrial Asset' : 'Register New Equipment' }}</h2>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">
        <mat-dialog-content class="form-content">
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Asset / Machine Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. GA 90+ VSD Oil-Injected">
              <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row two-cols">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option value="Air Compressor">Air Compressor</mat-option>
                <mat-option value="Vacuum Pump">Vacuum Pump</mat-option>
                <mat-option value="Industrial Tool">Industrial Tool</mat-option>
                <mat-option value="Power Technique">Power Technique</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Model Number</mat-label>
              <input matInput formControlName="modelNumber" placeholder="e.g. GA-90-VSD-PLUS">
              <mat-error *ngIf="form.get('modelNumber')?.hasError('required')">Model is required</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row two-cols">
            <mat-form-field appearance="outline">
              <mat-label>Operating Pressure (bar)</mat-label>
              <input matInput type="number" step="0.1" formControlName="operatingPressureBar">
              <mat-error *ngIf="form.get('operatingPressureBar')?.hasError('min')">Must be greater than 0</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Flow Rate (CFM)</mat-label>
              <input matInput type="number" formControlName="flowRateCfm">
            </mat-form-field>
          </div>

          <div class="form-row two-cols">
            <mat-form-field appearance="outline">
              <mat-label>Operating Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="Operational">Operational</mat-option>
                <mat-option value="Maintenance Due">Maintenance Due</mat-option>
                <mat-option value="Standby">Standby</mat-option>
                <mat-option value="Offline">Offline</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Operating Temp (°C)</mat-label>
              <input matInput type="number" step="0.1" formControlName="temperatureCelsius">
            </mat-form-field>
          </div>

          <div class="form-row two-cols">
            <mat-form-field appearance="outline">
              <mat-label>Runtime (Hours)</mat-label>
              <input matInput type="number" formControlName="runtimeHours">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Last Service Date</mat-label>
              <input matInput type="date" formControlName="lastServiceDate">
            </mat-form-field>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
            <mat-icon>{{ isEditMode ? 'save' : 'check' }}</mat-icon>
            {{ isEditMode ? 'Save Changes' : 'Create Machine' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 8px 16px 16px 16px;
      min-width: 520px;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #0284c7;
      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #0f172a;
      }
    }
    .form-content {
      padding: 0;
      max-height: 70vh;
      overflow-y: auto;
    }
    .form-row {
      margin-bottom: 10px;
      &.two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
    }
    .full-width {
      width: 100%;
    }
    .dialog-actions {
      padding: 16px 0 0 0;
      gap: 8px;
    }
  `]
})
export class EquipmentDialogComponent {
  public form: FormGroup;
  public isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EquipmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Equipment | null
  ) {
    this.isEditMode = !!data;
    this.form = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      category: [data?.category || 'Air Compressor', [Validators.required]],
      modelNumber: [data?.modelNumber || '', [Validators.required]],
      operatingPressureBar: [data?.operatingPressureBar || 7.0, [Validators.required, Validators.min(0)]],
      flowRateCfm: [data?.flowRateCfm || 300, [Validators.required, Validators.min(0)]],
      status: [data?.status || 'Operational', [Validators.required]],
      temperatureCelsius: [data?.temperatureCelsius || 60, [Validators.required]],
      runtimeHours: [data?.runtimeHours || 100, [Validators.required, Validators.min(0)]],
      lastServiceDate: [data?.lastServiceDate || new Date().toISOString().split('T')[0], [Validators.required]]
    });
  }

  public onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
