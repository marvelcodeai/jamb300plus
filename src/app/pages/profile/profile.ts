import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  fullName = 'Student';
  email = '';
  goal = '300+';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {

    const supabase = this.supabaseService.client;

    const { data } = await supabase.auth.getUser();

    if (data.user) {

      this.email = data.user.email || '';

      this.fullName =
        data.user.user_metadata?.['full_name'] ||
        'Student';
    }
  }

  async logout(): Promise<void> {

    await this.supabaseService.client.auth.signOut();

    this.router.navigate(['/login']);
  }
}