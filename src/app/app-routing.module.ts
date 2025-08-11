import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { isGuestGuard } from './shared/guards/is-guest.guard';
import { isAuthorizedGuard } from './shared/guards/is-authorized.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./screens/home-screen/home-screen.module').then(m => m.HomeScreenPageModule),
    canActivate: [isAuthorizedGuard],
  },
  {
    path: 'onboarding',
    loadChildren: () => import('./screens/splash-screen/splash-screen.module').then( m => m.SplashScreenPageModule),
    canActivate: [isGuestGuard],
  },
  {
    path: 'identify',
    loadChildren: () => import('./screens/identify-screen/identify-screen.module').then( m => m.IdentifyScreenPageModule),
    canActivate: [isAuthorizedGuard],
  },
  {
    path: 'archive',
    loadChildren: () => import('./screens/archive/archive.module').then( m => m.ArchivePageModule),
    canActivate: [isAuthorizedGuard],
  },
  {
    path: 'profile',
    loadChildren: () => import('./screens/profile-screen/profile-screen.module').then( m => m.ProfileScreenPageModule),
    canActivate: [isAuthorizedGuard],
  },
  {
    path: 'quiz-essay',
    loadChildren: () => import('./screens/quiz-essay/quiz-essay.module').then( m => m.QuizEssayPageModule)
  },
  {
    path: 'quiz-mcq',
    loadChildren: () => import('./screens/quiz-mcq/quiz-mcq.module').then( m => m.QuizMcqPageModule)
  },
  {
    path: 'profile-screen',
    loadChildren: () => import('./screens/profile-screen/profile-screen.module').then( m => m.ProfileScreenPageModule)
  },
  {
    path: '',
    redirectTo: '/onboarding',
    pathMatch: 'full'
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
