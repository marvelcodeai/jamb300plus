import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

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

  // =====================================================
  // USER INFORMATION
  // =====================================================

  email = '';
  password = '';

  // =====================================================
  // ERRORS
  // =====================================================

  emailError = '';
  passwordError = '';
  loginError = '';

  // =====================================================
  // UI STATE
  // =====================================================

  isLoading = false;
  loginSuccess = false;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  validateEmail(): void {
    const cleanEmail = this.email.trim();

    if (!cleanEmail) {
      this.emailError = 'Email is required';
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
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
      this.passwordError = 'Password is required';
      return;
    }

    this.passwordError = '';
  }

  // =====================================================
  // LOGIN
  // =====================================================

  onLogin(): void {

    // ---------------------------------------------------
    // RESET STATE
    // ---------------------------------------------------

    this.loginError = '';
    this.loginSuccess = false;

    // ---------------------------------------------------
    // VALIDATE FORM
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

    // ---------------------------------------------------
    // CLEAN EMAIL
    // ---------------------------------------------------

    const cleanEmail =
      this.email.trim().toLowerCase();

    // ---------------------------------------------------
    // DEBUG
    // ---------------------------------------------------

    console.log('================================');
    console.log('🔐 LOGIN REQUEST');
    console.log('================================');

    console.log({
      email: cleanEmail
    });

    // ---------------------------------------------------
    // SEND LOGIN REQUEST
    // ---------------------------------------------------

    this.apiService
      .login(
        cleanEmail,
        this.password
      )
      .subscribe({

        // ===============================================
        // SUCCESS
        // ===============================================

        next: (response) => {

          console.log('================================');
          console.log('✅ LOGIN RESPONSE');
          console.log('================================');

          console.log(response);

          this.isLoading = false;

          // ------------------------------------------------
          // CHECK BACKEND RESPONSE
          // ------------------------------------------------

          if (!response?.success) {

            this.loginError =
              response?.message ||
              'Login failed.';

            return;
          }

          // ------------------------------------------------
          // GET ACCESS TOKEN
          // ------------------------------------------------

          const accessToken =
            response?.session?.accessToken;

          if (!accessToken) {

            console.error(
              '❌ Login succeeded but no access token was returned.'
            );

            this.loginError =
              'Login succeeded, but your session could not be created.';

            return;
          }

          // ------------------------------------------------
          // SAVE ACCESS TOKEN
          // ------------------------------------------------

          localStorage.setItem(
            'access_token',
            accessToken
          );

          // ------------------------------------------------
          // SAVE REFRESH TOKEN
          // ------------------------------------------------

          if (response?.session?.refreshToken) {

            localStorage.setItem(
              'refresh_token',
              response.session.refreshToken
            );
          }

          // ------------------------------------------------
          // SAVE USER INFORMATION
          // ------------------------------------------------

          if (response?.user) {

            localStorage.setItem(
              'current_user',
              JSON.stringify(response.user)
            );
          }

          // ------------------------------------------------
          // LOGIN SUCCESS
          // ------------------------------------------------

          this.loginSuccess = true;

          console.log(
            '✅ Login successful.'
          );

          console.log(
            'Logged in as:',
            cleanEmail
          );

          // ------------------------------------------------
          // NAVIGATE TO HOME
          // ------------------------------------------------

          setTimeout(() => {

            this.router.navigate([
              '/home'
            ]);

          }, 500);
        },

        // ===============================================
        // ERROR
        // ===============================================

        error: (error) => {

          console.error(
            '================================'
          );

          console.error(
            '❌ LOGIN ERROR'
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

          // ------------------------------------------------
          // BACKEND ERROR MESSAGE
          // ------------------------------------------------

          this.loginError =
            error?.error?.message ||
            'Unable to connect to the server. Please try again.';
        }
      });
  }
}