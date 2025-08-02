import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from '../../shared/services/supabase.service';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { GlobalState } from '../../shared/state/reducers/app.reducer';
import { AppActions } from '../../shared/state/actions/app.actions';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-identify-screen',
  templateUrl: './identify-screen.page.html',
  styleUrls: ['./identify-screen.page.scss'],
  imports: [IonicModule, AsyncPipe, RouterLink],
})
export class IdentifyScreenPage implements OnInit {

  user$: BehaviorSubject<{
    isLoading: number;
    user: any;
  }> = new BehaviorSubject({
    isLoading: 1,
    user: null
  });

  constructor(
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
  ) { 
    this.supabaseService.getUser()
      .then(user => {
        this.user$.next({
          isLoading: 0,
          user: user.data.user
        });

        // Create lesson if user is authenticated
        this.store.dispatch(AppActions.createLesson({
          data: {
            user: user?.data?.user?.id,
            content_type: 'text',
            description: localStorage.getItem('goalText') || '',
          },
          source: 'identify',
          metadata: {
            enrollment: {
              goalHour: localStorage.getItem('goalHour') || '20:00',
            }
          }
        }));
      }, catchError => {
        console.error('Error fetching user:', catchError);
      });
  }

  ngOnInit() {
    
  }

}
