import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { SupabaseService } from '../../services/supabase.service';
import { switchMap, tap } from 'rxjs';
import { AppActions } from '../actions/app.actions';
import { setHours, setMinutes, setSeconds } from 'date-fns';
import { Store } from '@ngrx/store';
import { GlobalState } from '../reducers/app.reducer';
import { format, formatInTimeZone } from 'date-fns-tz';
import { Router } from '@angular/router';

@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
    private router: Router,
  ) {}

  signInWithGoogle$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.signInWithGoogle),
    switchMap(async ({ source }) => {
      try {
        const user = await this.supabaseService.signInWithGoogle(source);
        return AppActions.signInWithGoogleSuccess({ user, source });
      } catch (error) {
        console.error('Error signing in with Google:', error);
        return AppActions.signInWithGoogleFailure({ error, source });
      }
    })
  ));

  signInWithGoogleSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.signInWithGoogleSuccess),
    tap(({ user }) => {
      console.log('User signed in with Google:', user);
    })
  ), { dispatch: false });

  signInWithGoogleFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.signInWithGoogleFailure),
    tap(({ error }) => {
      console.error('Error signing in with Google:', error);
    }
  )), { dispatch: false });


  // ...
  // Create Lesson Effect
  // ...
  createLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createLesson),
    switchMap(async ({ data, source, metadata }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('lessons')
          .insert(data)
          .select();
        
        if (error) {
          throw error;
        }
        return AppActions.createLessonSuccess({ data: result, source: source, metadata: metadata });
      } catch (error) {
        console.error('Error creating lesson:', error);
        return AppActions.createLessonFailure({ error, source: source, metadata: metadata });
      }
    })
  ));

  createLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createLessonSuccess),
    tap(({ data, source, metadata }) => {
      console.log('Lesson created successfully:', data);
      const enrollmentData = metadata?.enrollment;

      if (enrollmentData) {
        const goalHours = enrollmentData.goalHour?.split(':');
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const today = new Date();
        const withNewHour = setHours(today, goalHours ? parseInt(goalHours[0], 10) : 0);
        const withNewMinutes = setMinutes(withNewHour, goalHours ? parseInt(goalHours[1], 10) : 0);
        const withNewSeconds = setSeconds(withNewMinutes, 0);

        const payload = {
          lesson: data[0].id,
          user: data[0].user,
          start_datetime: today.toISOString(),
          target_completion_datetime: withNewSeconds.toISOString(),
          status: 'in_progress',
          progress_percentage: 0.0,
        }

        this.store.dispatch(AppActions.enrollLesson({ data: payload }));
      }
    })
  ), { dispatch: false });

  createLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createLessonFailure),
    tap(({ error }) => {
      console.error('Error creating lesson:', error);
    })
  ), { dispatch: false });


  // ...
  // Update Lesson Effect
  // ...
  updateLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateLesson),
    switchMap(async ({ id, data }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('lessons')
          .update(data)
          .eq('id', id)
          .select();

        console.log('Update lesson data:', result);
        if (error) {
          throw error;
        }
        return AppActions.updateLessonSuccess({ id, data: result });
      } catch (error) {
        console.error('Error updating lesson:', error);
        return AppActions.updateLessonFailure({ id, error });
      }
    })
  ));

  updateLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateLessonSuccess),
    tap(({ id, data }) => {
      console.log('Lesson updated successfully:', id, data);
    })
  ), { dispatch: false });

  updateLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateLessonFailure),
    tap(({ id, error }) => {
      console.error('Error updating lesson:', id, error);
    })
  ), { dispatch: false });


  // ...
  // Enroll lesson Effect
  // ...
  enrollLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.enrollLesson),
    switchMap(async ({ data }) => {
      try {
        const { data: res, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .insert(data)
          .select(`
            *,
            lessons(id, content_type, description, content_data)
          `)
        
        if (error) {
          throw error;
        }
        return AppActions.enrollLessonSuccess({ data: res });
      } catch (error) {
        console.error('Error enrolling lesson:', error);
        return AppActions.enrollLessonFailure({ error });
      }
    })
  ));

  enrollLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.enrollLessonSuccess),
    tap(({ data }) => {
      console.log('Lesson enrolled successfully:', data);
    })
  ), { dispatch: false });

  enrollLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.enrollLessonFailure),
    tap(({ error }) => {
      console.error('Error enrolling lesson:', error);
    })
  ), { dispatch: false });


  // ...
  // Update Enrollment Effect
  // ...
  updateEnrolledLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrolledLesson),
    switchMap(async ({ id, data, source }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .update(data)
          .eq('id', id)
          .select('*, lessons(id, content_type, description, content_data)');

        if (error) {
          throw error;
        }
        return AppActions.updateEnrolledLessonSuccess({ id, data: result, source });
      } catch (error) {
        console.error('Error updating enrolled lesson:', error);
        return AppActions.updateEnrolledLessonFailure({ id, error, source });
      }
    })
  ));

  updateEnrolledLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrolledLessonSuccess),
    tap(({ id, data, source }) => {
      console.log('Enrolled lesson updated successfully:', id, data, source);

      if (source === 'answer-now-alert') {
        // go to the quiz list page
        this.router.navigate(['/quiz'], {
          queryParams: {
            lessonId: data[0].lessons.id,
            enrolledId: id,
          },
        });
      }
    })
  ), { dispatch: false });

  updateEnrolledLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrolledLessonFailure),
    tap(({ id, error }) => {
      console.error('Error updating enrolled lesson:', id, error);
    })
  ), { dispatch: false });


  // ...
  // Delete Enrolled Lesson Effect
  // ...
  deleteEnrolledLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteEnrolledLesson),
    switchMap(async ({ id }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .select('*, lessons(id, content_type, description, content_data)');

        if (error) {
          throw error;
        }
        return AppActions.deleteEnrolledLessonSuccess({ id });
      } catch (error) {
        console.error('Error deleting enrolled lesson:', error);
        return AppActions.deleteEnrolledLessonFailure({ id, error });
      }
    })
  ));

  deleteEnrolledLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteEnrolledLessonSuccess),
    tap(({ id }) => {
      console.log('Enrolled lesson deleted successfully:', id);
    })
  ), { dispatch: false })

  deleteEnrolledLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteEnrolledLessonFailure),
    tap(({ id, error }) => {
      console.error('Error deleting enrolled lesson:', id, error);
    })
  ), { dispatch: false })


  // ...
  // Get Enrolled Lessons Effect
  // ...
  getEnrolledLessons$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrolledLessons),
    switchMap(async ({ filter, metadata }) => {
      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .select('*, lessons(id, content_type, description, content_data)')
          .eq('user', filter.user_id)
          .is('deleted_at', null)
          .range(filter.from_page, filter.to_page)
          .order('created_at', { ascending: false })
          .limit(25);

        if (error) {
          throw error;
        }
        return AppActions.getEnrolledLessonsSuccess({ data, filter, metadata });
      } catch (error) {
        console.error('Error getting enrolled lessons:', error);
        return AppActions.getEnrolledLessonsFailure({ error });
      }
    })
  ));

  getEnrolledLessonsSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrolledLessonsSuccess),
    tap(({ data }) => {
      console.log('Enrolled lessons retrieved successfully:', data);
    })
  ), { dispatch: false });

  getEnrolledLessonsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrolledLessonsFailure),
    tap(({ error }) => {
      console.error('Error getting enrolled lessons:', error);
    })
  ), { dispatch: false });


  // ...
  // Get single Enrolled Lesson Effect
  // ...
  getEnrolledLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrolledLesson),
    switchMap(async ({ id }) => {
      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .select('*, lessons(id, content_type, description, content_data)')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }
        return AppActions.getEnrolledLessonSuccess({ data });
      } catch (error) {
        console.error('Error getting enrolled lesson:', error);
        return AppActions.getEnrolledLessonFailure({ id, error });
      }
    })
  ));

  getEnrolledLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrolledLessonSuccess),
    tap(({ data }) => {
      console.log('Enrolled lesson retrieved successfully:', data);
    })
  ), { dispatch: false });

  getEnrolledLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrolledLessonFailure),
    tap(({ id, error }) => {
      console.error('Error getting enrolled lesson:', id, error);
    })
  ), { dispatch: false });


  // ...
  // Get Latest Enrolled Lessons Effect
  // ...
  getLatestEnrolledLessons$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getLatestEnrolledLessons),
    switchMap(async ({ filter }) => {
      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .select(`*, lessons(id, content_type, description, content_data)`)
          .eq('user', filter.user_id)
          .is('deleted_at', null)
          .gte('start_datetime', filter.start_datetime)
          .lte('target_completion_datetime', filter.target_completion_datetime)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }
        return AppActions.getLatestEnrolledLessonsSuccess({ data });
      } catch (error) {
        console.error('Error getting latest enrolled lessons:', error);
        return AppActions.getLatestEnrolledLessonsFailure({ error });
      }
    })
  ));

  getLatestEnrolledLessonsSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getLatestEnrolledLessonsSuccess),
    tap(({ data }) => {
      console.log('Latest enrolled lessons retrieved successfully:', data);
    })
  ), { dispatch: false });

  getLatestEnrolledLessonsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getLatestEnrolledLessonsFailure),
    tap(({ error }) => {
      console.error('Error getting latest enrolled lessons:', error);
    })
  ), { dispatch: false });

}
