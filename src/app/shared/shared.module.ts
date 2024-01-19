import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { AnimeCardComponent } from './components/anime-card/anime-card.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { AnimeFormComponent } from './components/anime-form/anime-form.component';
import { ReviewFormComponent } from './components/review-form/review-form.component';
import { ReviewsComponent } from './components/reviews/reviews.component';
import { UserReviewPipe } from './pipes/user-review.pipe';
import { GenreSearchComponent } from './components/genre-search/genre-search.component';
import { FilterGenrePipe } from './pipes/filter-genre.pipe';
import { ExpandableDirective } from './directives/expandable.directive';
import { NicknameFormComponent } from './components/nickname-form/nickname-form.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { createTranslateLoader } from '../core/services/custom-translate.service';
import { CardTextDirective } from './directives/card-text.directive';



@NgModule({
  declarations: [
    SearchBarComponent,
    AnimeCardComponent,
    NavbarComponent,
    LoginFormComponent,
    RegisterFormComponent,
    AnimeFormComponent,
    ReviewFormComponent,
    ReviewsComponent,
    UserReviewPipe,
    GenreSearchComponent,
    FilterGenrePipe,
    ExpandableDirective,
    NicknameFormComponent,
    CardTextDirective
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild({
      loader: {
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [HttpClient]
      }
      }),
  ],
  exports: [
    SearchBarComponent,
    AnimeCardComponent,
    NavbarComponent,
    LoginFormComponent,
    RegisterFormComponent,
    AnimeFormComponent,
    ReviewFormComponent,
    ReviewsComponent,
    UserReviewPipe,
    GenreSearchComponent,
    FilterGenrePipe,
    ExpandableDirective,
    NicknameFormComponent,
    TranslateModule,
    CardTextDirective
  ]
})
export class SharedModule { }
