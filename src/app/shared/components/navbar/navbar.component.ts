import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ModalController, ToastController, ToastOptions } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/api/auth.service';
import { NicknameFormComponent } from '../nickname-form/nickname-form.component';
import { Observable, lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/core/services/api/api.service';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { FirebaseAuthService } from 'src/app/core/services/api/firebase/firebase-auth.service';
import { FirebaseService } from 'src/app/core/services/firebase/firebase.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {

  public username: string | null = null;
  lang: string = "es";


  constructor(
    private router: Router,
    private auth: FirebaseAuthService,
    private menu: MenuController,
    private modal: ModalController,
    private toast: ToastController,
    private firebaseService: FirebaseService,
    private translate: CustomTranslateService
  ) {
    let browserLang = translate.getBrowserLang();
    if (browserLang == 'en' || browserLang == 'es') {
      this.lang = browserLang

    }
    this.translate.use(this.lang);
  }

  ngOnInit() {
    this.setUsername().subscribe();
  }


  onLang(lang: string) {
    this.lang = lang;
    this.translate.use(this.lang);
    return false;
  }

  private setUsername(): Observable<void> {
    return new Observable(obs => {
      this.auth.me().subscribe(user => {
        this.username = user.nickname;
        obs.complete();
      })
    })
  }

  goSearch() {
    this.menu.close();
    this.router.navigate(['/search']);
  }


  goLibrary() {
    this.menu.close();
    this.router.navigate(['/library']);
  }

  goAbout() {
    this.menu.close();
    this.router.navigate(['/about']);
  }

  logout() {
    this.menu.close();
    this.auth.logout();
    this.username = "";
    this.router.navigate(['/login']);
  }


  private setNickname(name: any): Observable<string> {
    return new Observable(observer => {
      this.auth.me().subscribe(async user => {

          await this.firebaseService.updateDocumentField('users/', user.uuid!, 'nickname', name.nickname);
          observer.next(name);
          observer.complete();
        
      });
    });
  }

  async presentNickname(data: string | null, onDismiss: (result: any) => void) {

    const modal = await this.modal.create({
      component: NicknameFormComponent,
      componentProps: {
        nickname: data
      },
      cssClass: 'custom-modal'
    });
    modal.present();
    modal.onDidDismiss().then(result => {
      if (result && result.data) {
        onDismiss(result);
      }
    });
  }

  changeNickname() {
    var onDismiss = (info: any) => {
      this.setNickname(info.data).subscribe(async nickname => {
        this.setUsername().subscribe();
        this.translate.get('toast.nicknameChanged').subscribe(async (translatedMessage: string) => {
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
    this.presentNickname(null, onDismiss);

  }


}



