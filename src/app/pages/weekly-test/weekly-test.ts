import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

interface Subject {
  id: number;
  subject_name: string;
}

interface WeeklyTestData {
  id: number;
  week_number: number;
  title: string;
  description: string | null;
  is_active: boolean;
  duration_minutes: number;
  english_questions: number;
  other_subject_questions: number;
  question_count: number;
}

@Component({
  selector: 'app-weekly-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-test.html',
  styleUrl: './weekly-test.css',
})
export class WeeklyTest implements OnInit {

  // =====================================================
  // WEEKLY TEST
  // =====================================================

  weeklyTest = signal<WeeklyTestData | null>(null);

  isTestActive = signal(false);

  loadingTest = signal(true);

  errorMessage = signal('');

  // =====================================================
  // SUBJECTS
  // =====================================================

  subjects = signal<Subject[]>([]);

  loading = signal(false);

  selectedSubjectIds = signal<number[]>([]);

  englishSubjectId = signal<number | null>(null);

  // =====================================================
  // DEFAULT SETTINGS
  // =====================================================

  readonly englishQuestionCount = 60;

  readonly otherSubjectQuestionCount = 40;

  readonly totalQuestionCount = 180;

  readonly testDurationMinutes = 120;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit(): Promise<void> {
    await this.loadWeeklyTest();
  }

  // =====================================================
  // LOAD WEEKLY TEST
  // =====================================================

  async loadWeeklyTest(): Promise<void> {

    this.loadingTest.set(true);

    this.errorMessage.set('');

    try {

      const supabase = this.supabaseService.client;

      console.log('LOADING WEEKLY TEST...');

      const { data, error } = await supabase
        .from('weekly_tests')
        .select(
          `
          id,
          week_number,
          title,
          description,
          is_active,
          duration_minutes,
          english_questions,
          other_subject_questions,
          question_count
        `,
        )
        .eq('week_number', 1)
        .maybeSingle();

      // =================================================
      // DATABASE ERROR
      // =================================================

      if (error) {

        console.error('WEEKLY TEST DATABASE ERROR:', error);

        throw error;

      }

      // =================================================
      // NO TEST
      // =================================================

      if (!data) {

        console.log('NO WEEKLY TEST FOUND');

        this.weeklyTest.set(null);

        this.isTestActive.set(false);

        return;

      }

      // =================================================
      // TEST FOUND
      // =================================================

      this.weeklyTest.set(data as WeeklyTestData);

      this.isTestActive.set(
        this.weeklyTest()?.is_active ?? false
      );

      console.log('================================');

      console.log(
        'WEEKLY TEST FOUND:',
        this.weeklyTest()
      );

      console.log(
        'ACTIVE:',
        this.isTestActive()
      );

      console.log(
        'QUESTIONS:',
        this.weeklyTest()?.question_count
      );

      console.log(
        'DURATION:',
        this.weeklyTest()?.duration_minutes
      );

      console.log('================================');

      // =================================================
      // STOP LOADING THE MAIN TEST HERE
      // =================================================

      this.loadingTest.set(false);

      // =================================================
      // LOAD SUBJECTS SEPARATELY
      // =================================================

      if (this.isTestActive()) {

        this.loadSubjects();

      }

    } catch (error) {

      console.error('WEEKLY TEST LOAD ERROR:', error);

      this.errorMessage.set(
        'Unable to load the weekly test. Please try again.'
      );

      this.loadingTest.set(false);

    }

  }

  // =====================================================
  // LOAD SUBJECTS
  // =====================================================

