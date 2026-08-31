
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-past-questions',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './past-questions.html',
  styleUrl: './past-questions.css'
})
export class PastQuestions {

  years: number[] = Array.from(
    { length: 27 },
    (_, index) => 2026 - index
  );

}
