import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { EntryFormComponent } from '../entry-form/entry-form.component';
import { EntryTimeComponent } from '../entry-time/entry-time.component';
import { Base64String } from 'capacitor-voice-recorder';
import { format, setHours, setMinutes, setSeconds } from 'date-fns';
import { Store } from '@ngrx/store';
import { GlobalState } from '../../state/reducers/app.reducer';
import { AppActions } from '../../state/actions/app.actions';
import { Observable, Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { Actions } from '@ngrx/effects';

@Component({
  selector: 'app-entry-dialog',
  templateUrl: './entry-dialog.component.html',
  styleUrls: ['./entry-dialog.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    EntryFormComponent,
    EntryTimeComponent,
  ]
})
export class EntryDialogComponent  implements OnInit {

  @Input('data') data: any | null = null;

  isRecording: boolean = false;
  goalText: string | null = null;
  currentRecordingData: {
    mimeType: string;
    msDuration: number;
    path?: string;
    recordDataBase64?: Base64String;
  } | null = null;
  hourSelected: string | null = null;
  updateLesson: Observable<{ data: any, isLoading: boolean, error: any }> | null = null;
  updateEnrollment: Observable<{ data: any, isLoading: boolean, error: any }> | null = null;
  uploadedData: any | null = null;
  transcriptionStatus: string | null = null;
  onDestroy$ = new Subject<boolean>();

  constructor(
    private modalCtrl: ModalController,
    private store: Store<GlobalState>,
    private actions$: Actions,
    private supabaseService: SupabaseService,
  ) { 
    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.updateLessonSuccess.type:
          const goalHours = this.hourSelected?.split(':');
          const currDate = new Date(this.data?.target_completion_datetime);
          const withNewHour = setHours(currDate, goalHours ? parseInt(goalHours[0], 10) : 0);
          const withNewMinutes = setMinutes(withNewHour, goalHours ? parseInt(goalHours[1], 10) : 0);
          const withNewSeconds = setSeconds(withNewMinutes, 0);

          this.store.dispatch(AppActions.updateEnrollment({
            id: this.data?.id,
            data: {
              target_completion_datetime: withNewSeconds.toISOString(),
            },
            source: 'edit',
          }))
          break;
        
        case AppActions.updateEnrollmentSuccess.type:
          this.modalCtrl.dismiss({
            data: action.data[0],
          });
          break;
      
        case AppActions.enrollLessonSuccess.type:
          this.modalCtrl.dismiss({
            data: action.data[0],
          });
          break;

        case AppActions.deleteEnrollmentSuccess.type:
          this.modalCtrl.dismiss({
            data: null,
          });
          break;
      }
    });
  }

  ngOnInit() {
    if (this.data) {
      this.goalText = this.data.lesson.description || null;
      this.hourSelected = format(this.data.target_completion_datetime, 'HH:mm');
    }
  }

  /**
   * Close modal.
   */
  closeModal() {
    this.modalCtrl.dismiss({
      data: null,
    });
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
   * Submit!
   */
  async onSubmit() {
    let payload: any = {
      description: this.goalText,
      content_type: 'text',
    }

    if (this.uploadedData) {
      payload = {
        ...payload,
        content_data: this.uploadedData,
      }
    }

    if (this.data) {
      // Dispatch update action
      this.store.dispatch(AppActions.updateLesson({
        id: this.data.lesson.id,
        data: {
          ...payload,
          content_type: 'audio/mpeg',
        },
      }));
    } else {
      // create new lesson
      const session = await this.supabaseService.session();
      
      this.store.dispatch(AppActions.createLesson({
        data: {
          ...payload,
          user: session?.user?.id,
        },
        metadata: {
          enrollment: {
            goalHour: this.hourSelected,
          }
        }
      }));
    }
  }

  /**
   * On delete
   */
  onDelete() {
    this.store.dispatch(AppActions.deleteEnrollment({
      id: this.data.id,
    }));
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

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

}
