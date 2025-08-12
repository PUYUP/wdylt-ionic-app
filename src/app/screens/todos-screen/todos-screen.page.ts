import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SimpleCalendarComponent } from 'src/app/shared/components/simple-calendar/simple-calendar.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-todos-screen',
  templateUrl: './todos-screen.page.html',
  styleUrls: ['./todos-screen.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    SimpleCalendarComponent,
    NgStyle,
  ]
})
export class TodosScreenPage implements OnInit {

  private filter: { 
    user_id: string, 
    from_page: number, 
    to_page: number,
    lt_date: string,
    gt_date: string,
  } = {
    user_id: '',
    from_page: 0,
    to_page: environment.queryPerPage,
    lt_date: '',
    gt_date: '',
  };

  weekRangeLabel: string = '';
  ltDate: string = '';
  gtDate: string = '';

  constructor() { }

  ngOnInit() {
  }

  /**
   * Get the week range label
   */
  getWeekRangeLabel(label: string) {
    this.weekRangeLabel = label;
    this.filter = {
      ...this.filter,
      from_page: 0,
      to_page: environment.queryPerPage,
    }
  }

  /**
   * Get calendar result
   */
  getWeekDataResult(data: string) {
    const toJson = JSON.parse(data);
    this.ltDate = toJson.formatted[0];
    this.gtDate = toJson.formatted[toJson.formatted.length - 1];

    this.filter = {
      ...this.filter,
      lt_date: this.ltDate,
      gt_date: this.gtDate,
      from_page: 0,
      to_page: environment.queryPerPage,
    }
  }

}
