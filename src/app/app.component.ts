import { Component } from '@angular/core';
import { AuthService } from './core/services/api/auth.service';
import { Router } from '@angular/router';
import { CustomTranslateService } from './core/services/custom-translate.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor(
    private auth:AuthService,
    private router:Router
  ) {

  }

}
