import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTestInstructions } from './weekly-test-instructions';

describe('WeeklyTestInstructions', () => {
  let component: WeeklyTestInstructions;
  let fixture: ComponentFixture<WeeklyTestInstructions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyTestInstructions],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyTestInstructions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
