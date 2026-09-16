import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportFilters {
  propertyId?: number;
  desde?: string;
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly baseUrl = `${environment.apiUrl}/admin/reports`;

  constructor(private http: HttpClient) {}

  private buildParams(filters: ReportFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  reservations(filters: ReportFilters): Observable<any> {
    return this.http.get(`${this.baseUrl}/reservations`, { params: this.buildParams(filters) });
  }
  revenue(filters: ReportFilters): Observable<any> {
    return this.http.get(`${this.baseUrl}/revenue`, { params: this.buildParams(filters) });
  }
  occupancy(filters: ReportFilters): Observable<any> {
    return this.http.get(`${this.baseUrl}/occupancy`, { params: this.buildParams(filters) });
  }
  cancellations(filters: ReportFilters): Observable<any> {
    return this.http.get(`${this.baseUrl}/cancellations`, { params: this.buildParams(filters) });
  }
  performance(filters: ReportFilters): Observable<any> {
    return this.http.get(`${this.baseUrl}/performance`, { params: this.buildParams(filters) });
  }
}
