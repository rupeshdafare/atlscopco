import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { switchMap, shareReplay, catchError } from 'rxjs/operators';
import { DashboardResponse } from '../models/telemetry.model';

@Injectable({
  providedIn: 'root'
})
export class TelemetryApiService {
  // Direct Spring Boot backend endpoint (configured with @CrossOrigin(origins = "*"))
  private readonly apiUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  /**
   * Fetches a single snapshot from the backend
   */
  public getDashboardData(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }

  /**
   * Streams live dashboard telemetry polling at the specified interval (default 1.5s to match @Scheduled in backend)
   * Using catchError inside switchMap guarantees polling continues even if backend is temporarily unreachable.
   */
  public streamDashboardData(pollIntervalMs = 1500): Observable<DashboardResponse | null> {
    return timer(0, pollIntervalMs).pipe(
      switchMap(() => this.getDashboardData().pipe(
        catchError((err) => {
          console.warn('Backend API connection warning:', err);
          return of(null);
        })
      )),
      shareReplay(1)
    );
  }
}
