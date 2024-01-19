import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientWebProvider } from './core/services/http/http-client-web.provider';
import { ApiService } from './core/services//strapi/api.service';
import { JwtService } from './core/services/http/jwt.service';
import { AuthStrapiService } from './core/services/strapi/auth-strapi.service';
import { HttpClientProvider } from './core/services/http/http-client.provider';
import { AuthService } from './core/services/strapi/auth.service';
import { ExpandableDirective } from './shared/directives/expandable.directive';
import { SharedModule } from './shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { createTranslateLoader } from './core/services/custom-translate.service';

export function httpProviderFactory(
  http: HttpClient) {
  return new HttpClientWebProvider(http);
}

export function AuthServiceProvider(
  jwt: JwtService,
  api: ApiService
) {
  return new AuthStrapiService(jwt, api);
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
      provide: AuthService,
      deps: [JwtService, ApiService],
      useFactory: AuthServiceProvider,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
