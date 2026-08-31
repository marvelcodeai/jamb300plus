import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  backendMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.testBackend().subscribe({
      next: (response) => {
        this.backendMessage = response.message;
        console.log('BACKEND:', response);
      },
      error: (error) => {
        console.error('Backend connection failed:', error);
      }
    });
  }
}
