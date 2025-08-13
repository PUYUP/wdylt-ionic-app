import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { EntryFormComponent } from '../entry-form/entry-form.component';
import { SupabaseService } from '../../services/supabase.service';
import { GlobalState } from '../../state/reducers/app.reducer';
import { Store } from '@ngrx/store';
import { AppActions } from '../../state/actions/app.actions';
import { Actions } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { INote } from '../../models';

@Component({
  selector: 'app-write-note-dialog',
  templateUrl: './write-note-dialog.component.html',
  styleUrls: ['./write-note-dialog.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    EntryFormComponent,
  ]
})
export class WriteNoteDialogComponent  implements OnInit {

  @Input('data') data: any;
  @Input('source') source: string | null = null;
  
  content: WritableSignal<string> = signal('');
  isRecording: WritableSignal<boolean> = signal(false);
  recordingData: WritableSignal<any> = signal(null);
  uploadedData: WritableSignal<any> = signal(null);
  transcriptionStatus: WritableSignal<any> = signal(null);

  // get value from signal
  getContent = computed(() => this.content());
  getIsRecording = computed(() => this.isRecording());
  getRecordingData = computed(() => this.recordingData());
  getUploadedData = computed(() => this.uploadedData());
  getTranscriptionStatus = computed(() => this.transcriptionStatus());

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
    private actions$: Actions,
  ) { 
    this.actions$.pipe(takeUntilDestroyed()).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.createNoteSuccess.type:
        case AppActions.updateNoteSuccess.type:
          this.modalCtrl.dismiss();
          break;
      }
    });
  }

  ngOnInit() {
    if (this.data) {
      this.content.set(this.data.content);
      this.uploadedData.set(this.data.content_data);
    }
  }

  /**
   * Input text changed
   */
  onInputChangeListener(event: any) {
    this.content.set(event.detail.value);
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

    if (!this.getContent() || this.getContent().trim() === '') {
      console.error('No content found');
      return;
    }

    const user = session?.user;
    let payload: INote = {
      user: user.id,
      content: this.getContent(),
      content_data: this.getUploadedData(),
    }

    if (this.data) {
      // edit handler
      this.store.dispatch(AppActions.updateNote({
        id: this.data.id,
        data: payload,
        source: this.source,
      }));
    } else {
      // create handler
      this.store.dispatch(AppActions.createNote({
        data: payload,
        source: this.source,
      }));
    }
  }

  onClose() {
    this.modalCtrl.dismiss();
  }

}
