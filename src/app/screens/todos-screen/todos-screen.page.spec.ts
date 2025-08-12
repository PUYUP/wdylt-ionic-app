import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodosScreenPage } from './todos-screen.page';

describe('TodosScreenPage', () => {
  let component: TodosScreenPage;
  let fixture: ComponentFixture<TodosScreenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TodosScreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
