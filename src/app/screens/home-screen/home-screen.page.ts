import { AsyncPipe, CommonModule, NgStyle } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonicModule, ModalController, RefresherCustomEvent } from '@ionic/angular';
import { Actions } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { Base64String } from 'capacitor-voice-recorder';
import { differenceInMinutes, endOfDay, startOfDay } from 'date-fns';
import { firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
import { EntryDialogComponent } from 'src/app/shared/components/entry-dialog/entry-dialog.component';
import { EntryFormComponent } from 'src/app/shared/components/entry-form/entry-form.component';
import { EntryTimeComponent } from 'src/app/shared/components/entry-time/entry-time.component';
import { LearnCardComponent } from 'src/app/shared/components/learn-card/learn-card.component';
import { ProgressCardComponent } from 'src/app/shared/components/progress-card/progress-card.component';
import { WriteNoteDialogComponent } from 'src/app/shared/components/write-note-dialog/write-note-dialog.component';
import { WriteTodoDialogComponent } from 'src/app/shared/components/write-todo-dialog/write-todo-dialog.component';
import { canDismissDialog } from 'src/app/shared/helpers';
import { UctToLocalTimePipe } from 'src/app/shared/pipes/uct-to-local-time.pipe';
import { EntryFormService } from 'src/app/shared/services/entry-form.service';
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
    ProgressCardComponent,
    NgStyle,
    UctToLocalTimePipe,
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
  refreshEvent: RefresherCustomEvent | null = null;
  uploadedData: any | null = null;
  transcriptionStatus: string | null = null;
  onDestroy$ = new Subject<boolean>();

  constructor(
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
    private modalCtrl: ModalController,
    private actions$: Actions,
    private entryFormService: EntryFormService,
    private alertController: AlertController,
  ) {
    this.latestEnrollments$ = this.store.pipe(select(selectLatestEnrollments));
    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.getLatestEnrollmentsSuccess.type:
          if (this.refreshEvent) {
            this.refreshEvent.target.complete();
            this.refreshEvent = null;
          }
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
  onInputChangeListener(event: any) {
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
    let payload: any = {
      description: this.goalText,
      content_type: 'text',
      user: userId,
    }

    if (this.uploadedData) {
      payload = {
        ...payload,
        content_data: this.uploadedData,
      }
    }

    this.store.dispatch(AppActions.createLesson({
      data: payload,
      metadata: {
        enrollment: {
          goalHour: this.hourSelected,
        }
      },
      source: 'homepage'
    }));
  }

  /**
   * Handle pull to refresh
   */
  handleRefresh(event: RefresherCustomEvent) {
    this.refreshEvent = event;
    this.getLatestEnrollments();
  }

  /**
   * On recording uploaded
   */
  onRecordingUploadedListener(event: any) {
    this.uploadedData = event.detail.value;
  }

  /**
   * On transcription processing
   */
  onTranscriptionProcessingListener(event: any) {
    const status = event.detail.value;
    this.transcriptionStatus = status;
  }

  /**
   * Add new learn
   */
  async onAddNewLearn() {
    const modal = await this.modalCtrl.create({
      component: EntryDialogComponent,
      backdropDismiss: true,
      canDismiss: async (data?: any, role?: string) => {
        const { content, recordedData, uploadedRecordedData } = await firstValueFrom(this.entryFormService.state$);
        if ((content && content.trim() !== '') || recordedData || uploadedRecordedData) {
          const canDismiss = await canDismissDialog();
          if (canDismiss) {
            this.entryFormService.resetState();
            return true;
          }
          return false;
        }
        return true;
      },
      componentProps: {
        source: 'home',
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Modal data:', data);
    }
  }

  /**
   * Add todo dialog
   */
  async onAddTodo() {
    const modal = await this.modalCtrl.create({
      component: WriteTodoDialogComponent,
      backdropDismiss: true,
      canDismiss: async (data?: any, role?: string) => {
        const { content, recordedData, uploadedRecordedData } = await firstValueFrom(this.entryFormService.state$);
        if ((content && content.trim() !== '') || recordedData || uploadedRecordedData) {
          const canDismiss = await canDismissDialog();
          if (canDismiss) {
            this.entryFormService.resetState();
            return true;
          }
          return false;
        }
        return true;
      },
      componentProps: {
        source: 'home',
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Modal data:', data);
    }
  }

  /**
   * Add note dialog
   */
  async onAddNote() {
    const modal = await this.modalCtrl.create({
      component: WriteNoteDialogComponent,
      backdropDismiss: true,
      canDismiss: async (data?: any, role?: string) => {
        const { content, recordedData, uploadedRecordedData } = await firstValueFrom(this.entryFormService.state$);
        if ((content && content.trim() !== '') || recordedData || uploadedRecordedData) {
          const canDismiss = await canDismissDialog();
          if (canDismiss) {
            this.entryFormService.resetState();
            return true;
          }
          return false;
        }
        return true;
      },
      componentProps: {
        source: 'home',
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Modal data:', data);
    }
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

}
  