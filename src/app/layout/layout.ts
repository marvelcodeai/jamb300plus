import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { SupabaseService } from '../services/supabase';


@Component({
  selector: 'app-layout',
  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './layout.html',
  styleUrl: './layout.css'
})


export class Layout implements OnInit {

  // ===============================
  // SIDEBAR
  // ===============================

  sidebarOpen = false;


  // ===============================
  // USER INFORMATION
  // SIGNALS
  // ===============================

  userName = signal('Student');

  userEmail = signal('Candidate');

  userExam = signal('JAMB');

  userInitial = signal('S');


  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}


  // ===============================
  // INITIALIZE
  // ===============================

  ngOnInit(): void {

    /*
     * Do NOT wait for Supabase here.
     *
     * Layout renders immediately.
     * User information loads in background.
     */

    this.loadUser();

  }


  // ===============================
  // LOAD USER
  // ===============================

  async loadUser(): Promise<void> {

    try {

      const supabase =
        this.supabaseService.client;


      const {
        data,
        error
      } = await supabase.auth.getUser();


      // ===============================
      // NO USER
      // ===============================

      if (error || !data.user) {

        console.log(
          'No logged-in user.'
        );

        return;

      }


      const user =
        data.user;


      // ===============================
      // USER METADATA
      // ===============================

      const metadata =
        user.user_metadata || {};


      const fullName =
        metadata['full_name'] ||
        metadata['fullName'] ||
        'Student';


      const email =
        user.email ||
        'Candidate';


      const examType =
        metadata['exam_type'] ||
        metadata['examType'] ||
        'JAMB';


      // ===============================
      // UPDATE SIGNALS
      // ===============================

      this.userName.set(
        fullName
      );

      this.userEmail.set(
        email
      );

      this.userExam.set(
        examType
      );


      // ===============================
      // INITIAL
      // ===============================

      this.userInitial.set(

        fullName
          .trim()
          .charAt(0)
          .toUpperCase() || 'S'

      );


      // ===============================
      // DEBUG
      // ===============================

      console.log(
        'LOGGED-IN USER:',
        {
          name: this.userName(),
          email: this.userEmail(),
          exam: this.userExam(),
          initial: this.userInitial()
        }
      );


    } catch (error) {

      console.error(
        'USER LOAD ERROR:',
        error
      );

    }

  }


  // ===============================
  // SIDEBAR
  // ===============================

  toggleSidebar(): void {

    this.sidebarOpen =
      !this.sidebarOpen;

  }


  closeSidebar(): void {

    this.sidebarOpen = false;

  }


  // ===============================
  // LOGOUT
  // ===============================

  async logout(): Promise<void> {

    this.sidebarOpen = false;


    try {

      const supabase =
        this.supabaseService.client;


      const {
        error
      } = await supabase.auth.signOut();


      if (error) {

        console.error(
          'LOGOUT ERROR:',
          error
        );

        return;

      }


      console.log(
        'USER LOGGED OUT'
      );


      await this.router.navigate([
        '/login'
      ]);


    } catch (error) {

      console.error(
        'LOGOUT ERROR:',
        error
      );

    }

  }

}
