import { Component, OnInit, signal } from '@angular/core';
import {
ActivatedRoute,
RouterLink
} from '@angular/router';

import { SupabaseService } from '../../services/supabase';

@Component({
selector: 'app-pq-subjects',
standalone: true,
imports: [
RouterLink
],
templateUrl: './pq-subjects.html',
styleUrl: './pq-subjects.css'
})
export class PqSubjects implements OnInit {

// ===============================
// YEAR
// ===============================

year = signal('');

// ===============================
// SUBJECTS
// ===============================

subjects = signal<{
id: number;
name: string;
}[]>([]);

// ===============================
// UI STATES
// ===============================

loading = signal(true);

errorMessage = signal('');

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

async ngOnInit(): Promise<void> {


const selectedYear =
  this.route.snapshot.paramMap.get('year') || '';

this.year.set(selectedYear);

if (!selectedYear) {

  this.errorMessage.set(
    'Invalid JAMB year.'
  );

  this.loading.set(false);

  return;

}

await this.loadSubjects();


}

// ===============================
// LOAD SUBJECTS
// ===============================

async loadSubjects(): Promise<void> {

this.loading.set(true);

this.errorMessage.set('');


try {

  const selectedYear =
    this.year();


  if (!selectedYear) {

    this.errorMessage.set(
      'Invalid JAMB year.'
    );

    return;

  }


  const supabase =
    this.supabaseService.client;


  // ===============================
  // GET QUESTIONS FOR YEAR
  // ===============================

  const {
    data: questions,
    error: questionError
  } = await supabase

    .from('questions')

    .select('subject_id')

    .eq(
      'year',
      Number(selectedYear)
    );


  // ===============================
  // QUESTION ERROR
  // ===============================

  if (questionError) {

    console.error(
      '❌ PQ SUBJECT ERROR:',
      questionError
    );

    this.errorMessage.set(
      'Unable to load subjects right now.'
    );

    return;

  }


  // ===============================
  // NO QUESTIONS
  // ===============================

  if (
    !questions ||
    questions.length === 0
  ) {

    this.subjects.set([]);

    return;

  }


  // ===============================
  // GET UNIQUE SUBJECT IDS
  // ===============================

  const subjectIds = [
    ...new Set(
      questions
        .map(
          question =>
            question.subject_id
        )
        .filter(
          id =>
            id !== null &&
            id !== undefined
        )
    )
  ];


  // ===============================
  // NO SUBJECT IDS
  // ===============================

  if (subjectIds.length === 0) {

    this.subjects.set([]);

    return;

  }


  // ===============================
  // GET SUBJECT NAMES
  // ===============================

  const {
    data: subjectData,
    error: subjectError
  } = await supabase

    .from('subjects')

    .select(
      'id, subject_name'
    )

    .in(
      'id',
      subjectIds
    );


  // ===============================
  // SUBJECT ERROR
  // ===============================

  if (subjectError) {

    console.error(
      '❌ SUBJECT TABLE ERROR:',
      subjectError
    );

    this.errorMessage.set(
      'Unable to load subjects right now.'
    );

    return;

  }


  // ===============================
  // BUILD SUBJECT LIST
  // ===============================

  this.subjects.set(

    (subjectData || [])

      .map(subject => ({

        id: subject.id,

        name: subject.subject_name

      }))

      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      )

  );

} catch (error) {

  console.error(
    '❌ UNEXPECTED PQ SUBJECT ERROR:',
    error
  );

  this.errorMessage.set(
    'Unable to load subjects right now.'
  );

} finally {

  this.loading.set(false);

}


}

}
