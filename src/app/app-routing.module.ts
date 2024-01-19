import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MainPage } from './pages/main/main.page';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [

  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: '',
    component: MainPage,
    canActivate:[AuthGuard],
    children: [
      {
        path: 'main',
        loadChildren: () => import('./pages/main/main.module').then(m => m.MainPageModule),
        

      },
      {
        path: 'library',
        loadChildren: () => import('./pages/library/library.module').then(m => m.LibraryPageModule),
        

      },
      {
        path: 'search',
        loadChildren: () => import('./pages/search/search.module').then( m => m.SearchPageModule),
        

      },
      {
        path: 'anime/:id',
        loadChildren: () => import('./pages/anime/anime.module').then( m => m.AnimePageModule)
      },
      {
        path: 'about',
        loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule)
      },
    ]
  },



];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
