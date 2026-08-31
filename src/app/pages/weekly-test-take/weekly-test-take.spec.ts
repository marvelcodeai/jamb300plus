import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTestTake } from './weekly-test-take';

describe('WeeklyTestTake', () => {
  let component: WeeklyTestTake;
  let fixture: ComponentFixture<WeeklyTestTake>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyTestTake],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyTestTake);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