  async loadSubjects(): Promise<void> {

    this.loading.set(true);

    console.log('LOADING SUBJECTS...');

    try {

      const supabase = this.supabaseService.client;

      const { data, error } = await supabase
        .from('subjects')
        .select(
          `
            id,
            subject_name
          `,
        )
        .order('id', { ascending: true });

      // =================================================
      // DATABASE ERROR
      // =================================================

      if (error) {

        console.error('SUBJECT DATABASE ERROR:', error);

        throw error;

      }

      // =================================================
      // SAVE SUBJECTS
      // =================================================

      this.subjects.set(
        (data ?? []) as Subject[]
      );

      console.log(
        'SUBJECTS LOADED:',
        this.subjects()
      );

      // =================================================
      // FIND USE OF ENGLISH
      // =================================================

      const english = this.subjects().find(
        (subject) =>
          subject.subject_name.trim().toLowerCase() ===
          'use of english',
      );

      // =================================================
      // ENGLISH NOT FOUND
      // =================================================

      if (!english) {

        console.error('USE OF ENGLISH NOT FOUND');

        this.errorMessage.set(
          'Use of English could not be found in the subjects table.'
        );

        return;

      }

      // =================================================
      // SAVE ENGLISH ID
      // =================================================

      this.englishSubjectId.set(
        english.id
      );

      // =================================================
      // ENGLISH IS ALWAYS SELECTED
      // =================================================

      this.selectedSubjectIds.set([
        english.id
      ]);

      console.log(
        'USE OF ENGLISH ID:',
        this.englishSubjectId()
      );

      console.log(
        'DEFAULT SELECTED:',
        this.selectedSubjectIds()
      );

    } catch (error) {

      console.error(
        'SUBJECT LOAD ERROR:',
        error
      );

      this.errorMessage.set(
        'Unable to load JAMB subjects. Please check your subjects table.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  // =====================================================
  // SELECT / DESELECT SUBJECT
  // =====================================================

  toggleSubject(subject: Subject): void {

    // English is compulsory

    if (
      subject.id === this.englishSubjectId()
    ) {

      return;

    }

    const alreadySelected =
      this.selectedSubjectIds().includes(
        subject.id
      );

    // ===================================================
    // REMOVE
    // ===================================================

    if (alreadySelected) {

      this.selectedSubjectIds.update(
        ids =>
          ids.filter(
            id => id !== subject.id
          )
      );

      return;

    }

    // ===================================================
    // MAX 3 ADDITIONAL SUBJECTS
    // ===================================================

    if (
      this.additionalSubjectCount >= 3
    ) {

      return;

    }

    // ===================================================
    // ADD
    // ===================================================

    this.selectedSubjectIds.update(
      ids => [
        ...ids,
        subject.id
      ]
    );

  }

  // =====================================================
  // CHECK SELECTED
  // =====================================================

  isSubjectSelected(
    subjectId: number
  ): boolean {

    return this.selectedSubjectIds().includes(
      subjectId
    );

  }

  // =====================================================
  // CHECK ENGLISH
  // =====================================================

  isEnglish(
    subject: Subject
  ): boolean {

    return (
      subject.id ===
      this.englishSubjectId()
    );

  }

  // =====================================================
  // ADDITIONAL SUBJECT COUNT
  // =====================================================

  get additionalSubjectCount(): number {

    return this.selectedSubjectIds()
      .filter(
        id =>
          id !== this.englishSubjectId()
      )
      .length;

  }

  // =====================================================
  // SELECTED SUBJECT COUNT
  // =====================================================

  get selectedSubjectCount(): number {

    return this.selectedSubjectIds().length;

  }

  // =====================================================
  // ALL FOUR SELECTED
  // =====================================================

  get allSubjectsSelected(): boolean {

    return (
      this.selectedSubjectIds().length === 4
    );

  }

  // =====================================================
  // CAN SELECT MORE
  // =====================================================

  get canSelectMoreSubjects(): boolean {

    return (
      this.additionalSubjectCount < 3
    );

  }

  // =====================================================
  // SELECTED SUBJECT OBJECTS
  // =====================================================

  get selectedSubjects(): Subject[] {

    return this.subjects().filter(
      subject =>
        this.selectedSubjectIds().includes(
          subject.id
        )
    );

  }

  // =====================================================
  // QUESTION COUNT PER SUBJECT
  // =====================================================

  getQuestionCount(
    subject: Subject
  ): number {

    if (
      subject.id ===
      this.englishSubjectId()
    ) {

      return (
        this.weeklyTest()?.english_questions ??
        this.englishQuestionCount
      );

    }

    return (
      this.weeklyTest()?.other_subject_questions ??
      this.otherSubjectQuestionCount
    );

  }

  // =====================================================
  // TOTAL QUESTIONS
  // =====================================================

  get calculatedQuestionCount(): number {

    if (
      !this.allSubjectsSelected
    ) {

      return 0;

    }

    if (
      this.weeklyTest()?.question_count
    ) {

      return this.weeklyTest()!.question_count;

    }

    return (
      this.englishQuestionCount +
      this.additionalSubjectCount *
      this.otherSubjectQuestionCount
    );

  }

  // =====================================================
  // TEST DURATION MINUTES
  // =====================================================

  get testDurationMinutesValue(): number {

    return (
      this.weeklyTest()?.duration_minutes ??
      this.testDurationMinutes
    );

  }

  // =====================================================
  // DISPLAY DURATION
  // =====================================================

  get testDuration(): string {

    const minutes =
      this.testDurationMinutesValue;

    if (
      minutes === 120
    ) {

      return '2 hours';

    }

    const hours =
      Math.floor(minutes / 60);

    const remainingMinutes =
      minutes % 60;

    if (
      hours > 0 &&
      remainingMinutes > 0
    ) {

      return `${hours}h ${remainingMinutes}m`;

    }

    if (
      hours > 0
    ) {

      return `${hours} hours`;

    }

    return `${minutes} minutes`;

  }

  // =====================================================
  // CAN START
  // =====================================================

  get canStartTest(): boolean {

    return (
      this.isTestActive() &&
      !this.loadingTest() &&
      !this.loading() &&
      !this.errorMessage() &&
      this.allSubjectsSelected
    );

  }

  // =====================================================
  // CONTINUE TO INSTRUCTIONS
  // =====================================================

  continueToTest(): void {

    if (
      !this.canStartTest
    ) {

      return;

    }

    console.log('================================');

    console.log(
      'WEEKLY TEST READY'
    );

    console.log(
      'WEEK:',
      this.weeklyTest()?.week_number
    );

    console.log(
      'SELECTED SUBJECTS:',
      this.selectedSubjects
    );

    console.log(
      'SUBJECT IDS:',
      this.selectedSubjectIds()
    );

    console.log(
      'QUESTIONS:',
      this.calculatedQuestionCount
    );

    console.log(
      'TIME:',
      this.testDurationMinutesValue
    );

    console.log('================================');

    // =================================================
    // SAVE TEST SETUP
    // =================================================

    sessionStorage.setItem(
      'weeklyTestId',
      String(
        this.weeklyTest()?.id ?? ''
      )
    );

    sessionStorage.setItem(
      'weeklyTestWeek',
      String(
        this.weeklyTest()?.week_number ?? 1
      )
    );

    sessionStorage.setItem(
      'weeklyTestSubjects',
      JSON.stringify(
        this.selectedSubjectIds()
      )
    );

    sessionStorage.setItem(
      'weeklyTestDuration',
      String(
        this.testDurationMinutesValue
      )
    );

    sessionStorage.setItem(
      'weeklyTestQuestionCount',
      String(
        this.calculatedQuestionCount
      )
    );

    // =================================================
    // GO TO INSTRUCTIONS
    // =================================================

    this.router.navigate(
      ['/weekly-test/instructions']
    );

  }

}