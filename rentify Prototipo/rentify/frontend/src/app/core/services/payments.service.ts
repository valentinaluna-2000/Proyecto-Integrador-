import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPreference(reservationId: number): Observable<{ initPoint: string; preferenceId: string }> {
    return this.http.post<{ initPoint: string; preferenceId: string }>(
      `${this.baseUrl}/reservations/${reservationId}/payment`,
      {},
    );
  }

  findAllAdmin(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/admin/payments`);
  }
}
