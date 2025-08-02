import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdentifyScreenPage } from './identify-screen.page';

describe('IdentifyScreenPage', () => {
  let component: IdentifyScreenPage;
  let fixture: ComponentFixture<IdentifyScreenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IdentifyScreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
