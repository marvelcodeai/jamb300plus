import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { SupabaseService } from '../../services/supabase';


interface LeaderboardEntry {

  userId: string;

  rank: number;

  name: string;

  score: number;

  totalQuestions: number;

  percentage: number;

}


interface TestResult {

  user_id: string;

  weekly_test_id: number;

  week_number: number;

  score: number;

  total_questions: number;

  percentage: number;

  created_at: string;

}


interface Profile {

  id: string;

  full_name: string;

}


@Component({

  selector: 'app-leaderboard',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './leaderboard.html',

  styleUrl: './leaderboard.css'

})


export class Leaderboard implements OnInit {


  // =====================================================
  // LEADERBOARD
  // =====================================================

  leaderboard =
    signal<LeaderboardEntry[]>([]);


  loading =
    signal(true);


  errorMessage =
    signal('');


  currentUserId =
    signal('');


  currentUserRank =
    signal<number | null>(null);


  currentUserScore =
    signal<number | null>(null);


  currentUserPercentage =
    signal<number | null>(null);


  totalParticipants =
    signal(0);


  // =====================================================
  // CURRENT WEEKLY TEST
  // =====================================================

  weekNumber =
    signal(1);


  weeklyTestId =
    signal(1);


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private supabaseService: SupabaseService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit(): Promise<void> {

    await this.loadLeaderboard();

  }


  // =====================================================
  // LOAD LEADERBOARD
  // =====================================================

  async loadLeaderboard(): Promise<void> {

    this.loading.set(true);

    this.errorMessage.set('');


    try {


      // ===================================================
      // 1. GET CURRENT USER
      // ===================================================

      const {
        data: { user },
        error: userError
      } =
        await this.supabaseService
          .client
          .auth
          .getUser();


      if (userError) {

        throw userError;

      }


      this.currentUserId.set(
        user?.id ?? ''
      );


      // ===================================================
      // 2. GET WEEKLY TEST RESULTS
      // ===================================================

      const {
        data: results,
        error: resultsError
      } =
        await this.supabaseService
          .client
          .from('weekly_test_results')
          .select(`
            user_id,
            weekly_test_id,
            week_number,
            score,
            total_questions,
            percentage,
            created_at
          `)
          .eq(
            'weekly_test_id',
            this.weeklyTestId()
          )
          .eq(
            'week_number',
            this.weekNumber()
          )
          .order(
            'score',
            {
              ascending: false
            }
          )
          .order(
            'percentage',
            {
              ascending: false
            }
          )
          .order(
            'created_at',
            {
              ascending: true
            }
          );


      if (resultsError) {

        throw resultsError;

      }


      // ===================================================
      // 3. GET PROFILES
      // ===================================================

      const {
        data: profiles,
        error: profilesError
      } =
        await this.supabaseService
          .client
          .from('profiles')
          .select(
            'id, full_name'
          );


      if (profilesError) {

        throw profilesError;

      }


      // ===================================================
      // 4. CREATE PROFILE LOOKUP
      // ===================================================

      const profileMap =
        new Map<string, string>();


      for (
        const profile of
        (profiles ?? []) as Profile[]
      ) {

        profileMap.set(

          profile.id,

          profile.full_name ||
          'Student'

        );

      }


      // ===================================================
      // 5. KEEP BEST RESULT PER STUDENT
      // ===================================================

      const bestResults =
        new Map<string, TestResult>();


      for (
        const result of
        (results ?? []) as TestResult[]
      ) {

        const existing =
          bestResults.get(
            result.user_id
          );


        if (!existing) {

          bestResults.set(
            result.user_id,
            result
          );

          continue;

        }


        const currentScore =
          Number(
            result.score ?? 0
          );


        const existingScore =
          Number(
            existing.score ?? 0
          );


        const currentPercentage =
          Number(
            result.percentage ?? 0
          );


        const existingPercentage =
          Number(
            existing.percentage ?? 0
          );


        if (

          currentScore > existingScore ||

          (
            currentScore === existingScore &&

            currentPercentage >
            existingPercentage
          )

        ) {

          bestResults.set(
            result.user_id,
            result
          );

        }

      }


      // ===================================================
      // 6. SORT RESULTS
      // ===================================================

      const sortedResults =
        Array.from(
          bestResults.values()
        );


      sortedResults.sort(
        (a, b) => {


          const scoreDifference =
            Number(b.score ?? 0) -
            Number(a.score ?? 0);


          if (
            scoreDifference !== 0
          ) {

            return scoreDifference;

          }


          const percentageDifference =
            Number(b.percentage ?? 0) -
            Number(a.percentage ?? 0);


          if (
            percentageDifference !== 0
          ) {

            return percentageDifference;

          }


          // Earlier submission wins

          return (

            new Date(
              a.created_at
            ).getTime()

            -

            new Date(
              b.created_at
            ).getTime()

          );

        }
      );


      // ===================================================
      // 7. BUILD LEADERBOARD
      // ===================================================

      const finalLeaderboard =
        sortedResults.map(
          (result, index) => {


            return {

              userId:
                result.user_id,


              rank:
                index + 1,


              name:
                profileMap.get(
                  result.user_id
                ) || 'Student',


              score:
                Number(
                  result.score ?? 0
                ),


              totalQuestions:
                Number(
                  result.total_questions ?? 0
                ),


              percentage:
                Number(
                  result.percentage ?? 0
                )

            };

          }
        );


      this.leaderboard.set(
        finalLeaderboard
      );


      // ===================================================
      // 8. TOTAL PARTICIPANTS
      // ===================================================

      this.totalParticipants.set(
        finalLeaderboard.length
      );


      // ===================================================
      // 9. FIND CURRENT STUDENT
      // ===================================================

      const currentStudent =
        finalLeaderboard.find(
          student =>
            student.userId ===
            this.currentUserId()
        );


      if (currentStudent) {


        this.currentUserRank.set(
          currentStudent.rank
        );


        this.currentUserScore.set(
          currentStudent.score
        );


        this.currentUserPercentage.set(
          currentStudent.percentage
        );


      } else {


        this.currentUserRank.set(
          null
        );


        this.currentUserScore.set(
          null
        );


        this.currentUserPercentage.set(
          null
        );

      }


    } catch (error: any) {


      console.error(
        'Leaderboard error:',
        error
      );


      this.errorMessage.set(

        error?.message ||

        'Unable to load leaderboard. Please try again.'

      );


      this.leaderboard.set([]);

      this.totalParticipants.set(0);

      this.currentUserRank.set(null);

      this.currentUserScore.set(null);

      this.currentUserPercentage.set(null);


    } finally {

      this.loading.set(false);

    }

  }


  // =====================================================
  // MEDALS
  // =====================================================

  getMedal(
    rank: number
  ): string {


    if (rank === 1) {

      return '🥇';

    }


    if (rank === 2) {

      return '🥈';

    }


    if (rank === 3) {

      return '🥉';

    }


    return String(rank);

  }


  // =====================================================
  // STUDENT INITIALS
  // =====================================================

  getInitials(
    name: string
  ): string {


    if (!name) {

      return 'S';

    }


    return name

      .split(' ')

      .filter(Boolean)

      .slice(0, 2)

      .map(
        part =>
          part
            .charAt(0)
            .toUpperCase()
      )

      .join('');

  }

}