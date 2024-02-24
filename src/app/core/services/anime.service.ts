import { Injectable } from '@angular/core';
import { Anime } from '../interfaces/anime';
import { Observable, catchError, finalize, from, lastValueFrom, map, mergeMap, of, switchMap, tap, throwError } from 'rxjs';
import { FirebaseAuthService } from './firebase/firebase-auth.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {

  constructor(
    private firebaseAuth: FirebaseAuthService,
    private firebaseService: FirebaseService
  ) { }

  private createAnime(anime: any): Observable<any> {
    return new Observable(observer => {
      this.firebaseService.getDocumentsBy('animes', 'mal_id', anime.mal_id)
        .then(existingAnimes => {
          if (existingAnimes.length > 0) {
            let existingAnime = existingAnimes[0];
            observer.next(existingAnime.id);
            observer.complete();
          } else {
            let animeToCreate = {
              title: anime.title,
              title_english: anime.title_english,
              episodes: anime.episodes,
              status: anime.status,
              synopsis: anime.synopsis,
              year: anime.year,
              image_url: anime.images.jpg.image_url,
              mal_id: anime.mal_id,
              genres: anime.genres.map((genre: { name: any; }) => genre.name)
            };
  
            this.firebaseService.createDocument('animes', animeToCreate)
              .then(docRefId => {
                observer.next(docRefId);
                observer.complete();
              })
          }
        })

    })
  }

  public addAnimeUser(anime: any, form: any): Observable<any> {
    return this.createAnime(anime).pipe(
      switchMap(animeUUID => {
        return this.firebaseAuth.user$.pipe(
          switchMap(user => {
            if (!user) {
              return throwError('Usuario no autenticado');
            }
            const userId = user.uuid;
            const libraryPath = `users/${userId}`;
  
            return from(this.firebaseService.getDocument('users', userId!)).pipe(
              switchMap(userDoc => {
                let library = userDoc.data['library'] || [];
                const existingAnimeIndex = library.findIndex((item: any) => item.animeUUID === animeUUID);
                if (existingAnimeIndex !== -1) {
                  return throwError('El anime ya está en la biblioteca');
                }
  
                const relation = {
                  animeUUID: animeUUID,
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
                library.push(relation);
  
                return from(this.firebaseService.updateDocument('users', userId!, { library: library })).pipe(
                  map(() => relation),
                  catchError(error => throwError('Error al actualizar la biblioteca del usuario'))
                );
              })
            );
          })
        );
      })
    );
  }


}
