import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, Input, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { Base64String, CurrentRecordingStatus, RecordingData, RecordingOptions, RecordingStatus, VoiceRecorder } from 'capacitor-voice-recorder';
import { RecordingTimerComponent } from '../recording-timer/recording-timer.component';
import { CdTimerComponent, CdTimerModule, TimeInterface } from 'angular-cd-timer';
import { FormsModule } from '@angular/forms';
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { msToAudioDuration } from '../../helpers';
import { AppActions } from '../../state/actions/app.actions';
import { Store } from '@ngrx/store';
import { GlobalState } from '../../state/reducers/app.reducer';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { Actions } from '@ngrx/effects';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    CdTimerModule,
    AsyncPipe,
  ]
})
export class EntryFormComponent  implements OnInit {

  @Input('placeholder') placeholder: string = 'Want to learn today?';
  @Input('data') data: any | null = null;
  
  @Output() onTextChange: EventEmitter<any | null> = new EventEmitter<any | null>();
  @Output() onRecordStop: EventEmitter<any | null> = new EventEmitter<any | null>();
  @Output() onRecording: EventEmitter<any | null> = new EventEmitter<any | null>();
  @Output() onRecordingUploaded: EventEmitter<any | null> = new EventEmitter<any | null>();
  @Output() onTranscriptionProcessing: EventEmitter<any | null> = new EventEmitter<any | null>();

  @ViewChild('audioTimer') audioTimer!: CdTimerComponent;

  audioUrl: WritableSignal<string | null> = signal<string | null>(null);
  transcriptionStatus: WritableSignal<string | null> = signal<string | null>(null);

  getAudioUrl = computed(() => this.audioUrl());
  getTranscriptionStatus = computed(() => this.transcriptionStatus());

  isRecording: boolean = false;
  maxLength: number = 500;
  currentRecordingData: {
    mimeType: string;
    msDuration: number;
    path?: string;
    recordDataBase64?: Base64String;
  } | null = null;
  timerData: TimeInterface | null = null;
  goalText: string | null = null;
  audioAssetId: string = 'recording';
  nativeAudio: NativeAudio | null = null;
  duration: string = '00:00';
  isPlaying: boolean = false;
  progressLength: number = 0;
  processingVoiceToText$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  onDestroy$ = new Subject<boolean>();

