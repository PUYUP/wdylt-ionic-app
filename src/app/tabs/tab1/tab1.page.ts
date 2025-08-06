import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, IonicModule, ModalController } from '@ionic/angular';
import { ActionsSubject, select, Store } from '@ngrx/store';
import { Base64String } from 'capacitor-voice-recorder';
import { differenceInMinutes, endOfDay, startOfDay } from 'date-fns';
import { Observable } from 'rxjs';
import { EntryDialogComponent } from 'src/app/shared/components/entry-dialog/entry-dialog.component';
import { EntryFormComponent } from 'src/app/shared/components/entry-form/entry-form.component';
import { EntryTimeComponent } from 'src/app/shared/components/entry-time/entry-time.component';
import { ProgressCardComponent } from 'src/app/shared/components/progress-card/progress-card.component';
import { TimeDifferenceInMinutesPipe } from 'src/app/shared/pipes/time-difference-in-minutes.pipe';
import { UctToLocalTimePipe } from 'src/app/shared/pipes/uct-to-local-time.pipe';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectLatestEnrolledLessons } from 'src/app/shared/state/selectors/app.selectors';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    ProgressCardComponent,
    AsyncPipe,
    EntryFormComponent,
    EntryTimeComponent,
    UctToLocalTimePipe,
    TimeDifferenceInMinutesPipe,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class Tab1Page implements OnInit {

  @ViewChild(ProgressCardComponent, { static: false }) progressCard!: ProgressCardComponent;
  
  public startDatetime: Date = new Date('2025-07-30T08:00:00');
  public targetCompletionDatetime: Date = new Date('2025-07-30T22:00:00');
  public learnDurationInMinutes: number = 0;
  public latestEnrolledLessons$: Observable<{ data: any, isLoading: boolean, error: any }>;
  public isRecording: boolean = false;
  currentRecordingData: {
    mimeType: string;
    msDuration: number;
    path?: string;
    recordDataBase64?: Base64String;
  } | null = null;
  hourSelected: string | null = null;
  goalText: string | null = null;
  user$: Promise<any> = this.supabaseService.getUser();
  latestEnrolledLessons: any[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
    private router: Router,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private actionsSubject$: ActionsSubject,
  ) {
    this.latestEnrolledLessons$ = this.store.pipe(select(selectLatestEnrolledLessons));
    this.actionsSubject$.pipe(takeUntilDestroyed()).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.updateEnrolledLessonSuccess.type:
          break;
        
        case AppActions.getLatestEnrolledLessonsSuccess.type:
          this.latestEnrolledLessons = action.data;
          break;
      }
    });
  }

  /**
   * Open action sheet
   */
  async openActionSheet(enrolled: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Actions',
      buttons: [
        {
          text: 'Edit',
          icon: 'pencil',
          handler: () => {
            this.onEdit(enrolled);
          }
        },
        {
          text: 'Mark as Completed',
          icon: 'checkmark-done',
          handler: () => {
            if (enrolled.status !== 'completed') {
              this.store.dispatch(AppActions.updateEnrolledLesson({
                id: enrolled.id,
                data: {
                  status: 'completed',
                  updated_at: new Date().toISOString(),
                }
              }));
            }
          }
        },
        {
          text: 'Delete',
          icon: 'trash',
          handler: () => {
            this.store.dispatch(AppActions.deleteEnrolledLesson({
              id: enrolled.id,
            }));
          }
        },
        {
          text: 'Cancel Action',
          role: 'cancel',
          icon: 'close',
          data: {
            action: 'cancel',
          },
        },
      ]
    });
    
    await actionSheet.present();
  }

  /**
   * Answer now alert
   */
  async anwerNowAlert(enrolled: any) {
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
              },
              source: 'answer-now-alert'
            }));
          }
        }
      ]
    });

    await alert.present();
  }

  ngOnInit(): void {
    this.learnDurationInMinutes = differenceInMinutes(this.targetCompletionDatetime, this.startDatetime);
    this.getLatestEnrolledLessons();
  }

  onSignOut() {
    this.supabaseService.signOut().then(() => {
      console.log('User signed out successfully');
      this.router.navigate(['/onboarding']);
    }).catch(error => {
      console.error('Error signing out:', error);
    });
  }

  async getLatestEnrolledLessons() {
    const today = new Date();
    const midnight = endOfDay(today);
    const start = startOfDay(today);
    const { data } = await this.supabaseService.getUser();

    if (data) {
      this.store.dispatch(AppActions.getLatestEnrolledLessons({ 
        filter: { 
          user_id: data?.user?.id as string, 
          start_datetime: start.toISOString(),
          target_completion_datetime: midnight.toISOString(),
        }
      }));
    }
  }

  /**
   * On start quiz button click, navigate to the quiz page.
   */
  onStartQuiz(enrolled: any) {
    const status = enrolled.status;

    if (status === 'in_progress') {
      this.anwerNowAlert(enrolled);
    } else if (status === 'waiting_answer') {
      this.router.navigate(['/quiz'], {
        queryParams: {
          lessonId: enrolled.lesson.id,
          enrolledId: enrolled.id,
        },
      });
    }
  }

  /**
   * On edit
   */
  async onEdit(enrolled: any) {
    // if (enrolled.status !== 'in_progress') {
    //   console.warn('Cannot edit lesson that is not in progress');
    //   return;
    // }

    const modal = await this.modalCtrl.create({
      component: EntryDialogComponent,
      componentProps: {
        data: enrolled,
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Modal data:', data);
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

  onTimerCompleteListener(event: any) {
    console.log('Timer complete event:', event);

    if (this.latestEnrolledLessons.length > 0) {
      const enrolled = this.latestEnrolledLessons[0];
      if (enrolled.status === 'in_progress') {
        this.store.dispatch(AppActions.updateEnrolledLesson({
          id: enrolled.id,
          data: {
            status: 'waiting_answer',
            updated_at: new Date().toISOString(),
          }
        }));
      }
    }
  }

}
  