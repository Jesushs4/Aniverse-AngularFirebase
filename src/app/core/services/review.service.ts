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

  getReviews(): Observable<Review[]> {
    return new Observable<Review[]>(observer => {
      let reviews: Review[] = [];
      let animeUID = this.libraryService.anime!.id;
  
      let reviewsPath = `animes/${animeUID}/reviews`;
  
      this.firebaseService.getDocuments(reviewsPath).then(async reviewDocuments => {
        let users = reviewDocuments.map(reviewDoc => {
          let reviewData = reviewDoc.data;

          return this.firebaseService.getDocument('users', reviewData['userId']).then(userDoc => {
            let userData = userDoc.data;
            let libraryItem = userData['library'].find((item: { animeUUID: string; }) => item.animeUUID === animeUID);
            return {
              nickname: userData['nickname'],
              userScore: libraryItem ? libraryItem.user_score : undefined
            };
          });
        });
        
        let usersInfo = await Promise.all(users);
  
        reviewDocuments.forEach((reviewDoc, index) => {
          let reviewData = reviewDoc.data;
          reviews.push({
            id: reviewDoc.id,
            summary: reviewData['summary'],
            review: reviewData['review'],
            date_added: reviewData['date_added'],
            user_score: usersInfo[index].userScore,
            user_id: reviewData['userId'],
            nickname: usersInfo[index].nickname, 
            own_review: this.firebaseService.user?.uid === reviewData['userId'],
            animeId: animeUID
          });
        });
        this._reviews.next(reviews);
        observer.next(reviews);
        observer.complete();
      })

    })
  }

  async deleteReview(review: Review) { // Borrar reseña
    let collectionName = `animes/${review.animeId}/reviews`;
    this.firebaseService.deleteDocument(collectionName, review.id);
    this.getReviews().subscribe();
  }

  async editReview(review: Review, form: any) {
    let documentId = review.id;
    let collectionName = `animes/${review.animeId}/reviews`;
    await this.firebaseService.updateDocumentField(collectionName, documentId, 'summary', form.summary);
    await this.firebaseService.updateDocumentField(collectionName, documentId, 'review', form.review);
    this.getReviews().subscribe();
  }


}
