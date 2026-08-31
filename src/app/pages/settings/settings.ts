import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  SupabaseService
} from '../../services/supabase';


@Component({
  selector: 'app-settings',
  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './settings.html',
  styleUrl: './settings.css'
})


export class Settings implements OnInit {


  // =====================================================
  // PROFILE
  // =====================================================

  fullName = signal('');

  email = signal('');

  examType = signal('JAMB');

  profileImage = signal<string | null>(null);


  // =====================================================
  // SECURITY
  // =====================================================

  currentPassword = signal('');

  newPassword = signal('');

  confirmPassword = signal('');

  showCurrentPassword = signal(false);

  showNewPassword = signal(false);

  showConfirmPassword = signal(false);


  // =====================================================
  // APPEARANCE
  // =====================================================

  theme = signal<'light' | 'dark' | 'system'>('light');


  // =====================================================
  // STUDY PREFERENCES
  // =====================================================

  targetScore = signal(300);


  // =====================================================
  // UI STATE
  // =====================================================

  loading = signal(true);

  saving = signal(false);

  message = signal('');

  errorMessage = signal('');


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private supabaseService: SupabaseService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  async ngOnInit(): Promise<void> {

    await this.loadSettings();

    this.applyTheme(this.theme());

  }


  // =====================================================
  // LOAD SETTINGS
  // =====================================================

