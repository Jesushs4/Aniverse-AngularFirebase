import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { JikanApiService } from 'src/app/core/services/jikan-api.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],

})
export class SearchBarComponent implements OnInit {
  searchControl = new FormControl();

  constructor(private apiService: JikanApiService) {
  }

  @Output() searchUpdate = new EventEmitter<any[]>();

  ngOnInit() {
    this.searchControl.valueChanges // Controlamos los cambios
      .pipe(
        debounceTime(300), // Esperamos a que el usuario termine de escribir
        distinctUntilChanged(),
        switchMap(term =>
          this.apiService.searchAnime(term)) // Realizamos la busqueda en la API
      ).subscribe({
        next: (results) => {
          this.searchUpdate.emit(results.data); // Enviamos la respuesta de la API como un evento
        }
      });
  }

}
