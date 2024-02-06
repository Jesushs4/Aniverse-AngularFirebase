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
      const userUid = this.firebaseService.user.uid;
  
      // Primero, busca el anime por mal_id en la colección de animes.
      this.firebaseService.getDocumentsBy('animes', 'mal_id', mal_id).then(animeDocuments => {
        if (animeDocuments.length === 0) {
          observer.error('Anime no encontrado');
          return;
        }
        const animeData = animeDocuments[0].data; // Asumimos que mal_id es único.
  
        // Luego, busca en la colección 'library' del usuario por el mismo anime.
        this.firebaseService.getDocumentsBy(`users/${userUid}/library`, 'mal_id', mal_id).then(libraryDocuments => {
          if (libraryDocuments.length === 0) {
            observer.error('Información de la biblioteca no encontrada');
            return;
          }
          const libraryData = libraryDocuments[0].data;
  
          // Combina la información del anime con la de la biblioteca del usuario.
          const combinedData = {
            title: animeData['title'],
            title_english: animeData['title_english'],
            episodes: animeData['episodes'],
            status: animeData['status'],
            synopsis: animeData['synopsis'],
            year: animeData['year'],
            images: { jpg: { image_url: animeData['image_url'] } },
            genres: animeData['genres'],
            favorites: animeData['favorites'],
            mal_id: animeData['mal_id'],
            episodes_watched: libraryData['episodes_watched'],
            watch_status: libraryData['watch_status'],
            user_score: libraryData['user_score'],
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
        if (!user || !user.uuid) { // Asegúrate de que aquí usas el identificador correcto para el usuario
          throw new Error('Usuario no autenticado');
        }
        // Accede directamente a la colección "library" del usuario
        const libraryPath = `users/${user.uuid}/library`;
        return from(this.firebaseService.getDocuments(libraryPath));
      }),
      map(libraryDocuments => {
        // Mapea los documentos directamente a objetos Anime
        let animes = libraryDocuments.map(doc => {
          const data = doc.data;
          return {
            id : data['animeUUID'], // Asegúrate de que el campo se llama así en tu documento
            title: data['title'],
            title_english: data['title_english'],
            episodes: data['episodes'],
            status: data['status'],
            genres: data['genres'],
            images: { jpg: { image_url: data['image_url'] } },
            episodes_watched: data['episodes_watched'],
            mal_id: data['mal_id'],
            watch_status: data['watch_status'],
            user_score: data['user_score'],
            year: data['year']
          };
        });
        this._library.next(animes);
        return animes;
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

  deleteAnime(anime: Anime): Observable<Anime> { // Borrar anime de la libreria
    return new Observable<Anime>(obs => {
      this.auth.me().subscribe({
        next: async (user: User) => {
          let response = await lastValueFrom(this.apiService.get(`/libraries?filters[user][id][$eq]=${user.id}&filters[anime][mal_id][$eq]=${anime.mal_id}`));
          let reviewResponse = await lastValueFrom(this.apiService.get(`/reviews?filters[library][id]=${response.data[0].id}`))
          if (reviewResponse.data.length > 0) {
            await lastValueFrom(this.apiService.delete(`/reviews/${reviewResponse.data[0].id}`));
          }
          await lastValueFrom(this.apiService.delete(`/libraries/${response.data[0].id}`));
          this._anime.next(anime);
          obs.next(anime);

          let libraryResponse = await lastValueFrom(this.apiService.get(`/libraries?filters[user][id][$eq]=${user.id}`));
          if (libraryResponse.data.length === 0) {
            this._library.next([]);
          } else {
            this.getLibrary().subscribe();
          }
        }
      })
    })
  }

  editAnime(anime: Anime, form: any): Observable<Anime> { // Editar anime de la libreria
    return new Observable<Anime>(obs => {
      this.auth.me().subscribe({
        next: async (user: User) => {
          let response = await lastValueFrom(this.apiService.get(`/libraries?filters[user][id][$eq]=${user.id}&filters[anime][mal_id][$eq]=${anime.mal_id}`));
          let info = {
            data: {
              episodes_watched: form.episodes_watched,
              watch_status: form.watch_status,
              user_score: form.user_score
            }
          }
          let newAnime = await lastValueFrom(this.apiService.put(`/libraries/${response.data[0].id}`, info));
          anime.episodes_watched = newAnime.data.attributes.episodes_watched;
          anime.watch_status = newAnime.data.attributes.watch_status;
          anime.user_score = newAnime.data.attributes.user_score;
          this._anime.next(anime); // De esta forma mostramos los nuevos datos sin necesidad de recargar
          obs.next(anime);
        }
      })
    })
  }

}
