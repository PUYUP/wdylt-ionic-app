import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IdentifyScreenPageRoutingModule } from './identify-screen-routing.module';

import { IdentifyScreenPage } from './identify-screen.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IdentifyScreenPageRoutingModule,
    IdentifyScreenPage,
  ],
})
export class IdentifyScreenPageModule {}
