import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GlobalState } from '../../state/reducers/app.reducer';
import { select, Store } from '@ngrx/store';
import { AppActions } from '../../state/actions/app.actions';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { selectEnrollment, selectMCQQuestions } from '../../state/selectors/app.selectors';
import { SupabaseService } from '../../services/supabase.service';
import { Actions } from '@ngrx/effects';

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
  correctAnswer: string;
}

@Component({
  selector: 'app-quiz-mcq',
  templateUrl: './quiz-mcq.component.html',
  styleUrls: ['./quiz-mcq.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonicModule,
    AsyncPipe,
  ],
})
export class QuizMcqComponent  implements OnInit {

  @Input('data') data: any | null = null;
  @Input('lessonId') lessonId: string | null = null;
  @Input('enrolledId') enrolledId: string | null = null;

  enrolled$: Observable<any>;
  mcq$: Observable<any> | null = null;
  questions$: Observable<any> | null = null;
  generatingQuiz$: BehaviorSubject<{ status: string }> = new BehaviorSubject<{ status: string }>({ status: 'generating' });
  isQuizGenerating$: Observable<{ status: string }> = this.generatingQuiz$.asObservable();

  // Signals for reactive state management
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
      const options = question.question_options;
      return options.find((option: any) => option.chosen_options && option.chosen_options.length > 0);
    }).length > 0;
  });

  onDestroy$ = new Subject<boolean>();

  constructor(
    private store: Store<GlobalState>,
    private actions$: Actions,
    private supabaseService: SupabaseService,
  ) {
    this.enrolled$ = this.store.pipe(select(selectEnrollment({ id: this.enrolledId as string })));
    this.mcq$ = this.store.pipe(select(selectMCQQuestions));
    this.mcq$.pipe(takeUntil(this.onDestroy$)).subscribe((mcq: any) => {
      if (!mcq.isLoading && mcq.data && mcq.data.length >= 10) {
        this.resetQuiz();

        this.questions.set(mcq.data);
        clearInterval(this.refreshInterval); // Clear any existing interval
        this.refreshInterval = null; // Reset refresh interval

        // set answer array to match the number of questions
        for (let [index, value] of mcq.data.entries()) {
          const chosenAnswer = value.question_options.find((item: any) => item.chosen_options.length > 0);

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

    this.actions$.pipe(takeUntil(this.onDestroy$)).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.getMCQQuestionsSuccess.type:
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
        // this.store.dispatch(AppActions.aIGenerateMCQ({ topic: description }));

        // get mcq questions
        this.store.dispatch(AppActions.getMCQQuestions({ lessonId: this.lessonId as string }));

        this.refreshInterval = setInterval(() => {
          this.store.dispatch(AppActions.getMCQQuestions({ lessonId: this.lessonId as string }));
        }, 5000); // Refresh every 5 seconds
      }
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
        points_earned: option?.points || 1,
      };
    });

    console.log('Answers to be submitted:', answers);
    this.store.dispatch(AppActions.saveAnsweredMCQ({
      data: answers,
      source: 'quiz-mcq'
    }));
  }

  ngOnDestroy() {
    console.log('QuizMCQComponent destroyed');
    this.resetQuiz();
    this.generatingQuiz$.complete();
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

}
