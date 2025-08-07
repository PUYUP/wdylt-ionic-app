import { CommonModule, NgStyle } from '@angular/common';
import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ActionsSubject, select, Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrolledLesson, selectEssayQuestions } from 'src/app/shared/state/selectors/app.selectors';

interface Question {
  id: number;
  content_text: string;
  answers?: any[];
}

@Component({
  selector: 'app-quiz-essay',
  templateUrl: './quiz-essay.page.html',
  styleUrls: ['./quiz-essay.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
  ]
})
export class QuizEssayPage implements OnInit {

  enrollment$!: Observable<any>;
  enrolledId: string | null = this.route.snapshot.queryParamMap.get('enrolledId');
  lessonId: string | null = this.route.snapshot.queryParamMap.get('lessonId');

  essay$: Observable<any> | null = null;
  questions$: Observable<any> | null = null;
  generatingQuiz$: BehaviorSubject<{ status: string }> = new BehaviorSubject<{ status: string }>({ status: 'generating' });
  isQuizGenerating$: Observable<{ status: string }> = this.generatingQuiz$.asObservable();

  // Signals for reactive state management
  generatingAttempt = signal(1);
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
  totalGeneratingAttempts = computed(() => this.generatingAttempt());
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

  constructor(
    private store: Store<GlobalState>,
     private route: ActivatedRoute,
    private actionsSubject$: ActionsSubject,
    private supabaseService: SupabaseService,
  ) {
    effect(() => {
      if (this.totalGeneratingAttempts() > 10) {
        console.error('Failed to load Essay questions after multiple attempts');
        clearInterval(this.refreshInterval); // Clear the refresh interval
        // force update enrollment again to get new questions
        this.store.dispatch(AppActions.updateEnrolledLesson({
          id: this.enrolledId as string,
          data: {
            status: 'waiting_answer',
          }
        }));

        // try to get questions again
        this.store.dispatch(AppActions.getEssayQuestions({
          lessonId: this.lessonId as string,
        }));

        this.refreshInterval = setInterval(() => {
          this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));
        }, 5000); // Refresh every 5 seconds
      }
    });
    
    this.enrollment$ = this.store.pipe(select(selectEnrolledLesson({ id: this.enrolledId as string })));
    this.essay$ = this.store.pipe(select(selectEssayQuestions));
    this.essay$.pipe(takeUntilDestroyed()).subscribe((essay: any) => {
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
  }

  ngOnInit() {
    if (!this.lessonId && !this.enrolledId) {
      console.error('Lesson ID or Enrolled ID is missing');
      return;
    }

    // get essay questions
    this.generatingQuiz$.next({ status: 'generating' });
    this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));

    this.refreshInterval = setInterval(() => {
      this.generatingAttempt.update(attempt => attempt + 1);
      this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));
    }, 5000); // Refresh every 5 seconds
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
    clearInterval(this.refreshInterval); // Clear the refresh interval
  }

}
