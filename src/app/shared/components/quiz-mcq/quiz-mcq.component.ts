import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface QuizOption {
  id: string;
  label: string;
  value: string;
}

interface Question {
  id: number;
  text: string;
  description: string;
  options: QuizOption[];
  correctAnswer: string;
}

interface QuizStats {
  correct: number;
  incorrect: number;
  score: number;
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
  ],
})
export class QuizMcqComponent  implements OnInit {

  @Input('data') data: any | null = null;

  // Signals for reactive state management
  currentQuestionIndex = signal(0);
  userAnswers = signal<string[]>([]);
  quizComplete = signal(false);
  optionChosen = signal<string | null>(null);

  // Form control for current answer
  answerValue = '';

  // Sample questions data
  questions = signal<Question[]>([
    {
      id: 1,
      text: 'What is the primary programming language used for web development?',
      description: 'Select the best answer from the options below',
      options: [
        { id: 'a', label: 'Python', value: 'python' },
        { id: 'b', label: 'JavaScript', value: 'javascript' },
        { id: 'c', label: 'Java', value: 'java' },
        { id: 'd', label: 'C++', value: 'cpp' }
      ],
      correctAnswer: 'javascript'
    },
    {
      id: 2,
      text: 'Which CSS framework is known for utility-first approach?',
      description: 'Choose the framework that uses utility classes',
      options: [
        { id: 'a', label: 'Bootstrap', value: 'bootstrap' },
        { id: 'b', label: 'Tailwind CSS', value: 'tailwind' },
        { id: 'c', label: 'Bulma', value: 'bulma' },
        { id: 'd', label: 'Foundation', value: 'foundation' }
      ],
      correctAnswer: 'tailwind'
    },
    {
      id: 3,
      text: 'What does SPA stand for in web development?',
      description: 'Select the correct full form',
      options: [
        { id: 'a', label: 'Single Page Application', value: 'spa' },
        { id: 'b', label: 'Simple Page Architecture', value: 'architecture' },
        { id: 'c', label: 'Structured Page Assembly', value: 'assembly' },
        { id: 'd', label: 'Static Page Application', value: 'static' }
      ],
      correctAnswer: 'spa'
    }
  ]);

  // Computed values
  currentQuestion = computed(() => this.questions()[this.currentQuestionIndex()]);
  selectedOption = computed(() => this.optionChosen() || '');
  progressPercentage = computed(() => 
    Math.round(((this.currentQuestionIndex() + 1) / this.questions().length) * 100)
  );
  
  stats = computed((): QuizStats => {
    const answers = this.userAnswers();
    const questions = this.questions();
    const correct = answers.reduce((count, answer, index) => {
      return count + (answer === questions[index]?.correctAnswer ? 1 : 0);
    }, 0);
    const total = questions.length;
    const incorrect = answers.length - correct;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { correct, incorrect, score };
  });
  
  // Helper computed properties
  canGoPrevious = computed(() => this.currentQuestionIndex() > 0);
  canProceed = computed(() => this.selectedOption() !== '');
  canSkip = computed(() => this.optionChosen() != null);
  canSubmit = computed(() => this.currentQuestionIndex() === this.questions().length - 1 && this.selectedOption() !== '');
  isLastQuestion = computed(() => this.currentQuestionIndex() === this.questions().length - 1);
  isQuizComplete = computed(() => this.quizComplete());
  
  constructor() {
    // Load saved answer when question changes
    this.currentQuestionIndex.set(0);
    this.loadCurrentAnswer();
  }

  ngOnInit() {}

  // Navigation methods
  nextQuestion(): void {
    // if (!this.canProceed()) return;

    // this.saveCurrentAnswer();
    
    // if (this.isLastQuestion()) {
    //   this.completeQuiz();
    // } else {
    //   this.currentQuestionIndex.update(index => index + 1);
    //   this.loadCurrentAnswer();
    // }

    // this.optionChosen.set(null); // Reset selected option after proceeding
  }

  previousQuestion(): void {
    // if (!this.canGoPrevious()) return;
    
    // this.saveCurrentAnswer();
    // this.currentQuestionIndex.update(index => index - 1);
    // this.loadCurrentAnswer();
    // this.optionChosen.set(null); // Reset selected option after proceeding
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
    const currentAnswer = this.selectedOption();
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
    this.optionChosen.set(null);
  }

  onOptionSelected(event: any): void {
    this.optionChosen.set(event.detail.value);
  }

}
