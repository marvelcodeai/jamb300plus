import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastQuestions } from './past-questions';

describe('PastQuestions', () => {
  let component: PastQuestions;
  let fixture: ComponentFixture<PastQuestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PastQuestions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PastQuestions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
