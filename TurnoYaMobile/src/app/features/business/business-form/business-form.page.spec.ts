import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessFormPage } from './business-form.page';

describe('BusinessFormPage', () => {
  let component: BusinessFormPage;
  let fixture: ComponentFixture<BusinessFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
