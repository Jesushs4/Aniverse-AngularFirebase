import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClientWebProvider } from './http/http-client-web.provider';

@Injectable({
  providedIn: 'root'
})
export class JikanApiService {

  constructor(
    private http: HttpClientWebProvider
  ) { }

  searchAnime(search: string): Observable<any> { // Consulta la API
    const url = `${environment.jikanURL}/anime?order_by=score&sort=desc&sfw&min_score=5&q=${search}`;
    return this.http.get(url);
  }
}
