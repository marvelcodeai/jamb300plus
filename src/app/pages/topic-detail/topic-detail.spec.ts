import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicDetail } from './topic-detail';

describe('TopicDetail', () => {
  let component: TopicDetail;
  let fixture: ComponentFixture<TopicDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
