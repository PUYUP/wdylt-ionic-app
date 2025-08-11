import { CommonModule, NgStyle } from '@angular/common';
import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, map, Observable, Subject, takeUntil } from 'rxjs';
import { GlobalState } from '../../state/reducers/app.reducer';
import { selectEnrollment, selectEssayQuestions } from '../../state/selectors/app.selectors';
import { AppActions } from '../../state/actions/app.actions';
import { SupabaseService } from '../../services/supabase.service';
import { Actions } from '@ngrx/effects';

interface Question {
  id: number;
  content_text: string;
  answers?: any[];
}

@Component({
  selector: 'app-quiz-essay',
  templateUrl: './quiz-essay.component.html',
  styleUrls: ['./quiz-essay.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonicModule,
    NgStyle,
  ],
})
export class QuizEssayComponent  implements OnInit {

  @Input('data') data: any | null = null;
  @Input('lessonId') lessonId: string | null = null;
  @Input('enrolledId') enrolledId: string | null = null;

  enrolled$: Observable<any> | null = null;
  essay$: Observable<any> | null = null;
  questions$: Observable<any> | null = null;
  generatingQuiz$: BehaviorSubject<{ status: string }> = new BehaviorSubject<{ status: string }>({ status: 'generating' });
  isQuizGenerating$: Observable<{ status: string }> = this.generatingQuiz$.asObservable();

  // Signals for reactive state management
  currentQuestionIndex = signal(0);
  userAnswers = signal<string[]>([]);
  quizComplete = signal(false);
  textInputFilled = signal<string>('');

  // Form control for current answer
  answerValue = '';

  // Sample questions data
  questions = signal<Question[]>([]);

  // Computed values
  currentQuestion = computed(() => this.questions()[this.currentQuestionIndex()]);
  selectedOption = computed(() => this.textInputFilled() || '');
  
  // Helper computed properties
  canGoPrevious = computed(() => this.currentQuestionIndex() > 0);
  canProceed = computed(() => this.selectedOption() !== '');
  canSkip = computed(() => this.selectedOption() === null || this.selectedOption() === '');
  canSubmit = computed(() => this.currentQuestionIndex() === this.questions().length - 1 && this.selectedOption() !== '');
  totalAnswered = computed(() => this.userAnswers().filter(answer => answer && answer != '').length);
  isLastQuestion = computed(() => this.currentQuestionIndex() === this.questions().length - 1);
  isQuizComplete = computed(() => this.quizComplete());
  pageNumbers = computed(() => Array.from({ length: this.questions().length }, (_, i) => i + 1));
  
  // Question prerendering
  refreshInterval: any = null;
  isAnswered = computed(() => {
    return this.questions().filter((question, index) => {
      return question.answers && question.answers?.length > 0;
    }).length > 0;
  });

  onDestroy$ = new Subject<boolean>();

