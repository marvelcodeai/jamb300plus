import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../services/supabase';

@Component({

  selector: 'app-login',

  standalone: true,

  imports: [

    FormsModule,

    RouterLink

  ],

  templateUrl: './login.html',

  styleUrl: './login.css'

})

export class Login {

  email = '';

  password = '';

  emailError = '';

  passwordError = '';

  loginError = '';

  isLoading = false;

  constructor(

    private router: Router,

    private supabaseService: SupabaseService

  ) {}

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  validateEmail(): void {

    if (!this.email.trim()) {

      this.emailError = 'Email is required';

      return;

    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(this.email.trim())) {

      this.emailError =
        'Please enter a valid email address';

      return;

    }

    this.emailError = '';

  }

  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================

  validatePassword(): void {

    if (!this.password) {

      this.passwordError =
        'Password is required';

      return;

    }

    if (this.password.length < 6) {

      this.passwordError =
        'Password must be at least 6 characters';

      return;

    }

    this.passwordError = '';

  }

  // =====================================================
  // LOGIN
  // =====================================================

  async onLogin(): Promise<void> {

    // ---------------------------------------------------
    // RESET ERROR
    // ---------------------------------------------------

    this.loginError = '';

    // ---------------------------------------------------
    // VALIDATE
    // ---------------------------------------------------

    this.validateEmail();

    this.validatePassword();

    // ---------------------------------------------------
    // STOP IF INVALID
    // ---------------------------------------------------

    if (
      this.emailError ||
      this.passwordError
    ) {

      return;

    }

    // ---------------------------------------------------
    // LOADING
    // ---------------------------------------------------

    this.isLoading = true;

    try {

      // -------------------------------------------------
      // SUPABASE CLIENT
      // -------------------------------------------------

      const supabase =
        this.supabaseService.client;

      // -------------------------------------------------
      // LOGIN
      // -------------------------------------------------

      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({

            email:
              this.email.trim().toLowerCase(),

            password:
              this.password

          });

      // -------------------------------------------------
      // SUPABASE ERROR
      // -------------------------------------------------

      if (error) {

        console.error(
          '❌ SUPABASE LOGIN ERROR:',
          error
        );

        this.loginError =
          error.message ||
          'Invalid email or password.';

        return;

      }

      // -------------------------------------------------
      // LOGIN SUCCESS
      // -------------------------------------------------

      if (data.session) {

        console.log(
          '================================'
        );

        console.log(
          '✅ LOGIN SUCCESS'
        );

        console.log(
          'User:',
          data.user
        );

        console.log(
          '================================'
        );

        // -----------------------------------------------
        // GO TO HOME
        // -----------------------------------------------

        await this.router.navigate([
          '/home'
        ]);

      } else {

        this.loginError =
          'Login failed. Please try again.';

      }

    } catch (error) {

      console.error(
        '❌ LOGIN SERVER ERROR:',
        error
      );

      this.loginError =
        'Something went wrong. Please try again.';

    } finally {

      this.isLoading = false;

    }

  }

}
