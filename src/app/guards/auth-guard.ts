import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { SupabaseService } from '../services/supabase';


export const authGuard: CanActivateFn = async () => {

  const supabaseService =
    inject(SupabaseService);

  const router =
    inject(Router);

  const supabase =
    supabaseService.client;


  console.log('🔐 AUTH GUARD: checking session...');

  const start =
    performance.now();


  const {
    data,
    error
  } = await supabase.auth.getSession();


  const end =
    performance.now();


  console.log(
    `🔐 AUTH GUARD: finished in ${Math.round(end - start)}ms`
  );


  if (error) {

    console.error(
      '❌ AUTH GUARD ERROR:',
      error
    );

  }


  if (data.session) {

    console.log(
      '✅ AUTH GUARD: session exists'
    );

    return true;

  }


  console.log(
    '❌ AUTH GUARD: no session'
  );


  return router.createUrlTree([
    '/login'
  ]);

};
