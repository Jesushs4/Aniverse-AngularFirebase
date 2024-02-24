import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, last, lastValueFrom } from 'rxjs';
import { CreateReview, Review } from '../interfaces/review';
import { AuthService } from './auth.service';
import { LibraryService } from './library.service';
import { ApiService } from './strapi/api.service';
import { Anime } from '../interfaces/anime';
import { ToastController, ToastOptions } from '@ionic/angular';
import { CustomTranslateService } from './custom-translate.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  _reviews: BehaviorSubject<Review[]> = new BehaviorSubject<Review[]>([]);
  reviews$: Observable<Review[]> = this._reviews.asObservable();

  constructor(
    private auth: AuthService,
    private libraryService: LibraryService,
    private apiService: ApiService,
    private toast: ToastController,
    private translate: CustomTranslateService,
    private firebaseService: FirebaseService
  ) { }

  createReview(form: any): Observable<any> { // Crear reseñas
    return new Observable<any>(obs => {

      const animeId = this.libraryService!.anime!.id;
      const userId = this.firebaseService.user!.uid;
      const reviewsPath = `animes/${animeId}/reviews`;
      this.firebaseService.getDocumentsBy(reviewsPath, 'userId', userId).then(existingReviews => {
        if (existingReviews.length > 0) {
          this.translate.get('toast.alreadyReview').subscribe(async (translatedMessage: string) => {
            const options: ToastOptions = {
              message: translatedMessage,
              duration: 1000,
              position: 'bottom',
              color: 'tertiary',
            };
            const toast = await this.toast.create(options);
            toast.present();

          })
        } else {
          let review: any = {
            summary: form.summary,
            review: form.review,
            userId: this.firebaseService.user!.uid
        }

        this.firebaseService.createDocument(`animes/${this.libraryService!.anime!.id}/reviews`, review)
        .then(docRefId => {
          obs.next(docRefId);
          obs.complete();
        })
        }

        })
              /*this.libraryService.getAnimeIdFromLibrary(this.libraryService.anime!).subscribe({
        next: async (libraryId: number) => {
          let check = await lastValueFrom(this.apiService.get(`/reviews?filters[library][id][$eq]=${libraryId}`))
          if (check.data.length < 1) { // Comprobar que no haya ninguna creada por ese usuario
            let review: CreateReview = {
              data: {
                summary: form.summary,
                review: form.review,
                library: libraryId,
              }
            }
            let response = await lastValueFrom(this.apiService.post(`/reviews`, review));
            this.getReviews().subscribe();
            obs.next(review);
          } else {
            this.translate.get('toast.alreadyReview').subscribe(async (translatedMessage: string) => {
              const options: ToastOptions = {
                message: translatedMessage,
                duration: 1000,
                position: 'bottom',
                color: 'tertiary',
              };
              const toast = await this.toast.create(options);
              toast.present();

            })
          }
        }
      })*/

      /*this.firebaseService.getDocumentsBy('animes', 'mal_id', anime.mal_id)
        .then(existingReview => {
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
        })*/
    })
  }

  getReviews(): Observable<Review[]> {
    return new Observable<Review[]>(observer => {
      let reviews: Review[] = [];
      let animeUID = this.libraryService.anime!.id;
  
      let reviewsPath = `animes/${animeUID}/reviews`;
  
      this.firebaseService.getDocuments(reviewsPath).then(async reviewDocuments => {
        const userPromises = reviewDocuments.map(reviewDoc => {
          const reviewData = reviewDoc.data;

          return this.firebaseService.getDocument('users', reviewData['userId']).then(userDoc => {
            const userData = userDoc.data;
            // Buscar el anime específico en el array 'library' del usuario para obtener el user_score
            const libraryItem = userData['library'].find((item: { animeUUID: string; }) => item.animeUUID === animeUID);
            console.log(libraryItem, "libreria");
            return {
              nickname: userData['nickname'], // Nickname del usuario
              userScore: libraryItem ? libraryItem.user_score : undefined // user_score del anime si está presente
            };
          });
        });
        
        const usersInfo = await Promise.all(userPromises);
  
        reviewDocuments.forEach((reviewDoc, index) => {
          const reviewData = reviewDoc.data;
          reviews.push({
            id: reviewDoc.id,
            summary: reviewData['summary'],
            review: reviewData['review'],
            date_added: new Date(reviewData['createdAt']).toLocaleDateString(),
            user_score: usersInfo[index].userScore,
            user_id: reviewData['userId'],
            nickname: usersInfo[index].nickname, 
            own_review: this.firebaseService.user?.uid === reviewData['userId']
          });
        });
        console.log(reviews, "RESEÑAS");
        this._reviews.next(reviews);
        observer.next(reviews);
        observer.complete();
      }).catch(error => observer.error(error));



      /*this.libraryService.getAnimeFromLibrary(this.libraryService.anime!).subscribe({
        next: async (libraryId: Anime) => {
          let libraryResponse = await lastValueFrom(this.apiService.get(`/reviews?filters[library][anime][mal_id][$eq]=${libraryId.mal_id}&populate=library`));
          let reviews: Review[] = [];
          for (let userReview of libraryResponse.data) {
            let library = userReview.attributes.library.data;
            let userResponse = await lastValueFrom(this.apiService.get(`/libraries?filters[id][$eq]=${library.id}&populate=user`));
            let user = userResponse.data[0].attributes.user.data[0].id;
            let extendedResponse = await lastValueFrom(this.apiService.get(`/extended-users?filters[user_id][id][$eq]=${user}`));
            let nickname = extendedResponse.data[0].attributes.nickname;
            this.auth.me().subscribe(ownUser => {
              reviews.push({
                id: userReview.id,
                summary: userReview.attributes.summary,
                review: userReview.attributes.review,
                date_added: (new Date(userReview.attributes.createdAt)).toLocaleDateString(), // Fecha de creación formateada
                user_score: library.attributes.user_score,
                user_id: user,
                nickname: nickname,
                own_review: ownUser.id == user // Booleano para comprobar si la reseña es del usuario logueado
              })
            })
          }
          this._reviews.next(reviews);
          obs.next(reviews);
          obs.complete();
        }
      })*/
    })
  }

  async deleteReview(review: Review) { // Borrar reseña
    await lastValueFrom(this.apiService.delete(`/reviews/${review.id}`))
    this.getReviews().subscribe();
  }

  async editReview(review: Review, form: any) {
    let info = {
      data: {
        summary: form.summary,
        review: form.review
      }
    }
    await lastValueFrom(this.apiService.put(`/reviews/${review.id}`, info));
    this.getReviews().subscribe();
  }


}
