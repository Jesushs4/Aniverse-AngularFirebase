import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, from, lastValueFrom, map, of, switchMap, tap } from 'rxjs';
import { Anime, Library } from '../interfaces/anime';
import { ApiService } from './api/api.service';
import { AuthService } from './api/auth.service';
import { User } from '../interfaces/user';
import { AnimeService } from './anime.service';
import { FirebaseService } from './firebase/firebase.service';
import { FirebaseAuthService } from './api/firebase/firebase-auth.service';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {

  private _library: BehaviorSubject<Anime[]> = new BehaviorSubject<Anime[]>([]);
  public library$: Observable<Anime[]> = this._library.asObservable();

  private _anime: BehaviorSubject<Anime | null> = new BehaviorSubject<Anime | null>(null);
  public anime$: Observable<Anime | null> = this._anime.asObservable();

  public anime: Anime | null = null;

  constructor(
    private animeService: AnimeService,
    private firebaseService: FirebaseService,
    private firebaseAuth: FirebaseAuthService
  ) {

  }

  setAnime(anime: Anime): Observable<Anime> {
    this.anime = anime;
    return new Observable(observer => {
      this._anime.next(anime);
      observer.next(anime);
      observer.complete();
    })
  }


  public addAnime(anime: Anime, form: any): Observable<Anime> { // Añadir el anime a la libreria
    return new Observable<Anime>(observer => {
      this.animeService.addAnimeUser(anime, form).subscribe(response => {
        this.getLibrary().subscribe();
      })
      observer.next(anime);
    })
  }

  getAnimeById(mal_id: number): Observable<any> {
    return new Observable(observer => {
      if (!this.firebaseService.user) {
        observer.error('Usuario no autenticado');
        return;
      }
      let userUid = this.firebaseService.user.uid;
  
      this.firebaseService.getDocument('users', userUid).then(userDocument => {
        let userDocData = userDocument.data;
        let library = userDocData['library'] || [];
        let libraryItem = library.find((item: any) => item.mal_id === mal_id);
  
        if (!libraryItem) {
          observer.error('Anime no encontrado en la biblioteca');
          return;
        }
  
        this.firebaseService.getDocumentsBy('animes', 'mal_id', mal_id).then(animeDocuments => {
          if (animeDocuments.length === 0) {
            observer.error('Anime no encontrado');
            return;
          }
          let animeData = animeDocuments[0].data;
  
          let combinedData = {
            id: libraryItem.animeUUID || animeData['id'],
            title: animeData['title'],
            title_english: animeData['title_english'],
            episodes: animeData['episodes'],
            status: animeData['status'],
            synopsis: animeData['synopsis'],
            year: animeData['year'],
            images: { jpg: { image_url: libraryItem.image_url || animeData['image_url'] } },
            genres: animeData['genres'],
            mal_id: animeData['mal_id'],
            episodes_watched: libraryItem.episodes_watched,
            watch_status: libraryItem.watch_status,
            user_score: libraryItem.user_score,
          };
          observer.next(combinedData);
          observer.complete();
        })
      })
    });
  }

  getLibrary(): Observable<Anime[]> {
    return this.firebaseAuth.user$.pipe(
      switchMap(user => {
        if (!user || !user.uuid) { 
          throw new Error('Usuario no autenticado');
        }
        return from(this.firebaseService.getDocument('users', user.uuid));
      }),
      map(userDocument => {
        let library = userDocument.data['library'] as Anime[];
        this._library.next(library);
        return library;
      })
    );
  }


  /*getAnimeIdFromLibrary(anime: Anime): Observable<number> { // Obtener id del anime de la libreria
    return new Observable<number>(obs => {
      this.auth.me().subscribe({
        next: async (user: User) => {
          let response = await lastValueFrom(this.apiService.get(`/libraries?filters[user][id][$eq]=${user.id}&filters[anime][mal_id][$eq]=${anime.mal_id}`));
          obs.next(response.data[0].id)
        }
      })
    })
  }*/

  getAnimeFromLibrary(anime: Anime): Observable<Anime> { // Obtener anime de la libreria
    return new Observable<Anime>(obs => {
      obs.next(anime)
    })
  }

  deleteAnime(anime: Anime): Observable<Anime> {
    return new Observable<Anime>(observer => {
      if (!this.firebaseService.user) {
        observer.error('Usuario no autenticado');
        return;
      }
      let userUid = this.firebaseService.user.uid;
      this.firebaseService.getDocument('users', userUid).then(userDocument => {
        let userData = userDocument.data;
        let library: Anime[] = userData['library'] || [];
        let isLastAnime = library.length === 1 && library.some(item => item.mal_id === anime.mal_id);
        let updatedLibrary = library.filter(item => item.mal_id !== anime.mal_id);
  
        this.firebaseService.updateDocument('users', userUid, { library: updatedLibrary })
          .then(() => {
            this._anime.next(null);
  
            if (isLastAnime) {
              this._library.next([]);
            } else {
              this.getLibrary().subscribe();
            }
  
            observer.next(anime);
            observer.complete();
          })
      })
    });
  }

  editAnime(anime: Anime, form: any): Observable<Anime> {
    return new Observable<Anime>(observer => {
      if (!this.firebaseService.user) {
        observer.error('Usuario no autenticado');
        return;
      }
      let userUid = this.firebaseService.user.uid;
      this.firebaseService.getDocument('users', userUid).then(userDocument => {
        let userData = userDocument.data;
        let library: Anime[] = userData['library'] || [];
        let animeIndex = library.findIndex(item => item.mal_id === anime.mal_id);
  
        if (animeIndex !== -1) {
          library[animeIndex] = {
            ...library[animeIndex],
            episodes_watched: form.episodes_watched,
            watch_status: form.watch_status,
            user_score: form.user_score,
          };
  
          this.firebaseService.updateDocument('users', userUid, { library })
            .then(() => {
              anime.episodes_watched = form.episodes_watched;
              anime.watch_status = form.watch_status;
              anime.user_score = form.user_score;
              this._anime.next(anime);
              observer.next(anime);
            })
        } else {
          observer.error('Anime no encontrado en la biblioteca');
        }
      })
    });
  }

}
