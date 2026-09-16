import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IntegrationsService {
  private readonly baseUrl = `${environment.apiUrl}/integrations`;

  constructor(private http: HttpClient) {}

  getMapsConfig(): Observable<{ enabled: boolean; apiKey: string | null }> {
    return this.http.get<{ enabled: boolean; apiKey: string | null }>(
      `${this.baseUrl}/maps/config`,
    );
  }

  getWeather(lat: number, lon: number, fecha?: string): Observable<any> {
    let params = new HttpParams().set('lat', lat).set('lon', lon);
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get(`${this.baseUrl}/weather`, { params });
  }
}
