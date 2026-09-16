import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Availability,
  PaginatedResponse,
  Property,
  PropertyQuery,
} from '../models/property.model';

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  private readonly baseUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) {}

  findAll(query: PropertyQuery): Observable<PaginatedResponse<Property>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Property>>(this.baseUrl, { params });
  }

  findOne(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/${id}`);
  }

  getAvailability(id: number, from?: string, to?: string): Observable<Availability> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<Availability>(`${this.baseUrl}/${id}/availability`, { params });
  }

  create(payload: Partial<Property>): Observable<Property> {
    return this.http.post<Property>(this.baseUrl, payload);
  }

  update(id: number, payload: Partial<Property>): Observable<Property> {
    return this.http.patch<Property>(`${this.baseUrl}/${id}`, payload);
  }

  deactivate(id: number): Observable<Property> {
    return this.http.delete<Property>(`${this.baseUrl}/${id}`);
  }

  activate(id: number): Observable<Property> {
    return this.http.patch<Property>(`${this.baseUrl}/${id}/activate`, {});
  }

  findOneForAdmin(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/admin/mine/${id}`);
  }

  findAllForAdmin(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/admin/mine`);
  }

  uploadImage(propertyId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/${propertyId}/images`, formData);
  }

  deleteImage(propertyId: number, imageId: number) {
    return this.http.delete(`${this.baseUrl}/${propertyId}/images/${imageId}`);
  }
}
