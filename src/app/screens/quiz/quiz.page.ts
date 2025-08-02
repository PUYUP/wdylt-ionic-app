import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { QuizEssayComponent } from 'src/app/shared/components/quiz-essay/quiz-essay.component';
import { QuizMcqComponent } from 'src/app/shared/components/quiz-mcq/quiz-mcq.component';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrolledLesson } from 'src/app/shared/state/selectors/app.selectors';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    AsyncPipe,
    QuizMcqComponent,
    QuizEssayComponent,
  ]
})
export class QuizPage implements OnInit {

  enrolled$!: Observable<any>;
  enrolledId: string | null = this.route.snapshot.queryParamMap.get('enrolledId');
  lessonId: string | null = this.route.snapshot.queryParamMap.get('lessonId');
  quizType: 'mcq' | 'essay' | null = this.route.snapshot.queryParamMap.get('type') as 'mcq' | 'essay' | null;

  constructor(
    private store: Store<GlobalState>,
    private route: ActivatedRoute,
  ) { 
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.enrolledId = params.get('enrolledId');
      this.lessonId = params.get('lessonId');
      this.quizType = params.get('type') as 'mcq' | 'essay' | null;
      this.enrolled$ = this.store.pipe(select(selectEnrolledLesson({ id: this.enrolledId as string })));
    });

    this.enrolled$ = this.store.pipe(select(selectEnrolledLesson({ id: this.enrolledId as string })));
    this.enrolled$.pipe(takeUntilDestroyed()).subscribe((enrolled: any) => {
      if (!enrolled.isLoading && !enrolled.error && !enrolled.data) {
        this.store.dispatch(AppActions.getEnrolledLesson({
          id: this.enrolledId as string,
        }));
      }
    });
  }

  ngOnInit() {
  }

}
