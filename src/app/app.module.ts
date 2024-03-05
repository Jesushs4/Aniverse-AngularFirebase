import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientWebProvider } from './core/services/http/http-client-web.provider';
import { ApiService } from './core/services/api/api.service';
import { JwtService } from './core/services/http/jwt.service';
import { AuthStrapiService } from './core/services/api/strapi/auth-strapi.service';
import { HttpClientProvider } from './core/services/http/http-client.provider';
import { AuthService } from './core/services/api/auth.service';
import { SharedModule } from './shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { createTranslateLoader } from './core/services/custom-translate.service';
import { environment } from 'src/environments/environment';
import { FirebaseService } from './core/services/firebase/firebase.service';
import { FirebaseAuthService } from './core/services/api/firebase/firebase-auth.service';

export function httpProviderFactory(
  http: HttpClient) {
  return new HttpClientWebProvider(http);
}


export function AuthServiceFactory(
  backend:string,
  jwt:JwtService,
  api:ApiService,
  firebase:FirebaseService
) {
    switch(backend){
      case 'Strapi':
        return new AuthStrapiService(jwt, api);
      case 'Firebase':
        return new FirebaseAuthService(firebase);
      default:
        throw new Error("Not implemented");
    }
}


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [HttpClient]
    }
  }),SharedModule, ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: HttpClientProvider,
      deps: [HttpClient, Platform],
      useFactory: httpProviderFactory,
    },
    
    {
      provide: 'firebase-config',
      useValue:environment.firebaseConfig
    },
    {
      provide: 'backend',
      useValue:'Firebase'
    },
    {
      provide: AuthService,
      deps: ['backend',JwtService, ApiService, FirebaseService],
      useFactory: AuthServiceFactory,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
