import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { SupabaseService } from '../../services/supabase';


interface Subject {
  id: number;
  subject_name: string;
}


@Component({
  selector: 'app-subjects',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './subjects.html',
  styleUrl: './subjects.css'
})


export class Subjects implements OnInit {

  // ===============================
  // REACTIVE STATE
  // ===============================

  subjects = signal<Subject[]>([]);

  loading = signal(true);

  errorMessage = signal('');


  // ===============================
  // SUBJECT ORDER
  // ===============================

  private subjectOrder = [
    'use of english',
    'mathematics',
    'biology',
    'chemistry',
    'physics',
    'economics',
    'government',
    'literature in english',
    'crs',
    'irs'
  ];


  constructor(
    private supabaseService: SupabaseService
  ) {}


  // ===============================
  // INITIAL LOAD
  // ===============================

  async ngOnInit(): Promise<void> {

    await this.loadSubjects();

  }


  // ===============================
  // LOAD SUBJECTS
  // ===============================

  async loadSubjects(): Promise<void> {

    this.loading.set(true);

    this.errorMessage.set('');


    try {

      const supabase =
        this.supabaseService.client;


      const {
        data,
        error
      } = await supabase
        .from('subjects')
        .select('id, subject_name');


      if (error) {

        throw error;

      }


      const loadedSubjects =
        (data ?? []) as Subject[];


      // ===============================
      // SORT
      // ===============================

      loadedSubjects.sort((a, b) => {

        const aName =
          a.subject_name
            ?.trim()
            .toLowerCase() ?? '';


        const bName =
          b.subject_name
            ?.trim()
            .toLowerCase() ?? '';


        const aIndex =
          this.subjectOrder.indexOf(aName);


        const bIndex =
          this.subjectOrder.indexOf(bName);


        if (
          aIndex === -1 &&
          bIndex === -1
        ) {

          return aName.localeCompare(
            bName
          );

        }


        if (aIndex === -1) {

          return 1;

        }


        if (bIndex === -1) {

          return -1;

        }


        return aIndex - bIndex;

      });


      // ===============================
      // REACTIVE UPDATE
      // ===============================

      this.subjects.set(
        loadedSubjects
      );


      console.log(
        'SUBJECTS LOADED:',
        this.subjects()
      );


    } catch (error: any) {

      console.error(
        'SUBJECT LOAD ERROR:',
        error
      );


      this.subjects.set([]);


      this.errorMessage.set(
        error?.message ||
        'Unable to load subjects. Please try again.'
      );


    } finally {

      this.loading.set(false);

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
        ?.trim()
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
  // DESCRIPTION
  // ===============================

  getDescription(
    subjectName: string
  ): string {

    switch (
      subjectName
        ?.trim()
        .toLowerCase()
    ) {

      case 'use of english':
        return 'Improve grammar, comprehension, vocabulary and JAMB English skills.';

      case 'mathematics':
        return 'Build your confidence with calculations, algebra, geometry and more.';

      case 'biology':
        return 'Explore cells, genetics, ecology, evolution and human biology.';

      case 'chemistry':
        return 'Prepare for atomic structure, reactions, organic chemistry and more.';

      case 'physics':
        return 'Master mechanics, electricity, waves, energy and other key areas.';

      case 'economics':
        return 'Understand markets, demand, supply, national income and economic concepts.';

      case 'government':
        return 'Study political systems, institutions, citizenship and Nigerian government.';

      case 'literature in english':
        return 'Study prose, poetry, drama and important literary concepts.';

      case 'crs':
        return 'Prepare for Christian Religious Studies with structured JAMB revision materials.';

      case 'irs':
        return 'Study Islamic Religious Studies with structured JAMB revision materials.';

      default:
        return 'Explore JAMB preparation materials, topics and practice questions.';

    }

  }


  // ===============================
  // SUBJECT NUMBER
  // ===============================

  subjectNumber(
    subjectName: string
  ): string {

    const index =
      this.subjectOrder.indexOf(
        subjectName
          ?.trim()
          .toLowerCase()
      );


    return index >= 0
      ? String(index + 1).padStart(2, '0')
      : '00';

  }

}
