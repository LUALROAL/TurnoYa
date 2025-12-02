import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessDetailPage } from './business-detail.page';

describe('BusinessDetailPage', () => {
  let component: BusinessDetailPage;
  let fixture: ComponentFixture<BusinessDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
