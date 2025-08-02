import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IdentifyScreenPage } from './identify-screen.page';

const routes: Routes = [
  {
    path: '',
    component: IdentifyScreenPage,
    title: 'Identify Screen',
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IdentifyScreenPageRoutingModule {}
