
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

  email = '';

  emailError = '';
  resetError = '';
  successMessage = '';

  isLoading = false;

  constructor(
    private http: HttpClient
  ) {}

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

  onSubmit(): void {

    this.validateEmail();

    if (this.emailError) {
      return;
    }

    this.resetError = '';
    this.successMessage = '';
    this.isLoading = true;

    this.http
      .post<any>(
        'http://localhost:3000/api/auth/forgot-password',
        {
          email: this.email.trim()
        }
      )
      .subscribe({

        next: (response) => {

          this.isLoading = false;

          if (response?.success) {

            this.successMessage =
              response.message ||
              'Password reset instructions have been sent to your email.';

          } else {

            this.resetError =
              response?.message ||
              'Unable to send reset instructions.';

          }
        },

        error: (error) => {

          this.isLoading = false;

          console.error(
            'FORGOT PASSWORD ERROR:',
            error
          );

          this.resetError =
            error?.error?.message ||
            'Unable to connect to the server.';
        }

      });
  }
}
