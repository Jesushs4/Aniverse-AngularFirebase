import { Component, EventEmitter, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonPopover } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { Genre } from 'src/app/core/interfaces/genre';
import { FirebaseService } from 'src/app/core/services/firebase/firebase.service';
import { FirebaseAuthService } from 'src/app/core/services/api/firebase/firebase-auth.service';
import { LibraryService } from 'src/app/core/services/library.service';
import { ApiService } from 'src/app/core/services/api/api.service';

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
    const user = this.firebaseService.user
    
    let userDoc = await this.firebaseService.getDocument('users', user!.uid);
    let library = userDoc.data['library'] || [];
  
    let genreSet = new Set<string>();
    library.forEach((anime: any) => {
      if (anime.genres) {
        anime.genres.forEach((genre: string) => {
          genreSet.add(genre);
        });
      }
    });
    this.allGenres = Array.from(genreSet).map(name => ({ name }));
    this.genres = this.allGenres;
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