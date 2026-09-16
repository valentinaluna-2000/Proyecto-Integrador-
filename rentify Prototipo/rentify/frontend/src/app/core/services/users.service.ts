import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getMe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/me`);
  }

  updateMe(payload: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    password?: string;
  }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/me`, payload);
  }
}
