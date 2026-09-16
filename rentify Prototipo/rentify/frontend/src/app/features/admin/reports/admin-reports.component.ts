import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../../core/services/reports.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  template: `
    <h2>Reportes</h2>

    <div class="filters card">
      <input class="form-control" type="date" [(ngModel)]="desde" (change)="load()" />
      <input class="form-control" type="date" [(ngModel)]="hasta" (change)="load()" />
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (report()) {
      <div class="grid grid-3 summary-cards">
        <div class="card summary-card">
          <span class="text-muted">Reservas totales</span>
          <h2>{{ report()!.resumen.totalReservas }}</h2>
        </div>
        <div class="card summary-card">
          <span class="text-muted">Ingresos (pagos aprobados)</span>
          <h2>$ {{ report()!.resumen.totalIngresos | number }}</h2>
        </div>
        <div class="card summary-card">
          <span class="text-muted">Cancelaciones</span>
          <h2>{{ report()!.resumen.totalCancelaciones }}</h2>
        </div>
      </div>

      <div class="card chart-card">
        <h3>Desempeno por propiedad</h3>
        <div class="chart">
          @for (item of report()!.indicadores; track item.propertyId) {
            <div class="chart-row">
              <span class="chart-label">{{ item.nombre }}</span>
              <div class="chart-bar-wrap">
                <div class="chart-bar" [style.width.%]="barWidth(item.cantidadReservas)"></div>
              </div>
              <span class="chart-value">{{ item.cantidadReservas }} reservas</span>
            </div>
          }
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card chart-card">
          <h3>Ingresos por propiedad</h3>
          @for (item of report()!.indicadores; track item.propertyId) {
            <div class="chart-row">
              <span class="chart-label">{{ item.nombre }}</span>
              <div class="chart-bar-wrap">
                <div class="chart-bar chart-bar-secondary" [style.width.%]="barWidthMoney(item.ingresos)"></div>
              </div>
              <span class="chart-value">$ {{ item.ingresos | number }}</span>
            </div>
          }
        </div>

        <div class="card chart-card">
          <h3>Ocupacion (%)</h3>
          @for (item of report()!.indicadores; track item.propertyId) {
            <div class="chart-row">
              <span class="chart-label">{{ item.nombre }}</span>
              <div class="chart-bar-wrap">
                <div class="chart-bar chart-bar-info" [style.width.%]="item.porcentajeOcupacion"></div>
              </div>
              <span class="chart-value">{{ item.porcentajeOcupacion }}%</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .filters { display: flex; gap: 12px; padding: 16px; margin-bottom: 20px; }
    .filters input { max-width: 220px; }
    .summary-cards { margin-bottom: 24px; }
    .summary-card { padding: 20px; }
    .summary-card h2 { margin-top: 6px; color: var(--color-primary); }
    .chart-card { padding: 22px; margin-bottom: 20px; }
    .chart-row { display: grid; grid-template-columns: 160px 1fr 110px; align-items: center; gap: 12px; margin-bottom: 12px; }
    .chart-label { font-size: 0.85rem; }
    .chart-bar-wrap { background: var(--color-bg); border-radius: 6px; height: 14px; overflow: hidden; }
    .chart-bar { background: var(--color-primary); height: 100%; border-radius: 6px; transition: width 0.4s ease; }
    .chart-bar-secondary { background: var(--color-secondary); }
    .chart-bar-info { background: #6c5ce7; }
    .chart-value { font-size: 0.82rem; text-align: right; color: var(--color-text-muted); }
  `],
})
export class AdminReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  loading = signal(true);
  report = signal<any>(null);
  desde = '';
  hasta = '';

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.reportsService.performance({ desde: this.desde || undefined, hasta: this.hasta || undefined }).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private maxReservas(): number {
    return Math.max(1, ...this.report()!.indicadores.map((i: any) => i.cantidadReservas));
  }
  private maxIngresos(): number {
    return Math.max(1, ...this.report()!.indicadores.map((i: any) => i.ingresos));
  }

  barWidth(value: number): number {
    return Math.round((value / this.maxReservas()) * 100);
  }
  barWidthMoney(value: number): number {
    return Math.round((value / this.maxIngresos()) * 100);
  }
}
