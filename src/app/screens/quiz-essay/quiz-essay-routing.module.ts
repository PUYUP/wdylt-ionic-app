import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuizEssayPage } from './quiz-essay.page';

const routes: Routes = [
  {
    path: '',
    component: QuizEssayPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuizEssayPageRoutingModule {}
