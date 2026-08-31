import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

interface Question {
  id: number;
  subject_id: number;
  question_text: string;

  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;

  correct_answer?: string;
}

@Component({
  selector: 'app-weekly-test-take',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-test-take.html',
  styleUrl: './weekly-test-take.css'
})
export class WeeklyTestTake implements OnInit, OnDestroy {

  // =====================================================
  // WEEK
  // =====================================================

  weekNumber = signal('01');


  // =====================================================
  // TEST SETTINGS
  // =====================================================

  totalQuestions = signal(180);

  durationMinutes = signal(120);


  // =====================================================
  // QUESTIONS
  // =====================================================

  questions = signal<Question[]>([]);

  currentQuestionIndex = signal(0);

  loadingQuestions = signal(true);

  errorMessage = signal('');


  // =====================================================
  // ANSWERS
  // =====================================================

  answers = signal<{
    [questionId: number]: string;
  }>({});


  // =====================================================
  // TIMER
  // =====================================================

  timeRemainingSeconds = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;

  /*
   * We store an actual deadline instead of simply
   * subtracting 1 every second.
   *
   * This makes the timer much more reliable.
   */
  private timerEndTime = 0;

  private readonly timerStorageKey =
    'weeklyTestEndTime';


  // =====================================================
  // SUBMIT
  // =====================================================

  submitting = signal(false);

  private hasSubmitted = false;


  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  currentQuestion = computed(() => {

    return (
      this.questions()[
        this.currentQuestionIndex()
      ] ?? null
    );

  });


  // =====================================================
  // CURRENT QUESTION NUMBER
  // =====================================================

  currentQuestionNumber = computed(() => {

    return (
      this.currentQuestionIndex() + 1
    );

  });


  // =====================================================
  // PROGRESS
  // =====================================================

  progressPercentage = computed(() => {

    if (
      this.questions().length === 0
    ) {

      return 0;

    }


    return (
      this.currentQuestionNumber() /
      this.questions().length
    ) * 100;

  });


  // =====================================================
  // ANSWERED COUNT
  // =====================================================

  answeredCount = computed(() => {

    return Object.keys(
      this.answers()
    ).length;

  });


  // =====================================================
  // UNANSWERED COUNT
  // =====================================================

  unansweredCount = computed(() => {

    return Math.max(
      this.questions().length -
      this.answeredCount(),
      0
    );

  });


  // =====================================================
  // FORMATTED TIMER
  // =====================================================

  formattedTime = computed(() => {

    const totalSeconds =
      Math.max(
        this.timeRemainingSeconds(),
        0
      );


    const hours =
      Math.floor(
        totalSeconds / 3600
      );


    const minutes =
      Math.floor(
        (
          totalSeconds % 3600
        ) / 60
      );


    const seconds =
      totalSeconds % 60;


    return [
      hours,
      minutes,
      seconds
    ]

      .map(
        value =>
          String(
            value
          ).padStart(
            2,
            '0'
          )
      )

      .join(':');

  });


  // =====================================================
  // TIMER WARNING
  // =====================================================

  timerWarning = computed(() => {

    return (
      this.timeRemainingSeconds() <=
      10 * 60
    );

  });


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private supabaseService: SupabaseService,
    public router: Router
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit(): Promise<void> {

    this.loadTestSettings();

    await this.loadQuestions();

  }


  // =====================================================
  // LOAD TEST SETTINGS
  // =====================================================

  loadTestSettings(): void {

    const savedWeek =
      sessionStorage.getItem(
        'weeklyTestWeek'
      );

    const savedDuration =
      sessionStorage.getItem(
        'weeklyTestDuration'
      );

    const savedQuestionCount =
      sessionStorage.getItem(
        'weeklyTestQuestionCount'
      );


    // -----------------------------------------------------
    // WEEK
    // -----------------------------------------------------

    if (savedWeek) {

      this.weekNumber.set(
        savedWeek.padStart(2, '0')
      );

    }


    // -----------------------------------------------------
    // DURATION
    // -----------------------------------------------------

    if (savedDuration) {

      const duration =
        Number(savedDuration);

      if (
        Number.isFinite(duration) &&
        duration > 0
      ) {

        this.durationMinutes.set(
          duration
        );

      }

    }


    // -----------------------------------------------------
    // QUESTION COUNT
    // -----------------------------------------------------

    if (savedQuestionCount) {

      const questionCount =
        Number(savedQuestionCount);

      if (
        Number.isFinite(questionCount) &&
        questionCount > 0
      ) {

        this.totalQuestions.set(
          questionCount
        );

      }

    }


    // -----------------------------------------------------
    // RESTORE OR CREATE TIMER
    // -----------------------------------------------------

    this.prepareTimer();

  }


  // =====================================================
  // PREPARE TIMER
  // =====================================================

