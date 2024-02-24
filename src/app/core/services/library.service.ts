import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, from, lastValueFrom, map, of, switchMap, tap } from 'rxjs';
import { Anime, Library } from '../interfaces/anime';
import { ApiService } from './strapi/api.service';
import { AuthService } from './auth.service';
import { User } from '../interfaces/user';
import { AnimeService } from './anime.service';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthService } from './firebase/firebase-auth.service';

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
    private auth: AuthService,
    private apiService: ApiService,
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
  
      // Obtener el documento del usuario que contiene la biblioteca en un array
      this.firebaseService.getDocument('users', userUid).then(userDocument => {
        const userDocData = userDocument.data;
        const library = userDocData['library'] || [];
        const libraryItem = library.find((item: any) => item.mal_id === mal_id);
  
        if (!libraryItem) {
          observer.error('Anime no encontrado en la biblioteca');
          return;
        }
  
        // Asumiendo que necesitas complementar la información del anime desde la colección 'animes'
        this.firebaseService.getDocumentsBy('animes', 'mal_id', mal_id).then(animeDocuments => {
          if (animeDocuments.length === 0) {
            observer.error('Anime no encontrado');
            return;
          }
          let animeData = animeDocuments[0].data;
  
          let combinedData = {
            id: libraryItem.animeUUID || animeData['id'], // Asegúrate de ajustar según tus identificadores
            title: animeData['title'],
            title_english: animeData['title_english'],
            episodes: animeData['episodes'],
            status: animeData['status'],
            synopsis: animeData['synopsis'],
            year: animeData['year'],
            images: { jpg: { image_url: libraryItem.image_url || animeData['image_url'] } }, // Ajusta según tus datos
            genres: animeData['genres'],
            mal_id: animeData['mal_id'],
            episodes_watched: libraryItem.episodes_watched,
            watch_status: libraryItem.watch_status,
            user_score: libraryItem.user_score,
          };
          observer.next(combinedData);
          observer.complete();
        }).catch(error => observer.error(error));
      }).catch(error => observer.error(error));
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
        const library = userDocument.data['library'] as Anime[]; // Asume que tienes el campo library correctamente tipado en tu documento.
        console.log(library);
        this._library.next(library);
        return library;
      }),
      catchError(error => {
        console.error('Error al obtener la librería:', error);
        return of([]);
      })
    );
  }


  getAnimeIdFromLibrary(anime: Anime): Observable<number> { // Obtener id del anime de la libreria
    return new Observable<number>(obs => {
      this.auth.me().subscribe({
        next: async (user: User) => {
          let response = await lastValueFrom(this.apiService.get(`/libraries?filters[user][id][$eq]=${user.id}&filters[anime][mal_id][$eq]=${anime.mal_id}`));
          obs.next(response.data[0].id)
        }
      })
    })
  }

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
      const userUid = this.firebaseService.user.uid;
      this.firebaseService.getDocument('users', userUid).then(userDocument => {
        const userData = userDocument.data;
        const library: Anime[] = userData['library'] || [];
        // Determina si el anime a eliminar es el único en la biblioteca
        const isLastAnime = library.length === 1 && library.some(item => item.mal_id === anime.mal_id);
        const updatedLibrary = library.filter(item => item.mal_id !== anime.mal_id);
  
        this.firebaseService.updateDocument('users', userUid, { library: updatedLibrary })
          .then(() => {
            this._anime.next(null); // Actualiza el BehaviorSubject para el anime individual
  
            // Aquí se verifica si se debe limpiar la biblioteca o recargarla
            if (isLastAnime) {
              this._library.next([]); // Si es el último anime, limpia la biblioteca
            } else {
              this.getLibrary().subscribe(); // Si no, recarga la biblioteca
            }
  
            observer.next(anime);
            observer.complete();
          })
          .catch(error => observer.error(error));
      })
      .catch(error => observer.error(error));
    });
  }

  editAnime(anime: Anime, form: any): Observable<Anime> {
    return new Observable<Anime>(observer => {
      if (!this.firebaseService.user) {
        observer.error('Usuario no autenticado');
        return;
      }
      const userUid = this.firebaseService.user.uid;
      this.firebaseService.getDocument('users', userUid).then(userDocument => {
        const userData = userDocument.data;
        const library: Anime[] = userData['library'] || [];
        const animeIndex = library.findIndex(item => item.mal_id === anime.mal_id);
  
        if (animeIndex !== -1) {
          // Actualizar los datos del anime
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
            .catch(error => observer.error(error));
        } else {
          observer.error('Anime no encontrado en la biblioteca');
        }
      })
      .catch(error => observer.error(error));
    });
  }

  /* 
User
  deleteAnime(anime: Anime): Observable<Anime> { // Borrar anime de la libreria
    return new Observable<Anime>(obs => {
      let user = this.firebaseService.user
      this.firebaseService.getDocumentsBy(`users/${user!.uid}/library`, 'mal_id', anime.mal_id).then(animeDocuments => {
        let animeUid = animeDocuments[0].id
        console.log(animeDocuments[0].id);

        this.firebaseService.deleteDocument(`users/${user!.uid}/library`, animeUid)

        this._anime.next(anime); // De esta forma mostramos los nuevos datos sin necesidad de recargar
        obs.next(anime);

        this.firebaseService.getDocuments(`users/${user!.uid}/library`).then(library => {
          console.log(library)
          if (library.length === 0) {
          this._library.next([]);
        } else {
          this.getLibrary().subscribe();
        }
        })
        
    })
    })
  }*/

}
