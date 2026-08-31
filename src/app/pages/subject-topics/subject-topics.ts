
import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { SupabaseService } from '../../services/supabase';


interface Subject {
  id: number;
  subject_name: string;
}


interface Topic {
  id: number;
  subject_id: number;
  topic_name: string;
  created_at?: string;
}


@Component({
  selector: 'app-subject-topics',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './subject-topics.html',

  styleUrl: './subject-topics.css'
})


export class SubjectTopics implements OnInit {


  // ===============================
  // REACTIVE DATA
  // ===============================

  subject = signal<Subject | null>(null);

  topics = signal<Topic[]>([]);


  // ===============================
  // REACTIVE LOADING
  // ===============================

  loading = signal(true);

  topicsLoading = signal(true);

  errorMessage = signal('');


  // ===============================
  // SUBJECT NAMES
  // ===============================

  private subjectNames: Record<number, string> = {

    1: 'Use of English',

    2: 'Mathematics',

    3: 'Biology',

    4: 'Chemistry',

    5: 'Physics',

    6: 'Economics',

    7: 'Government',

    8: 'Literature in English',

    9: 'CRS',

    10: 'IRS'

  };


  // ===============================
  // CONSTRUCTOR
  // ===============================

  constructor(

    private route: ActivatedRoute,

    private supabaseService: SupabaseService

  ) {}


  // ===============================
  // INITIALIZE
  // ===============================

  ngOnInit(): void {

    const id =
      this.route.snapshot.paramMap.get('id');


    console.log(
      'SUBJECT ID FROM URL:',
      id
    );


    // ===============================
    // NO ID
    // ===============================

    if (!id) {

      this.errorMessage.set(
        'No subject ID found.'
      );

      this.loading.set(false);

      this.topicsLoading.set(false);

      return;

    }


    // ===============================
    // CONVERT ID
    // ===============================

    const subjectId =
      Number(id);


    if (isNaN(subjectId)) {

      this.errorMessage.set(
        'Invalid subject ID.'
      );

      this.loading.set(false);

      this.topicsLoading.set(false);

      return;

    }


    // ===============================
    // SHOW SUBJECT IMMEDIATELY
    // ===============================

    const subjectName =
      this.subjectNames[subjectId];


    if (subjectName) {

      this.subject.set({

        id: subjectId,

        subject_name: subjectName

      });

    }


    // ===============================
    // STOP PAGE LOADING
    // ===============================

    this.loading.set(false);


    // ===============================
    // LOAD REAL DATA
    // ===============================

    void this.loadSubject(subjectId);

    void this.loadTopics(subjectId);

  }


  // ===============================
  // LOAD SUBJECT
  // ===============================

  async loadSubject(
    subjectId: number
  ): Promise<void> {

    try {

      const supabase =
        this.supabaseService.client;


      const {
        data,
        error
      } = await supabase

        .from('subjects')

        .select(
          'id, subject_name'
        )

        .eq(
          'id',
          subjectId
        )

        .single();


      console.log(
        'SUBJECT DATA:',
        data
      );


      if (error) {

        console.error(
          'SUBJECT LOAD ERROR:',
          error
        );

        return;

      }


      if (data) {

        this.subject.set(
          data as Subject
        );

      }


    } catch (error) {

      console.error(
        'SUBJECT FETCH ERROR:',
        error
      );

    }

  }


  // ===============================
  // LOAD TOPICS
  // ===============================

  async loadTopics(
    subjectId: number
  ): Promise<void> {

    this.topicsLoading.set(true);


    try {

      const supabase =
        this.supabaseService.client;


      const {
        data,
        error
      } = await supabase

        .from('topics')

        .select(
          'id, subject_id, topic_name, created_at'
        )

        .eq(
          'subject_id',
          subjectId
        )

        .order(
          'id',
          {
            ascending: true
          }
        );


      console.log(
        'TOPICS DATA:',
        data
      );


      console.log(
        'TOPICS ERROR:',
        error
      );


      if (error) {

        console.error(
          'TOPICS LOAD ERROR:',
          error
        );

        this.errorMessage.set(
          'Unable to load topics. Please try again.'
        );

        return;

      }


      // ===============================
      // UPDATE SIGNAL
      // ===============================

      this.topics.set(
        (data ?? []) as Topic[]
      );


    } catch (error) {

      console.error(
        'TOPICS FETCH ERROR:',
        error
      );

      this.errorMessage.set(
        'Unable to load topics. Please try again.'
      );


    } finally {

      this.topicsLoading.set(false);

    }

  }


  // ===============================
  // SUBJECT ICON
  // ===============================

  getIcon(
    subjectName: string
  ): string {

    switch (
      subjectName
        .trim()
        .toLowerCase()
    ) {

      case 'use of english':
        return 'A';

      case 'mathematics':
        return '∑';

      case 'biology':
        return 'B';

      case 'chemistry':
        return '⚗';

      case 'physics':
        return 'Φ';

      case 'economics':
        return '₦';

      case 'government':
        return 'G';

      case 'literature in english':
        return 'L';

      case 'crs':
        return 'C';

      case 'irs':
        return 'I';

      default:
        return '•';

    }

  }


  // ===============================
  // TOPIC NUMBER
  // ===============================

  getTopicNumber(
    index: number
  ): string {

    return String(
      index + 1
    ).padStart(2, '0');

  }

}
