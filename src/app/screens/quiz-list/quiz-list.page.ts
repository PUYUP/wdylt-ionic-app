import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-quiz-list',
  templateUrl: './quiz-list.page.html',
  styleUrls: ['./quiz-list.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
  ]
})
export class QuizListPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
