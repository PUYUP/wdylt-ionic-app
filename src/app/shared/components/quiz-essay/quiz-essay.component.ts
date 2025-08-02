import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-quiz-essay',
  templateUrl: './quiz-essay.component.html',
  styleUrls: ['./quiz-essay.component.scss'],
})
export class QuizEssayComponent  implements OnInit {

  @Input('data') data: any | null = null;
  
  constructor() { }

  ngOnInit() {}

}
