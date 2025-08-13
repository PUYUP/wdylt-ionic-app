import { Component, OnInit, ViewChild } from '@angular/core';
import { CdTimerComponent, CdTimerModule, TimeInterface } from 'angular-cd-timer';
import { IonicModule, ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recording-timer',
  templateUrl: './recording-timer.component.html',
  styleUrls: ['./recording-timer.component.scss'],
  imports: [IonicModule, CdTimerModule],
})
export class RecordingTimerComponent  implements OnInit {

  @ViewChild(CdTimerComponent, { static: true }) timer!: CdTimerComponent;

  maxDuration: number = environment.maxRecordingDuration;

  constructor(
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {}

  ionViewDidEnter() {
    // Start the timer when the component is fully initialized
    this.timer.start();
  }

  onFinish() {
    this.timer.stop();
  }

  onStop() {
    this.modalCtrl.dismiss({
      timer: this.timer.get(),
    });
  }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  onTick(event: TimeInterface) {
    const seconds = event.minutes * (60 + event.seconds);
    if (seconds >= this.maxDuration) {
      this.onStop();
    }
  }

}
