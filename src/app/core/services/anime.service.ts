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
    console.log(anime);
    return this.createAnime(anime).pipe(
      switchMap(animeUUID => {
        return this.firebaseAuth.user$.pipe(
          switchMap(user => {
            if (!user) {
              throw new Error('Usuario no autenticado');
            }
            let userId = user.uuid;
            let libraryPath = `users/${userId}/library`;
            let relation = {
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
                    return of({ ...relation, id: docId });
                  });
                } else {
                  // Si la relación ya existe, devuelve la existente
                  return of(existingRelations[0]);
                }
              })
            );
          })
        );
      })
    );
  }


}
