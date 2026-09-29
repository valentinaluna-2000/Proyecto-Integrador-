export interface UnavailablePeriod {
  fecha_desde: string;
  fecha_hasta: string;
  tipo: 'RESERVADA' | 'BLOQUEADA';
}
export const addMonths = (value: string, months: number) => {
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
};
export const reservationLimit = (today: string, months: number) => {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};
export const monthDays = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const first = (start.getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: first + total }, (_, index) =>
    index < first ? '' : `${month}-${String(index - first + 1).padStart(2, '0')}`,
  );
};
export const inPeriod = (day: string, period: UnavailablePeriod) =>
  day >= period.fecha_desde && day < period.fecha_hasta;
export const rangeHasUnavailableDay = (from: string, to: string, periods: UnavailablePeriod[]) =>
  periods.some((period) => from < period.fecha_hasta && to > period.fecha_desde);
export const isStartSelectable = (
  day: string,
  today: string,
  maxMonths: number,
  periods: UnavailablePeriod[],
) => day >= today && day <= reservationLimit(today, maxMonths) && !periods.some((period) => inPeriod(day, period));
export const isEndSelectable = (
  from: string,
  to: string,
  today: string,
  maxMonths: number,
  periods: UnavailablePeriod[],
) =>
  to > from &&
  to >= today &&
  to <= reservationLimit(today, maxMonths) &&
  !rangeHasUnavailableDay(from, to, periods);

export interface CalendarSelection {
  from: string;
  to: string;
}

export const canNavigateMonth = (month: string, delta: number, today: string, maxMonths: number) => {
  const next = addMonths(month, delta).slice(0, 7);
  return next >= today.slice(0, 7) && next <= reservationLimit(today, maxMonths).slice(0, 7);
};

export const selectCalendarDay = (
  selection: CalendarSelection,
  day: string,
  today: string,
  maxMonths: number,
  periods: UnavailablePeriod[],
): CalendarSelection => {
  if (!selection.from || selection.to) {
    return isStartSelectable(day, today, maxMonths, periods) ? { from: day, to: '' } : selection;
  }
  if (day === selection.from) return { from: '', to: '' };
  if (day < selection.from) {
    return isStartSelectable(day, today, maxMonths, periods) ? { from: day, to: '' } : selection;
  }
  return isEndSelectable(selection.from, day, today, maxMonths, periods)
    ? { from: selection.from, to: day }
    : selection;
};
