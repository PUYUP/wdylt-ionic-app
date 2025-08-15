import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-lesson-detail',
  templateUrl: './lesson-detail.page.html',
  styleUrls: ['./lesson-detail.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LessonDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
