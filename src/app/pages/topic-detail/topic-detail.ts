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


interface Topic {
  id: number;
  subject_id: number;
  topic_name: string;
  created_at?: string;
}


@Component({
  selector: 'app-topic-detail',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './topic-detail.html',
  styleUrl: './topic-detail.css'
})


export class TopicDetail implements OnInit {


  // ===============================
  // TOPIC
  // ===============================

  topic = signal<Topic | null>(null);


  // ===============================
  // LOADING
  // ===============================

  loading = signal(true);


  // ===============================
  // ERROR
  // ===============================

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

    try {

      const topicIdParam =
        this.route.snapshot.paramMap.get('topicId');


      console.log(
        'TOPIC ID FROM URL:',
        topicIdParam
      );


      // ===============================
      // NO ID
      // ===============================

      if (!topicIdParam) {

        this.errorMessage.set(
          'No topic ID found.'
        );

        return;
      }


      // ===============================
      // CONVERT ID
      // ===============================

      const topicId =
        Number(topicIdParam);


      // ===============================
      // INVALID ID
      // ===============================

      if (isNaN(topicId)) {

        this.errorMessage.set(
          'Invalid topic ID.'
        );

        return;
      }


      // ===============================
      // LOAD TOPIC
      // ===============================

      await this.loadTopic(topicId);


    } catch (error) {

      console.error(
        'TOPIC DETAIL ERROR:',
        error
      );


      this.errorMessage.set(
        'Unable to load this topic.'
      );


    } finally {

      this.loading.set(false);

    }

  }


  // ===============================
  // LOAD TOPIC
  // ===============================

  async loadTopic(
    topicId: number
  ): Promise<void> {

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
        'id',
        topicId
      )

      .single();


    console.log(
      'TOPIC DATA:',
      data
    );


    console.log(
      'TOPIC ERROR:',
      error
    );


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        'Topic not found.'
      );

    }


    // ===============================
    // UPDATE SIGNAL
    // ===============================

    this.topic.set(
      data as Topic
    );

  }


  // ===============================
  // BACK LINK
  // ===============================

  get backLink(): string {

    const currentTopic =
      this.topic();


    if (!currentTopic) {

      return '/subjects';

    }


    return `/subjects/${currentTopic.subject_id}`;

  }


  // ===============================
  // PRACTICE LINK
  // ===============================

  get practiceLink(): string {

    const currentTopic =
      this.topic();


    if (!currentTopic) {

      return '/subjects';

    }


    return `/subjects/${currentTopic.subject_id}/topics/${currentTopic.id}/questions`;

  }

}