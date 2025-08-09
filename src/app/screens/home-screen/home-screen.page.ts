import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { ActionsSubject, select, Store } from '@ngrx/store';
import { Base64String } from 'capacitor-voice-recorder';
import { differenceInMinutes, endOfDay, startOfDay } from 'date-fns';
import { Observable } from 'rxjs';
import { EntryFormComponent } from 'src/app/shared/components/entry-form/entry-form.component';
import { EntryTimeComponent } from 'src/app/shared/components/entry-time/entry-time.component';
import { LearnCardComponent } from 'src/app/shared/components/learn-card/learn-card.component';
import { ProgressCardComponent } from 'src/app/shared/components/progress-card/progress-card.component';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectLatestEnrollments } from 'src/app/shared/state/selectors/app.selectors';

@Component({
  selector: 'app-home-screen',
  templateUrl: 'home-screen.page.html',
  styleUrls: ['home-screen.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    AsyncPipe,
    EntryFormComponent,
    EntryTimeComponent,
    LearnCardComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class HomeScreenPage implements OnInit {

  @ViewChild(ProgressCardComponent, { static: false }) progressCard!: ProgressCardComponent;
  
  public startDatetime: Date = new Date('2025-07-30T08:00:00');
  public targetCompletionDatetime: Date = new Date('2025-07-30T22:00:00');
  public learnDurationInMinutes: number = 0;
  public latestEnrollments$: Observable<{ data: any, isLoading: boolean, error: any }>;
  public isRecording: boolean = false;
  currentRecordingData: {
    mimeType: string;
    msDuration: number;
    path?: string;
    recordDataBase64?: Base64String;
  } | null = null;
  hourSelected: string | null = null;
  goalText: string | null = null;
  session$: Promise<any> = this.supabaseService.session();

  constructor(
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
    private actionsSubject$: ActionsSubject,
  ) {
    this.latestEnrollments$ = this.store.pipe(select(selectLatestEnrollments));
    this.actionsSubject$.pipe(takeUntilDestroyed()).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.updateEnrollmentSuccess.type:
          break;
        
        case AppActions.getLatestEnrollmentsSuccess.type:
          break;
      }
    });
  }

  ngOnInit(): void {
    this.learnDurationInMinutes = differenceInMinutes(this.targetCompletionDatetime, this.startDatetime);
    this.getLatestEnrollments();
  }

  async getLatestEnrollments() {
    const today = new Date();
    const midnight = endOfDay(today);
    const start = startOfDay(today);
    const session = await this.supabaseService.session();

    if (session) {
      this.store.dispatch(AppActions.getLatestEnrollments({
        filter: {
          user_id: session.user.id as string,
          created_at: start.toISOString(),
          target_completion_datetime: midnight.toISOString(),
        }
      }));
    }
  }

  /**
   * On hour changed event.
   * @param event - The hour changed event.
   */
  onHourChangedListener(event: any) {
    this.hourSelected = event.data.value;
  }

  /**
   * Recording listeners.
   */
  onRecordingListener(event: any) {
    this.isRecording = event.detail.value;
  }

  /**
   * Listen for text change event.
   */
  onTextChangeListener(event: any) {
    this.goalText = event.detail.value;
  }

  /**
   * Record stop listener.
   */
  onRecordStopListener(event: any) {
    this.currentRecordingData = event.detail.value;
    this.isRecording = !this.isRecording;
  }

  /**
   * On start learning button click.
   */
  async onStartLearning(userId: string) {
    this.store.dispatch(AppActions.createLesson({
      data: {
        user: userId,
        content_type: 'text',
        description: this.goalText,
      },
      metadata: {
        enrollment: {
          goalHour: this.hourSelected,
        }
      },
      source: 'homepage'
    }));
  }

}
  