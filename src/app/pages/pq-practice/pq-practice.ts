import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-pq-practice',
  standalone: true,
  imports: [],
  templateUrl: './pq-practice.html',
  styleUrl: './pq-practice.css'
})
export class PqPractice implements OnInit, OnDestroy {

  // ===============================
  // ROUTE DATA
  // ===============================

  year = 0;

  subjectId = 0;


  // ===============================
  // SUBJECT
  // ===============================

  subjectName = '';


  // ===============================
  // QUESTIONS
  // ===============================

  questions: any[] = [];

  currentQuestionIndex = 0;


  // ===============================
  // ANSWERS
  // ===============================

  selectedAnswers: {
    [questionId: number]: string;
  } = {};


  // ===============================
  // SETUP
  // ===============================

  setupComplete = false;

  selectedTime = 30;


  // Available time options in minutes

  timeOptions = [
    10,
    20,
    30,
    45,
    60,
    90,
    120,
    0
  ];


  // ===============================
  // TIMER
  // ===============================

  remainingSeconds = 0;

  timerInterval: ReturnType<typeof setInterval> | null = null;


  // ===============================
  // UI STATES
  // ===============================

  loading = true;

  errorMessage = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}


  // ===============================
  // INITIALIZE
  // ===============================

  async ngOnInit(): Promise<void> {

    this.year = Number(
      this.route.snapshot.paramMap.get('year')
    );

    this.subjectId = Number(
      this.route.snapshot.paramMap.get('subjectId')
    );


    if (!this.year || !this.subjectId) {

      this.errorMessage =
        'Invalid past question selection.';

      this.loading = false;

      return;

    }


    await this.loadQuestions();

  }


  // ===============================
  // LOAD QUESTIONS
  // ===============================

  async loadQuestions(): Promise<void> {

    this.loading = true;

    this.errorMessage = '';

    const supabase =
      this.supabaseService.client;


    const {
      data,
      error
    } = await supabase
      .from('questions')
      .select(`
        id,
        question_id,
        subject_id,
        topic_id,
        year,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
      `)
      .eq('year', this.year)
      .eq('subject_id', this.subjectId)
      .order('id', {
        ascending: true
      });


    // ===============================
    // ERROR
    // ===============================

    if (error) {

      console.error(
        '❌ PQ PRACTICE ERROR:',
        error
      );

      this.errorMessage =
        'Unable to load questions right now.';

      this.loading = false;

      return;

    }


    // ===============================
    // NO QUESTIONS
    // ===============================

    if (!data || data.length === 0) {

      this.questions = [];

      this.loading = false;

      return;

    }


    // ===============================
    // STORE QUESTIONS
    // ===============================

    this.questions = data;


    // ===============================
    // GET SUBJECT NAME
    // ===============================

    const {
      data: subject,
      error: subjectError
    } = await supabase
      .from('subjects')
      .select('subject_name')
      .eq('id', this.subjectId)
      .single();


    if (!subjectError && subject) {

      this.subjectName =
        subject.subject_name;

    }


    this.currentQuestionIndex = 0;

    this.loading = false;

  }


  // ===============================
  // START PRACTICE
  // ===============================

  startPractice(): void {

    if (this.questions.length === 0) {
      return;
    }


    this.setupComplete = true;


    // ===============================
    // NO TIME LIMIT
    // ===============================

    if (this.selectedTime === 0) {

      this.remainingSeconds = 0;

      return;

    }


    // ===============================
    // SET TIMER
    // ===============================

    this.remainingSeconds =
      this.selectedTime * 60;


    this.startTimer();

  }


  // ===============================
  // START TIMER
  // ===============================

  startTimer(): void {

    this.stopTimer();


    this.timerInterval =
      setInterval(() => {

        if (this.remainingSeconds <= 0) {

          this.stopTimer();

          this.finishPractice();

          return;

        }


        this.remainingSeconds--;

      }, 1000);

  }


  // ===============================
  // STOP TIMER
  // ===============================

  stopTimer(): void {

    if (this.timerInterval) {

      clearInterval(
        this.timerInterval
      );

      this.timerInterval = null;

    }

  }


  // ===============================
  // TIMER DISPLAY
  // ===============================

  get formattedTime(): string {

    if (this.selectedTime === 0) {

      return 'No Limit';

    }


    const minutes =
      Math.floor(
        this.remainingSeconds / 60
      );


    const seconds =
      this.remainingSeconds % 60;


    return `${this.pad(minutes)}:${this.pad(seconds)}`;

  }


  // ===============================
  // PAD TIMER
  // ===============================

  private pad(value: number): string {

    return value
      .toString()
      .padStart(2, '0');

  }


  // ===============================
  // CURRENT QUESTION
  // ===============================

  get currentQuestion(): any {

    return this.questions[
      this.currentQuestionIndex
    ];

  }


  // ===============================
  // SELECT ANSWER
  // ===============================

  selectAnswer(answer: string): void {

    if (!this.currentQuestion) {
      return;
    }


    this.selectedAnswers[
      this.currentQuestion.id
    ] = answer;

  }


  // ===============================
  // CHECK SELECTED ANSWER
  // ===============================

  isSelected(answer: string): boolean {

    if (!this.currentQuestion) {
      return false;
    }


    return (
      this.selectedAnswers[
        this.currentQuestion.id
      ] === answer
    );

  }


  // ===============================
  // NEXT QUESTION
  // ===============================

  nextQuestion(): void {

    if (
      this.currentQuestionIndex <
      this.questions.length - 1
    ) {

      this.currentQuestionIndex++;

    }

  }


  // ===============================
  // PREVIOUS QUESTION
  // ===============================

  previousQuestion(): void {

    if (
      this.currentQuestionIndex > 0
    ) {

      this.currentQuestionIndex--;

    }

  }


  // ===============================
  // GO TO QUESTION
  // ===============================

  goToQuestion(index: number): void {

    if (
      index >= 0 &&
      index < this.questions.length
    ) {

      this.currentQuestionIndex = index;

    }

  }


  // ===============================
  // ANSWERED COUNT
  // ===============================

  get answeredCount(): number {

    return Object.keys(
      this.selectedAnswers
    ).length;

  }


  // ===============================
  // PROGRESS
  // ===============================

  get progressPercentage(): number {

    if (this.questions.length === 0) {

      return 0;

    }


    return (
      (
        (this.currentQuestionIndex + 1) /
        this.questions.length
      ) * 100
    );

  }


  // ===============================
  // FINISH PRACTICE
  // ===============================

  finishPractice(): void {

    this.stopTimer();


    console.log(
      '✅ PQ PRACTICE FINISHED',
      {
        year: this.year,
        subjectId: this.subjectId,
        answered: this.answeredCount,
        total: this.questions.length
      }
    );

    // Result page will be connected later.

  }


  // ===============================
  // EXIT PRACTICE
  // ===============================

  exitPractice(): void {

    this.stopTimer();


    this.router.navigate([
      '/pq-subjects',
      this.year
    ]);

  }


  // ===============================
  // DESTROY
  // ===============================

  ngOnDestroy(): void {

    this.stopTimer();

  }

}