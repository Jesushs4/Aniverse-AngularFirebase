import { Pipe, PipeTransform } from '@angular/core';
import { Review } from 'src/app/core/interfaces/review';
import { AuthService } from 'src/app/core/services/auth.service';
import { FirebaseService } from 'src/app/core/services/firebase.service';

@Pipe({
  name: 'userReview'
})
export class UserReviewPipe implements PipeTransform {

  constructor(private firebaseService: FirebaseService) { }

  transform(reviews: Review[] | null): Review[] | null {
    if (!reviews || reviews.length === 0) { // Si no hay reviews no hace nada
      return reviews;
    }

    let user = this.firebaseService.user

        let userReviewIndex = reviews.findIndex(r => r.user_id === user?.uid);

        if (userReviewIndex > -1) { // Si se encuentra la review del usuario, se pone la primera
          let [userReview] = reviews.splice(userReviewIndex, 1);
          reviews.unshift(userReview);
        }

        return reviews;
      

  }
}
