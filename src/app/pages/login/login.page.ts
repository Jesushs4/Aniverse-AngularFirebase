import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController, ToastOptions } from '@ionic/angular';
import { UserCredentials } from 'src/app/core/interfaces/user-credentials';
import { UserRegisterInfo } from 'src/app/core/interfaces/user-register-info';
import { AuthService } from 'src/app/core/services/strapi/auth.service';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { RegisterFormComponent } from 'src/app/shared/components/register-form/register-form.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  backgroundImages = [
    'assets/images/backgrounds/Imagen1.jpg',
    'assets/images/backgrounds/Imagen2.jpg',
    'assets/images/backgrounds/Imagen3.jpg',
    'assets/images/backgrounds/Imagen4.jpg',
    'assets/images/backgrounds/Imagen5.jpg'
  ]
  backgroundImage: string | undefined;
  lang: string = "es";


  constructor(
    private auth: AuthService,
    private router: Router,
    private modal: ModalController,
    private toast: ToastController,
    private translate: CustomTranslateService
  ) { }

  ngOnInit() {
    let index = Math.floor(Math.random() * this.backgroundImages.length)
    this.backgroundImage = `url('${this.backgroundImages[index]}')`;
    let browserLang = this.translate.getBrowserLang();
    if (browserLang == 'en' || browserLang == 'es') {
      this.lang = browserLang

    }
    this.translate.use(this.lang);
  }

  onLang(lang: string) {
    this.lang = lang;
    this.translate.use(this.lang);
    return false;
  }

  onLogin(credentials: UserCredentials) {
    this.auth.login(credentials).subscribe({
      next: data => {
        this.router.navigate(['search'])
      },
      error: err => {
        console.log(err);
      }
    });
  }

  async presentRegister(data: UserRegisterInfo | null, onDismiss: (result: any) => void) {

    const modal = await this.modal.create({
      component: RegisterFormComponent,
      componentProps: {
        user: data
      },
    });
    modal.present();
    modal.onDidDismiss().then(result => {
      if (result && result.data) {
        onDismiss(result);
      }
    });
  }

  onRegister() {
    var onDismiss = (info: any) => {
      switch (info.role) {
        case 'ok': {
          this.auth.register(info.data).subscribe(async user => {
            this.translate.get('toast.userCreated').subscribe(async (translatedMessage: string) => {
              const options: ToastOptions = {
                message: translatedMessage,
                duration: 1000,
                position: 'bottom',
                color: 'tertiary',
                cssClass: 'card-ion-toast'
              };
              const toast = await this.toast.create(options);
              toast.present();
            })
          })
        }
          break;
        default: {
          console.error("No debería entrar");
        }
      }
    }
    this.presentRegister(null, onDismiss);
  }


}

