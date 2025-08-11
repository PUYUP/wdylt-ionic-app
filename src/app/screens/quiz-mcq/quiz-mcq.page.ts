import { CommonModule, NgClass, NgStyle } from '@angular/common';
import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { IonicModule } from '@ionic/angular';
import { ActionsSubject, select, Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectEnrollment, selectMCQQuestions } from 'src/app/shared/state/selectors/app.selectors';
import { environment } from 'src/environments/environment';

interface QuizOption {
  id: number;
  content_text: string;
  order: string;
  points?: number;
}

interface Question {
  id: number;
  content_text: string;
  description: string;
  question_options: QuizOption[];
  chosen_options: any[];
  correctAnswer: string;
  points: number;
}

@Component({
  selector: 'app-quiz-mcq',
  templateUrl: './quiz-mcq.page.html',
  styleUrls: ['./quiz-mcq.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
    NgClass,
  ]
})
export class QuizMcqPage implements OnInit {

  enrollment$!: Observable<any>;
  enrolledId: string | null = this.route.snapshot.queryParamMap.get('enrolledId');
  lessonId: string | null = this.route.snapshot.queryParamMap.get('lessonId');
  attemptId: string | null = this.route.snapshot.queryParamMap.get('attemptId');

  mcq$: Observable<any> | null = null;
  questions$: Observable<any> | null = null;
  generatingQuiz$: BehaviorSubject<{ status: string }> = new BehaviorSubject<{ status: string }>({ status: 'generating' });
  isQuizGenerating$: Observable<{ status: string }> = this.generatingQuiz$.asObservable();

  // Signals for reactive state management
  generatingAttempt = signal(1);
  currentQuestionIndex = signal(0);
  userAnswers = signal<string[]>([]);
  quizComplete = signal(false);
  optionChosen = signal<string>('');

  // Form control for current answer
  answerValue = '';

  // Sample questions data
  questions = signal<Question[]>([]);

  // Computed values
  currentQuestion = computed(() => this.questions()[this.currentQuestionIndex()]);
  selectedOption = computed(() => this.optionChosen() || '');
  
  // Helper computed properties
  totalGeneratingAttempts = computed(() => this.generatingAttempt());
  canGoPrevious = computed(() => this.currentQuestionIndex() > 0);
  canProceed = computed(() => this.selectedOption() !== '');
  canSkip = computed(() => this.selectedOption() === null || this.selectedOption() === '');
  canSubmit = computed(() => this.currentQuestionIndex() === this.questions().length - 1 && this.selectedOption() !== '');
  totalAnswered = computed(() => this.userAnswers().filter(answer => answer && answer != '').length);
  isLastQuestion = computed(() => this.currentQuestionIndex() === this.questions().length - 1);
  isQuizComplete = computed(() => this.quizComplete());
  pageNumbers = computed(() => Array.from({ length: this.questions().length }, (_, i) => {
    return {
      number: i + 1,
      isCorrect: this.questions()[i]?.chosen_options?.length > 0 ? (this.questions()[i].chosen_options?.[0]?.is_correct ? true : false) : null,
    };
  }));
  totalPoints = computed(() => {
    return this.questions().reduce((acc, curr: any) => {
      return acc + parseInt(curr.points, 10);
    }, 0);
  });
  correctPoints = computed(() => {
    return this.questions().reduce((acc, curr: any) => {  
      const chosenAnswer = curr.chosen_options?.[0];
      if (!chosenAnswer) return acc;
      if (!chosenAnswer.is_correct) return acc;

      return acc + parseInt(curr.points, 10);
    }, 0);
  });
  correctAnswers = computed(() => {
    return this.questions().filter((question: any) => {
      const chosenAnswer = question.chosen_options?.[0];
      return chosenAnswer && chosenAnswer.is_correct;
    }).length;
  });

