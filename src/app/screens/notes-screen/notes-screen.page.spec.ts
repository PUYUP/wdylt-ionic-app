import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotesScreenPage } from './notes-screen.page';

describe('NotesScreenPage', () => {
  let component: NotesScreenPage;
  let fixture: ComponentFixture<NotesScreenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesScreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
