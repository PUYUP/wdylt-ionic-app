import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { DateService } from '../../services/date.service';

@Component({
  selector: 'app-entry-time-custom',
  templateUrl: './entry-time-custom.component.html',
  styleUrls: ['./entry-time-custom.component.scss'],
  imports: [
    IonicModule,
    CommonModule,
  ]
})
export class EntryTimeCustomComponent  implements OnInit {

  @Input('hourSelected') hourSelected: string | null = null;

  hoursValue: string[] = this.dateService.getNextHours24Format();
  minutesValue: string[] = ['00', '15', '30', '45'];
  customHour: string | null = null;
  customHourSelected: string | null = null;

  constructor(
    private dateService: DateService,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {}

  /**
   * On hour change event.
   * @param event - The ionChange event.
   */
  onHourChange(event: any) {
    this.customHourSelected = event.detail.value;
  }

  onHourSelectConfirm(): void {
    this.modalCtrl.dismiss({
      customHour: this.customHour,
      customHourSelected: this.customHourSelected
    });
  }

}
