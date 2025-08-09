import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from 'src/app/shared/services/supabase.service';

@Component({
  selector: 'app-profile-screen',
  templateUrl: './profile-screen.page.html',
  styleUrls: ['./profile-screen.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    AsyncPipe,
  ]
})
export class ProfileScreenPage implements OnInit {

  session$: Promise<any> = this.supabaseService.session();

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
  ) { }

  ngOnInit() {
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

}
