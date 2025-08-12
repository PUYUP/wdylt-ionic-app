import { CUSTOM_ELEMENTS_SCHEMA, inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { appReducer } from './shared/state/reducers/app.reducer';
import { AppEffects } from './shared/state/effects/app.effects';
import { provideHttpClient } from '@angular/common/http';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { NgxSpinnerModule } from "ngx-spinner";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    IonicModule.forRoot({
      mode: 'md',
    }),
    AppRoutingModule,
    EffectsModule.forRoot([
      AppEffects,
    ]),
    StoreModule.forRoot({
      app: appReducer,
    }, {}),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideFirebaseApp(() => initializeApp({
      projectId: "wdylt-website",
      appId: "1:928871794567:web:c9294dd68219e9214b7522",
      storageBucket: "wdylt-website.firebasestorage.app",
      apiKey: "AIzaSyDfg8iyDo-pnK1HK0-YIXn0gGckzERFkkk",
      authDomain: "wdylt-website.firebaseapp.com",
      messagingSenderId: "928871794567"
    })),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage(inject(FirebaseApp))),
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
