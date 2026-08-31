import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient
} from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://qvtywpekdpzliarzenpi.supabase.co',
      'sb_publishable_3MMHrAMx4_ZDRgMQ5UCOkA_IC-BQTXU'
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}