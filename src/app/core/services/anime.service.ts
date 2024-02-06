import { Injectable } from '@angular/core';
import { Anime } from '../interfaces/anime';
import { Observable, catchError, finalize, from, lastValueFrom, map, mergeMap, of, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from './strapi/api.service';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase/firebase-auth.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
    private firebaseAuth: FirebaseAuthService,
    private firebaseService: FirebaseService
  ) { }

  private createAnime(anime: any): Observable<any> {
    return new Observable(observer => {
      this.firebaseService.getDocumentsBy('animes', 'mal_id', anime.mal_id)
        .then(existingAnimes => {
          if (existingAnimes.length > 0) {
            // Anime encontrado, devuelve el ID de Firebase existente
            const existingAnime = existingAnimes[0];
            observer.next(existingAnime.id); // Usa el ID proporcionado por Firebase
            observer.complete();
          } else {
            // Anime no encontrado, crea uno nuevo con atributos específicos
            const animeToCreate = {
              title: anime.title,
              title_english: anime.title_english,
              episodes: anime.episodes,
              status: anime.status,
              synopsis: anime.synopsis,
              year: anime.year,
              image_url: anime.images.jpg.image_url,
              mal_id: anime.mal_id,
              genres: anime.genres.map((genre: { name: any; }) => genre.name) // Asumiendo que genres es un array de objetos
            };
  
            this.firebaseService.createDocument('animes', animeToCreate)
              .then(docRefId => {
                // Ahora usa el ID del documento recién creado, proporcionado por Firebase
                observer.next(docRefId); // Devuelve el ID de Firebase del nuevo documento
                observer.complete();
              })
              .catch(error => {
                if (error.code === 'permission-denied' || error.code === 'resource-exhausted') {
                  observer.error(new Error('No se pudo crear el anime debido a restricciones de seguridad o límites de cuota.'));
                } else {
                  observer.error(error);
                }
              });
          }
        })
        .catch(error => observer.error(error));
    }).pipe(
      catchError(error => {
        return of(`Error al buscar o crear el anime: ${error.message}`);
      }),
    );
  }

  /*private createGenre(anime: Anime): Observable<any> { // Crea genero
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
  }*/


  public addAnimeUser(anime: any, form: any): Observable<any> {
    // Primero, se crea o encuentra el anime y se obtiene su UUID
    console.log(anime);
    return this.createAnime(anime).pipe(
      switchMap(animeUUID => {
        // Una vez que tienes el UUID, obtienes el usuario autenticado
        return this.firebaseAuth.user$.pipe( // Asumiendo que tienes un observable `user$`
          switchMap(user => {
            if (!user) {
              throw new Error('Usuario no autenticado');
            }
            const userId = user.uuid; // Asumiendo que el objeto user tiene una propiedad uid
            const libraryPath = `users/${userId}/library`;
            const relation = {
              animeUUID: animeUUID, // Usamos el UUID del anime para la relación
              title: anime.title,
              title_english: anime.title_english,
              episodes: anime.episodes,
              status: anime.status,
              year: anime.year,
              mal_id: anime.mal_id,
              genres: anime.genres.map((genre: { name: any; }) => genre.name),
              image_url: anime.images.jpg.image_url,
              episodes_watched: form.episodes_watched,
              watch_status: form.watch_status,
              user_score: form.user_score
            };
            
            // Verificar si la relación anime-usuario ya existe usando el UUID
            return from(this.firebaseService.getDocumentsBy(libraryPath, 'animeUUID', animeUUID)).pipe(
              switchMap(existingRelations => {
                if (existingRelations.length === 0) {
                  // Si no existe, crea la relación
                  return this.firebaseService.createDocument(libraryPath, relation).then(docId => {
                    return of({ ...relation, id: docId }); // Devuelve la relación creada con su ID
                  });
                } else {
                  // Si la relación ya existe, devuelve la existente
                  return of(existingRelations[0]); // Asumiendo que quieres la primera relación existente
                }
              }),
              catchError(error => {
                // Manejo de errores, por ejemplo, permisos insuficientes
                return of(`Error al crear o verificar la relación anime-usuario: ${error.message}`);
              })
            );
          })
        );
      })
    );
  }


}
