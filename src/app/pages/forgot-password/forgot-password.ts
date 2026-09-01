import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {

  // =====================================================
  // PRODUCTION BACKEND
  // =====================================================

  private readonly API_URL =
    'https://jamb300plus-backend.onrender.com';

  // =====================================================
  // FORM DATA
  // =====================================================

  email = '';

  // =====================================================
  // ERRORS & STATE
  // =====================================================

  emailError = '';
  resetError = '';
  successMessage = '';
  isLoading = false;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  validateEmail(): void {

    const email = this.email.trim();

    if (!email) {
      this.emailError = 'Email is required';
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.emailError =
        'Please enter a valid email address';
      return;
    }

    this.emailError = '';
  }

  // =====================================================
  // SUBMIT FORGOT PASSWORD
  // =====================================================

  onSubmit(): void {

    // ---------------------------------------------------
    // RESET STATE
    // ---------------------------------------------------

    this.resetError = '';
    this.successMessage = '';

    // ---------------------------------------------------
    // VALIDATE EMAIL
    // ---------------------------------------------------

    this.validateEmail();

    if (this.emailError) {
      return;
    }

    // ---------------------------------------------------
    // LOADING
    // ---------------------------------------------------

    this.isLoading = true;

    // ---------------------------------------------------
    // CLEAN EMAIL
    // ---------------------------------------------------

    const email = this.email.trim().toLowerCase();

    // ---------------------------------------------------
    // DEBUG
    // ---------------------------------------------------

    console.log('================================');
    console.log('FORGOT PASSWORD REQUEST');
    console.log('================================');

    console.log({
      email
    });

    // ---------------------------------------------------
    // SEND REQUEST TO PRODUCTION BACKEND
    // ---------------------------------------------------

    this.http
      .post<any>(
        `${this.API_URL}/api/auth/forgot-password`,
        {
          email
        }
      )
      .subscribe({

        // ===============================================
        // SUCCESS
        // ===============================================

        next: (response) => {

          console.log('================================');
          console.log('FORGOT PASSWORD RESPONSE');
          console.log('================================');

          console.log(response);

          this.isLoading = false;

          if (!response?.success) {

            this.resetError =
              response?.message ||
              'Unable to send reset instructions.';

            return;
          }

          // ------------------------------------------------
          // SUCCESS
          // ------------------------------------------------

          this.successMessage =
            response.message ||
            'Password reset instructions have been sent to your email.';

          console.log(
            '✅ Password reset request successful.'
          );
        },

        // ===============================================
        // ERROR
        // ===============================================

        error: (error) => {

          console.error(
            '================================'
          );

          console.error(
            '❌ FORGOT PASSWORD ERROR'
          );

          console.error(
            '================================'
          );

          console.error(
            'Status:',
            error?.status
          );

          console.error(
            'Status text:',
            error?.statusText
          );

          console.error(
            'URL:',
            error?.url
          );

          console.error(
            'Backend response:',
            error?.error
          );

          this.isLoading = false;

          this.resetError =
            error?.error?.message ||
            'Unable to connect to the server. Please try again.';
        }
      });
  }
}
