import { Component, Input, OnInit, Output } from '@angular/core';
import { Anime } from 'src/app/core/interfaces/anime';
import { AnimeFormComponent } from '../anime-form/anime-form.component';
import { ModalController, ToastController, ToastOptions } from '@ionic/angular';
import { Router } from '@angular/router';
import { LibraryService } from 'src/app/core/services/library.service';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';

@Component({
  selector: 'app-anime-card',
  templateUrl: './anime-card.component.html',
  styleUrls: ['./anime-card.component.scss'],
})
export class AnimeCardComponent implements OnInit {
  @Input() anime: Anime | null = null;

  constructor(
    private modal: ModalController,
    private router: Router,
    private libraryService: LibraryService,
    private toast: ToastController,
    private translate: CustomTranslateService,
  ) {


  }

  ngOnInit() {

  }



  isSearchPage(): boolean {
    return this.router.url.includes('search');
  }

  async presentAnime(data: Anime | null, onDismiss: (result: any) => void) {

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

  addToLibrary() {
    var onDismiss = (info: any) => {
      switch (info.role) {
        case 'submit': {
          if (this.anime) {
            this.libraryService.addAnime(this.anime, info.data).subscribe(async anime => {
              this.translate.get('toast.addAnime').subscribe(async (translatedMessage: string) => {

                const options: ToastOptions = {
                  message: translatedMessage,
                  duration: 1000,
                  position: 'bottom',
                  color: 'tertiary',
                };
                const toast = await this.toast.create(options);
                toast.present();
              })
            });
          }
        }
          break;
        default: {
          console.error("No debería entrar");
        }
      }
    }
    this.presentAnime(this.anime, onDismiss);
  }

}
