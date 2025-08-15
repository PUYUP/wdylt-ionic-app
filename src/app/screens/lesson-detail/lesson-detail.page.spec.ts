import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonDetailPage } from './lesson-detail.page';

describe('LessonDetailPage', () => {
  let component: LessonDetailPage;
  let fixture: ComponentFixture<LessonDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