  // Question prerendering
  refreshInterval: any = null;
  haveQuestionsWithNoAnswer = computed(() => {
    return this.questions().filter((question, index) => {
      return question?.chosen_options?.length == 0;
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
        console.error('Failed to load MCQ questions after multiple attempts');
        clearInterval(this.refreshInterval); // Clear the refresh interval
        // force update enrollment again to get new questions
        this.store.dispatch(AppActions.updateEnrollment({
          id: this.enrolledId as string,
          data: {
            status: 'waiting_answer',
          }
        }));

        // try to get questions again
        this.store.dispatch(AppActions.getMCQQuestions({
          lessonId: this.lessonId as string,
        }));

        this.refreshInterval = setInterval(() => {
          this.store.dispatch(AppActions.getMCQQuestions({ lessonId: this.lessonId as string }));
        }, 5000); // Refresh every 5 seconds
      }
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.enrolledId = params.get('enrolledId');
      this.lessonId = params.get('lessonId');
    });

    this.enrollment$ = this.store.pipe(select(selectEnrollment({ id: this.enrolledId as string })));
    this.enrollment$.pipe(takeUntilDestroyed()).subscribe((state: any) => {
      if (!state.isLoading) {
        if (!state.error && !state.data) {
          this.store.dispatch(AppActions.getEnrollment({
            id: this.enrolledId as string,
          }));
        }
      }
    });

    this.mcq$ = this.store.pipe(select(selectMCQQuestions));
    this.mcq$.pipe(takeUntilDestroyed()).subscribe((mcq: any) => {
      if (!mcq.isLoading && mcq.data && mcq.data.length >= environment.generatedMCQ) {
        this.resetQuiz();

        this.questions.set(mcq.data);
        clearInterval(this.refreshInterval); // Clear any existing interval
        this.refreshInterval = null; // Reset refresh interval
        this.loadSavedAnswers();

        // set answer array to match the number of questions
        for (let [index, value] of mcq.data.entries()) {
          const chosenAnswer = value.chosen_options?.[0]?.selected_option;
          if (chosenAnswer) {
            this.userAnswers.update(answers => {
              const newAnswers = [...answers];
              newAnswers[index] = `${chosenAnswer.question}:${chosenAnswer.order}`;
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

    // get MCQ questions
    this.generatingQuiz$.next({ status: 'generating' });
    this.store.dispatch(AppActions.getMCQQuestions({
      lessonId: this.lessonId as string,
    }));

    this.refreshInterval = setInterval(() => {
      this.generatingAttempt.update(attempt => attempt + 1);
      this.store.dispatch(AppActions.getMCQQuestions({ lessonId: this.lessonId as string }));
    }, 5000); // Refresh every 5 seconds
  }

  // load answers from local storage
  async loadSavedAnswers() {
    if (this.userAnswers().length > 0) return;

    const savedAnswers = await Preferences.get({ key: `mcq_answer_${this.enrolledId}` });
    if (savedAnswers.value) {
      this.userAnswers.set(JSON.parse(savedAnswers.value));
      this.loadCurrentAnswer();
    }
  }

  // Navigation methods
  nextQuestion(): void {
    if (!this.canProceed()) return;

    // this.optionChosen.set(null); // Reset selected option after proceeding
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
  private async saveCurrentAnswer(): Promise<void> {
    const currentIndex = this.currentQuestionIndex();
    const currentAnswer = this.selectedOption() || '';

    this.userAnswers.update(answers => {
      const newAnswers = [...answers];
      newAnswers[currentIndex] = currentAnswer;
      return newAnswers;
    });

    await Preferences.set({ 
      key: `mcq_answer_${this.enrolledId}`,
      value: JSON.stringify(this.userAnswers()),
    });
  }

  private loadCurrentAnswer(): void {
    const currentIndex = this.currentQuestionIndex();
    const savedAnswer = this.userAnswers()[currentIndex];
    this.answerValue = savedAnswer; // Update the input value

    if (savedAnswer && savedAnswer !== '') {
      this.optionChosen.set(savedAnswer); // Set the selected option if available
    } else {
      this.optionChosen.set(''); // Reset if no saved answer
    }
  }

  // Quiz completion
  private completeQuiz(): void {
    this.quizComplete.set(true);
  }

  resetQuiz(): void {
    this.currentQuestionIndex.set(0);
    this.userAnswers.set([]);
    this.quizComplete.set(false);
    this.answerValue = '';
    this.optionChosen.set('');
  }

  onOptionSelected(event: any): void {
    this.optionChosen.set(event.detail.value);
    this.saveCurrentAnswer(); // Save the selected option immediately

    // check have next answer
    const nextIndex = this.currentQuestionIndex() + 1;
    if (this.userAnswers()[nextIndex] == undefined && this.userAnswers()[nextIndex] !== '') {
      setTimeout(() => {
        this.nextQuestion(); // Automatically proceed to the next question
      }, 150);
    }
  }
  
  goToQuestion(index: number): void {
    this.currentQuestionIndex.set(index);
    this.loadCurrentAnswer(); // Load the answer for the selected question
  }

  async submitQuiz() {
    console.log('Quiz submitted!');
    console.log('User Answers:', this.userAnswers());

    const session = await this.supabaseService.session();
    if (!session) {
      console.error('User is not authenticated');
      return;
    }

    const answers = this.userAnswers().map((answer, index) => {
      const instances = answer.split(':');
      const questionId = instances[0]; 
      const value = instances[1];
      const question = this.questions().find(q => q.id === parseInt(questionId));
      const option = question?.question_options.find(opt => opt.order == value);

      return {
        user: session?.user?.id,
        lesson: this.lessonId,
        enrollment: this.enrolledId,
        question: questionId,
        selected_option: option?.id,
        points_earned: question?.points || 1,
        attempt: this.attemptId,
      };
    });

    console.log('Answers to be submitted:', answers);
    this.store.dispatch(AppActions.saveAnsweredMCQ({
      data: answers,
      source: 'quiz-mcq',
      enrollmentId: this.enrolledId as string,
    }));
  }

  ngOnDestroy() {
    console.log('QuizMCQComponent destroyed');
    this.resetQuiz();
    this.generatingQuiz$.complete();
    clearInterval(this.refreshInterval); // Clear the refresh interval
  }

}
