import { AsyncPipe, CommonModule, DatePipe, NgStyle } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, InfiniteScrollCustomEvent, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrollments } from 'src/app/shared/state/selectors/app.selectors';
import { TimeDifferenceInMinutesPipe } from "../../shared/pipes/time-difference-in-minutes.pipe";
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { SimpleCalendarComponent } from 'src/app/shared/components/simple-calendar/simple-calendar.component';
import { Actions } from '@ngrx/effects';
import { endOfDay, startOfDay } from 'date-fns';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.page.html',
  styleUrls: ['./archive.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    AsyncPipe,
    DatePipe,
    NgStyle,
    TimeDifferenceInMinutesPipe,
    SimpleCalendarComponent,
  ]
})
export class ArchivePage implements OnInit {

  @ViewChild(SimpleCalendarComponent) simpleCalendar!: SimpleCalendarComponent;

  public infiniteEvent: InfiniteScrollCustomEvent | null = null;
  public enrolledLessons$: Observable<any>;
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
  refreshEvent: RefresherCustomEvent | null = null;
  weekRangeLabel: string = '';
  ltDate: string = '';
  gtDate: string = '';
  onDestroy$ = new Subject<boolean>();
  public haveMoreData: boolean = false;

  constructor(
    private store: Store<GlobalState>,
    private supabaseService: SupabaseService,
    private router: Router,
    private actions$: Actions,
    private alertCtrl: AlertController,
  ) { 
    this.enrolledLessons$ = this.store.pipe(select(selectEnrollments));
    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.getEnrollmentsSuccess.type:
          if (this.infiniteEvent) {
            this.infiniteEvent.target.complete();
            this.infiniteEvent = null;
          }

          if (this.refreshEvent) {
            this.refreshEvent.target.complete();
            this.refreshEvent = null;
          }

          if (action.data.length > environment.queryPerPage) {
            this.haveMoreData = true;
          } else {
            this.haveMoreData = false;
          }
          break;
      }
    });
  }

  ngOnInit() {
    this.getEnrollments();
  }

  /**
   * Get enrolled lessons
   */
  async getEnrollments() {
    const session = await this.supabaseService.session();
    if (session) {
      this.filter = {
        ...this.filter,
        user_id: session.user.id,
      }

      this.store.dispatch(AppActions.getEnrollments({
        filter: this.filter,
      }));
    }
  }

  /**
   * On see quizs button click, navigate to the quizs page.
   */
  onStartQuiz(enrolled: any, type: 'mcq' | 'essay') {
    const status = enrolled.status;
    console.log('Enrolled lesson status:', status);

    if (status === 'in_progress') {
      this.startQuizNow(enrolled, type);
    } else if (status === 'waiting_answer' || status === 'completed') {
      this.router.navigate(['/quiz-' + type], {
        queryParams: {
          lessonId: enrolled.lesson.id,
          enrolledId: enrolled.id,
          attemptId: enrolled.attempts?.length > 0 ? enrolled.attempts[enrolled.attempts.length - 1].id : null,
        },
      });
    }
  }

  /**
   * Load more enrolled lessons when the user scrolls down.
   */
  onIonInfinite(event: InfiniteScrollCustomEvent) {
    this.infiniteEvent = event;
    this.filter = {
      ...this.filter,
      from_page: this.filter.from_page + environment.queryPerPage,
      to_page: this.filter.to_page + environment.queryPerPage,
    }

    console.log('Loading more enrolled lessons:', this.filter);
    this.store.dispatch(AppActions.getEnrollments({
      filter: this.filter,
      metadata: {
        isLoadMore: true,
      }
    }));
  }

  /**
   * Answer now alert
   */
  async startQuizNow(enrolled: any, type: 'mcq' | 'essay') {
    const alert = await this.alertCtrl.create({
      header: 'Answer Quizs',
      message: 'You still have much time, so you can start the quiz now or later.',
      buttons: [
        {
          text: 'Later',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Start Quiz Now',
          handler: () => {
            this.store.dispatch(AppActions.updateEnrollment({
              id: enrolled.id,
              data: {
                status: 'waiting_answer',
                updated_at: new Date().toISOString(),
                start_datetime: new Date().toISOString(),
              },
              metadata: {
                quizType: type,
              },
              source: 'answer-now-alert',
            }));
          }
        }
      ]
    });

    await alert.present();
  }

  /** Refresh the enrolled lessons */
  onRefresh() {
    this.filter = {
      ...this.filter,
      from_page: 0,
      to_page: environment.queryPerPage,
    }

    this.getEnrollments();
  }

  /**
   * Handle pull to refresh
   */
  handleRefresh(event: RefresherCustomEvent) {
    this.refreshEvent = event;
    this.filter = {
      ...this.filter,
      from_page: 0,
      to_page: environment.queryPerPage,
    }

    this.getEnrollments();
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
   * Get the current week
   */
  getCurrentWeek() {
    this.simpleCalendar.navigateToCurrentWeek();
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

    this.getEnrollments();
  }

  /**
   * Day clicked
   */
  onDayClicked(day: Date) {
    console.log('Day clicked:', day);
    const start = startOfDay(day);
    const end = endOfDay(day);
    
    this.filter = {
      ...this.filter,
      lt_date: start.toDateString(),
      gt_date: end.toDateString(),
      from_page: 0,
      to_page: environment.queryPerPage,
    }

    this.store.dispatch(AppActions.getEnrollments({ filter: this.filter }));
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

}
