import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActionSheetController, AlertController, IonicModule, ModalController } from '@ionic/angular';
import { ProgressCardComponent } from '../progress-card/progress-card.component';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';
import { GlobalState } from '../../state/reducers/app.reducer';
import { Store } from '@ngrx/store';
import { AppActions } from '../../state/actions/app.actions';
import { Router } from '@angular/router';
import { TimeDifferenceInMinutesPipe } from "../../pipes/time-difference-in-minutes.pipe";
import { UctToLocalTimePipe } from "../../pipes/uct-to-local-time.pipe";

@Component({
  selector: 'app-learn-card',
  templateUrl: './learn-card.component.html',
  styleUrls: ['./learn-card.component.scss'],
  imports: [
    IonicModule,
    CommonModule,
    ProgressCardComponent,
    TimeDifferenceInMinutesPipe,
    UctToLocalTimePipe
]
})
export class LearnCardComponent  implements OnInit {

  @Input('item') item: any | null = null;
  
  constructor(
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private store: Store<GlobalState>,
    private router: Router,
  ) { }

  ngOnInit() {}

  /**
   * Answer now alert
   */
  async startQuizNow(enrolled: any) {
    const alert = await this.alertCtrl.create({
      header: 'Answer Quizs',
      message: 'You still have much time, so you can start the quiz now or later.',
      buttons: [
        {
          text: 'Later',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Start Quiz Now',
          handler: () => {
            this.store.dispatch(AppActions.updateEnrolledLesson({
              id: enrolled.id,
              data: {
                status: 'waiting_answer',
                updated_at: new Date().toISOString(),
              },
              source: 'answer-now-alert'
            }));
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Open action sheet
   */
  async openActionSheet(enrolled: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Actions',
      buttons: [
        {
          text: 'Edit',
          icon: 'pencil',
          handler: () => {
            this.onEdit(enrolled);
          }
        },
        {
          text: 'Mark as Completed',
          icon: 'checkmark-done',
          handler: () => {
            if (enrolled.status !== 'completed') {
              this.store.dispatch(AppActions.updateEnrolledLesson({
                id: enrolled.id,
                data: {
                  status: 'completed',
                  updated_at: new Date().toISOString(),
                }
              }));
            }
          }
        },
        {
          text: 'Delete',
          icon: 'trash',
          handler: () => {
            this.store.dispatch(AppActions.deleteEnrolledLesson({
              id: enrolled.id,
            }));
          }
        },
        {
          text: 'Cancel Action',
          role: 'cancel',
          icon: 'close',
          data: {
            action: 'cancel',
          },
        },
      ]
    });
    
    await actionSheet.present();
  }

  /**
   * On edit
   */
  async onEdit(enrolled: any) {
    if (enrolled.status !== 'in_progress') {
      console.warn('Cannot edit lesson that is not in progress');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: EntryDialogComponent,
      componentProps: {
        data: enrolled,
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Modal data:', data);
    }
  }

  /**
   * On see quizs button click, navigate to the quizs page.
   */
  onStartQuiz(enrolled: any, type: 'mcq' | 'essay') {
    const status = enrolled.status;
    console.log('Enrolled lesson status:', status);

    if (status === 'in_progress') {
      this.startQuizNow(enrolled);
    } else if (status === 'waiting_answer' || status === 'completed') {
      this.router.navigate(['/quiz'], {
        queryParams: {
          lessonId: enrolled.lessons.id,
          enrolledId: enrolled.id,
          type: type,
        },
      });
    }
  }

  /**
   * Timer complete listener.
   */
  onTimerCompleteListener(event: any) {
    console.log('Timer complete event:', event);

    if (this.item) {
      if (this.item.status === 'in_progress') {
        this.store.dispatch(AppActions.updateEnrolledLesson({
          id: this.item.id,
          data: {
            status: 'waiting_answer',
            updated_at: new Date().toISOString(),
          }
        }));
      }
    }
  }

}
