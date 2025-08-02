import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const isAuthorizedGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);
  const isAuthenticated = await supabaseService.isAuthenticated();
  
  if (isAuthenticated) {
    return true;
  } else {
    // Redirect to the onboarding screen if not authenticated
    router.navigate(['/onboarding']);
    return false;
  }
};
