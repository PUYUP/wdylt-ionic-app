import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { SupabaseService } from '../../services/supabase.service';
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { AppActions } from '../actions/app.actions';
import { getISODay, setHours, setMinutes, setSeconds } from 'date-fns';
import { Store } from '@ngrx/store';
import { GlobalState } from '../reducers/app.reducer';
import { format, formatInTimeZone } from 'date-fns-tz';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../../services/http.service';

@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private supabaseService: SupabaseService,
    private store: Store<GlobalState>,
    private router: Router,
    private httpService: HttpService,
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
          .select('*');
        
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
          .select(`*, lesson(id, content_type, description, content_data)`)
        
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

      // create reminder for the enrolled lesson
      const instance = data[0];
      const dayOfWeek = getISODay(new Date(instance.target_completion_datetime));
      const payload = {
        enrollment: instance.id,
        user: instance.user,
        lesson: instance.lesson.id,
        scheduled_time: format(instance.target_completion_datetime, 'HH:mm'),
        is_active: true,
        buffer_minutes: 15,
        days_of_week: [dayOfWeek],
        message: 'Reminder: You have a lesson in progress!',
      }

      this.store.dispatch(AppActions.createReminder({
        data: payload,
        source: 'enroll-lesson',
      }));
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
    switchMap(async ({ id, data, source, metadata }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .update(data)
          .eq('id', id)
          .select('*, lesson(id, content_type, description, content_data)');

        if (error) {
          throw error;
        }
        return AppActions.updateEnrolledLessonSuccess({ id, data: result, source, metadata });
      } catch (error) {
        console.error('Error updating enrolled lesson:', error);
        return AppActions.updateEnrolledLessonFailure({ id, error, source, metadata });
      }
    })
  ));

  updateEnrolledLessonSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrolledLessonSuccess),
    tap(({ id, data, source, metadata }) => {
      console.log('Enrolled lesson updated successfully:', id, data, source, metadata);
      const quizType = metadata?.quizType || 'mcq';

      if (source === 'answer-now-alert') {
        // go to the quiz list page
        this.router.navigate(['/quiz-' + quizType], {
          queryParams: {
            lessonId: data[0].lesson.id,
            enrolledId: id,
          },
        });
      }

      // create reminder for the enrolled lesson
      const instance = data[0];
      const dayOfWeek = getISODay(new Date(instance.target_completion_datetime));
      const payload = {
        enrollment: instance.id,
        user: instance.user,
        lesson: instance.lesson.id,
        scheduled_time: format(instance.target_completion_datetime, 'HH:mm'),
        days_of_week: [dayOfWeek],
      }

      this.store.dispatch(AppActions.updateReminder({
        data: payload,
        source: 'update-enrolled-lesson',
      }));
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
          .select('*, lesson(id, content_type, description, content_data)');

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
          .select(`
            *, 
            lesson(id, content_type, description, content_data),
            mcq_answers: chosen_answers!enrollment(*),
            essay_answers: answers!enrollment(*, question(id, question_type))
          `)
          .eq('user', filter.user_id)
          .is('deleted_at', null)
          .range(filter.from_page, filter.to_page)
          .order('created_at', { ascending: false })
          .limit(environment.queryPerPage);

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
          .select('*, lesson(id, content_type, description, content_data)')
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
          .select(`
            *, 
            lesson(id, content_type, description, content_data),
            mcq_answers: chosen_answers!enrollment(*),
            essay_answers: answers!enrollment(*, question(id, question_type))
          `)
          .in('status', ['in_progress', 'waiting_answer'])
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


  // ...
  // Update profile Effect
  // ...
  updateProfile$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateProfile),
    switchMap(async ({ id, data }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('profiles')
          .update(data)
          .eq('id', id)
          .select();

        if (error) {
          throw error;
        }
        return AppActions.updateProfileSuccess({ id: id, data: result });
      } catch (error) {
        console.error('Error updating profile:', error);
        return AppActions.updateProfileFailure({ id: id, error });
      }
    })
  ));

  updateProfileSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateProfileSuccess),
    tap(({ data }) => {
      console.log('Profile updated successfully:', data);
    })
  ), { dispatch: false });

  updateProfileFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateProfileFailure),
    tap(({ error }) => {
      console.error('Error updating profile:', error);
    })
  ), { dispatch: false });


  // ...
  // Update or Create Reminders Effect
  // ...
  createReminders$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createReminder),
    switchMap(async ({ data }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('reminders')
          .insert(data)
          .select(`*`)

        if (error) {
          throw error;
        }
        return AppActions.createReminderSuccess({ data: result });
      } catch (error) {
        console.error('Error updating/creating reminders:', error);
        return AppActions.createReminderFailure({ error });
      }
    })
  ));

  createRemindersSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createReminderSuccess),
    tap(({ data }) => {
      console.log('Reminders created successfully:', data);
    })
  ), { dispatch: false });

  createRemindersFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createReminderFailure),
    tap(({ error }) => {
      console.error('Error updating reminders:', error);
    })
  ), { dispatch: false });


  // ...
  // Update Reminders Effect
  // ...
  updateReminders$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateReminder),
    switchMap(async ({ data }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('reminders')
          .update(data)
          .eq('lesson', data.lesson)
          .eq('enrollment', data.enrollment)
          .eq('user', data.user)
          .select(`*`)
          .single();

        if (error) {
          throw error;
        }
        return AppActions.createReminderSuccess({ data: result });
      } catch (error) {
        console.error('Error updating/creating reminders:', error);
        return AppActions.createReminderFailure({ error });
      }
    })
  ));

  updateReminderSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateReminderSuccess),
    tap(({ data }) => {
      console.log('Reminders updated successfully:', data);
    })
  ), { dispatch: false });

  updateReminderFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateReminderFailure),
    tap(({ error }) => {
      console.error('Error updating reminders:', error);
    })
  ), { dispatch: false });


  // ..
  // AI Generate MCQ
  // ...
  aIGenerateMCQ$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateMCQ),
    switchMap(({ topic }) => 
      this.httpService.generateMCQ(topic).pipe(
        map((response: any) => AppActions.aIGenerateMCQSuccess({ data: response })),
        catchError((error: any) => of(AppActions.aIGenerateMCQFailure({ error })))
      )
    )
  ));

  aIGenerateMCQSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateMCQSuccess),
    tap(({ data }) => {
      console.log('MCQ generated successfully:', data);
    })
  ), { dispatch: false });

  aIGenerateMCQFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateMCQFailure),
    tap(({ error }) => {
      console.error('Error generating MCQ:', error);
    })
  ), { dispatch: false });


  // ..
  // AI Generate Essay
  // ...
  aIGenerateEssay$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateEssay),
    switchMap(({ topic }) => 
      this.httpService.generateMCQ(topic).pipe(
        map((response: any) => AppActions.aIGenerateMCQSuccess({ data: response })),
        catchError((error: any) => of(AppActions.aIGenerateMCQFailure({ error })))
      )
    )
  ));

  aIGenerateEssaySuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateEssaySuccess),
    tap(({ data }) => {
      console.log('Essay generated successfully:', data);
    })
  ), { dispatch: false });

  aIGenerateEssayFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateEssayFailure),
    tap(({ error }) => {
      console.error('Error generating Essay:', error);
    })
  ), { dispatch: false });


  // ...
  // Get MCQ Questions Effect
  // ...
  getMCQuestions$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getMCQQuestions),
    switchMap(async ({ lessonId }) => {
      try {
      const { data, error } = await this.supabaseService.getSupabase()
        .from('questions')
        .select('*, question_options(id, content_text, order, points, question, chosen_answers(*))')
        .eq('lesson', lessonId)
        .eq('question_type', 'mcq')
        .order('created_at', { ascending: true })
        .order('order', { referencedTable: "question_options", ascending: true }); // ensure options are ordered correctly (A, B, C, D)

      if (error) {
        throw error;
      }
      return AppActions.getMCQQuestionsSuccess({ data });
      } catch (error) {
      console.error('Error getting MC questions:', error);
      return AppActions.getMCQQuestionsFailure({ error });
      }
    })
  ));

  getMCQuestionsSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getMCQQuestionsSuccess),
    tap(({ data }) => {
      console.log('MC questions retrieved successfully:', data);
    })
  ), { dispatch: false });

  getMCQuestionsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getMCQQuestionsFailure),
    tap(({ error }) => {
      console.error('Error getting MC questions:', error);
    })
  ), { dispatch: false });


  // ...
  // Get Essay Questions Effect
  // ...
  getEssayQuestions$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEssayQuestions),
    switchMap(async ({ lessonId }) => {
      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('questions')
          .select('*, answers(id, content)', { count: 'exact' })
          .eq('lesson', lessonId)
          .eq('question_type', 'essay')
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }
        return AppActions.getEssayQuestionsSuccess({ data });
      } catch (error) {
        console.error('Error getting essay questions:', error);
        return AppActions.getEssayQuestionsFailure({ error });
      }
    })
  ));

  getEssayQuestionsSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEssayQuestionsSuccess),
    tap(({ data }) => {
      console.log('Essay questions retrieved successfully:', data);
    })
  ), { dispatch: false });

  getEssayQuestionsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEssayQuestionsFailure),
    tap(({ error }) => {
      console.error('Error getting essay questions:', error);
    })
  ), { dispatch: false });


  // ...
  // Save Answered Essay Effect
  // ...
  saveAnsweredEssay$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredEssay),
    switchMap(async ({ data }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('answers')
          .insert(data)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.saveAnsweredEssaySuccess({ data: result });
      } catch (error) {
        console.error('Error saving answered essay:', error);
        return AppActions.saveAnsweredEssayFailure({ error });
      }
    })
  ));

  saveAnsweredEssaySuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredEssaySuccess),
    tap(({ data }) => {
      console.log('Answered essay saved successfully:', data);
    })
  ), { dispatch: false });

  saveAnsweredEssayFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredEssayFailure),
    tap(({ error }) => {
      console.error('Error saving answered essay:', error);
    })
  ), { dispatch: false });


  // ...
  // Save Answered MCQ
  // ...
  saveAnsweredMCQ$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredMCQ),
    switchMap(async ({ data }) => {
      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('chosen_answers')
          .insert(data)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.saveAnsweredMCQSuccess({ data: result });
      } catch (error) {
        console.error('Error saving answered MCQ:', error);
        return AppActions.saveAnsweredMCQFailure({ error });
      }
    })
  ));

  saveAnsweredMCQSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredMCQSuccess),
    tap(({ data }) => {
      console.log('Answered MCQ saved successfully:', data);
    })
  ), { dispatch: false });

  saveAnsweredMCQFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredMCQFailure),
    tap(({ error }) => {
      console.error('Error saving answered MCQ:', error);
    })
  ), { dispatch: false });

}
