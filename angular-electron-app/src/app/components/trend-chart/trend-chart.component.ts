import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ChartDataPoint {
  time: string;
  value: number;
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="trend-chart-card">
      <div class="chart-top-bar">
        <div class="chart-title">
          <mat-icon>{{ icon }}</mat-icon>
          <span>{{ title }} ({{ unit }})</span>
        </div>
        <div class="chart-controls">
          <span class="zoom-level-badge" matTooltip="Current Zoom Level">{{ zoomLevel | number:'1.1-1' }}x</span>
          <button mat-icon-button (click)="zoomIn()" matTooltip="Zoom In">
            <mat-icon>zoom_in</mat-icon>
          </button>
          <button mat-icon-button (click)="zoomOut()" matTooltip="Zoom Out">
            <mat-icon>zoom_out</mat-icon>
          </button>
          <button mat-icon-button (click)="panLeft()" [disabled]="panOffset <= 0" matTooltip="Pan Left / Older">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-icon-button (click)="panRight()" [disabled]="panOffset >= maxPan" matTooltip="Pan Right / Newer">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button mat-icon-button (click)="resetView()" matTooltip="Reset Zoom & Pan">
            <mat-icon>restart_alt</mat-icon>
          </button>
        </div>
      </div>

      <div
        class="chart-viewport"
        #viewport
        (wheel)="onWheel($event)"
        (mousedown)="startDrag($event)"
        (mousemove)="onDrag($event); onHover($event)"
        (mouseup)="stopDrag()"
        (mouseleave)="stopDrag(); hoveredPoint = null"
      >
        <svg
          class="chart-svg"
          viewBox="0 0 600 220"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient [id]="gradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="strokeColor" stop-opacity="0.3" />
              <stop offset="100%" [attr.stop-color]="strokeColor" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Y Grid lines & Labels -->
          <g class="grid-group">
            <line *ngFor="let yVal of yGridTicks" x1="45" [attr.y1]="getYPos(yVal)" x2="595" [attr.y2]="getYPos(yVal)" class="grid-line" />
            <text *ngFor="let yVal of yGridTicks" x="40" [attr.y]="getYPos(yVal) + 4" text-anchor="end" class="axis-label">
              {{ yVal | number:'1.1-1' }}
            </text>
          </g>

          <!-- Chart Area / Polyline -->
          <polygon
            *ngIf="polygonPoints"
            [attr.points]="polygonPoints"
            [attr.fill]="'url(#' + gradId + ')'"
          />
          <polyline
            *ngIf="polylinePoints"
            [attr.points]="polylinePoints"
            fill="none"
            [attr.stroke]="strokeColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Data Points (dots on line) -->
          <circle
            *ngFor="let pt of renderedPoints"
            [attr.cx]="pt.x"
            [attr.cy]="pt.y"
            r="3"
            [attr.fill]="strokeColor"
            class="chart-point-dot"
          />

          <!-- Active Hovered Point highlight -->
          <g *ngIf="hoveredPoint">
            <circle
              [attr.cx]="hoveredPoint.x"
              [attr.cy]="hoveredPoint.y"
              r="6"
              [attr.fill]="strokeColor"
              stroke="#ffffff"
              stroke-width="2"
            />
            <line
              [attr.x1]="hoveredPoint.x"
              y1="10"
              [attr.x2]="hoveredPoint.x"
              y2="190"
              stroke="rgba(255,255,255,0.4)"
              stroke-dasharray="3,3"
            />
          </g>
        </svg>

        <!-- Dynamic Tooltip -->
        <div
          *ngIf="hoveredPoint"
          class="chart-tooltip"
          [style.left.px]="tooltipX"
          [style.top.px]="tooltipY"
        >
          <div class="tooltip-time">{{ hoveredPoint.time }}</div>
          <div class="tooltip-val">
            <span class="dot" [style.background]="strokeColor"></span>
            <strong>{{ hoveredPoint.value | number:'1.2-2' }}</strong> {{ unit }}
          </div>
        </div>
      </div>

      <!-- X-Axis Timestamps -->
      <div class="chart-x-axis">
        <span *ngFor="let tick of xLabels">{{ tick }}</span>
      </div>
    </div>
  `,
  styles: [`
    .trend-chart-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 14px;
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    :host-context(.light-mode) .trend-chart-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .chart-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .chart-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary, #f1f5f9);
    }
    :host-context(.light-mode) .chart-title {
      color: #0f172a;
    }
    .chart-controls {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .chart-controls button {
      width: 28px;
      height: 28px;
      line-height: 28px;
      padding: 0;
      color: rgba(255, 255, 255, 0.7);
    }
    :host-context(.light-mode) .chart-controls button {
      color: #475569;
    }
    .chart-controls mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .zoom-level-badge {
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 4px;
      color: var(--text-secondary, #94a3b8);
    }
    :host-context(.light-mode) .zoom-level-badge {
      background: #e2e8f0;
      color: #334155;
    }
    .chart-viewport {
      position: relative;
      height: 180px;
      width: 100%;
      cursor: crosshair;
      user-select: none;
      overflow: hidden;
    }
    .chart-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .grid-line {
      stroke: rgba(255, 255, 255, 0.08);
      stroke-width: 1;
    }
    :host-context(.light-mode) .grid-line {
      stroke: #e2e8f0;
    }
    .axis-label {
      font-size: 9px;
      fill: #64748b;
      font-family: monospace;
    }
    .chart-x-axis {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      padding-left: 45px;
      padding-right: 8px;
      font-size: 0.68rem;
      color: #64748b;
      font-family: monospace;
    }
    .chart-tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 6px 10px;
      pointer-events: none;
      font-size: 0.75rem;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 10;
      transform: translate(-50%, -120%);
      white-space: nowrap;
    }
    :host-context(.light-mode) .chart-tooltip {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .tooltip-time {
      font-size: 0.68rem;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .tooltip-val {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .tooltip-val .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  `]
})
export class TrendChartComponent implements OnChanges {
  @Input() public data: ChartDataPoint[] = [];
  @Input() public title = '';
  @Input() public unit = '';
  @Input() public icon = 'trending_up';
  @Input() public strokeColor = '#38bdf8';
  @Input() public gradId = 'chartGrad';

  @ViewChild('viewport') private viewportRef?: ElementRef<HTMLDivElement>;

  // Zoom & Pan State
  public zoomLevel = 1.0;
  public panOffset = 0; // index offset from the oldest visible sample
  public maxPan = 0;

  // Rendered calculations
  public polylinePoints = '';
  public polygonPoints = '';
  public renderedPoints: { x: number; y: number; time: string; value: number }[] = [];
  public yGridTicks: number[] = [];
  public xLabels: string[] = [];

  // Hover state
  public hoveredPoint: { x: number; y: number; time: string; value: number } | null = null;
  public tooltipX = 0;
  public tooltipY = 0;

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartOffset = 0;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['unit']) {
      this.recalculate();
    }
  }

  public zoomIn(): void {
    if (this.zoomLevel < 5.0) {
      this.zoomLevel = +(this.zoomLevel + 0.5).toFixed(1);
      this.recalculate();
    }
  }

  public zoomOut(): void {
    if (this.zoomLevel > 1.0) {
      this.zoomLevel = +(this.zoomLevel - 0.5).toFixed(1);
      if (this.zoomLevel < 1.0) this.zoomLevel = 1.0;
      this.recalculate();
    }
  }

  public panLeft(): void {
    if (this.panOffset > 0) {
      this.panOffset = Math.max(0, this.panOffset - 5);
      this.recalculate();
    }
  }

  public panRight(): void {
    if (this.panOffset < this.maxPan) {
      this.panOffset = Math.min(this.maxPan, this.panOffset + 5);
      this.recalculate();
    }
  }

  public resetView(): void {
    this.zoomLevel = 1.0;
    this.panOffset = 0;
    this.recalculate();
  }

  public onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  public startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartOffset = this.panOffset;
  }

  public onDrag(event: MouseEvent): void {
    if (!this.isDragging || !this.viewportRef) return;
    const dx = event.clientX - this.dragStartX;
    const width = this.viewportRef.nativeElement.clientWidth || 300;
    const totalSamples = this.data.length;
    const visibleCount = Math.max(10, Math.floor(totalSamples / this.zoomLevel));
    const sampleShift = Math.round((dx / width) * visibleCount);

    let nextOffset = this.dragStartOffset - sampleShift;
    nextOffset = Math.max(0, Math.min(this.maxPan, nextOffset));
    if (nextOffset !== this.panOffset) {
      this.panOffset = nextOffset;
      this.recalculate();
    }
  }

  public stopDrag(): void {
    this.isDragging = false;
  }

  public onHover(event: MouseEvent): void {
    if (!this.viewportRef || this.renderedPoints.length === 0) return;
    const rect = this.viewportRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const svgWidth = 600;
    const scale = svgWidth / rect.width;
    const scaledX = mouseX * scale;

    let closest = this.renderedPoints[0];
    let minDiff = Math.abs(closest.x - scaledX);

    for (const pt of this.renderedPoints) {
      const diff = Math.abs(pt.x - scaledX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    if (minDiff < 40) {
      this.hoveredPoint = closest;
      this.tooltipX = (closest.x / svgWidth) * rect.width;
      this.tooltipY = (closest.y / 220) * rect.height;
    } else {
      this.hoveredPoint = null;
    }
  }

  private recalculate(): void {
    if (!this.data || this.data.length === 0) {
      this.polylinePoints = '';
      this.polygonPoints = '';
      this.renderedPoints = [];
      this.xLabels = [];
      return;
    }

    const total = this.data.length;
    const visibleCount = Math.max(5, Math.floor(total / this.zoomLevel));
    this.maxPan = Math.max(0, total - visibleCount);

    if (this.panOffset > this.maxPan) {
      this.panOffset = this.maxPan;
    }

    const windowData = this.data.slice(this.panOffset, this.panOffset + visibleCount);

    // Compute min and max value for Y-axis
    let minVal = Math.min(...windowData.map(d => d.value));
    let maxVal = Math.max(...windowData.map(d => d.value));

    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }
    const pad = (maxVal - minVal) * 0.1;
    minVal -= pad;
    maxVal += pad;

    // Y Grid ticks (4 intervals)
    this.yGridTicks = [];
    const step = (maxVal - minVal) / 4;
    for (let i = 0; i <= 4; i++) {
      this.yGridTicks.push(+(minVal + step * i).toFixed(2));
    }

    // Geometry coordinates
    const leftPad = 45;
    const rightPad = 10;
    const topPad = 15;
    const bottomPad = 25;
    const chartWidth = 600 - leftPad - rightPad;
    const chartHeight = 220 - topPad - bottomPad;

    const xStep = windowData.length > 1 ? chartWidth / (windowData.length - 1) : chartWidth;

    this.renderedPoints = windowData.map((d, i) => {
      const x = leftPad + i * xStep;
      const ratio = (d.value - minVal) / (maxVal - minVal);
      const y = topPad + chartHeight * (1 - ratio);
      return {
        x: +x.toFixed(1),
        y: +y.toFixed(1),
        time: this.formatTime(d.time),
        value: d.value
      };
    });

    const pts = this.renderedPoints.map(p => `${p.x},${p.y}`).join(' ');
    this.polylinePoints = pts;
    const lastX = this.renderedPoints[this.renderedPoints.length - 1]?.x ?? leftPad;
    const firstX = this.renderedPoints[0]?.x ?? leftPad;
    const bottomY = topPad + chartHeight;
    this.polygonPoints = `${pts} ${lastX},${bottomY} ${firstX},${bottomY}`;

    // X Labels (sample 4 evenly across visible range)
    this.xLabels = [];
    const count = windowData.length;
    if (count > 0) {
      const idxs = [0, Math.floor(count * 0.33), Math.floor(count * 0.66), count - 1];
      for (const idx of idxs) {
        if (windowData[idx]) {
          this.xLabels.push(this.formatTime(windowData[idx].time));
        }
      }
    }
  }

  public getYPos(yVal: number): number {
    const minVal = this.yGridTicks[0];
    const maxVal = this.yGridTicks[this.yGridTicks.length - 1];
    if (maxVal === minVal) return 100;
    const topPad = 15;
    const chartHeight = 220 - 15 - 25;
    const ratio = (yVal - minVal) / (maxVal - minVal);
    return +(topPad + chartHeight * (1 - ratio)).toFixed(1);
  }

  private formatTime(isoOrTime: string): string {
    if (!isoOrTime) return '';
    if (isoOrTime.includes('T')) {
      const d = new Date(isoOrTime);
      return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return isoOrTime;
  }
}
