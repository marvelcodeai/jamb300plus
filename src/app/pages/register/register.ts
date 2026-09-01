import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  // =====================================================
  // PRODUCTION BACKEND
  // =====================================================

  private readonly API_URL =
    'https://jamb300plus-backend.onrender.com';

  // =====================================================
  // USER INFORMATION
  // =====================================================

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  // =====================================================
  // ERRORS
  // =====================================================

  fullNameError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  registerError = '';

  registrationSuccess = false;
  isLoading = false;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // =====================================================
  // FULL NAME VALIDATION
  // =====================================================

  validateFullName(): void {

    const name = this.fullName.trim();

    if (!name) {
      this.fullNameError =
        'Full name is required';
      return;
    }

    if (name.length < 3) {
      this.fullNameError =
        'Please enter your full name';
      return;
    }

    this.fullNameError = '';
  }

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  validateEmail(): void {

    const email = this.email.trim();

    if (!email) {
      this.emailError =
        'Email is required';
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
  // CONFIRM PASSWORD VALIDATION
  // =====================================================

  validateConfirmPassword(): void {

    if (!this.confirmPassword) {
      this.confirmPasswordError =
        'Please confirm your password';
      return;
    }

    if (this.confirmPassword !== this.password) {
      this.confirmPasswordError =
        'Passwords do not match';
      return;
    }

    this.confirmPasswordError = '';
  }

  // =====================================================
  // REGISTER
  // =====================================================

  onRegister(): void {

    // ---------------------------------------------------
    // RESET STATE
    // ---------------------------------------------------

    this.registerError = '';
    this.registrationSuccess = false;

    // ---------------------------------------------------
    // VALIDATE
    // ---------------------------------------------------

    this.validateFullName();
    this.validateEmail();
    this.validatePassword();
    this.validateConfirmPassword();

    // ---------------------------------------------------
    // STOP IF INVALID
    // ---------------------------------------------------

    if (
      this.fullNameError ||
      this.emailError ||
      this.passwordError ||
      this.confirmPasswordError
    ) {
      return;
    }

    this.isLoading = true;

    // ---------------------------------------------------
    // CLEAN DATA
    // ---------------------------------------------------

    const registerData = {
      fullName: this.fullName.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    // ---------------------------------------------------
    // DEBUG
    // ---------------------------------------------------

    console.log('================================');
    console.log('REGISTER REQUEST');
    console.log('================================');

    console.log({
      fullName: registerData.fullName,
      email: registerData.email
    });

    console.log(
      'Backend:',
      `${this.API_URL}/api/auth/register`
    );

    // ---------------------------------------------------
    // SEND TO PRODUCTION EXPRESS BACKEND
    // ---------------------------------------------------

    this.http.post<any>(
      `${this.API_URL}/api/auth/register`,
      registerData
    )
    .subscribe({

      // ================================================
      // SUCCESS
      // ================================================

      next: (response) => {

        console.log('================================');
        console.log('REGISTER RESPONSE');
        console.log('================================');

        console.log(response);

        this.isLoading = false;

        if (!response?.success) {

          this.registerError =
            response?.message ||
            'Registration failed.';

          return;
        }

        // ------------------------------------------------
        // SUCCESS
        // ------------------------------------------------

        this.registrationSuccess = true;

        console.log(
          '✅ Registration successful.'
        );

        console.log(
          'Account created for:',
          registerData.email
        );

        // ------------------------------------------------
        // GO TO LOGIN
        // ------------------------------------------------

        setTimeout(() => {

          this.router.navigate(['/login']);

        }, 1000);
      },

      // ================================================
      // ERROR
      // ================================================

      error: (error) => {

        console.error(
          '================================'
        );

        console.error(
          '❌ REGISTER ERROR'
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

        this.registerError =
          error?.error?.message ||
          'Unable to connect to the server. Please try again.';
      }
    });
  }
}
