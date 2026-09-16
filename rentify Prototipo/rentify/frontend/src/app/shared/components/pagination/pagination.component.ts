import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages > 1) {
      <div class="pagination">
        <button class="btn btn-outline btn-sm" [disabled]="page <= 1" (click)="go(page - 1)">← Anterior</button>
        <span class="text-muted">Pagina {{ page }} de {{ totalPages }}</span>
        <button class="btn btn-outline btn-sm" [disabled]="page >= totalPages" (click)="go(page + 1)">Siguiente →</button>
      </div>
    }
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px 0;
    }
  `],
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  go(p: number) {
    if (p >= 1 && p <= this.totalPages) this.pageChange.emit(p);
  }
}
