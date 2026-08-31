import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-weekly-test-instructions',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './weekly-test-instructions.html',
  styleUrl: './weekly-test-instructions.css'
})
export class WeeklyTestInstructions {

  questionCount = 180;

  durationMinutes = 120;

  subjects = [
    {
      name: 'Use of English',
      questions: 60
    },
    {
      name: 'Subject 2',
      questions: 40
    },
    {
      name: 'Subject 3',
      questions: 40
    },
    {
      name: 'Subject 4',
      questions: 40
    }
  ];

  constructor(
    private router: Router
  ) {}

  beginTest(): void {

    this.router.navigate([
      '/weekly-test/take'
    ]);

  }

  goBack(): void {

    this.router.navigate([
      '/weekly-test'
    ]);

  }

}