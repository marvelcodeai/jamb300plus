import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PqPractice } from './pq-practice';

describe('PqPractice', () => {
  let component: PqPractice;
  let fixture: ComponentFixture<PqPractice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PqPractice],
    }).compileComponents();

    fixture = TestBed.createComponent(PqPractice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
