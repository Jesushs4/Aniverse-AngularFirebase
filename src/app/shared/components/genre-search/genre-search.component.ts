import { Component, EventEmitter, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonPopover } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { Genre } from 'src/app/core/interfaces/genre';
import { FirebaseService } from 'src/app/core/services/firebase.service';
import { FirebaseAuthService } from 'src/app/core/services/firebase/firebase-auth.service';
import { LibraryService } from 'src/app/core/services/library.service';
import { ApiService } from 'src/app/core/services/strapi/api.service';

export const GENRESEARCH_SELECTABLE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => GenreSearchComponent),
  multi: true
};

@Component({
  selector: 'app-genre-search',
  templateUrl: './genre-search.component.html',
  styleUrls: ['./genre-search.component.scss'],
  providers: [GENRESEARCH_SELECTABLE_VALUE_ACCESSOR]
})
export class GenreSearchComponent implements OnInit, ControlValueAccessor {

  genres: Genre[] = [];
  allGenres: Genre[] = []
  genreSelected: string | undefined;
  disabled: boolean = false;

  @Output() genreSelectedEvent = new EventEmitter<string>();

  propagateChange = (obj: any) => { };

  constructor(public apiService: ApiService, public firebaseService: FirebaseService, public firebaseAuth: FirebaseAuthService, private libraryService: LibraryService) { }

  async ngOnInit() {
    // Asumiendo que firebaseService ya tiene un método getLibrary()
    if (this.firebaseAuth.user$) {
      const userUid = this.firebaseService.user!.uid;
      try {
        const library = this.libraryService.getLibrary(); // Implementa este método en FirebaseService
        const genreSet = new Set<string>(); // Usamos un Set para evitar géneros duplicados
        library.forEach(anime => {
          console.log(anime);
          anime.forEach(animeGenre => {
            animeGenre.genres.forEach((genre: { name: string; }) => {
              genreSet.add(genre.name); // Asume que cada género tiene una propiedad 'name'
          })
          });
        });
        console.log(genreSet);
        this.allGenres = Array.from(genreSet).map(name => ({ name }));
        this.genres = this.allGenres;
      } catch (error) {
        console.error('Error al obtener los géneros de la biblioteca:', error);
      }
    }
  }

  writeValue(obj: any): void {
    this.selectGenre(obj);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void { }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private selectGenre(name: string | undefined, propagate: boolean = false) {
    this.genreSelected = name;
    if (propagate && this.genreSelected) {
      this.propagateChange(this.genreSelected);
      this.genreSelectedEvent.emit(this.genreSelected);
    }
  }

  private async filter(value: string) {
    const query = value
    if (query) {
      this.genres = this.allGenres.filter(genre =>
        genre.name.toLowerCase().startsWith(query)
      );
    } else {
      this.genres = [...this.allGenres];
    }
  }

  onFilter(evt: any) {
    this.filter(evt.detail.value);
  }

  onGenreClicked(popover: IonPopover, genre: Genre) {
    this.selectGenre(genre.name, true);
    popover.dismiss();
  }

  clearSearch(input: IonInput) {
    input.value = '';
    this.filter('');
  }

  deselect(popover: IonPopover | null = null) {
    this.selectGenre(undefined, true);
    if (popover) popover.dismiss();
    this.genreSelectedEvent.emit(this.genreSelected)
  }
}