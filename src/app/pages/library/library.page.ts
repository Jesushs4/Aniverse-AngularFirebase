import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Anime } from 'src/app/core/interfaces/anime';
import { LibraryService } from 'src/app/core/services/library.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
})
export class LibraryPage implements OnInit {

  selectedGenre: string = '';
  public isCapacitor: boolean;

  constructor(
    public libraryService: LibraryService,
    private router: Router,
  ) {
    this.libraryService.getLibrary().subscribe();
    this.isCapacitor = Capacitor.isNative!;
  }

  ngOnInit() {

  }

  onCardClicked(anime: Anime) { // Al clickar, te envía al anime/id
    this.router.navigate(['/anime', anime.mal_id]);
  }

  onGenreSelected(selectedGenre: string) {
    this.selectedGenre = selectedGenre;
  }

  async shareLibrary() {
    let library: Anime[] | null = null;
  
    this.libraryService.library$.subscribe({
      next: async (animeLibrary) => {
        library = animeLibrary;
  
        if (library!.length === 0) {
          console.log('No anime in the library to share.');
          return;
        }
  
        let animeNames = library!.map(anime => anime.title).join('\n');
        await Share.share({
          text: `Mi lista de Aniverse:\n${animeNames}`,
        });
  
      }
    });
  }

}
