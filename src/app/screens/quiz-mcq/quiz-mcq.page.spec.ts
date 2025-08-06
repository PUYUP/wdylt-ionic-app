import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizMcqPage } from './quiz-mcq.page';

describe('QuizMcqPage', () => {
  let component: QuizMcqPage;
  let fixture: ComponentFixture<QuizMcqPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuizMcqPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
