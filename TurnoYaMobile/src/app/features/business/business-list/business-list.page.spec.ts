import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusinessListPage } from './business-list.page';

describe('BusinessListPage', () => {
  let component: BusinessListPage;
  let fixture: ComponentFixture<BusinessListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
