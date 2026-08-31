import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-weekly-test-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-test-result.html',
  styleUrl: './weekly-test-result.css'
})
export class WeeklyTestResult implements OnInit {

  // =====================================================
  // RESULT DATA
  // =====================================================

  score = 0;

  total = 0;

  answered = 0;

  automaticSubmit = false;


  // =====================================================
  // CALCULATED DATA
  // =====================================================

  percentage = 0;

  correctAnswers = 0;

  wrongAnswers = 0;

  unanswered = 0;


  // =====================================================
  // WEEK
  // =====================================================

  weekNumber = '01';

  weeklyTestId: number | null = null;


  // =====================================================
  // STATE
  // =====================================================

  resultLoaded = false;

  savingResult = false;

  resultSaved = false;

  errorMessage = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit(): Promise<void> {

    this.loadResult();

    if (this.resultLoaded) {

      await this.saveResult();

    }

  }


  // =====================================================
  // LOAD RESULT
  // =====================================================

  loadResult(): void {

    const savedScore =
      sessionStorage.getItem(
        'weeklyTestScore'
      );

    const savedTotal =
      sessionStorage.getItem(
        'weeklyTestTotal'
      );

    const savedAnswered =
      sessionStorage.getItem(
        'weeklyTestAnswered'
      );

    const savedAutomatic =
      sessionStorage.getItem(
        'weeklyTestAutomaticSubmit'
      );

    const savedWeek =
      sessionStorage.getItem(
        'weeklyTestWeek'
      );

    const savedTestId =
      sessionStorage.getItem(
        'weeklyTestId'
      );


    // ===================================================
    // NO RESULT
    // ===================================================

    if (
      savedScore === null ||
      savedTotal === null
    ) {

      this.resultLoaded = false;

      return;

    }


    // ===================================================
    // LOAD VALUES
    // ===================================================

    this.score =
      Number(savedScore);

    this.total =
      Number(savedTotal);

    this.answered =
      Number(savedAnswered ?? 0);

    this.automaticSubmit =
      savedAutomatic === 'true';


    if (savedWeek) {

      this.weekNumber =
        savedWeek.padStart(2, '0');

    }


    if (savedTestId) {

      const parsedId =
        Number(savedTestId);

      if (!Number.isNaN(parsedId)) {

        this.weeklyTestId =
          parsedId;

      }

    }


    // ===================================================
    // CALCULATE RESULT
    // ===================================================

    this.correctAnswers =
      this.score;


    this.unanswered =
      Math.max(
        this.total -
        this.answered,
        0
      );


    this.wrongAnswers =
      Math.max(
        this.answered -
        this.correctAnswers,
        0
      );


    this.percentage =
      this.total > 0
        ? Math.round(
            (
              this.score /
              this.total
            ) * 100
          )
        : 0;


    this.resultLoaded = true;


    console.log(
      '================================'
    );

    console.log(
      'WEEKLY TEST RESULT'
    );

    console.log(
      'Score:',
      this.score
    );

    console.log(
      'Total:',
      this.total
    );

    console.log(
      'Percentage:',
      this.percentage
    );

    console.log(
      'Correct:',
      this.correctAnswers
    );

    console.log(
      'Wrong:',
      this.wrongAnswers
    );

    console.log(
      'Unanswered:',
      this.unanswered
    );

    console.log(
      'Weekly Test ID:',
      this.weeklyTestId
    );

    console.log(
      '================================'
    );

  }


  // =====================================================
  // SAVE RESULT TO SUPABASE
  // =====================================================

