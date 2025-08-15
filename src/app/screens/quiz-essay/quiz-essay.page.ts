import { CommonModule, NgStyle } from '@angular/common';
import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { IonicModule } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { EntryFormComponent } from 'src/app/shared/components/entry-form/entry-form.component';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrollment, selectEssayQuestions } from 'src/app/shared/state/selectors/app.selectors';
import { environment } from 'src/environments/environment';

interface Question {
  id: number;
  content_text: string;
  answers?: any[];
  is_answered?: boolean; // Indicates if the question has been answered
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
    EntryFormComponent,
    NgStyle,
  ]
})
export class QuizEssayPage implements OnInit {

  enrollment$!: Observable<any>;
  enrolledId: string | null = this.route.snapshot.queryParamMap.get('enrolledId');
  lessonId: string | null = this.route.snapshot.queryParamMap.get('lessonId');
  attemptId: string | null = this.route.snapshot.queryParamMap.get('attemptId');

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
    private supabaseService: SupabaseService,
  ) {
    effect(() => {
      if (this.totalGeneratingAttempts() > 10) {
        console.error('Failed to load Essay questions after multiple attempts');
        clearInterval(this.refreshInterval); // Clear the refresh interval
        // force update enrollment again to get new questions
        this.store.dispatch(AppActions.updateEnrollment({
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
    
    this.enrollment$ = this.store.pipe(select(selectEnrollment({ id: this.enrolledId as string })));
    this.essay$ = this.store.pipe(select(selectEssayQuestions));
    this.essay$.pipe(takeUntilDestroyed()).subscribe((essay: any) => {
      if (!essay.isLoading && essay.data && essay.data.length >= environment.generatedEssay) {
        this.resetQuiz();

        this.questions.set(essay.data);
        clearInterval(this.refreshInterval); // Clear any existing interval
        this.refreshInterval = null; // Reset refresh interval
        this.loadSavedAnswers();

        // set answer array to match the number of questions
        for (let [index, value] of essay.data.entries()) {
          if (value?.answers?.length <= 0) {
            // inject answer
            value = {
              ...value,
              answers: [
                ...value.answers.slice(0, 0),
                {
                  ...value.answers[0],
                  content: this.userAnswers()[index] || '',
                },
                ...value.answers.slice(1),
              ]
            }
          }

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

    this.loadSavedAnswers();

    // get essay questions
    this.generatingQuiz$.next({ status: 'generating' });
    this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));

    this.refreshInterval = setInterval(() => {
      this.generatingAttempt.update(attempt => attempt + 1);
      this.store.dispatch(AppActions.getEssayQuestions({ lessonId: this.lessonId as string }));
    }, 5000); // Refresh every 5 seconds
  }

  // load answers from local storage
  async loadSavedAnswers() {
    if (this.userAnswers().length > 0) return;

    const savedAnswers = await Preferences.get({ key: `essay_answer_${this.enrolledId}` });
    if (savedAnswers.value) {
      this.userAnswers.set(JSON.parse(savedAnswers.value));
      this.loadCurrentAnswer();
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
  private async saveCurrentAnswer() {
    const currentIndex = this.currentQuestionIndex();
    const currentAnswer = this.selectedOption() || '';

    this.userAnswers.update(answers => {
      const newAnswers = [...answers];
      newAnswers[currentIndex] = currentAnswer;
      return newAnswers;
    });

    await Preferences.set({ 
      key: `essay_answer_${this.enrolledId}`,
      value: JSON.stringify(this.userAnswers()),
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
      attempt: this.attemptId,
    }));

    this.store.dispatch(AppActions.saveAnsweredEssay({
      data: answers,
      source: 'quiz-essay',
      enrollmentId: this.enrolledId as string,
    }));
  }

  ngOnDestroy() {
    console.log('QuizEssayComponent destroyed');
    this.resetQuiz();
    this.generatingQuiz$.complete();
    clearInterval(this.refreshInterval); // Clear the refresh interval
  }

}
