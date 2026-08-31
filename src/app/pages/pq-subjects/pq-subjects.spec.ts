import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PqSubjects } from './pq-subjects';

describe('PqSubjects', () => {
  let component: PqSubjects;
  let fixture: ComponentFixture<PqSubjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PqSubjects],
    }).compileComponents();

    fixture = TestBed.createComponent(PqSubjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