  async saveResult(): Promise<void> {

    if (this.savingResult) {

      return;

    }


    this.savingResult = true;

    this.errorMessage = '';


    try {

      const supabase =
        this.supabaseService.client;


      // =================================================
      // GET CURRENT USER
      // =================================================

      const {
        data: {
          user
        },
        error: userError
      } =
        await supabase.auth.getUser();


      if (userError) {

        throw userError;

      }


      if (!user) {

        this.errorMessage =
          'Your account could not be identified. Please log in again.';

        return;

      }


      // =================================================
      // CHECK IF RESULT ALREADY EXISTS
      // =================================================

      let existingQuery =
        supabase
          .from('weekly_test_results')
          .select('id')
          .eq(
            'user_id',
            user.id
          )
          .eq(
            'week_number',
            Number(this.weekNumber)
          );


      if (this.weeklyTestId !== null) {

        existingQuery =
          existingQuery.eq(
            'weekly_test_id',
            this.weeklyTestId
          );

      }


      const {
        data: existingResult,
        error: existingError
      } =
        await existingQuery
          .maybeSingle();


      if (existingError) {

        throw existingError;

      }


      // =================================================
      // ALREADY SAVED
      // =================================================

      if (existingResult) {

        console.log(
          'WEEKLY TEST RESULT ALREADY SAVED'
        );

        this.resultSaved = true;

        return;

      }


      // =================================================
      // INSERT RESULT
      // =================================================

      const {
        error
      } =
        await supabase
          .from('weekly_test_results')
          .insert({

            user_id:
              user.id,

            weekly_test_id:
              this.weeklyTestId,

            week_number:
              Number(this.weekNumber),

            score:
              this.score,

            total_questions:
              this.total,

            answered_questions:
              this.answered,

            correct_answers:
              this.correctAnswers,

            wrong_answers:
              this.wrongAnswers,

            unanswered_questions:
              this.unanswered,

            percentage:
              this.percentage,

            automatic_submit:
              this.automaticSubmit

          });


      if (error) {

        throw error;

      }


      this.resultSaved = true;


      console.log(
        '================================'
      );

      console.log(
        'WEEKLY TEST RESULT SAVED'
      );

      console.log(
        'Score:',
        this.score,
        '/',
        this.total
      );

      console.log(
        'Percentage:',
        this.percentage + '%'
      );

      console.log(
        '================================'
      );


    } catch (error) {

      console.error(
        'SAVE RESULT ERROR:',
        error
      );

      this.errorMessage =
        'Your result could not be saved. Please try again.';

    } finally {

      this.savingResult = false;

    }

  }


  // =====================================================
  // PERFORMANCE TITLE
  // =====================================================

  get performanceTitle(): string {

    if (this.percentage >= 80) {

      return 'Excellent work!';

    }

    if (this.percentage >= 60) {

      return 'Great effort!';

    }

    if (this.percentage >= 40) {

      return 'Good attempt!';

    }

    return 'Keep practising!';

  }


  // =====================================================
  // PERFORMANCE MESSAGE
  // =====================================================

  get performanceMessage(): string {

    if (this.percentage >= 80) {

      return 'You performed excellently in this weekly challenge. Keep pushing towards 300+!';

    }

    if (this.percentage >= 60) {

      return 'Nice performance. Review the questions you missed and keep improving.';

    }

    if (this.percentage >= 40) {

      return 'You are making progress. Keep studying and your score will improve.';

    }

    return 'Do not give up. Review your subjects and come back stronger next week.';

  }


  // =====================================================
  // SCORE CLASS
  // =====================================================

  get scoreClass(): string {

    if (this.percentage >= 80) {

      return 'excellent';

    }

    if (this.percentage >= 60) {

      return 'good';

    }

    if (this.percentage >= 40) {

      return 'average';

    }

    return 'needs-work';

  }


  // =====================================================
  // HOME
  // =====================================================

  goHome(): void {

    this.router.navigate([
      '/home'
    ]);

  }


  // =====================================================
  // LEADERBOARD
  // =====================================================

  viewLeaderboard(): void {

    this.router.navigate([
      '/leaderboard'
    ]);

  }


  // =====================================================
  // WEEKLY TEST
  // =====================================================

  backToWeeklyTest(): void {

    this.router.navigate([
      '/weekly-test'
    ]);

  }

}