  constructor(
    private modalCtrl: ModalController,
    private store: Store<GlobalState>,
    private actions$: Actions,
  ) { 
    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.uploadAudioSuccess.type:
          console.log('Audio uploaded successfully:', action.data);
          this.onRecordingUploaded.emit({
            detail: {
              value: action.data,
            }
          });

          // transcribe audio
          this.store.dispatch(AppActions.transcribeAudio({
            // gcsUri: 'gs://wdylt-website.firebasestorage.app/audios/test-audio-1.mp3'
            gcsUri: action.data.storageLocation,
          }));
          break;
        
        case AppActions.transcribeAudioSuccess.type:
          this.goalText = action.data.transcript;
          this.onTextChange.emit({ detail: { value: this.goalText } });
          this.processingVoiceToText$.next(false);
          this.onTranscriptionProcessing.emit({ detail: { value: 'DONE' } });
          this.transcriptionStatus.set('DONE');
          break;
        
        case AppActions.transcribeAudioFailure.type:
          this.onTextChange.emit({ detail: { value: null } });
          this.processingVoiceToText$.next(false);
          this.onTranscriptionProcessing.emit({ detail: { value: 'DONE' } });
          this.transcriptionStatus.set('DONE');
          break;
      }
    });
  }

  /**
   * Recording timer modal.
   */
  async openRecordingTimerModal() {
    const modal = await this.modalCtrl.create({
      component: RecordingTimerComponent,
      backdropDismiss: false,
    });

    modal.onDidDismiss().then(({ data }) => {
      if (data.timer) {
        this.timerData = data.timer;
        console.log('Timer data:', this.timerData);
        this.stopRecording();
      }
    });

    await modal.present();
    this.startRecording();
  }

  ngOnInit() { 
    if (this.data) {
      // fill the form with data
      this.goalText = this.data.lesson.description || null;
    }
  }

  /**
   * Event from textarea input.
   * @param event - The input event.
   */
  onGoalInput(event: any) {
    const value = event.target.value;
    this.onTextChange.emit({
      detail: {
        value: value,
      }
    });
  }

  /**
   * Start or stop recording the goal.
   */
  async onRecord() {
    // check if the device can record audio
    const canRecord = await this.canDeviceRecordAudio();
    if (!canRecord) {
      console.error('Device cannot record audio');
      return;
    }

    // request permission to record audio
    const permissionGranted = await this.requestAudioRecordingPermission();
    if (!permissionGranted) {
      console.error('Audio recording permission denied');
      return;
    }

    // has the user granted permission to record audio?
    const hasPermission = await this.hasAudioRecordingPermission();
    if (!hasPermission) {
      console.error('Audio recording permission denied');
      return;
    }

    // check current recording status
    const status = await this.getRecordingStatus();
    if (status === RecordingStatus.RECORDING) {
      console.warn('Already recording');
      return;
    }

    if (status === RecordingStatus.PAUSED) {
      // If paused, resume recording
      VoiceRecorder.resumeRecording().then((result) => {
        console.log('Recording resumed:', result);
      }).catch((error) => {
        console.error('Error resuming recording:', error);
      });
      return;
    }

    await this.openRecordingTimerModal();
    this.isRecording = !this.isRecording;
  }

  /**
   * Check device can record audio.
   */
  async canDeviceRecordAudio(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      VoiceRecorder.canDeviceVoiceRecord().then((result) => {
        console.log('Device can record audio:', result);
        resolve(result.value);
      }).catch((error) => {
        console.error('Error checking if device can record audio:', error);
        reject(error);
      });
    });
  }

  /**
   * Request permission to record audio.
   */
  async requestAudioRecordingPermission(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      VoiceRecorder.requestAudioRecordingPermission().then((result) => {
        console.log('Audio recording permission granted:', result);
        resolve(result.value);
      }).catch((error) => {
        console.error('Error requesting audio recording permission:', error);
        reject(error);
      });
    });
  }

  /**
   * Has the user granted permission to record audio?
   */
  async hasAudioRecordingPermission(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      VoiceRecorder.hasAudioRecordingPermission().then((result) => {
        console.log('Has audio recording permission:', result);
        resolve(result.value);
      }).catch((error) => {
        console.error('Error checking audio recording permission:', error);
        reject(error);
      });
    });
  }

  /**
   * Get current recording status.
   */
  async getRecordingStatus(): Promise<string> {
    return new Promise((resolve, reject) => {
      VoiceRecorder.getCurrentStatus().then((result: CurrentRecordingStatus) => {
        console.log('Current recording status:', result);
        resolve(result.status);
      }).catch((error) => {
        console.error('Error getting recording status:', error);
        reject(error);
      });
    });
  }

  stopRecording() {
    // Stop recording
    VoiceRecorder.stopRecording().then(async (result: RecordingData) => {
      console.log('Recording stopped:', result);
      // Save the recording data
      this.currentRecordingData = result.value;
      this.isRecording = false;

      this.onRecordStop.emit({
        detail: {
          value: this.currentRecordingData,
        }
      });

      this.onRecording.emit({
        detail: {
          value: this.isRecording
        }
      });

      console.log('Recording stopped:', this.currentRecordingData);
      
      const audioUrl = await this.getBlobURL(this.currentRecordingData.path as string);
      this.audioUrl.set(audioUrl);

      console.log('Audio URL:', this.getAudioUrl());

      this.prepareAudio(this.getAudioUrl() as string);
      this.duration = msToAudioDuration(this.currentRecordingData.msDuration);

      // Upload to firestore
      this.store.dispatch(AppActions.uploadAudio({ fileData: result }));
      this.processingVoiceToText$.next(true);
      this.onTranscriptionProcessing.emit({ detail: { value: 'ON_PROGRESS' } });
      this.transcriptionStatus.set('ON_PROGRESS');
    }).catch((error) => {
      console.error('Error stopping recording:', error);
    });
  }

  startRecording() {
    // Start recording
    const options: RecordingOptions = {
      directory: Directory.Data,
    }
    
    VoiceRecorder.startRecording(options).then((result) => {
      console.log('Recording started:', result);
      this.isRecording = true;
      this.onRecording.emit({
        detail: {
          value: this.isRecording
        }
      });
    }).catch((error) => {
      console.error('Error starting recording:', error);
    });
  }

  /** Generate a URL to the blob file with @capacitor/core and @capacitor/filesystem */
  async getBlobURL(path: any) {
    const directory = Directory.Data // Same Directory as the one you used with VoiceRecorder.startRecording

    if (Capacitor.getPlatform() === 'web') {
      const { data } = await Filesystem.readFile({ directory, path });
      return URL.createObjectURL(data as Blob)
    }

    const { uri } = await Filesystem.getUri({ directory, path })
    return uri;
  }

  async prepareAudio(path: string) {
    await NativeAudio.preload({
      assetId: this.audioAssetId,
      assetPath: path,
      audioChannelNum: 1,
      isUrl: true,
    });
  }

  async playAudio() {
    this.isPlaying = !this.isPlaying;

    await NativeAudio.play({
      assetId: this.audioAssetId
    });

    // get timer element
    if (this.audioTimer) {
      this.audioTimer.start();
    }
  }

  async stopAudio() {
    if (this.isPlaying) {
      this.progressLength = 0;
      await NativeAudio.stop({ assetId: this.audioAssetId });
    }

    // get timer element
    if (this.audioTimer) {
      this.audioTimer.stop();
    }

    this.isPlaying = false;
  }

  /**
   * Timer is tick
   */
  onAudioTimerTick(event: TimeInterface) {
    const seconds = event.seconds;
    if (this.currentRecordingData) {
      const percentage = 100 - ((seconds / (this.currentRecordingData.msDuration / 1000)) * 100);
      this.progressLength = percentage;
    }
  }

  /**
   * Timer complete
   */
  onAudioTimerComplete(event: CdTimerComponent) {
    setTimeout(() => {
      this.stopAudio();
    }, 1000);
  }

  /**
   * Clear audio
   */
  clearAudio() {
    this.currentRecordingData = null;
    this.isPlaying = false;
    this.progressLength = 0;
    this.goalText = null;

    this.onRecordingUploaded.emit({
      detail: {
        value: null,
      }
    });

    this.onRecordStop.emit({
      detail: {
        value: null,
      }
    });
  }

  ngOnDestroy() {
    this.processingVoiceToText$.complete();
    this.goalText = null;
    this.onDestroy$.next(true);
    this.onDestroy$.complete();

    if (this.getAudioUrl() != '') {
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(this.getAudioUrl() as string);
    }
    
    this.stopAudio();
    NativeAudio.unload({ assetId: this.audioAssetId });
  }

}
