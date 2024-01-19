import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Anime } from 'src/app/core/interfaces/anime';
import { LibraryService } from 'src/app/core/services/library.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
})
export class LibraryPage implements OnInit {

  selectedGenre: string = '';

  constructor(
    public libraryService: LibraryService,
    private router: Router,
  ) {
    this.libraryService.getLibrary().subscribe();
  }

  ngOnInit() {

  }

  onCardClicked(anime: Anime) { // Al clickar, te envía al anime/id
    this.router.navigate(['/anime', anime.mal_id]);
  }

  onGenreSelected(selectedGenre: string) {
    this.selectedGenre = selectedGenre;
  }

}
