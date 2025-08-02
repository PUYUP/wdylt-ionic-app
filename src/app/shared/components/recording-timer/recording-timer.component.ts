import { Component, OnInit, ViewChild } from '@angular/core';
import { CdTimerComponent, CdTimerModule } from 'angular-cd-timer';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-recording-timer',
  templateUrl: './recording-timer.component.html',
  styleUrls: ['./recording-timer.component.scss'],
  imports: [IonicModule, CdTimerModule],
})
export class RecordingTimerComponent  implements OnInit {

  @ViewChild(CdTimerComponent, { static: true }) timer!: CdTimerComponent;

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

}
