import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { Store } from '@ngrx/store';
import { GlobalState } from '../../state/reducers/app.reducer';
import { Actions } from '@ngrx/effects';
import { AppActions } from '../../state/actions/app.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ITodo } from '../../models';
import { EntryFormComponent } from '../entry-form/entry-form.component';
import { EntryFormService } from '../../services/entry-form.service';

@Component({
  selector: 'app-write-todo-dialog',
  templateUrl: './write-todo-dialog.component.html',
  styleUrls: ['./write-todo-dialog.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    EntryFormComponent,
  ]
})
export class WriteTodoDialogComponent  implements OnInit {

  @Input('data') data: any;
  @Input('lessonId') lessonId: number | null = null;
  @Input('source') source: string | null = null;
  
  title: WritableSignal<string> = signal('');
  isRecording: WritableSignal<boolean> = signal(false);
  recordingData: WritableSignal<any> = signal(null);
  uploadedData: WritableSignal<any> = signal(null);
  transcriptionStatus: WritableSignal<any> = signal(null);

  // get value from signal
  getTitle = computed(() => this.title());
  getIsRecording = computed(() => this.isRecording());
  getRecordingData = computed(() => this.recordingData());
  getUploadedData = computed(() => this.uploadedData());
  getTranscriptionStatus = computed(() => this.transcriptionStatus());

  constructor(
    private modalCtrl: ModalController,
    private supabaseService: SupabaseService,
    private entryFormService: EntryFormService,
    private store: Store<GlobalState>,
    private actions$: Actions,
  ) { 
    this.actions$.pipe(takeUntilDestroyed()).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.createTodoSuccess.type:
        case AppActions.updateTodoSuccess.type:
          this.modalCtrl.dismiss();
          break;
      }
    });
  }

  ngOnInit() {
    if (this.data) {
      this.title.set(this.data.title);
      this.uploadedData.set(this.data.content_data);
    }
  }

  /**
   * Input text changed
   */
  onInputChangeListener(event: any) {
    const value = event.detail.value;
    this.title.set(value);
  }

  /**
   * Recording listeners.
   */
  onRecordingListener(event: any) {
    this.isRecording.set(event.detail.value);
  }

  /**
   * Record stop listener.
   */
  onRecordStopListener(event: any) {
    this.recordingData.set(event.detail.value);
    this.isRecording.set(false);
  }

  /**
   * On recording uploaded
   */
  onRecordingUploadedListener(event: any) {
    this.uploadedData.set(event.detail.value);
  }

  /**
   * On transcription processing
   */
  onTranscriptionProcessingListener(event: any) {
    this.transcriptionStatus.set(event.detail.value);
  }

  async onSubmit() {
    const session = await this.supabaseService.session();
    if (!session) {
      console.error('No active session found');
      return;
    }

    if (!this.getTitle() || this.getTitle().trim() === '') {
      console.error('No title found');
      return;
    }

    const user = session?.user;
    let payload: ITodo = {
      user: user.id,
      title: this.getTitle(),
      priority: 'medium', // Default priority
      is_completed: false, // Default completion status
      content_data: this.getUploadedData() || null,
    }

    if (this.lessonId) {
      payload = {
        ...payload,
        lesson: this.lessonId,
      }
    }

    if (this.data) {
      // edit handler
      this.store.dispatch(AppActions.updateTodo({
        id: this.data.id,
        data: {
          ...payload,
          is_completed: this.data.is_completed,
        },
        source: this.source,
      }));
    } else {
      // create handler
      this.store.dispatch(AppActions.createTodo({
        data: payload,
        source: this.source,
      }));
    }
  }

  onClose() {
    this.modalCtrl.dismiss();
  }

}
