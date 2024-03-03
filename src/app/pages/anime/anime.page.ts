import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
import { ModalController, ToastController, ToastOptions } from '@ionic/angular';
import { Anime } from 'src/app/core/interfaces/anime';
import { Review } from 'src/app/core/interfaces/review';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { LibraryService } from 'src/app/core/services/library.service';
import { ReviewService } from 'src/app/core/services/review.service';
import { AnimeFormComponent } from 'src/app/shared/components/anime-form/anime-form.component';
import { ReviewFormComponent } from 'src/app/shared/components/review-form/review-form.component';

@Component({
  selector: 'app-anime',
  templateUrl: './anime.page.html',
  styleUrls: ['./anime.page.scss'],
})
export class AnimePage implements OnInit {

  public reviewCreated: boolean | undefined
  public animeLoaded = false;
  public isCapacitor: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public anime: LibraryService,
    private modal: ModalController,
    public reviewService: ReviewService,
    private toast: ToastController,
    private translate: CustomTranslateService
  ) {
    this.isCapacitor = Capacitor.isNative!;
  }

  ngOnInit() {
    this.route.params.subscribe(params => { // Con esto obtenemos el id del anime en base a la URL
      let idNumber = +params['id']; // Parseamos a un number
      this.anime.getAnimeById(idNumber).subscribe(animeData => {
        this.anime.setAnime(animeData).subscribe(response => {
          this.animeLoaded = true;
        });
      });
    });
  }

  textToSpeech() {
    const speak = async () => {
      await TextToSpeech.speak({
        text: this.anime.anime!.synopsis!,
        lang: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
    };

    speak();
  }

  scrollToReviews() {
    let reviewsElement = document.getElementById('reviewTitle');
    if (reviewsElement) {
      reviewsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }



  public backToLibrary() {
    this.router.navigate(['/library']);
  }

  public deleteAnime() {
    if (this.anime.anime) {
      this.anime.deleteAnime(this.anime.anime).subscribe(async anime => {
        this.translate.get('toast.deleteAnime').subscribe(async (translatedMessage: string) => {

          const options: ToastOptions = {
            message: translatedMessage,
            duration: 1000,
            position: 'bottom',
            color: 'danger',
          };
          const toast = await this.toast.create(options);
          toast.present();
        })
        this.router.navigate(['/library']);
      });
    }
  }



  async presentAnime(data: Anime | null, onDismiss: (result: any) => void) { // Ejecuta el modal
    const modal = await this.modal.create({
      component: AnimeFormComponent,
      componentProps: {
        anime: data
      },
    });
    modal.present();
    modal.onDidDismiss().then(result => {
      if (result && result.data) {
        onDismiss(result);
      }
    });
  }

  public editAnime() { // Editar anime
    var onDismiss = (info: any) => {
      switch (info.role) {
        case 'submit': {
          if (this.anime.anime) {
            this.anime.editAnime(this.anime.anime, info.data).subscribe(async anime => {
              this.translate.get('toast.editAnime').subscribe(async (translatedMessage: string) => {
                const options: ToastOptions = {
                  message: translatedMessage,
                  duration: 1000,
                  position: 'bottom',
                  color: 'tertiary',
                };
                const toast = await this.toast.create(options);
                toast.present();
              });
            })
          }
        }
          break;
        default: {
          console.error("No debería entrar");
        }
      }
    }
    this.presentAnime(this.anime.anime, onDismiss);
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
      await this.reviewService.createReview(info.data).subscribe(async review => {
        this.translate.get('toast.addReview').subscribe(async (translatedMessage: string) => {

          const options: ToastOptions = {
            message: translatedMessage,
            duration: 1000,
            position: 'bottom',
            color: 'tertiary',
          };
          const toast = await this.toast.create(options);
          toast.present();
        })
      })
    }

    this.presentReview(null, onDismiss);


  }




}
