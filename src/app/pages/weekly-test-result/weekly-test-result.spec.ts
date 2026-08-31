import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTestResult } from './weekly-test-result';

describe('WeeklyTestResult', () => {
  let component: WeeklyTestResult;
  let fixture: ComponentFixture<WeeklyTestResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyTestResult],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyTestResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
