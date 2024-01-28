import { Component, Input, OnInit } from '@angular/core';
import { Review } from 'src/app/core/interfaces/review';
import { AuthService } from 'src/app/core/services/auth.service';
import { ReviewService } from 'src/app/core/services/review.service';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { ModalController, ToastController, ToastOptions } from '@ionic/angular';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
})
export class ReviewsComponent implements OnInit {

  @Input() review: Review | undefined

  constructor(
    private auth: AuthService,
    private reviewService: ReviewService,
    private modal: ModalController,
    private toast: ToastController,
    private translate: CustomTranslateService
  ) {
  }

  ngOnInit() { }

  public deleteReview(review: Review) {
    this.reviewService.deleteReview(review)
    this.translate.get('toast.deleteReview').subscribe(async (translatedMessage: string) => {

      const options: ToastOptions = {
        message: translatedMessage,
        duration: 1000,
        position: 'bottom',
        color: 'danger',
      };
      const toast = await this.toast.create(options);
      toast.present()
    });
  }

  async presentReview(data: Review | null, onDismiss: (result: any) => void) {

    const modal = await this.modal.create({
      component: ReviewFormComponent,
      componentProps: {
        review: data
      },
    });
    modal.present();
    modal.onDidDismiss().then(result => {
      if (result && result.data) {
        onDismiss(result);
      }
    });
  }

  onReview() {
    var onDismiss = async (info: any) => {
      if (this.review) {
        await this.reviewService.editReview(this.review, info.data)
        this.translate.get('toast.editReview').subscribe(async (translatedMessage: string) => {

          const options: ToastOptions = {
            message: translatedMessage,
            duration: 1000,
            position: 'bottom',
            color: 'tertiary',
          };
          const toast = await this.toast.create(options);
          toast.present();
        });
      }
    }
    if (this.review) {
      this.presentReview(this.review, onDismiss);
    }

  }

}

