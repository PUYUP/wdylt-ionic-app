import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const isGuestGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);
  const isAuthenticated = await supabaseService.isAuthenticated();

  if (isAuthenticated) {
    router.navigate(['/']);
    return false;
  } else {
    return true;
  }
};
