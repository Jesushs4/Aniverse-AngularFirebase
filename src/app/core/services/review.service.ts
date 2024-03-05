import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, filter, last, lastValueFrom, switchMap } from 'rxjs';
import { CreateReview, Review } from '../interfaces/review';
import { AuthService } from './api/auth.service';
import { LibraryService } from './library.service';
import { ApiService } from './api/api.service';
import { Anime } from '../interfaces/anime';
import { ToastController, ToastOptions } from '@ionic/angular';
import { CustomTranslateService } from './custom-translate.service';
import { FirebaseService } from './firebase/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  _reviews: BehaviorSubject<Review[]> = new BehaviorSubject<Review[]>([]);
  reviews$: Observable<Review[]> = this._reviews.asObservable();

  constructor(
    private libraryService: LibraryService,
    private toast: ToastController,
    private translate: CustomTranslateService,
    private firebaseService: FirebaseService
  ) {
    // Cuando se tenga la id del anime, se hara el subscribeToCollection para evitar errores
    this.libraryService.anime$.pipe(
      filter((anime): anime is Anime => !!anime && !!anime.id),
      switchMap(anime => {
        return this.subscribeToReviews(anime.id);
      })
    ).subscribe();
  }

  async subscribeToReviews(animeId: string): Promise<Observable<any>> {
    let allUsers = await this.firebaseService.getDocuments('users');

    let currentUserUid = this.firebaseService.user?.uid;

    this.firebaseService.subscribeToCollection(`animes/${animeId}/reviews`, this._reviews, (doc) => {
      let reviewData = doc['data']();
      reviewData.id = doc['id'];
      let userId = reviewData.userId;

      reviewData.own_review = currentUserUid === userId;
      reviewData.animeId = animeId;

      let userDoc = allUsers.find(doc => doc.id === userId);
      reviewData.nickname = userDoc!.data['nickname']
      let userLibrary = userDoc!.data['library'];
      let animeLibraryItem = userLibrary.find((item: { animeUUID: string; }) => item.animeUUID === animeId);

      reviewData.user_score = animeLibraryItem ? animeLibraryItem.user_score : null;

      return reviewData;
    });

    return this._reviews.asObservable();
  }

  createReview(form: any): Observable<any> { // Crear reseñas
    return new Observable<any>(obs => {

      let animeId = this.libraryService!.anime!.id;
      let userId = this.firebaseService.user!.uid;
      let reviewsPath = `animes/${animeId}/reviews`;
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
            userId: this.firebaseService.user!.uid,
            date_added: new Date().toISOString().split('T')[0]
          }

          this.firebaseService.createDocument(`animes/${this.libraryService!.anime!.id}/reviews`, review)
            .then(docRefId => {
              obs.next(docRefId);
              obs.complete();
            })
        }
      })
    })
  }

  async deleteReview(review: Review) { // Borrar reseña
    let collectionName = `animes/${review.animeId}/reviews`;
    this.firebaseService.deleteDocument(collectionName, review.id);
  }

  async editReview(review: Review, form: any) {
    let documentId = review.id;
    let collectionName = `animes/${review.animeId}/reviews`;
    await this.firebaseService.updateDocumentField(collectionName, documentId, 'summary', form.summary);
    await this.firebaseService.updateDocumentField(collectionName, documentId, 'review', form.review);
  }


}
