import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuizMcqPage } from './quiz-mcq.page';

const routes: Routes = [
  {
    path: '',
    component: QuizMcqPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuizMcqPageRoutingModule {}
