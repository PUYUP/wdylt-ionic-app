import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProfileScreenPage } from './profile-screen.page';

const routes: Routes = [
  {
    path: '',
    component: ProfileScreenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileScreenPageRoutingModule {}
