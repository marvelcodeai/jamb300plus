import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectTopics } from './subject-topics';

describe('SubjectTopics', () => {
  let component: SubjectTopics;
  let fixture: ComponentFixture<SubjectTopics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectTopics],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectTopics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
