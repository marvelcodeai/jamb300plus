import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

interface Question {
id: number;
subject_id: number;
topic_id: number;
question_text: string;
option_a: string;
option_b: string;
option_c: string;
option_d: string;
correct_answer: string;
year: number;
explanation?: string;
}

@Component({
selector: 'app-questions',
standalone: true,
imports: [
CommonModule,
RouterLink
],
templateUrl: './questions.html',
styleUrl: './questions.css'
})
export class Questions implements OnInit {

// ===============================
// QUESTION DATA
// ===============================

allQuestions = signal<Question[]>([]);

questions = signal<Question[]>([]);

currentIndex = signal(0);

selectedAnswer = signal('');

answered = signal(false);

// ===============================
// LOADING / ERROR
// ===============================

loading = signal(true);

errorMessage = signal('');

// ===============================
// ROUTE DATA
// ===============================

subjectId = signal<number | null>(null);

topicId = signal<number | null>(null);

// ===============================
// QUIZ SETUP
// ===============================

setupComplete = signal(false);

selectedQuestionCount = signal(10);

shuffleQuestions = signal(false);

readonly questionOptions = [
10,
20,
30,
40,
50,
60,
100
];

// ===============================
// STUDY / EXAM MODE
// ===============================

mode = signal<'study' | 'exam'>('study');

examAnswers = signal<{
[questionId: number]: string;
}>({});

examFinished = signal(false);

examScore = signal(0);

// ===============================
// CONSTRUCTOR
// ===============================

constructor(
private route: ActivatedRoute,
private supabaseService: SupabaseService
) {}

// ===============================
// INITIALIZE
// ===============================

async ngOnInit(): Promise<void> {


const subjectIdParam =
  this.route.snapshot.paramMap.get('subjectId');

const topicIdParam =
  this.route.snapshot.paramMap.get('topicId');


console.log(
  'SUBJECT ID FROM URL:',
  subjectIdParam
);

console.log(
  'TOPIC ID FROM URL:',
  topicIdParam
);


// ===============================
// NO ROUTE PARAMETERS
// ===============================

if (!subjectIdParam || !topicIdParam) {

  this.errorMessage.set(
    'Invalid question page.'
  );

  this.loading.set(false);

  return;

}


// ===============================
// CONVERT PARAMETERS
// ===============================

const parsedSubjectId =
  Number(subjectIdParam);

const parsedTopicId =
  Number(topicIdParam);


if (
  !Number.isFinite(parsedSubjectId) ||
  !Number.isFinite(parsedTopicId)
) {

  this.errorMessage.set(
    'Invalid subject or topic.'
  );

  this.loading.set(false);

  return;

}


// ===============================
// SAVE ROUTE DATA
// ===============================

this.subjectId.set(parsedSubjectId);

this.topicId.set(parsedTopicId);


// ===============================
// LOAD QUESTIONS
// ===============================

await this.loadQuestions();


}

// ===============================
// LOAD QUESTIONS
// ===============================

async loadQuestions(): Promise<void> {


this.loading.set(true);

this.errorMessage.set('');


try {

  const topicId =
    this.topicId();


  if (topicId === null) {

    this.errorMessage.set(
      'Invalid topic.'
    );

    return;

  }


  const supabase =
    this.supabaseService.client;


  // ===============================
  // FETCH QUESTIONS
  // ===============================

  const {
    data,
    error
  } = await supabase

    .from('questions')

    .select(`
      id,
      subject_id,
      topic_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      year,
      explanation
    `)

    .eq(
      'topic_id',
      topicId
    )

    .order(
      'id',
      {
        ascending: true
      }
    );


  console.log(
    'QUESTIONS DATA:',
    data
  );

  console.log(
    'QUESTIONS ERROR:',
    error
  );


  // ===============================
  // HANDLE ERROR
  // ===============================

  if (error) {

    console.error(
      'QUESTION LOAD ERROR:',
      error
    );

    this.errorMessage.set(
      'Unable to load questions. Please try again.'
    );

    return;

  }


  // ===============================
  // UPDATE QUESTIONS
  // ===============================

  const loadedQuestions =
    (data ?? []) as Question[];


  this.allQuestions.set(
    loadedQuestions
  );


  console.log(
    'TOTAL AVAILABLE QUESTIONS:',
    loadedQuestions.length
  );


  // ===============================
  // EMPTY STATE
  // ===============================

  if (loadedQuestions.length === 0) {

    this.errorMessage.set(
      'No questions available for this topic.'
    );

  }

} catch (error) {

  console.error(
    'UNEXPECTED QUESTION ERROR:',
    error
  );

  this.errorMessage.set(
    'Unable to load questions. Please try again.'
  );

} finally {

  this.loading.set(false);

}


}

// ===============================
// SELECT QUESTION COUNT
// ===============================

selectQuestionCount(
count: number
): void {


this.selectedQuestionCount.set(
  count
);


}

// ===============================
// TOGGLE SHUFFLE
// ===============================

toggleShuffle(): void {


this.shuffleQuestions.update(
  value => !value
);


}

// ===============================
// STUDY MODE
// ===============================

selectStudyMode(): void {


this.mode.set(
  'study'
);


}

// ===============================
// EXAM MODE
// ===============================

selectExamMode(): void {


this.mode.set(
  'exam'
);

}

// ===============================
// START PRACTICE
// ===============================

startPractice(): void {


const availableQuestions =
  this.allQuestions();


if (
  availableQuestions.length === 0
) {

  return;

}


// ===============================
// DETERMINE QUESTION COUNT
// ===============================

const amount =
  Math.min(
    this.selectedQuestionCount(),
    availableQuestions.length
  );


// ===============================
// COPY QUESTIONS
// ===============================

let selectedQuestions =
  [...availableQuestions];


// ===============================
// SHUFFLE IF ENABLED
// ===============================

if (this.shuffleQuestions()) {

  selectedQuestions =
    this.shuffleArray(
      selectedQuestions
    );

}


// ===============================
// SELECT QUESTIONS
// ===============================

this.questions.set(
  selectedQuestions.slice(
    0,
    amount
  )
);


// ===============================
// RESET QUIZ STATE
// ===============================

this.currentIndex.set(0);

this.selectedAnswer.set('');

this.answered.set(false);

this.examAnswers.set({});

this.examFinished.set(false);

this.examScore.set(0);

this.setupComplete.set(true);


console.log(
  'PRACTICE STARTED'
);

console.log(
  'MODE:',
  this.mode()
);

console.log(
  'REQUESTED:',
  this.selectedQuestionCount()
);

console.log(
  'AVAILABLE:',
  availableQuestions.length
);

console.log(
  'ACTUAL QUESTIONS:',
  this.questions().length
);

console.log(
  'SHUFFLED:',
  this.shuffleQuestions()
);


}

// ===============================
// SHUFFLE ARRAY
// ===============================

private shuffleArray(
array: Question[]
): Question[] {


const shuffled =
  [...array];


for (
  let i = shuffled.length - 1;
  i > 0;
  i--
) {

  const j =
    Math.floor(
      Math.random() * (i + 1)
    );


  [
    shuffled[i],
    shuffled[j]
  ] = [
    shuffled[j],
    shuffled[i]
  ];

}


return shuffled;


}

// ===============================
// CURRENT QUESTION
// ===============================

get currentQuestion(): Question | null {


return (
  this.questions()[
    this.currentIndex()
  ] ?? null
);


}

// ===============================
// QUESTION NUMBER
// ===============================

get questionNumber(): number {


return (
  this.currentIndex() + 1
);


}

// ===============================
// SELECT ANSWER
// ===============================

selectAnswer(
answer: string
): void {


const question =
  this.currentQuestion;


if (!question) {

  return;

}


// ===============================
// STUDY MODE
// ===============================

if (
  this.mode() === 'study'
) {

  if (this.answered()) {

    return;

  }


  this.selectedAnswer.set(
    answer
  );

  this.answered.set(
    true
  );

  return;

}


// ===============================
// EXAM MODE
// ===============================

this.selectedAnswer.set(
  answer
);


this.examAnswers.update(
  answers => ({
    ...answers,
    [question.id]: answer
  })
);


}

// ===============================
// CHECK ANSWER
// ===============================

isCorrect(
answer: string
): boolean {


const question =
  this.currentQuestion;


if (!question) {

  return false;

}


return (
  answer.toUpperCase() ===
  question.correct_answer.toUpperCase()
);


}

// ===============================
// NEXT QUESTION
// ===============================

nextQuestion(): void {


// ===============================
// STUDY MODE
// ===============================

if (
  this.mode() === 'study'
) {

  if (!this.answered()) {

    return;

  }


  if (
    this.currentIndex() <
    this.questions().length - 1
  ) {

    this.currentIndex.update(
      index => index + 1
    );

    this.selectedAnswer.set('');

    this.answered.set(false);

    return;

  }


  // ===============================
  // FINISH STUDY
  // ===============================

  this.setupComplete.set(false);

  return;

}


// ===============================
// EXAM MODE
// ===============================

if (
  this.currentIndex() <
  this.questions().length - 1
) {

  this.currentIndex.update(
    index => index + 1
  );


  const nextQuestion =
    this.questions()[
      this.currentIndex()
    ];


  this.selectedAnswer.set(
    this.examAnswers()[
      nextQuestion.id
    ] ?? ''
  );

  return;

}


// ===============================
// FINISH EXAM
// ===============================

this.finishExam();


}

// ===============================
// PREVIOUS QUESTION
// ===============================

previousQuestion(): void {


if (
  this.currentIndex() <= 0
) {

  return;

}


this.currentIndex.update(
  index => index - 1
);


// ===============================
// STUDY MODE
// ===============================

if (
  this.mode() === 'study'
) {

  this.selectedAnswer.set('');

  this.answered.set(false);

  return;

}


// ===============================
// EXAM MODE
// ===============================

const previousQuestion =
  this.questions()[
    this.currentIndex()
  ];


this.selectedAnswer.set(
  this.examAnswers()[
    previousQuestion.id
  ] ?? ''
);


}

// ===============================
// FINISH EXAM
// ===============================

finishExam(): void {


let score = 0;


// ===============================
// CALCULATE SCORE
// ===============================

for (
  const question of this.questions()
) {

  const answer =
    this.examAnswers()[
      question.id
    ];


  if (
    answer &&
    answer.toUpperCase() ===
    question.correct_answer.toUpperCase()
  ) {

    score++;

  }

}


this.examScore.set(
  score
);

this.examFinished.set(
  true
);


console.log(
  'EXAM FINISHED'
);

console.log(
  'SCORE:',
  score,
  '/',
  this.questions().length
);


}

// ===============================
// LAST QUESTION
// ===============================

get isLastQuestion(): boolean {


return (
  this.questions().length > 0 &&
  this.currentIndex() ===
  this.questions().length - 1
);


}

// ===============================
// CURRENT EXAM ANSWER
// ===============================

get currentExamAnswer(): string {


const question =
  this.currentQuestion;


if (!question) {

  return '';

}


return (
  this.examAnswers()[
    question.id
  ] ?? ''
);


}

// ===============================
// ANSWERED QUESTIONS
// ===============================

get answeredQuestionCount(): number {


return Object.keys(
  this.examAnswers()
).length;


}

// ===============================
// PROGRESS
// ===============================

get progress(): number {


const total =
  this.questions().length;


if (total === 0) {

  return 0;

}


return (
  (
    this.questionNumber /
    total
  ) * 100
);


}

// ===============================
// ACTUAL QUESTION COUNT
// ===============================

get actualQuestionCount(): number {


return Math.min(
  this.selectedQuestionCount(),
  this.allQuestions().length
);

}

// ===============================
// BACK LINK
// ===============================

get backLink(): string {

const id =
  this.subjectId();


if (id === null) {

  return '/subjects';

}


return `/subjects/${id}`;

}

}
