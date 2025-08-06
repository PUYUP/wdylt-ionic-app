import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { QuizMcqPageRoutingModule } from './quiz-mcq-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QuizMcqPageRoutingModule
  ],
})
export class QuizMcqPageModule {}
