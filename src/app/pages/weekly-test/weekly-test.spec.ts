import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTest } from './weekly-test';

describe('WeeklyTest', () => {
  let component: WeeklyTest;
  let fixture: ComponentFixture<WeeklyTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyTest],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
