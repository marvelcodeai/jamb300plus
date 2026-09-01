import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // =====================================================
  // PRODUCTION BACKEND
  // =====================================================

  private readonly apiUrl =
    'https://jamb300plus-backend.onrender.com';

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // TEST BACKEND
  // =====================================================

  testBackend(): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/`
    );
  }

  // =====================================================
  // LOGIN
  // =====================================================

  login(
    email: string,
    password: string
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/api/auth/login`,
      {
        email,
        password
      }
    );
  }
}
