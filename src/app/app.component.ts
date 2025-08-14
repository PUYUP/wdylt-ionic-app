import { Component, NgZone } from '@angular/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { ModalController, Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { register } from 'swiper/element/bundle';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Router } from '@angular/router';
import { SupabaseService } from './shared/services/supabase.service';
import { EntryDialogComponent } from './shared/components/entry-dialog/entry-dialog.component';
import OneSignal from 'onesignal-cordova-plugin';
import { Capacitor } from '@capacitor/core';
import { Store } from '@ngrx/store';
import { GlobalState } from './shared/state/reducers/app.reducer';
import { AppActions } from './shared/state/actions/app.actions';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { StatusBar, Style } from '@capacitor/status-bar';

// Register Swiper elements globally
register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {

  public appPages = [
    { title: 'Home', url: '/', icon: 'home' },
    { title: 'Profile', url: '/profile', icon: 'person' },
    { title: 'Sessions', url: '/archive', icon: 'bulb' },
    { title: 'Learning Notes', url: '/notes', icon: 'document' },
    { title: 'My Todos', url: '/todos', icon: 'checkmark-circle' }
  ];
  public session$: Promise<any> = this.supabaseService.session();

  constructor(
    private platform: Platform,
    private router: Router,
    private zone: NgZone,
    private supabaseService: SupabaseService,
    private modalCtrl: ModalController,
    private store: Store<GlobalState>,
  ) {
    // wait for the platform to be ready
    this.platform.ready().then(async () => {
      // any platform specific initialization can go here
      console.log('Platform ready');
      await this.initializeGoogleOAuth();
      this.initializeApp();

      if (Capacitor.isNativePlatform()) {
        this.initializeOneSignal();
      }
    });
  }

  async initializeGoogleOAuth() {
    // Initialize Google OAuth here if needed
    await SocialLogin.initialize({
      google: {
        webClientId: environment.GoogleOAuthClientID, // Required: the web client id for Android and Web
        iOSServerClientId: environment.GoogleOAuthClientID, // Optional: the iOS server client id for iOS
        mode: 'online'
      },
    });
  }

  initializeApp() {
    // Deeplinks
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        // Example url: https://beerswift.app/tabs/tab2
        // slug = /tabs/tab2
        const url = new URL(event.url);
        const params: Record<string, string> | undefined = url.hash
          ?.substring(1)
          ?.split('&')
          ?.reduce((acc: Record<string, string>, s) => {
            acc[s.split('=')[0]] = s.split('=')[1]
            return acc
          }, {});

        const access_token = params?.['access_token'] ?? '';
        const refresh_token = params?.['refresh_token'] ?? '';

        // Only sign in if we got an accessToken with this request
        if (access_token) {
          this.supabaseService.getSupabase().auth.setSession({ access_token, refresh_token });
        }

        // Dive deep into the app if we have a specific place we were told to go:
        const slug = event.url.split(".com").pop();
        if (slug) {
          this.router.navigateByUrl(slug);
        }
      });
    });

    if (Capacitor.isNativePlatform()) {
      const setBackgroundColor = async () => {
        await EdgeToEdge.setBackgroundColor({ color: '#000000' });
        await StatusBar.setStyle({ style: Style.Dark });
      };

      setBackgroundColor();
    }
  }

  /**
   * Sign out the user
   */
  onSignOut() {
    this.supabaseService.signOut().then(() => {
      console.log('User signed out successfully');
      this.router.navigate(['/onboarding']);
    }).catch(error => {
      console.error('Error signing out:', error);
    });
  }

  /**
   * Create new
   */
  async onCreateNew(enrolled: any = null) {
    const modal = await this.modalCtrl.create({
      component: EntryDialogComponent,
      backdropDismiss: false,
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
   * OneSignal initialization
   */
  async initializeOneSignal() {
    const isAuthenticated = await this.supabaseService.isAuthenticated();
    if (!isAuthenticated) {
      console.warn('User is not authenticated, skipping OneSignal initialization');
      return;
    }

    const session = await this.supabaseService.session();
    if (!session || !session.user) {
      console.warn('No user session found, skipping OneSignal initialization');
      return;
    }

    console.log('Initializing OneSignal');
    OneSignal.initialize(environment.oneSignalAppId);
    const oneSignalId = await OneSignal.User.getOnesignalId();
    if (oneSignalId) {
      console.log('OneSignal ID:', oneSignalId);
      // Here you can send the OneSignal ID to your server or use it as needed
      this.store.dispatch(AppActions.updateProfile({
        id: session?.user?.id as string,
        data: { 
          one_signal_id: oneSignalId,
        }
      }));
    }
  }

}
