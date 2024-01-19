import { Pipe, PipeTransform } from '@angular/core';
import { Anime } from 'src/app/core/interfaces/anime';

@Pipe({
  name: 'filterGenre'
})
export class FilterGenrePipe implements PipeTransform {

  transform(animes: Anime[] | null, selectedGenre: string): Anime[] | null {
    if (!selectedGenre || selectedGenre == "") {
      return animes
    } else {
      return animes!.filter(anime => anime.genres.includes(selectedGenre)); // Devolvemos los animes que tengan ese género
    }
  }

}
