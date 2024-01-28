import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, last, lastValueFrom } from 'rxjs';
import { CreateReview, Review } from '../interfaces/review';
import { AuthService } from './auth.service';
import { LibraryService } from './library.service';
import { ApiService } from './strapi/api.service';
import { Anime } from '../interfaces/anime';
import { ToastController, ToastOptions } from '@ionic/angular';
import { CustomTranslateService } from './custom-translate.service';

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
    private translate: CustomTranslateService
  ) { }

  createReview(form: any): Observable<CreateReview> { // Crear reseñas
    return new Observable<CreateReview>(obs => {
      this.libraryService.getAnimeIdFromLibrary(this.libraryService.anime!).subscribe({
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
      })
    })
  }

  getReviews(): Observable<Review[]> { // Mostrar reseñas
    return new Observable<Review[]>(obs => {
      this.libraryService.getAnimeFromLibrary(this.libraryService.anime!).subscribe({
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
      })
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