  prepareTimer(): void {

    const savedEndTime =
      sessionStorage.getItem(
        this.timerStorageKey
      );


    // -----------------------------------------------------
    // RESTORE EXISTING TIMER
    // -----------------------------------------------------

    if (savedEndTime) {

      const endTime =
        Number(savedEndTime);

      if (
        Number.isFinite(endTime) &&
        endTime > Date.now()
      ) {

        this.timerEndTime =
          endTime;

        this.updateTimerDisplay();

        return;

      }

    }


    // -----------------------------------------------------
    // CREATE NEW TIMER
    // -----------------------------------------------------

    this.timerEndTime =
      Date.now() +
      (
        this.durationMinutes() *
        60 *
        1000
      );


    sessionStorage.setItem(
      this.timerStorageKey,
      String(
        this.timerEndTime
      )
    );


    this.updateTimerDisplay();

  }


  // =====================================================
  // LOAD QUESTIONS
  // =====================================================

  async loadQuestions(): Promise<void> {

    this.loadingQuestions.set(true);

    this.errorMessage.set('');


    try {

      const subjectIdsString =
        sessionStorage.getItem(
          'weeklyTestSubjects'
        );


      // ---------------------------------------------------
      // NO TEST SETUP
      // ---------------------------------------------------

      if (!subjectIdsString) {

        this.errorMessage.set(
          'Your test setup could not be found. Please start the test again.'
        );

        return;

      }


      let subjectIds: number[];


      try {

        subjectIds =
          JSON.parse(
            subjectIdsString
          );

      } catch {

        this.errorMessage.set(
          'Your test setup is invalid. Please start the test again.'
        );

        return;

      }


      // ---------------------------------------------------
      // VALIDATE SUBJECTS
      // ---------------------------------------------------

      if (
        !Array.isArray(subjectIds) ||
        subjectIds.length === 0
      ) {

        this.errorMessage.set(
          'No subjects were selected for this test.'
        );

        return;

      }


      const supabase =
        this.supabaseService.client;


      // ---------------------------------------------------
      // GET QUESTIONS
      // ---------------------------------------------------

      const {
        data,
        error
      } = await supabase

        .from('questions')

        .select(`
          id,
          subject_id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer
        `)

        .in(
          'subject_id',
          subjectIds
        );


      if (error) {

        console.error(
          'QUESTION LOAD ERROR:',
          error
        );

        throw error;

      }


      this.questions.set(
        (data ?? []) as Question[]
      );


      // ---------------------------------------------------
      // NO QUESTIONS
      // ---------------------------------------------------

      if (
        this.questions().length === 0
      ) {

        this.errorMessage.set(
          'No questions have been added for the selected subjects yet.'
        );

        this.stopTimer();

        return;

      }


      // ---------------------------------------------------
      // SHUFFLE QUESTIONS
      // ---------------------------------------------------

      this.questions.set(
        this.shuffleArray(
          this.questions()
        )
      );


      // ---------------------------------------------------
      // LIMIT TO TEST QUESTION COUNT
      // ---------------------------------------------------

      if (
        this.questions().length >
        this.totalQuestions()
      ) {

        this.questions.set(
          this.questions().slice(
            0,
            this.totalQuestions()
          )
        );

      }


      /*
       * The actual number of questions loaded
       * becomes the number displayed by the UI.
       */

      this.totalQuestions.set(
        this.questions().length
      );


      console.log(
        '================================'
      );

      console.log(
        'WEEKLY TEST'
      );

      console.log(
        'WEEK:',
        this.weekNumber()
      );

      console.log(
        'QUESTIONS:',
        this.questions().length
      );

      console.log(
        'TIME:',
        this.durationMinutes(),
        'minutes'
      );

      console.log(
        '================================'
      );


      // ---------------------------------------------------
      // START TIMER
      // ---------------------------------------------------

      this.startTimer();


    } catch (error) {

      console.error(
        'WEEKLY TEST ERROR:',
        error
      );

      this.errorMessage.set(
        'Unable to load the test questions. Please try again.'
      );

      this.stopTimer();


    } finally {

      this.loadingQuestions.set(false);

    }

  }


  // =====================================================
  // SHUFFLE QUESTIONS
  // =====================================================

  private shuffleArray<T>(
    array: T[]
  ): T[] {

    const copy = [
      ...array
    ];


    for (
      let i = copy.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() *
          (i + 1)
        );


      [
        copy[i],
        copy[j]
      ] = [
        copy[j],
        copy[i]
      ];

    }


