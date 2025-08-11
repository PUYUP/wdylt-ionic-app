import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { IonicModule, IonModal } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Base64String } from 'capacitor-voice-recorder';
import { Store } from '@ngrx/store';
import { GlobalState } from '../../shared/state/reducers/app.reducer';
import { AppActions } from '../../shared/state/actions/app.actions';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { EntryFormComponent } from '../../shared/components/entry-form/entry-form.component';
import { EntryTimeComponent } from '../../shared/components/entry-time/entry-time.component';
import { Subject, takeUntil } from 'rxjs';
import { Actions } from '@ngrx/effects';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.page.html',
  styleUrls: ['./splash-screen.page.scss'],
  imports: [
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    EntryFormComponent,
    EntryTimeComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SplashScreenPage implements OnInit {

  @ViewChild('splashSwiper', { static: true }) swiperContainer!: any;
  @ViewChild('selectHourModal', { static: true }) selectHourModal!: IonModal;
  @ViewChild('createAccountModal', { static: true }) createAccountModal!: IonModal;

  goalText: string = '';
  goalTextLength: number = 0;
  isRecording: boolean = false;
  currentRecordingData: {
    mimeType: string;
    msDuration: number;
    path?: string;
    recordDataBase64?: Base64String;
  } | null = null;
  hourSelected: string | null = null;
  onDestroy$ = new Subject<boolean>();

  constructor(
    private store: Store<GlobalState>,
    private actions$: Actions,
  ) {
    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.signInWithGoogleSuccess.type:
          console.log('Sign in with Google successful:', action.user);
          break;
      }
    });
  }

  ngOnInit() {
  }

  onNext() {
    this.swiperContainer.nativeElement.swiper.slideNext();
  }

  onPrev() {
    this.swiperContainer.nativeElement.swiper.slidePrev();
  }

  ionViewDidEnter() {
    this.swiperContainer.nativeElement.swiper.allowTouchMove = false;
    this.swiperContainer.nativeElement.swiper.update();
  }

  /**
   * Continue with Google login.
   * https://cjweed.com/capacitor-supabase-social-auth-react/
   */
  async onContinueWithGoogle() {
    console.log('Continue with Google clicked');
    this.store.dispatch(AppActions.signInWithGoogle({ source: 'signup'}));
    this.createAccountModal.dismiss();

    // const { result } = await SocialLogin.login({
    //   provider: 'google',
    //   options: {
    //     scopes: ['email', 'profile'],
    //     forceRefreshToken: true,
    //   }
    // });

    // console.log('Google login response:', result);
  }

  /**
   * Sign in with Google.
   */
  onSignIn() {
    console.log('Sign in with Google clicked');
    this.store.dispatch(AppActions.signInWithGoogle({ source: 'signin' }));
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
  onTextChangeListener(event: any) {
    this.goalText = event.detail.value;
    this.goalTextLength = this.goalText.length;

    // temporary save goal text to local storage
    localStorage.setItem('goalText', this.goalText);

    if (this.goalTextLength > 0) {
      if (this.swiperContainer.nativeElement.swiper.allowTouchMove == false) {
        this.swiperContainer.nativeElement.swiper.allowTouchMove = true;
        this.swiperContainer.nativeElement.swiper.update();
      }
    } else {
      if (this.swiperContainer.nativeElement.swiper.allowTouchMove == true) {
        this.swiperContainer.nativeElement.swiper.allowTouchMove = false;
        this.swiperContainer.nativeElement.swiper.update();
      }
    }
  }

  /**
   * Record stop listener.
   */
  onRecordStopListener(event: any) {
    this.currentRecordingData = event.detail.value;
    this.isRecording = !this.isRecording;
  }

  /**
   * On hour changed event.
   * @param event - The hour changed event.
   */
  onHourChangedListener(event: any) {
    this.hourSelected = event.data.value;
    localStorage.setItem('goalHour', this.hourSelected as string);
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

}