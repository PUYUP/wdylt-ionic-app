import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IonicModule, IonModal, ModalController } from '@ionic/angular';
import { DateService } from '../../services/date.service';
import { format, isValid } from 'date-fns';
import { EntryTimeCustomComponent } from '../entry-time-custom/entry-time-custom.component';

@Component({
  selector: 'app-entry-time',
  templateUrl: './entry-time.component.html',
  styleUrls: ['./entry-time.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
  ]
})
export class EntryTimeComponent  implements OnInit {

  @Input('hourSelected') hourSelected: string | null = null;
  @Output() onHourChanged: EventEmitter<any> = new EventEmitter<any>();

  selectHours: string[] = [
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '24:00'
  ];
  hoursValue: string[] = this.dateService.getNextHours24Format();
  minutesValue: string[] = [
    '00',
    '15',
    '30',
    '45'
  ];
  customHour: string | null = null;
  customHourSelected: string | null = null;

  constructor(
    private dateService: DateService,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    this.onHourChanged.emit({
      data: { value: this.hourSelected as string },
    });

    if (!this.customHour) {
      this.customHour = this.hourSelected;
    }

    this.selectHours = this.hoursValue.filter(hour => {
      const newestHour = parseInt(this.hoursValue[0].replace(/^\D+/g, ''), 10);
      const hourListed = parseInt(hour.replace(/^\D+/g, ''), 10);

      if (newestHour < 10) {
        return hourListed > 10;
      }

      return hourListed > newestHour;
    });
  }

  /**
   * On hour select.
   */
  onSelectHour(hour: string) {
    this.hourSelected = hour;
    
    this.onHourChanged.emit({
      data: { value: this.hourSelected as string },
    });
  }

  /**
   * On hour change event.
   * @param event - The ionChange event.
   */
  onHourChange(event: any) {
    this.customHourSelected = event.detail.value;
  }

  /**
   * Select custom hours
   */
  async onCustomHourSelect() {
    const modal = await this.modalCtrl.create({
      component: EntryTimeCustomComponent,
      initialBreakpoint: 0.5,
      breakpoints: [0.5],
      componentProps: {
        customHourSelected: this.customHourSelected,
        hourSelected: this.hourSelected,
        customHour: this.customHour,
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    this.customHourSelected = data?.customHourSelected || null;
    if (this.customHourSelected) {
      const validDate = isValid(new Date(this.customHourSelected));
      if (validDate) {
        this.hourSelected = format(this.customHourSelected, 'HH:mm');
      } else {
        this.hourSelected = this.customHourSelected;
      }

      this.onHourChanged.emit({
        data: { value: this.hourSelected },
      });

      if (!this.hoursValue.includes(this.hourSelected as string)) {
        this.customHour = this.hourSelected;
      } else {
        this.customHour = null;
      }
    }
  }

}
