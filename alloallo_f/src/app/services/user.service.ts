import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  register(username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username });
  }

  getAvailableUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available`);
  }
}
