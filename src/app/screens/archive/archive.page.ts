import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AlertController, InfiniteScrollCustomEvent, IonicModule } from '@ionic/angular';
import { ActionsSubject, select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrolledLessons } from 'src/app/shared/state/selectors/app.selectors';
import { TimeDifferenceInMinutesPipe } from "../../shared/pipes/time-difference-in-minutes.pipe";
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.page.html',
  styleUrls: ['./archive.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    AsyncPipe,
    JsonPipe,
    TimeDifferenceInMinutesPipe
]
})
export class ArchivePage implements OnInit {

  public infiniteEvent: InfiniteScrollCustomEvent | null = null;
  public enrolledLessons$: Observable<any>;
  private filter: { user_id: string, from_page: number, to_page: number } = {
    user_id: '',
    from_page: 0,
    to_page: environment.queryPerPage,
  };

  constructor(
    private store: Store<GlobalState>,
    private supabaseService: SupabaseService,
    private router: Router,
    private actionsSubject$: ActionsSubject,
    private alertCtrl: AlertController,
  ) { 
    this.enrolledLessons$ = this.store.pipe(select(selectEnrolledLessons));
    this.actionsSubject$.pipe(takeUntilDestroyed()).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.getEnrolledLessonsSuccess.type:
          if (this.infiniteEvent) {
            this.infiniteEvent.target.complete();
            this.infiniteEvent = null;
          }
          break;
      }
    });
  }

  ngOnInit() {
    this.getEnrolledLessons();
  }

  /**
   * Get enrolled lessons
   */
  async getEnrolledLessons() {
    const session = await this.supabaseService.session();
    if (session) {
      this.filter = {
        ...this.filter,
        user_id: session.user.id,
      }

      this.store.dispatch(AppActions.getEnrolledLessons({
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
    this.store.dispatch(AppActions.getEnrolledLessons({
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
            this.store.dispatch(AppActions.updateEnrolledLesson({
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

}
