import { Routes } from '@angular/router';

// =====================================================
// AUTH
// =====================================================

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';

// =====================================================
// LAYOUT
// =====================================================

import { Layout } from './layout/layout';

// =====================================================
// STUDENT PAGES
// =====================================================

import { Home } from './pages/home/home';
import { Subjects } from './pages/subjects/subjects';
import { SubjectTopics } from './pages/subject-topics/subject-topics';
import { TopicDetail } from './pages/topic-detail/topic-detail';
import { Questions } from './pages/questions/questions';

// =====================================================
// PAST QUESTIONS
// =====================================================

import { PastQuestions } from './pages/past-questions/past-questions';
import { PqSubjects } from './pages/pq-subjects/pq-subjects';
import { PqPractice } from './pages/pq-practice/pq-practice';

// =====================================================
// OTHER STUDENT PAGES
// =====================================================

import { WeeklyTest } from './pages/weekly-test/weekly-test';
import { Leaderboard } from './pages/leaderboard/leaderboard';
import { Performance } from './pages/performance/performance';
import { Videos } from './pages/videos/videos';
import { Contact } from './pages/contact/contact';

// =====================================================
// SETTINGS
// =====================================================

import { Settings } from './pages/settings/settings';

// =====================================================
// GUARD
// =====================================================

import { authGuard } from './guards/auth-guard';

// =====================================================
// ROUTES
// =====================================================

export const routes: Routes = [

// ===================================================
// AUTHENTICATION
// ===================================================

{
path: '',
redirectTo: 'login',
pathMatch: 'full'
},

{
path: 'login',
component: Login
},

{
path: 'register',
component: Register
},

// ===================================================
// PASSWORD ROUTES
// ===================================================

{
path: 'forgot-password',
component: ForgotPassword
},

{
path: 'reset-password',
component: ResetPassword
},

// ===================================================
// STUDENT APPLICATION
// ===================================================

{
path: '',
component: Layout,
canActivate: [authGuard],


children: [

  // ===============================================
  // DEFAULT
  // ===============================================

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // ===============================================
  // HOME
  // ===============================================

  {
    path: 'home',
    component: Home
  },

  // ===============================================
  // SUBJECTS
  // ===============================================

  {
    path: 'subjects',
    component: Subjects
  },

  // ===============================================
  // SUBJECT TOPICS
  // ===============================================

  {
    path: 'subjects/:id',
    component: SubjectTopics
  },

  // ===============================================
  // TOPIC DETAIL
  // ===============================================

  {
    path: 'subjects/:subjectId/topics/:topicId',
    component: TopicDetail
  },

  // ===============================================
  // PRACTICE QUESTIONS
  // ===============================================

  {
    path: 'subjects/:subjectId/topics/:topicId/questions',
    component: Questions
  },

  // ===============================================
  // PAST QUESTIONS
  // ===============================================

  {
    path: 'past-questions',
    component: PastQuestions
  },

  // ===============================================
  // PQ SUBJECTS
  // ===============================================

  {
    path: 'pq-subjects/:year',
    component: PqSubjects
  },

  // ===============================================
  // PQ PRACTICE
  // ===============================================

  {
    path: 'pq-practice/:year/:subject',
    component: PqPractice
  },

  // ===============================================
  // WEEKLY TEST
  // ===============================================

  {
    path: 'weekly-test',
    component: WeeklyTest
  },

  // ===============================================
  // WEEKLY TEST INSTRUCTIONS
  // ===============================================

  {
    path: 'weekly-test/instructions',

    loadComponent: () =>
      import(
        './pages/weekly-test-instructions/weekly-test-instructions'
      ).then(
        m => m.WeeklyTestInstructions
      )
  },

  // ===============================================
  // TAKE WEEKLY TEST
  // ===============================================

  {
    path: 'weekly-test/take',

    loadComponent: () =>
      import(
        './pages/weekly-test-take/weekly-test-take'
      ).then(
        m => m.WeeklyTestTake
      )
  },

  // ===============================================
  // WEEKLY TEST RESULT
  // ===============================================

  {
    path: 'weekly-test/result',

    loadComponent: () =>
      import(
        './pages/weekly-test-result/weekly-test-result'
      ).then(
        m => m.WeeklyTestResult
      )
  },

  // ===============================================
  // PERFORMANCE
  // ===============================================

  {
    path: 'performance',
    component: Performance
  },

  // ===============================================
  // LEADERBOARD
  // ===============================================

  {
    path: 'leaderboard',
    component: Leaderboard
  },

  // ===============================================
  // VIDEOS
  // ===============================================

  {
    path: 'videos',
    component: Videos
  },

  // ===============================================
  // CONTACT
  // ===============================================

  {
    path: 'contact',
    component: Contact
  },

  // ===============================================
  // SETTINGS
  // ===============================================

  {
    path: 'settings',
    component: Settings
  }

]


},

// ===================================================
// UNKNOWN URL
// ===================================================

{
path: '**',
redirectTo: 'login'
}

];
