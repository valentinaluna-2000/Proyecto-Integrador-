import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Api, message } from './core';
import { addMonths, canNavigateMonth, isEndSelectable, isStartSelectable, monthDays, selectCalendarDay, UnavailablePeriod } from './calendar-domain';

export const localToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Cordoba' }).format(new Date());

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  template: `<section class="availability-calendar" aria-label="Calendario de disponibilidad">
    <div class="calendar-header">
      <div><b>{{ from && !to ? 'Elegí la fecha de egreso' : 'Elegí tu estadía' }}</b><small>Las fechas en gris no están disponibles.</small></div>
      <div class="calendar-nav"><button type="button" class="icon-button" (click)="move(-1)" [disabled]="!canMove(-1)" aria-label="Mes anterior">←</button><strong>{{ label }}</strong><button type="button" class="icon-button" (click)="move(1)" [disabled]="!canMove(1)" aria-label="Mes siguiente">→</button></div>
    </div>
    @if (loading) { <p class="calendar-status" role="status"><span class="spinner"></span>Cargando disponibilidad…</p> }
    @if (error) { <p class="calendar-status error" role="alert">{{ error }}</p> }
    <div class="calendar-weekdays" aria-hidden="true"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
    <div class="calendar-grid" [attr.aria-busy]="loading">
      @for (day of days; track $index) {
        @if (day) {
          <button type="button" class="calendar-day" [class.disabled]="isDisabled(day)" [class.today]="day === today" [class.range-start]="day === from" [class.range-end]="day === to" [class.in-range]="inRange(day)" [disabled]="isDisabled(day) || loading" [attr.aria-label]="dayLabel(day)" (click)="select(day)">{{ day.slice(8) }}</button>
        } @else { <span class="calendar-blank"></span> }
      }
    </div>
    @if (from) { <p class="calendar-selection">Ingreso: <b>{{ from }}</b>@if (to) { · Egreso: <b>{{ to }}</b> }</p> }
  </section>`,
})
export class AvailabilityCalendarComponent implements OnChanges {
  @Input({ required: true }) propertyId!: number;
  @Input({ required: true }) maxMonths!: number;
  @Input() from = '';
  @Input() to = '';
  @Output() selected = new EventEmitter<{ from: string; to: string }>();
  @Output() state = new EventEmitter<{ ready: boolean; error: string }>();
  api = inject(Api);
  readonly today = localToday();
  month = this.today.slice(0, 7);
  loading = false;
  error = '';
  private cache = new Map<string, UnavailablePeriod[]>();
  ngOnChanges(changes: SimpleChanges) {
    if (changes['propertyId'] && !changes['propertyId'].firstChange) this.cache.clear();
    if (this.propertyId && (changes['propertyId'] || changes['maxMonths'])) void this.load();
  }
  get days() { return monthDays(this.month); }
  get label() { return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${this.month}-01T12:00:00Z`)); }
  get periods() { return [...this.cache.values()].flat(); }
  canMove(delta: number) { return canNavigateMonth(this.month, delta, this.today, this.maxMonths); }
  move(delta: number) {
    this.month = addMonths(this.month, delta).slice(0, 7);
    void this.load();
  }
  async reload() { this.cache.clear(); await this.load(); }
  private async load() {
    if (this.cache.has(this.month)) { this.state.emit({ ready: true, error: '' }); return; }
    this.loading = true; this.error = ''; this.state.emit({ ready: false, error: '' });
    const from = `${this.month}-01`, to = addMonths(from, 1);
    try {
      const query = new URLSearchParams({ fecha_desde: from, fecha_hasta: to });
      const result = await this.api.request<{ periodos: UnavailablePeriod[] }>(`/properties/${this.propertyId}/availability?${query}`);
      this.cache.set(this.month, result.periodos);
      this.state.emit({ ready: true, error: '' });
    } catch (error) {
      this.error = 'No pudimos actualizar la disponibilidad. Intentá nuevamente antes de reservar.';
      this.state.emit({ ready: false, error: message(error) });
    } finally { this.loading = false; }
  }
  isDisabled(day: string) {
    if (!this.from || this.to) return !isStartSelectable(day, this.today, this.maxMonths, this.periods);
    if (day <= this.from) return !isStartSelectable(day, this.today, this.maxMonths, this.periods);
    return !isEndSelectable(this.from, day, this.today, this.maxMonths, this.periods);
  }
  inRange(day: string) { return !!this.from && !!this.to && day > this.from && day < this.to; }
  select(day: string) {
    const next = selectCalendarDay({ from: this.from, to: this.to }, day, this.today, this.maxMonths, this.periods);
    if (next.from !== this.from || next.to !== this.to) this.selected.emit(next);
  }
  dayLabel(day: string) { return `${day}${this.isDisabled(day) ? ', no disponible' : ', disponible'}`; }
}
