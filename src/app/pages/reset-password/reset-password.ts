
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {

  password = '';
  confirmPassword = '';

  passwordError = '';
  confirmPasswordError = '';
  resetError = '';
  successMessage = '';

  isLoading = false;
  hasRecoverySession = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {

    const supabase = this.supabaseService.client;

    console.log('RESET PASSWORD PAGE LOADED');
    console.log('Current URL:', window.location.href);

    /*
    ================================================
    CHECK SUPABASE SESSION
    ================================================
    */

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('GET SESSION ERROR:', error);
      this.resetError =
        'Unable to verify your password reset session.';
      return;
    }

    if (session) {

      console.log('RECOVERY SESSION FOUND');
      console.log('User:', session.user.email);

      this.hasRecoverySession = true;
      this.resetError = '';

    } else {

      console.log('NO RECOVERY SESSION YET');

      /*
      ================================================
      LISTEN FOR PASSWORD RECOVERY
      ================================================
      */

      supabase.auth.onAuthStateChange(
        (event, newSession) => {

          console.log(
            'SUPABASE AUTH EVENT:',
            event
          );

          if (
            event === 'PASSWORD_RECOVERY' &&
            newSession
          ) {

            console.log(
              'PASSWORD RECOVERY SESSION READY'
            );

            this.hasRecoverySession = true;
            this.resetError = '';
          }
        }
      );

      /*
      ================================================
      CHECK URL
      ================================================
      */

      const hash = window.location.hash;

      if (!hash) {

        this.resetError =
          'This password reset link is invalid or has expired.';
      }
    }
  }


  /*
  ================================================
  VALIDATE PASSWORD
  ================================================
  */

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


  /*
  ================================================
  VALIDATE CONFIRM PASSWORD
  ================================================
  */

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


  /*
  ================================================
  UPDATE PASSWORD
  ================================================
  */

  async onResetPassword(): Promise<void> {

    this.validatePassword();
    this.validateConfirmPassword();

    if (
      this.passwordError ||
      this.confirmPasswordError
    ) {
      return;
    }

    this.resetError = '';
    this.successMessage = '';
    this.isLoading = true;

    try {

      const supabase =
        this.supabaseService.client;

      /*
      ================================================
      CHECK RECOVERY SESSION
      ================================================
      */

      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {

        console.error(
          'SESSION ERROR:',
          sessionError
        );

        this.resetError =
          'Unable to verify your reset session.';

        this.isLoading = false;
        return;
      }

      if (!session) {

        this.resetError =
          'Your password reset session has expired. Please request a new reset link.';

        this.isLoading = false;
        return;
      }

      /*
      ================================================
      UPDATE PASSWORD
      ================================================
      */

      const { error } =
        await supabase.auth.updateUser({
          password: this.password
        });

      if (error) {

        console.error(
          'PASSWORD UPDATE ERROR:',
          error
        );

        this.resetError =
          error.message ||
          'Unable to update your password.';

        this.isLoading = false;
        return;
      }

      /*
      ================================================
      SUCCESS
      ================================================
      */

      console.log(
        'PASSWORD UPDATED SUCCESSFULLY'
      );

      this.successMessage =
        'Your password has been updated successfully!';

      this.password = '';
      this.confirmPassword = '';

      this.isLoading = false;

      /*
      ================================================
      SIGN OUT
      ================================================
      */

      await supabase.auth.signOut();

      /*
      ================================================
      RETURN TO LOGIN
      ================================================
      */

      setTimeout(() => {

        this.router.navigate(['/login']);

      }, 2000);

    } catch (error) {

      console.error(
        'PASSWORD RESET ERROR:',
        error
      );

      this.resetError =
        'Something went wrong while updating your password.';

      this.isLoading = false;
    }
  }
}
