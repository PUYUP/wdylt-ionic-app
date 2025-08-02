import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface QuizOption {
  id: string;
  label: string;
  value: string;
}

interface Question {
  id: number;
  text: string;
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
  ],
})
export class QuizEssayComponent  implements OnInit {

  @Input('data') data: any | null = null;

  // Signals for reactive state management
  currentQuestionIndex = signal(0);
  userAnswers = signal<string[]>([]);
  quizComplete = signal(false);
  textInputFilled = signal<string>('');

  // Form control for current answer
  answerValue = '';

  // Sample questions data
  questions = signal<Question[]>([
    {
      id: 1,
      text: 'What is the primary programming language used for web development?',
      
    },
    {
      id: 2,
      text: 'Which CSS framework is known for utility-first approach?',
    },
    {
      id: 7,
      text: 'What is the purpose of dependency injection in Angular?',
    },
    {
      id: 8,
      text: 'What is the Angular CLI command to create a new component?',
    },
    {
      id: 9,
      text: 'Which decorator is used to define an Angular component?',
    },
  ]);

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
  
  constructor() {
    // Load saved answer when question changes
    this.currentQuestionIndex.set(0);
    this.loadCurrentAnswer();
  }

  ngOnInit() {}

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

  submitQuiz(): void {
    console.log('Quiz submitted!');
    console.log('User Answers:', this.userAnswers());
  }

}