  async loadSettings(): Promise<void> {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      const supabase =
        this.supabaseService.client;


      // -----------------------------------------------
      // GET CURRENT USER
      // -----------------------------------------------

      const {
        data,
        error
      } = await supabase.auth.getUser();


      if (error) {
        throw error;
      }


      if (!data.user) {

        throw new Error(
          'No logged-in user found.'
        );

      }


      const user =
        data.user;


      // -----------------------------------------------
      // EMAIL
      // -----------------------------------------------

      this.email.set(
        user.email || ''
      );


      // -----------------------------------------------
      // USER METADATA
      // -----------------------------------------------

      const metadata =
        user.user_metadata || {};


      const name =
        metadata['full_name'] ||
        metadata['fullName'] ||
        'Student';


      const exam =
        metadata['exam_type'] ||
        metadata['examType'] ||
        'JAMB';


      const avatar =
        metadata['avatar_url'] ||
        metadata['avatarUrl'] ||
        null;


      this.fullName.set(name);

      this.examType.set(exam);

      this.profileImage.set(avatar);


      // -----------------------------------------------
      // THEME
      // -----------------------------------------------

      const savedTheme =
        localStorage.getItem(
          'jamb300plus-theme'
        );


      if (
        savedTheme === 'light' ||
        savedTheme === 'dark' ||
        savedTheme === 'system'
      ) {

        this.theme.set(savedTheme);

      }


      // -----------------------------------------------
      // TARGET SCORE
      // -----------------------------------------------

      const savedTarget =
        localStorage.getItem(
          'jamb300plus-target'
        );


      if (savedTarget !== null) {

        const target =
          Number(savedTarget);


        if (
          Number.isFinite(target) &&
          target >= 100 &&
          target <= 400
        ) {

          this.targetScore.set(
            target
          );

        }

      }

    } catch (error: any) {

      console.error(
        'SETTINGS LOAD ERROR:',
        error
      );


      this.errorMessage.set(
        error?.message ||
        'Unable to load your settings.'
      );

    } finally {

      this.loading.set(false);

    }

  }


  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  async saveSettings(): Promise<void> {

    if (this.saving()) {
      return;
    }


    this.saving.set(true);

    this.message.set('');

    this.errorMessage.set('');


    try {

      const supabase =
        this.supabaseService.client;


      // -----------------------------------------------
      // VALIDATE NAME
      // -----------------------------------------------

      const name =
        this.fullName().trim();


      if (!name) {

        throw new Error(
          'Please enter your full name.'
        );

      }


      // -----------------------------------------------
      // VALIDATE TARGET SCORE
      // -----------------------------------------------

      const target =
        Number(this.targetScore());


      if (
        !Number.isFinite(target) ||
        target < 100 ||
        target > 400
      ) {

        throw new Error(
          'Target score must be between 100 and 400.'
        );

      }


      // -----------------------------------------------
      // PASSWORD CHANGE?
      // -----------------------------------------------

      const wantsPasswordChange =
        !!(
          this.currentPassword() ||
          this.newPassword() ||
          this.confirmPassword()
        );


      if (wantsPasswordChange) {

        await this.changePassword();

      }


      // -----------------------------------------------
      // UPDATE AUTH PROFILE
      // -----------------------------------------------

      const {
        error: updateError
      } = await supabase.auth.updateUser({

        data: {

          full_name:
            name,

          exam_type:
            this.examType(),

          avatar_url:
            this.profileImage()

        }

      });


      if (updateError) {
        throw updateError;
      }


      // -----------------------------------------------
      // SAVE THEME
      // -----------------------------------------------

      localStorage.setItem(
        'jamb300plus-theme',
        this.theme()
      );


      this.applyTheme(
        this.theme()
      );


      // -----------------------------------------------
      // SAVE TARGET
      // -----------------------------------------------

      localStorage.setItem(
        'jamb300plus-target',
        String(target)
      );


      this.targetScore.set(target);


      // -----------------------------------------------
      // CLEAR PASSWORD FIELDS
      // -----------------------------------------------

      this.currentPassword.set('');

      this.newPassword.set('');

      this.confirmPassword.set('');

      this.showCurrentPassword.set(false);

      this.showNewPassword.set(false);

      this.showConfirmPassword.set(false);


      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      this.message.set(
        'Your settings have been saved successfully.'
      );


    } catch (error: any) {

      console.error(
        'SETTINGS SAVE ERROR:',
        error
      );


      this.errorMessage.set(
        error?.message ||
        'Unable to save your settings.'
      );

    } finally {

      this.saving.set(false);

    }

  }


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  private async changePassword(): Promise<void> {

    const supabase =
      this.supabaseService.client;


    // -----------------------------------------------
    // CURRENT PASSWORD
    // -----------------------------------------------

    if (!this.currentPassword()) {

      throw new Error(
        'Please enter your current password.'
      );

    }


    // -----------------------------------------------
    // NEW PASSWORD
    // -----------------------------------------------

    if (!this.newPassword()) {

      throw new Error(
        'Please enter your new password.'
      );

    }


    if (
      this.newPassword().length < 6
    ) {

      throw new Error(
        'New password must be at least 6 characters.'
      );

    }


    // -----------------------------------------------
    // CONFIRM PASSWORD
    // -----------------------------------------------

    if (!this.confirmPassword()) {

      throw new Error(
        'Please confirm your new password.'
      );

    }


    if (
      this.newPassword() !==
      this.confirmPassword()
    ) {

      throw new Error(
        'New passwords do not match.'
      );

    }


    // -----------------------------------------------
    // GET USER
    // -----------------------------------------------

    const {
      data,
      error
    } = await supabase.auth.getUser();


    if (
      error ||
      !data.user
    ) {

      throw new Error(
        'Unable to verify your account.'
      );

    }


    const user =
      data.user;


    if (!user.email) {

      throw new Error(
        'Your account does not have an email address.'
      );

    }


    // -----------------------------------------------
    // VERIFY CURRENT PASSWORD
    // -----------------------------------------------

    const {
      error: verifyError
    } =
      await supabase.auth.signInWithPassword({

        email:
          user.email,

        password:
          this.currentPassword()

      });


    if (verifyError) {

      throw new Error(
        'Current password is incorrect.'
      );

    }


    // -----------------------------------------------
    // UPDATE PASSWORD
    // -----------------------------------------------

    const {
      error: passwordError
    } =
      await supabase.auth.updateUser({

        password:
          this.newPassword()

      });


    if (passwordError) {
      throw passwordError;
    }

  }


  // =====================================================
  // PROFILE PHOTO
  // =====================================================

  onProfileImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    // -----------------------------------------------
    // FILE TYPE
    // -----------------------------------------------

    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage.set(
        'Please select a valid image file.'
      );

      input.value = '';

      return;

    }


    // -----------------------------------------------
    // FILE SIZE
    // -----------------------------------------------

    if (
      file.size > 5 * 1024 * 1024
    ) {

      this.errorMessage.set(
        'Profile image must be smaller than 5MB.'
      );

      input.value = '';

      return;

    }


    // -----------------------------------------------
    // PREVIEW
    // -----------------------------------------------

    const reader =
      new FileReader();


    reader.onload = () => {

      this.profileImage.set(
        reader.result as string
      );

      this.errorMessage.set('');

    };


    reader.onerror = () => {

      this.errorMessage.set(
        'Unable to read the selected image.'
      );

    };


    reader.readAsDataURL(file);

  }


  // =====================================================
  // REMOVE PROFILE PHOTO
  // =====================================================

  removeProfileImage(): void {

    this.profileImage.set(null);

  }


  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  toggleCurrentPassword(): void {

    this.showCurrentPassword.update(
      value => !value
    );

  }


  toggleNewPassword(): void {

    this.showNewPassword.update(
      value => !value
    );

  }


  toggleConfirmPassword(): void {

    this.showConfirmPassword.update(
      value => !value
    );

  }


  // =====================================================
  // THEME
  // =====================================================

  setTheme(
    value: 'light' | 'dark' | 'system'
  ): void {

    this.theme.set(value);

    this.applyTheme(value);


    localStorage.setItem(
      'jamb300plus-theme',
      value
    );

  }


  // =====================================================
  // APPLY THEME
  // =====================================================

  private applyTheme(
    theme: 'light' | 'dark' | 'system'
  ): void {

    const html =
      document.documentElement;

    const body =
      document.body;


    html.classList.remove(
      'dark-theme',
      'light-theme'
    );


    body.classList.remove(
      'dark-theme',
      'light-theme'
    );


    // -----------------------------------------------
    // DARK
    // -----------------------------------------------

    if (theme === 'dark') {

      html.classList.add(
        'dark-theme'
      );

      body.classList.add(
        'dark-theme'
      );

      return;

    }


    // -----------------------------------------------
    // LIGHT
    // -----------------------------------------------

    if (theme === 'light') {

      html.classList.add(
        'light-theme'
      );

      body.classList.add(
        'light-theme'
      );

      return;

    }


    // -----------------------------------------------
    // SYSTEM
    // -----------------------------------------------

    const prefersDark =
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;


    if (prefersDark) {

      html.classList.add(
        'dark-theme'
      );

      body.classList.add(
        'dark-theme'
      );

    } else {

      html.classList.add(
        'light-theme'
      );

      body.classList.add(
        'light-theme'
      );

    }

  }


  // =====================================================
  // TARGET SCORE
  // =====================================================

  updateTargetScore(
    value: string | number
  ): void {

    const score =
      Number(value);


    if (!Number.isFinite(score)) {
      return;
    }


    this.targetScore.set(
      Math.min(
        400,
        Math.max(
          100,
          score
        )
      )
    );

  }


  // =====================================================
  // INITIALS
  // =====================================================

  getInitials(): string {

    const name =
      this.fullName().trim();


    if (!name) {
      return 'S';
    }


    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join('');

  }

}