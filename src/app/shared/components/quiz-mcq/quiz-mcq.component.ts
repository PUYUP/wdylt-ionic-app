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
  description: string;
  options: QuizOption[];
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
  ],
})
export class QuizMcqComponent  implements OnInit {

  @Input('data') data: any | null = null;

  // Signals for reactive state management
  currentQuestionIndex = signal(0);
  userAnswers = signal<string[]>([]);
  quizComplete = signal(false);
  optionChosen = signal<string>('');

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
    },
    {
      id: 4,
      text: 'Which HTTP method is used to request data from a server?',
      description: 'Select the HTTP method used for retrieving data',
      options: [
        { id: 'a', label: 'GET', value: 'get' },
        { id: 'b', label: 'POST', value: 'post' },
        { id: 'c', label: 'PUT', value: 'put' },
        { id: 'd', label: 'DELETE', value: 'delete' }
      ],
      correctAnswer: 'get'
    },
    {
      id: 5,
      text: 'What is TypeScript?',
      description: 'Choose the best description of TypeScript',
      options: [
        { id: 'a', label: 'A JavaScript runtime', value: 'runtime' },
        { id: 'b', label: 'A superset of JavaScript', value: 'superset' },
        { id: 'c', label: 'A JavaScript framework', value: 'framework' },
        { id: 'd', label: 'A database language', value: 'database' }
      ],
      correctAnswer: 'superset'
    },
    {
      id: 6,
      text: 'Which tool is used for state management in Angular?',
      description: 'Select the popular state management solution',
      options: [
        { id: 'a', label: 'NgRx', value: 'ngrx' },
        { id: 'b', label: 'Redux', value: 'redux' },
        { id: 'c', label: 'Vuex', value: 'vuex' },
        { id: 'd', label: 'MobX', value: 'mobx' }
      ],
      correctAnswer: 'ngrx'
    },
    {
      id: 7,
      text: 'What is the purpose of dependency injection in Angular?',
      description: 'Choose the main benefit of DI',
      options: [
        { id: 'a', label: 'Code reusability', value: 'reuse' },
        { id: 'b', label: 'Better testing', value: 'testing' },
        { id: 'c', label: 'Loose coupling', value: 'coupling' },
        { id: 'd', label: 'All of the above', value: 'all' }
      ],
      correctAnswer: 'all'
    },
    {
      id: 8,
      text: 'What is the Angular CLI command to create a new component?',
      description: 'Select the correct command',
      options: [
        { id: 'a', label: 'ng new component', value: 'new' },
        { id: 'b', label: 'ng generate component', value: 'generate' },
        { id: 'c', label: 'ng create component', value: 'create' },
        { id: 'd', label: 'ng add component', value: 'add' }
      ],
      correctAnswer: 'generate'
    },
    {
      id: 9,
      text: 'Which decorator is used to define an Angular component?',
      description: 'Select the correct decorator',
      options: [
        { id: 'a', label: '@Component', value: 'component' },
        { id: 'b', label: '@NgModule', value: 'module' },
        { id: 'c', label: '@Injectable', value: 'injectable' },
        { id: 'd', label: '@Directive', value: 'directive' }
      ],
      correctAnswer: 'component'
    },
    {
      id: 10,
      text: 'What is the purpose of Angular pipes?',
      description: 'Choose the main function of pipes',
      options: [
        { id: 'a', label: 'Data transformation', value: 'transform' },
        { id: 'b', label: 'Routing', value: 'routing' },
        { id: 'c', label: 'State management', value: 'state' },
        { id: 'd', label: 'Form validation', value: 'validation' }
      ],
      correctAnswer: 'transform'
    }
  ]);

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
  
  constructor() {
    // Load saved answer when question changes
    this.currentQuestionIndex.set(0);
    this.loadCurrentAnswer();
  }

  ngOnInit() {}

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

  submitQuiz(): void {
    console.log('Quiz submitted!');
    console.log('User Answers:', this.userAnswers());
  }

}
