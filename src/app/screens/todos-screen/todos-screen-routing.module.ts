import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TodosScreenPage } from './todos-screen.page';

const routes: Routes = [
  {
    path: '',
    component: TodosScreenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TodosScreenPageRoutingModule {}
