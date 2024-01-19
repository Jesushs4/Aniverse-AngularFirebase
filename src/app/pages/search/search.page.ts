import { Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Anime } from 'src/app/core/interfaces/anime';
import { JikanApiService } from 'src/app/core/services/jikan-api.service';
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})

export class SearchPage {

  _searchResults: BehaviorSubject<Anime[]> = new BehaviorSubject<Anime[]>([]);
  searchResults$: Observable<Anime[]> = this._searchResults.asObservable();

  constructor(
    private apiService: JikanApiService
  ) {
    this.apiService.searchAnime("").subscribe(search => { // Al inicializar la página, que busque vació "" para que salga algo
      this.searchResult(search.data)
    });

  }
  searchResults(event: Anime[]) {
    this._searchResults.next(event);
  }

  searchResult(event: any) { // Obtiene la información enviada por el evento y actualiza el BehaviourSubject con ella
    this.searchResults(event);
  }






}

