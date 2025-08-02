import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrolledLessons } from 'src/app/shared/state/selectors/app.selectors';
import { TimeDifferenceInMinutesPipe } from "../../shared/pipes/time-difference-in-minutes.pipe";
import { Router } from '@angular/router';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.page.html',
  styleUrls: ['./archive.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    AsyncPipe,
    TimeDifferenceInMinutesPipe
]
})
export class ArchivePage implements OnInit {

  public enrolledLessons$: Observable<any>;

  constructor(
    private store: Store<GlobalState>,
    private supabaseService: SupabaseService,
    private router: Router,
  ) { 
    this.enrolledLessons$ = this.store.pipe(select(selectEnrolledLessons));
  }

  ngOnInit() {
    this.getEnrolledLessons();
  }

  /**
   * Get enrolled lessons
   */
  async getEnrolledLessons() {
    const session = await this.supabaseService.session();
    if (session) {
      this.store.dispatch(AppActions.getEnrolledLessons({
        filter: { 
          user_id: session?.user?.id as string,
          from_page: 0,
          to_page: 10
        }
      }));
    }
  }

  /**
   * On see quizs button click, navigate to the quizs page.
   */
  onStartQuiz(enrolled: any, type: 'mcq' | 'essay') {
    this.router.navigate(['/quiz'], {
      queryParams: {
        lessonId: enrolled.lessons.id,
        enrolledId: enrolled.id,
        type: type,
      },
    });
  }

}
