import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CdTimerComponent, CdTimerModule } from 'angular-cd-timer';
import { differenceInSeconds } from 'date-fns';
import { AppActions } from '../../state/actions/app.actions';
import { GlobalState } from '../../state/reducers/app.reducer';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-progress-card',
  templateUrl: './progress-card.component.html',
  styleUrls: ['./progress-card.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    CdTimerModule,
  ]
})
export class ProgressCardComponent  implements OnInit {

  @Output() onTimerComplete: EventEmitter<any> = new EventEmitter<any>();

  @Input('data') data: any | null = null;
  @Input('startDatetime') startDatetime: string = new Date('2025-07-30T08:00:00').toISOString();
  @Input('targetCompletionDatetime') targetCompletionDatetime: string = new Date('2025-07-30T22:00:00').toISOString();

  @ViewChild('cdTimer', { static: false }) cdTimer!: CdTimerComponent;
  
  secondsDifference: number = 0;
  totalDuration: number = 0;
  leftDuration: number = 0;
  percentageDuration: number = 0;
  isTimerComplete: boolean = false;

  animatedPercentage: number = 10; // Example percentage
  size: number = 220;
  strokeWidth = 18;
  radius = (this.size - this.strokeWidth) / 2;
  circumference = this.radius * 2 * Math.PI;
  strokeDasharray = this.circumference;
  strokeDashoffset = this.circumference - (this.animatedPercentage / 100) * this.circumference;
  currentGradient: any = {
    start: '#20C997',
    end: '#343A40',
  }

  constructor(
    private store: Store<GlobalState>,
  ) { }

  ngOnInit() { }

  ngOnChanges() {
    this.startDatetime = new Date(this.startDatetime).toISOString();
    this.targetCompletionDatetime = new Date(this.targetCompletionDatetime).toISOString();
    this.isTimerComplete = this.data?.status !== 'in_progress';
    this.buildProgress();
  }

  buildProgress() {
    this.totalDuration = differenceInSeconds(this.targetCompletionDatetime, this.startDatetime);
    this.secondsDifference = differenceInSeconds(this.targetCompletionDatetime, Date.now());
    this.leftDuration = this.totalDuration - this.secondsDifference;
    this.percentageDuration = 100 - ((this.leftDuration / this.totalDuration) * 100);
    this.animatedPercentage = this.percentageDuration;
    this.strokeDashoffset = this.circumference - (this.animatedPercentage / 100) * this.circumference;
  }

  onTick() {
    this.buildProgress();
  }

  onComplete() {
    this.isTimerComplete = true;
    this.onTimerComplete.emit({
      data: {
        value: 'complete',
      },
    });

    this.onTimerCompleteListener();
  }

  /**
   * Timer complete listener.
   */
  onTimerCompleteListener() {
    if (this.data) {
      if (this.data.status === 'in_progress') {
        this.store.dispatch(AppActions.updateEnrollment({
          id: this.data.id,
          data: {
            status: 'waiting_answer',
            updated_at: new Date().toISOString(),
            start_datetime: new Date().toISOString(),
          }
        }));
      }
    }
  }

}