    return copy;

  }


  // =====================================================
  // SELECT ANSWER
  // =====================================================

  selectAnswer(
    answer: string
  ): void {

    const question =
      this.currentQuestion();


    if (!question) {

      return;

    }


    this.answers.update(
      currentAnswers => ({
        ...currentAnswers,
        [question.id]: answer
      })
    );

  }


  // =====================================================
  // CHECK SELECTED ANSWER
  // =====================================================

  isAnswerSelected(
    answer: string
  ): boolean {

    const question =
      this.currentQuestion();


    if (!question) {

      return false;

    }


    return (
      this.answers()[
        question.id
      ] === answer
    );

  }


  // =====================================================
  // NEXT QUESTION
  // =====================================================

  nextQuestion(): void {

    if (
      this.currentQuestionIndex() <
      this.questions().length - 1
    ) {

      this.currentQuestionIndex.update(
        index => index + 1
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      return;

    }


    this.confirmSubmit();

  }


  // =====================================================
  // PREVIOUS QUESTION
  // =====================================================

  previousQuestion(): void {

    if (
      this.currentQuestionIndex() > 0
    ) {

      this.currentQuestionIndex.update(
        index => index - 1
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

    }

  }


  // =====================================================
  // GO TO QUESTION
  // =====================================================

  goToQuestion(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.questions().length
    ) {

      return;

    }


    this.currentQuestionIndex.set(
      index
    );


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // =====================================================
  // QUESTION ANSWERED
  // =====================================================

  isQuestionAnswered(
    index: number
  ): boolean {

    const question =
      this.questions()[index];


    if (!question) {

      return false;

    }


    return !!this.answers()[
      question.id
    ];

  }


  // =====================================================
  // START TIMER
  // =====================================================

  startTimer(): void {

    this.stopTimer();


    // Make sure timer has a valid deadline

    if (
      !this.timerEndTime ||
      this.timerEndTime <= Date.now()
    ) {

      this.prepareTimer();

    }


    // Immediately update

    this.updateTimerDisplay();


    // Update every second

    this.timer =
      setInterval(() => {

        this.updateTimerDisplay();

      }, 1000);

  }


  // =====================================================
  // UPDATE TIMER DISPLAY
  // =====================================================

  private updateTimerDisplay(): void {

    const remaining =
      this.timerEndTime -
      Date.now();


    if (remaining <= 0) {

      this.timeRemainingSeconds.set(0);

      this.stopTimer();


      if (!this.hasSubmitted) {

        this.submitTest(true);

      }

      return;

    }


    this.timeRemainingSeconds.set(
      Math.ceil(
        remaining / 1000
      )
    );

  }


  // =====================================================
  // STOP TIMER
  // =====================================================

  stopTimer(): void {

    if (this.timer !== null) {

      clearInterval(
        this.timer
      );

      this.timer = null;

    }

  }


  // =====================================================
  // SUBMIT TEST
  // =====================================================

  async submitTest(
    automatic = false
  ): Promise<void> {

    if (
      this.submitting() ||
      this.hasSubmitted
    ) {

      return;

    }


    this.hasSubmitted = true;

    this.submitting.set(true);

    this.stopTimer();


    try {

      let score = 0;


      // ---------------------------------------------------
      // CALCULATE SCORE
      // ---------------------------------------------------

      for (
        const question of this.questions()
      ) {

        const userAnswer =
          this.answers()[
            question.id
          ];


        if (
          userAnswer &&
          question.correct_answer &&
          userAnswer.toUpperCase() ===
          question.correct_answer.toUpperCase()
        ) {

          score++;

        }

      }


      // ---------------------------------------------------
      // SAVE RESULT
      // ---------------------------------------------------

      sessionStorage.setItem(
        'weeklyTestScore',
        String(score)
      );


      sessionStorage.setItem(
        'weeklyTestTotal',
        String(
          this.questions().length
        )
      );


      sessionStorage.setItem(
        'weeklyTestAnswered',
        String(
          this.answeredCount()
        )
      );


      sessionStorage.setItem(
        'weeklyTestAutomaticSubmit',
        String(
          automatic
        )
      );


      sessionStorage.setItem(
        'weeklyTestAnswers',
        JSON.stringify(
          this.answers()
        )
      );


      // ---------------------------------------------------
      // REMOVE TIMER
      // ---------------------------------------------------

      sessionStorage.removeItem(
        this.timerStorageKey
      );


      // ---------------------------------------------------
      // GO TO RESULT
      // ---------------------------------------------------

      await this.router.navigate([
        '/weekly-test/result'
      ]);


    } catch (error) {

      console.error(
        'SUBMIT ERROR:',
        error
      );

      this.hasSubmitted = false;

      this.submitting.set(false);

    }

  }


  // =====================================================
  // CONFIRM SUBMISSION
  // =====================================================

  confirmSubmit(): void {

    if (
      this.submitting() ||
      this.hasSubmitted
    ) {

      return;

    }


    // ---------------------------------------------------
    // EVERYTHING ANSWERED
    // ---------------------------------------------------

    if (
      this.answeredCount() >=
      this.questions().length
    ) {

      const shouldSubmit =
        window.confirm(
          'You have answered all the questions. Are you ready to submit your test?'
        );


      if (!shouldSubmit) {

        return;

      }


      this.submitTest();

      return;

    }


    // ---------------------------------------------------
    // SOME QUESTIONS UNANSWERED
    // ---------------------------------------------------

    const remaining =
      this.unansweredCount();


    const shouldSubmit =
      window.confirm(
        `You have ${remaining} unanswered question(s). Are you sure you want to submit?`
      );


    if (!shouldSubmit) {

      return;

    }


    this.submitTest();

  }


  // =====================================================
  // CLEANUP
  // =====================================================

  ngOnDestroy(): void {

    this.stopTimer();

  }

}