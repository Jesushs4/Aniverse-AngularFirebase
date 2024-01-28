import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ModalController, ToastController, ToastOptions } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { NicknameFormComponent } from '../nickname-form/nickname-form.component';
import { Observable, lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/core/services/strapi/api.service';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';

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
    private auth: AuthService,
    private menu: MenuController,
    private modal: ModalController,
    private toast: ToastController,
    private apiService: ApiService,
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
        let response = await lastValueFrom(this.apiService.get(`/extended-users?filters[user_id][id][$eq]=${user.id}`))
        let extendeduser_id = response.data[0].id
        let nickname = {
          data: {
            nickname: name.nickname
          }
        }
        let changeNickname = await lastValueFrom(this.apiService.put(`/extended-users/${extendeduser_id}`, nickname))
        observer.next(name)
        observer.complete();
      })
    })

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