  constructor(
    private store: Store<GlobalState>,
    private actions$: Actions,
    private supabaseService: SupabaseService,
  ) {
    this.enrolled$ = this.store.pipe(select(selectEnrollment({ id: this.enrolledId as string })));
    this.essay$ = this.store.pipe(select(selectEssayQuestions));
    this.essay$.pipe(takeUntil(this.onDestroy$)).subscribe((essay: any) => {
      if (!essay.isLoading && essay.data && essay.data.length >= 5) {
        this.resetQuiz();

        this.questions.set(essay.data);
        clearInterval(this.refreshInterval); // Clear any existing interval
        this.refreshInterval = null; // Reset refresh interval

        // set answer array to match the number of questions
        for (let [index, value] of essay.data.entries()) {
          if (value.answers && value.answers.length > 0) {
            this.userAnswers.update(answers => {
              const newAnswers = [...answers];
              newAnswers[index] = value?.answers?.[0]?.content;
              return newAnswers;
            });
          }
          else {
            this.userAnswers.set([]);
          }
        }

        // Load saved answer when question changes
        this.currentQuestionIndex.set(0);
        this.loadCurrentAnswer();

        // Set generatingQuiz to false after loading questions
        this.generatingQuiz$.next({ status: 'generated' });
      }
    });

    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.getEssayQuestionsSuccess.type:
          break;
        }
      });
  }

  ngOnInit() {
    this.generatingQuiz$.next({ status: 'generating' });
    if (this.data) {
      console.log('Data received:', this.data);
      const status = this.data.status;
      if (status === 'waiting_answer') {
        // const description = this.data.lesson.description;
        // generate quiz based on the lesson description
        // this.store.dispatch(AppActions.aIGenerateEssay({ topic: description }));

        // get essay questions
        this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));

        this.refreshInterval = setInterval(() => {
          this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));
        }, 5000); // Refresh every 5 seconds
      }
    }
  }

  // Navigation methods
  nextQuestion(): void {
    if (!this.canProceed()) return;

    // this.textInputFilled.set(null); // Reset selected option after proceeding
    this.saveCurrentAnswer(); // Save the selected option before index change

    if (this.isLastQuestion()) {
      this.completeQuiz();
    } else {
      this.currentQuestionIndex.update(index => index + 1);
      this.loadCurrentAnswer(); // Load the answer for the next question
    }
  }

  previousQuestion(): void {
    if (!this.canGoPrevious()) return;
    
    this.saveCurrentAnswer();
    this.currentQuestionIndex.update(index => index - 1);
    this.loadCurrentAnswer();
  }

  skipQuestion(): void {
    if (this.canProceed()) return;

    this.saveCurrentAnswer();
    
    if (this.isLastQuestion()) {
      this.completeQuiz();
    } else {
      this.currentQuestionIndex.update(index => index + 1);
      this.loadCurrentAnswer();
    }
  }

  // Answer management
  private saveCurrentAnswer(): void {
    const currentIndex = this.currentQuestionIndex();
    const currentAnswer = this.selectedOption() || '';

    this.userAnswers.update(answers => {
      const newAnswers = [...answers];
      newAnswers[currentIndex] = currentAnswer;
      return newAnswers;
    });
  }

  private loadCurrentAnswer(): void {
    const currentIndex = this.currentQuestionIndex();
    const savedAnswer = this.userAnswers()[currentIndex];
    this.answerValue = savedAnswer; // Update the input value

    if (savedAnswer && savedAnswer !== '') {
      this.textInputFilled.set(savedAnswer); // Set the selected option if available
    } else {
      this.textInputFilled.set(''); // Reset if no saved answer
    }
  }

  // Quiz completion
  private completeQuiz(): void {
    this.quizComplete.set(true);
  }

  resetQuiz(): void {
    this.currentQuestionIndex.set(0);
    this.userAnswers.set([]);
    this.questions.set([]);
    this.quizComplete.set(false);
    this.answerValue = '';
    this.textInputFilled.set('');
  }

  onAnswerChange(event: any): void {
    this.textInputFilled.set(event.detail.value);
    this.saveCurrentAnswer(); // Save the selected option immediately
  }
  
  goToQuestion(index: number): void {
    this.currentQuestionIndex.set(index);
    this.loadCurrentAnswer(); // Load the answer for the selected question
  }

  async submitQuiz() {
    console.log('Quiz submitted!');
    const session = await this.supabaseService.session();
    if (!session) {
      console.error('User is not authenticated');
      return;
    }

    const answers = this.userAnswers().map((answer, index) => ({
      content: answer,
      user: session?.user?.id,
      question: this.questions()[index].id,
      question_content: this.questions()[index].content_text,
      lesson: this.lessonId,
      enrollment: this.enrolledId,
    }));

    this.store.dispatch(AppActions.saveAnsweredEssay({
      data: answers,
      source: 'quiz-essay'
    }));
  }

  ngOnDestroy() {
    console.log('QuizEssayComponent destroyed');
    this.resetQuiz();
    this.generatingQuiz$.complete();
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

}
