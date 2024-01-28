import { Injectable } from '@angular/core';
import { Anime } from '../interfaces/anime';
import { Observable, catchError, finalize, from, lastValueFrom, map, mergeMap, of, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from './strapi/api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
  ) { }

  private createAnime(anime: Anime): Observable<any> { // Crea anime
    let animeToCreate = {
      data: {
        title: anime.title,
        title_english: anime.title_english,
        episodes: anime.episodes,
        status: anime.status,
        synopsis: anime.synopsis,
        year: anime.year,
        image_url: anime.images.jpg.image_url,
        mal_id: anime.mal_id
      }
    };
    return this.apiService.post("/animes", animeToCreate).pipe(
      catchError(error => {
        if (error.status === 409 || error.status === 400) {
          return of(null);
        }
        return throwError(() => error);
      }),
      switchMap(createdAnime => {
        if (createdAnime) {
          return this.createGenre(anime);
        } else {
          return of(null);
        }
      })
    );
  }

  private createGenre(anime: Anime): Observable<any> { // Crea genero
    let genres: number[] = [];
    return this.apiService.get('/genres').pipe(
      switchMap(existingGenresResponse => {
        let existingGenres = existingGenresResponse.data.map((genre:
          {
            id: number; attributes:
            { name: string; };
          }) => {
          return {
            id: genre.id,
            name: genre.attributes.name
          };
        });
        anime.genres.forEach(genre => { // Tras obtener los generos que ya tengo, solo hago post si hay alguno que no tengo
          let foundGenre = existingGenres.find((g: { name: any; }) => g.name === genre.name);
          if (!foundGenre) {
            let newGenre = { data: { name: genre.name } };
            this.apiService.post('/genres', newGenre).subscribe(response =>
              genres.push(response.data.id));
          } else {
            genres.push(foundGenre.id);
          }
        });
        return of(null)
      }),
      finalize(() => {
        this.relationGenre(anime, genres).subscribe(); // Cuando finalice, ejecuto la relacion de géneros de forma que le paso el anime y los géneros que he ido guardando
      })
    )
  }

  private relationGenre(anime: Anime, genres: number[]): Observable<any> {
    return new Observable(obs => {
      this.apiService.get(`/animes?filters[mal_id]=${anime.mal_id}`).subscribe(async anime => {
        let post = {
          data: {
            anime: anime.data[0].id,
            genre: genres.map(id => ({ id: id }))
          }
        };
        await lastValueFrom(this.apiService.post(`/animegenres`, post))
      })
    })
  }


  public addAnimeUser(anime: Anime, form: any): Observable<any> { // Ejecuta las demas funciones y crea la relacion entre anime y user (biblioteca)
    return this.createAnime(anime).pipe(
      switchMap(() => this.apiService.get(`/animes?filters[mal_id]=${anime.mal_id}`)), // Nos aseguramos de que primero se crea el anime y concatenamos con switchMap
      switchMap(animeResponse => {
        let animeId = animeResponse.data[0].id;
        return this.auth.me().pipe(
          switchMap(user => { // Obtenemos el user para crear la relacion entre anime y user
            let relation = {
              data: {
                user: user.id,
                anime: animeId,
                episodes_watched: form.episodes_watched,
                watch_status: form.watch_status,
                user_score: form.user_score
              }
            };
            return this.apiService.get(`/libraries?filters[anime][mal_id][$eq]=${anime.mal_id}&filters[user][id][$eq]=${user.id}`).pipe( // Comprobamos si ya hay una relación asi para que el usuario no pueda añadir un anime que ya ha añadido
              switchMap(existingAnimeUserRelation => {
                if (existingAnimeUserRelation.data.length === 0) {
                  return this.apiService.post("/libraries", relation); // Crea la relación si no existe
                } else {
                  return of(relation); // Si la relacion existe va a devolver la existente en un observable
                }
              })
            );
          })
        );
      })
    );
  }


}
