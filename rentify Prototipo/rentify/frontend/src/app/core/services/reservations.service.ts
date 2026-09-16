import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaginatedResponse,
} from '../models/property.model';
import { Reservation, ReservationSimulation, ReservationStatus } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  simulate(
    propertyId: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Observable<ReservationSimulation> {
    const params = new HttpParams()
      .set('propertyId', propertyId)
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);
    return this.http.get<ReservationSimulation>(`${this.baseUrl}/reservations/simulate`, {
      params,
    });
  }

  create(propertyId: number, fechaDesde: string, fechaHasta: string): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations`, {
      propertyId,
      fechaDesde,
      fechaHasta,
    });
  }

  findMine(estado?: ReservationStatus, page = 1, limit = 10) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<Reservation>>(`${this.baseUrl}/reservations/my`, {
      params,
    });
  }

  findOne(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.baseUrl}/reservations/${id}`);
  }

  cancel(id: number, motivo: string, causaExcepcional = false): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/cancel`, {
      motivo,
      causaExcepcional,
    });
  }

  findAllAdmin(filters: {
    estado?: ReservationStatus;
    propertyId?: number;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Reservation>>(`${this.baseUrl}/admin/reservations`, {
      params,
    });
  }
}
