import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="circular-gauge-wrapper">
      <svg class="semi-gauge-svg" viewBox="0 0 180 110">
        <!-- Background Track Arc -->
        <path
          d="M 20 95 A 70 70 0 0 1 160 95"
          fill="none"
          class="gauge-track"
          stroke-width="12"
          stroke-linecap="round"
        />

        <!-- Value Progress Arc -->
        <path
          d="M 20 95 A 70 70 0 0 1 160 95"
          fill="none"
          [attr.stroke]="accentColor"
          class="gauge-progress"
          stroke-width="12"
          stroke-linecap="round"
          stroke-dasharray="219.9"
          [attr.stroke-dashoffset]="dashOffset"
        />
      </svg>

      <div class="gauge-center-content">
        <span class="gauge-value">{{ value | number:'1.1-2' }}</span>
        <span class="gauge-unit">{{ unit }}</span>
      </div>

      <div class="gauge-range-minmax">
        <span>{{ min | number:'1.0-1' }}</span>
        <span>{{ max | number:'1.0-1' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .circular-gauge-wrapper {
      position: relative;
      width: 170px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .semi-gauge-svg {
      width: 100%;
      height: 95px;
      overflow: visible;
    }
    .gauge-track {
      stroke: rgba(255, 255, 255, 0.08);
    }
    :host-context(.light-mode) .gauge-track {
      stroke: #e2e8f0;
    }
    .gauge-progress {
      transition: stroke-dashoffset 0.4s ease-out, stroke 0.3s ease;
    }
    .gauge-center-content {
      position: absolute;
      top: 42px;
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
    }
    .gauge-value {
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--text-primary, #ffffff);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.5px;
    }
    :host-context(.light-mode) .gauge-value {
      color: #0f172a;
    }
    .gauge-unit {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary, #94a3b8);
      text-transform: none;
      margin-top: 2px;
    }
    :host-context(.light-mode) .gauge-unit {
      color: #64748b;
    }
    .gauge-range-minmax {
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
      margin-top: -6px;
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      font-family: monospace;
    }
  `]
})
export class CircularGaugeComponent implements OnChanges {
  @Input() public value = 0;
  @Input() public min = 0;
  @Input() public max = 100;
  @Input() public unit = '';
  @Input() public accentColor = '#38bdf8';

  // Arc length for radius 70 across 180 degrees: PI * 70 ≈ 219.91
  private readonly totalLength = 219.91;
  public dashOffset = 219.91;

  public ngOnChanges(changes: SimpleChanges): void {
    const range = this.max - this.min;
    if (range <= 0) {
      this.dashOffset = this.totalLength;
      return;
    }
    const clamped = Math.max(this.min, Math.min(this.max, this.value));
    const ratio = (clamped - this.min) / range;
    this.dashOffset = +(this.totalLength * (1 - ratio)).toFixed(2);
  }
}
