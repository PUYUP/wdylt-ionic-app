import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-write-goal',
  templateUrl: './write-goal.component.html',
  styleUrls: ['./write-goal.component.scss'],
  imports: [IonicModule, FormsModule, ReactiveFormsModule],
})
export class WriteGoalComponent  implements OnInit {

  goalText: string = '';
  
  constructor() { }

  ngOnInit() {}

}
