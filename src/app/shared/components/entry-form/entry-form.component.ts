import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Directory } from '@capacitor/filesystem';
import { IonicModule, ModalController } from '@ionic/angular';
import { Base64String, CurrentRecordingStatus, RecordingData, RecordingOptions, RecordingStatus, VoiceRecorder } from 'capacitor-voice-recorder';
import { RecordingTimerComponent } from '../recording-timer/recording-timer.component';
import { TimeInterface } from 'angular-cd-timer';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
  ]
})
export class EntryFormComponent  implements OnInit {

  @Input('placeholder') placeholder: string = 'Want to learn today?';
  @Input('data') data: any | null = null;
  
  @Output() onTextChange: EventEmitter<any | null> = new EventEmitter<any | null>();
  @Output() onRecordStop: EventEmitter<any | null> = new EventEmitter<any | null>();
  @Output() onRecording: EventEmitter<any | null> = new EventEmitter<any | null>();

  isRecording: boolean = false;
  maxLength: number = 144;
  currentRecordingData: {
    mimeType: string;
    msDuration: number;
    path?: string;
    recordDataBase64?: Base64String;
  } | null = null;
  timerData: TimeInterface | null = null;
  goalText: string | null = null;

  constructor(
    private modalCtrl: ModalController,
  ) { }

  /**
   * Recording timer modal.
   */
  async openRecordingTimerModal() {
    const modal = await this.modalCtrl.create({
      component: RecordingTimerComponent,
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
      this.goalText = this.data.lessons.description || null;
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
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
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
    }
    else {
      this.stopRecording();
    }
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
    VoiceRecorder.stopRecording().then((result: RecordingData) => {
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

}
