import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';

interface TestResult {
  id: number;
  user_id: string;
  weekly_test_id: number;
  week_number: number;
  score: number;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  percentage: number;
  automatic_submit: boolean;
  created_at: string;
}

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance.html',
  styleUrl: './performance.css'
})
export class Performance implements OnInit {

  /* =========================
     DATA
  ========================== */

  results = signal<TestResult[]>([]);

  loading = signal(true);
  errorMessage = signal('');

  currentUserId = signal('');

  testsTaken = signal(0);
  averagePercentage = signal(0);
  bestPercentage = signal(0);

  latestResult = signal<TestResult | null>(null);

  /* =========================
     CONSTRUCTOR
  ========================== */

  constructor(
    private supabaseService: SupabaseService
  ) {}

  /* =========================
     INIT
  ========================== */

  async ngOnInit(): Promise<void> {
    await this.loadPerformance();
  }

  /* =========================
     LOAD PERFORMANCE
  ========================== */

  async loadPerformance(): Promise<void> {

    this.loading.set(true);
    this.errorMessage.set('');

    try {

      /* =========================
         1. GET CURRENT USER
      ========================== */

      const {
        data: { user },
        error: userError
      } = await this.supabaseService.client.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('No logged-in user found.');
      }

      this.currentUserId.set(user.id);


      /* =========================
         2. GET USER'S TEST RESULTS
      ========================== */

      const {
        data,
        error
      } = await this.supabaseService.client
        .from('weekly_test_results')
        .select(`
          id,
          user_id,
          weekly_test_id,
          week_number,
          score,
          total_questions,
          answered_questions,
          correct_answers,
          wrong_answers,
          unanswered_questions,
          percentage,
          automatic_submit,
          created_at
        `)
        .eq('user_id', this.currentUserId())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      this.results.set(
        (data ?? []) as TestResult[]
      );


      /* =========================
         3. CALCULATE STATISTICS
      ========================== */

      this.testsTaken.set(
        this.results().length
      );

      if (this.results().length > 0) {

        const percentages = this.results().map(
          result => Number(result.percentage ?? 0)
        );

        const totalPercentage = percentages.reduce(
          (sum, value) => sum + value,
          0
        );

        this.averagePercentage.set(
          Math.round(
            totalPercentage / percentages.length
          )
        );

        this.bestPercentage.set(
          Math.max(...percentages)
        );

        this.latestResult.set(
          this.results()[0]
        );

      } else {

        this.averagePercentage.set(0);
        this.bestPercentage.set(0);
        this.latestResult.set(null);

      }

    } catch (error: any) {

      console.error(
        'Performance error:',
        error
      );

      this.errorMessage.set(
        error?.message ||
        'Unable to load your performance. Please try again.'
      );

      this.results.set([]);

      this.testsTaken.set(0);
      this.averagePercentage.set(0);
      this.bestPercentage.set(0);
      this.latestResult.set(null);

    } finally {

      this.loading.set(false);

    }

  }


  /* =========================
     FORMAT DATE
  ========================== */

  formatDate(date: string): string {

    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  /* =========================
     TEST NAME
  ========================== */

  getTestName(result: TestResult): string {

    return 'Weekly Test';

  }


  /* =========================
     WEEK LABEL
  ========================== */

  getWeekLabel(result: TestResult): string {

    return `Week ${result.week_number}`;

  }


  /* =========================
     RESULT MESSAGE
  ========================== */

  getResultMessage(percentage: number): string {

    if (percentage >= 80) {
      return 'Excellent';
    }

    if (percentage >= 60) {
      return 'Good work';
    }

    if (percentage >= 40) {
      return 'Keep improving';
    }

    return 'Keep practising';

  }


  /* =========================
     SCORE COLOR CLASS
  ========================== */

  getScoreClass(percentage: number): string {

    if (percentage >= 80) {
      return 'excellent';
    }

    if (percentage >= 60) {
      return 'good';
    }

    if (percentage >= 40) {
      return 'average';
    }

    return 'low';

  }


  /* =========================
     TREND HEIGHT
  ========================== */

  getTrendHeight(result: TestResult): number {

    const percentage = Number(
      result.percentage ?? 0
    );

    return Math.max(
      8,
      Math.min(100, percentage)
    );

  }


  /* =========================
     DISPLAY SCORE
  ========================== */

  formatScore(result: TestResult): string {

    return `${result.score}/${result.total_questions}`;

  }


  /* =========================
     TRACK RESULTS
  ========================== */

  trackResult(
    index: number,
    result: TestResult
  ): string {

    return `${result.id}-${index}`;

  }

}

