import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizEssayPage } from './quiz-essay.page';

describe('QuizEssayPage', () => {
  let component: QuizEssayPage;
  let fixture: ComponentFixture<QuizEssayPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuizEssayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
