import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BlockedPeriod } from '../models/blocked-period.model';

@Injectable({ providedIn: 'root' })
export class BlockedPeriodsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  findAll(propertyId: number): Observable<BlockedPeriod[]> {
    return this.http.get<BlockedPeriod[]>(
      `${this.baseUrl}/properties/${propertyId}/blocked-periods`,
    );
  }

  create(
    propertyId: number,
    payload: { fechaDesde: string; fechaHasta: string; motivo: string },
  ): Observable<BlockedPeriod> {
    return this.http.post<BlockedPeriod>(
      `${this.baseUrl}/properties/${propertyId}/blocked-periods`,
      payload,
    );
  }

  update(id: number, payload: Partial<BlockedPeriod>): Observable<BlockedPeriod> {
    return this.http.patch<BlockedPeriod>(`${this.baseUrl}/blocked-periods/${id}`, payload);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/blocked-periods/${id}`);
  }
}
