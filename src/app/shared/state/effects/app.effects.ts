import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { SupabaseService } from '../../services/supabase.service';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AppActions } from '../actions/app.actions';
import { addDays, getISODay, setHours, setMinutes, setSeconds, subDays } from 'date-fns';
import { Store } from '@ngrx/store';
import { GlobalState } from '../reducers/app.reducer';
import { format } from 'date-fns-tz';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpService } from '../../services/http.service';
import { calculatePoints } from '../../helpers';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { getDownloadURL, ref, Storage, uploadBytes } from '@angular/fire/storage';
import { NgxSpinnerService } from 'ngx-spinner';
import { decode } from 'base64-arraybuffer';
import { EntryFormService } from '../../services/entry-form.service';

@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private supabaseService: SupabaseService,
    private entryFormService: EntryFormService,
    private store: Store<GlobalState>,
    private router: Router,
    private httpService: HttpService,
    private fireStorage: Storage,
    private spinner: NgxSpinnerService,
  ) {}

  signInWithGoogle$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.signInWithGoogle),
    switchMap(async ({ source }) => {
      this.spinner.show();

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
      this.spinner.hide();
    })
  ), { dispatch: false });

  signInWithGoogleFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.signInWithGoogleFailure),
    tap(({ error }) => {
      console.error('Error signing in with Google:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Create Lesson Effect
  // ...
  createLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createLesson),
    switchMap(async ({ data, source, metadata }) => {
      this.spinner.show();

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
      this.spinner.hide();
      this.entryFormService.resetState();
      const enrollmentData = metadata?.enrollment;

      if (enrollmentData) {
        const goalHours = enrollmentData.goalHour?.split(':');
        const today = new Date();
        const withNewHour = setHours(today, goalHours ? parseInt(goalHours[0], 10) : 0);
        const withNewMinutes = setMinutes(withNewHour, goalHours ? parseInt(goalHours[1], 10) : 0);
        const withNewSeconds = setSeconds(withNewMinutes, 0);

        const payload = {
          lesson: data[0].id,
          user: data[0].user,
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
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update Lesson Effect
  // ...
  updateLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateLesson),
    switchMap(async ({ id, data }) => {
      this.spinner.show();

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
      this.spinner.hide();
    })
  ), { dispatch: false });

  updateLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateLessonFailure),
    tap(({ id, error }) => {
      console.error('Error updating lesson:', id, error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Enroll lesson Effect
  // ...
  enrollLesson$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.enrollLesson),
    switchMap(async ({ data }) => {
      this.spinner.show();

      try {
        const { data: res, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .insert(data)
          .select(`
            *, 
            lesson(
              id, content_type, description, content_data,
              mcq_questions: questions(*),
              essay_questions: questions(*)
            ),
            mcq_answers: chosen_options!enrollment(*),
            essay_answers: answers!enrollment(*, question(id, question_type))
          `);
        
        if (error) {
          throw error;
        }
        return AppActions.enrollLessonSuccess({ data: calculatePoints(res) });
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
      this.spinner.hide();

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

      // create attempt
      this.store.dispatch(AppActions.createAttempt({
        data: {
          user: instance.user,
          enrollmentId: instance.id,
          lessonId: instance.lesson.id,
        }
      }));
    })
  ), { dispatch: false });

  enrollLessonFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.enrollLessonFailure),
    tap(({ error }) => {
      console.error('Error enrolling lesson:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update Enrollment Effect
  // ...
  updateEnrollment$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrollment),
    switchMap(async ({ id, data, source, metadata }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .update(data)
          .eq('id', id)
          .select('*, lesson(id, content_type, description, content_data)');

        if (error) {
          throw error;
        }
        return AppActions.updateEnrollmentSuccess({ id, data: calculatePoints(result), source, metadata });
      } catch (error) {
        console.error('Error updating enrolled lesson:', error);
        return AppActions.updateEnrollmentFailure({ id, error, source, metadata });
      }
    })
  ));

  updateEnrollmentSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrollmentSuccess),
    tap(({ id, data, source, metadata }) => {
      console.log('Enrolled lesson updated successfully:', id, data, source, metadata);
      this.spinner.hide();
      const quizType = metadata?.quizType || 'mcq';

      if (source === 'answer-now-alert') {
        // go to the quiz list page
        this.router.navigate(['/quiz-' + quizType], {
          queryParams: {
            lessonId: data[0].lesson.id,
            enrolledId: id,
            attemptId: data[0].attempts?.length > 0 ? data[0].attempts[data[0].attempts.length - 1].id : null,
          },
        });
      }

      // create reminder for the enrolled lesson
      if (source == 'edit') {
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
      }
    })
  ), { dispatch: false });

  updateEnrollmentFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateEnrollmentFailure),
    tap(({ id, error }) => {
      console.error('Error updating enrolled lesson:', id, error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Delete Enrolled Lesson Effect
  // ...
  deleteEnrollment$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteEnrollment),
    switchMap(async ({ id }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .select('*, lesson(id, content_type, description, content_data)');

        if (error) {
          throw error;
        }
        return AppActions.deleteEnrollmentSuccess({ id });
      } catch (error) {
        console.error('Error deleting enrolled lesson:', error);
        return AppActions.deleteEnrollmentFailure({ id, error });
      }
    })
  ));

  deleteEnrollmentSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteEnrollmentSuccess),
    tap(({ id }) => {
      console.log('Enrolled lesson deleted successfully:', id);
      this.spinner.hide();
    })
  ), { dispatch: false })

  deleteEnrollmentFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteEnrollmentFailure),
    tap(({ id, error }) => {
      console.error('Error deleting enrolled lesson:', id, error);
      this.spinner.hide();
    })
  ), { dispatch: false })


  // ...
  // Get Enrolled Lessons Effect
  // ...
  getEnrollments$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrollments),
    switchMap(async ({ filter, metadata }) => {
      if (!metadata?.isLoadMore) {
        this.spinner.show();
      }

      const lt = filter.lt_date;
      const gt = filter.gt_date;

      try {
        let query = this.supabaseService.getSupabase()
          .from('enrollments')
          .select(`
            *, 
            attempts(*),
            lesson(
              id, content_type, description, content_data,
              mcq_questions: questions(*),
              essay_questions: questions(*),
              todos(*)
            ),
            mcq_answers: chosen_options!enrollment(*),
            essay_answers: answers!enrollment(*, question(id, question_type))
          `)
          .eq('user', filter.user_id)
          .eq('lesson.mcq_questions.question_type', 'mcq')
          .eq('lesson.essay_questions.question_type', 'essay');

        if (lt) {
          query = query.gte('created_at', new Date(subDays(lt, 0)).toISOString());
        }

        if (gt) {
          query = query.lt('created_at', new Date(addDays(gt, 1)).toISOString());
        }

        query = query.is('deleted_at', null)
          .range(filter.from_page, filter.to_page)
          .order('created_at', { ascending: false })
          .limit(environment.queryPerPage);
          
        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // do some post-processing on the data
        return AppActions.getEnrollmentsSuccess({ data: calculatePoints(data), filter, metadata });
      } catch (error) {
        console.error('Error getting enrolled lessons:', error);
        return AppActions.getEnrollmentsFailure({ error });
      }
    })
  ));

  getEnrollmentsSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrollmentsSuccess),
    tap(({ data }) => {
      console.log('Enrolled lessons retrieved successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  getEnrollmentsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrollmentsFailure),
    tap(({ error }) => {
      console.error('Error getting enrolled lessons:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Get single Enrolled Lesson Effect
  // ...
  getEnrollment$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrollment),
    switchMap(async ({ id }) => {
      this.spinner.show();

      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .select(`
            *, 
            lesson(
              id, content_type, description, content_data,
              mcq_questions: questions(*),
              essay_questions: questions(*)
            ),
            mcq_answers: chosen_options!enrollment(*),
            essay_answers: answers!enrollment(*, question(id, question_type))
          `)
          .eq('lesson.mcq_questions.question_type', 'mcq')
          .eq('lesson.essay_questions.question_type', 'essay')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }
        return AppActions.getEnrollmentSuccess({ data });
      } catch (error) {
        console.error('Error getting enrolled lesson:', error);
        return AppActions.getEnrollmentFailure({ id, error });
      }
    })
  ));

  getEnrollmentSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrollmentSuccess),
    tap(({ data }) => {
      console.log('Enrolled lesson retrieved successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  getEnrollmentFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEnrollmentFailure),
    tap(({ id, error }) => {
      console.error('Error getting enrolled lesson:', id, error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Get Latest Enrolled Lessons Effect
  // ...
  getLatestEnrollments$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getLatestEnrollments),
    switchMap(async ({ filter }) => {
      this.spinner.show();
      
      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('enrollments')
          .select(`
            *,
            attempts(*),
            lesson(
              id, content_type, description, content_data,
              mcq_questions: questions!lesson(*),
              essay_questions: questions!lesson(*),
              todos(*)
            ),
            mcq_answers: chosen_options!enrollment(*),
            essay_answers: answers!enrollment(*, question(id, question_type))
          `)
          .in('status', ['in_progress', 'waiting_answer'])
          .eq('lesson.mcq_questions.question_type', 'mcq')
          .eq('lesson.essay_questions.question_type', 'essay')
          .eq('user', filter.user_id)
          .is('deleted_at', null)
          .gte('created_at', filter.created_at)
          .lte('target_completion_datetime', filter.target_completion_datetime)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }
        return AppActions.getLatestEnrollmentsSuccess({ data: calculatePoints(data) });
      } catch (error) {
        console.error('Error getting latest enrolled lessons:', error);
        return AppActions.getLatestEnrollmentsFailure({ error });
      }
    })
  ));

  getLatestEnrollmentsSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getLatestEnrollmentsSuccess),
    tap(({ data }) => {
      console.log('Latest enrolled lessons retrieved successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  getLatestEnrollmentsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getLatestEnrollmentsFailure),
    tap(({ error }) => {
      console.error('Error getting latest enrolled lessons:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update profile Effect
  // ...
  updateProfile$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateProfile),
    switchMap(async ({ id, data }) => {
      this.spinner.show();

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
      this.spinner.hide();
    })
  ), { dispatch: false });

  updateProfileFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateProfileFailure),
    tap(({ error }) => {
      console.error('Error updating profile:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update or Create Reminders Effect
  // ...
  createReminders$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createReminder),
    switchMap(async ({ data }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollment_reminders')
          .insert(data)
          .select(`*`)

        if (error) {
          throw error;
        }
        return AppActions.createReminderSuccess({ data: result });
      } catch (error) {
        console.error('Error updating/creating enrollment reminders:', error);
        return AppActions.createReminderFailure({ error });
      }
    })
  ));

  createRemindersSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createReminderSuccess),
    tap(({ data }) => {
      console.log('Enrollment reminders created successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  createRemindersFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createReminderFailure),
    tap(({ error }) => {
      console.error('Error updating enrollment reminders:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update Reminders Effect
  // ...
  updateReminders$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateReminder),
    switchMap(async ({ data }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('enrollment_reminders')
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
        console.error('Error updating/creating enrollment reminders:', error);
        return AppActions.createReminderFailure({ error });
      }
    })
  ));

  updateReminderSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateReminderSuccess),
    tap(({ data }) => {
      console.log('Reminders updated successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  updateReminderFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateReminderFailure),
    tap(({ error }) => {
      console.error('Error updating enrollment reminders:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ..
  // AI Generate MCQ
  // ...
  aIGenerateMCQ$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateMCQ),
    switchMap(({ topic }) => {
      this.spinner.show();
      return this.httpService.generateMCQ(topic).pipe(
        map((response: any) => AppActions.aIGenerateMCQSuccess({ data: response })),
        catchError((error: any) => of(AppActions.aIGenerateMCQFailure({ error })))
      )
    })
  ));

  aIGenerateMCQSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateMCQSuccess),
    tap(({ data }) => {
      console.log('MCQ generated successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  aIGenerateMCQFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.aIGenerateMCQFailure),
    tap(({ error }) => {
      console.error('Error generating MCQ:', error);
      this.spinner.hide();
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
      this.spinner.show();

      try {
      const { data, error } = await this.supabaseService.getSupabase()
        .from('questions')
        .select(`
          *, 
          question_options(id, content_text, order, points),
          chosen_options(id, is_correct, question, attempt, correct_option(*), selected_option(*))
        `)
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
      this.spinner.hide();
    })
  ), { dispatch: false });

  getMCQuestionsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getMCQQuestionsFailure),
    tap(({ error }) => {
      console.error('Error getting MC questions:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Get Essay Questions Effect
  // ...
  getEssayQuestions$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEssayQuestions),
    switchMap(async ({ lessonId }) => {
      this.spinner.show();

      try {
        const { data, error } = await this.supabaseService.getSupabase()
          .from('questions')
          .select('*, answers(id, content, points)', { count: 'exact' })
          .eq('lesson', lessonId)
          .eq('question_type', 'essay')
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        const newData = data.map((item: any) => {
          return {
            ...item,
            is_answered: item.answers.length > 0
          };
        });

        return AppActions.getEssayQuestionsSuccess({ data: newData });
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
      this.spinner.hide();
    })
  ), { dispatch: false });

  getEssayQuestionsFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getEssayQuestionsFailure),
    tap(({ error }) => {
      console.error('Error getting essay questions:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Save Answered Essay Effect
  // ...
  saveAnsweredEssay$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredEssay),
    switchMap(async ({ data, enrollmentId }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('answers')
          .insert(data)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.saveAnsweredEssaySuccess({ data: result, enrollmentId });
      } catch (error) {
        console.error('Error saving answered essay:', error);
        return AppActions.saveAnsweredEssayFailure({ error, enrollmentId });
      }
    })
  ));

  saveAnsweredEssaySuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredEssaySuccess),
    tap(({ data, enrollmentId }) => {
      console.log('Answered essay saved successfully:', data);
      this.spinner.hide();

      // update enrollment to trigger function in supabase
      this.store.dispatch(AppActions.updateEnrollment({
        id: enrollmentId as string,
        source: 'save-answered-essay',
        data: {
          updated_at: new Date().toISOString(),
        }
      }));
    })
  ), { dispatch: false });

  saveAnsweredEssayFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredEssayFailure),
    tap(({ error }) => {
      console.error('Error saving answered essay:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Save Answered MCQ
  // ...
  saveAnsweredMCQ$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredMCQ),
    switchMap(async ({ data, enrollmentId }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('chosen_options')
          .insert(data)
          .select('*, correct_option(*), selected_option(*)');

        if (error) {
          throw error;
        }
        return AppActions.saveAnsweredMCQSuccess({ data: result, enrollmentId });
      } catch (error) {
        console.error('Error saving answered MCQ:', error);
        return AppActions.saveAnsweredMCQFailure({ error, enrollmentId });
      }
    })
  ));

  saveAnsweredMCQSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredMCQSuccess),
    tap(({ data, enrollmentId }) => {
      console.log('Answered MCQ saved successfully:', data);
      this.spinner.hide();

      // update enrollment to trigger function in supabase
      this.store.dispatch(AppActions.updateEnrollment({
        id: enrollmentId as string,
        source: 'save-answered-mcq',
        data: {
          updated_at: new Date().toISOString(),
        }
      }));
    })
  ), { dispatch: false });

  saveAnsweredMCQFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.saveAnsweredMCQFailure),
    tap(({ error }) => {
      console.error('Error saving answered MCQ:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Upload audio
  // ...
  uploadAudio$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.uploadAudio),
    switchMap(async ({ fileData }) => {
      this.spinner.show();

      console.log('file data', fileData);

      try {
        const path = fileData.value.path as string;
        const storageRef = ref(this.fireStorage, `sounds${path.includes('/') ? path : '/' + path}`);
        let { data } = await Filesystem.readFile({ 
          directory: Directory.Data,
          path: path.includes('/') ? path : '/' + path,
        });

        if (typeof data === 'string') {
          data = new Blob([new Uint8Array(decode(data))], { type: fileData.value.mimeType });
        }

        const snapshot = await uploadBytes(storageRef, data);
        if (snapshot) {
          const downloadURL = await getDownloadURL(snapshot.ref);
          const bucket = snapshot.metadata.bucket;
          const fullPath = snapshot.metadata.fullPath;
          const storageLocation = `gs://${bucket}/${fullPath}`;

          return AppActions.uploadAudioSuccess({
            data: { 
              downloadUrl: downloadURL, 
              storageLocation: storageLocation
            }
          });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading audio:', error);
        return AppActions.uploadAudioFailure({ error });
      }
    })
  ));

  uploadAudioSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.uploadAudioSuccess),
    tap(({ data }) => {
      console.log('Audio uploaded successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  uploadAudioFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.uploadAudioFailure),
    tap(({ error }) => {
      console.error('Error uploading audio:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });

  
  // ...
  // Transcribe Audio
  // ...
  transcribeAudio$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.transcribeAudio),
    switchMap(({ gcsUri, mimeType }) => {
      this.spinner.show();
      return this.httpService.transcribeAudio(gcsUri, mimeType).pipe(
        map((response: any) => AppActions.transcribeAudioSuccess({ data: response })),
        catchError((error: any) => of(AppActions.transcribeAudioFailure({ error })))
      )
    })
  ));

  transcribeAudioSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.transcribeAudioSuccess),
    tap(({ data }) => {
      console.log('Audio transcribed successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  transcribeAudioFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.transcribeAudioFailure),
    tap(({ error }) => {
      console.error('Error transcribing audio:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Create attempt
  // ...
  createAttempt$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createAttempt),
    switchMap(async ({ data, source, metadata }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('attempts')
          .insert({
            user: data.user,
            lesson: data.lessonId,
            enrollment: data.enrollmentId
          })
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.createAttemptSuccess({ data: result, source, metadata });
      } catch (error) {
        console.error('Error saving attempt:', error);
        return AppActions.createAttemptFailure({ error, source, metadata });
      }
    })
  ));

  createAttemptSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createAttemptSuccess),
    tap(({ data, source, metadata }) => {
      console.log('Attempt created successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  createAttemptFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createAttemptFailure),
    tap(({ error, source, metadata }) => {
      console.error('Error creating attempt:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Create note
  // ...
  createNote$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createNote),
    switchMap(async ({ data, source }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('notes')
          .insert(data)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.createNoteSuccess({ data: result, source: source });
      } catch (error) {
        console.error('Error saving note:', error);
        return AppActions.createNoteFailure({ error, source });
      }
    })
  ));

  createNoteSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createNoteSuccess),
    tap(({ data, source }) => {
      console.log('Note written successfully:', data);
      this.spinner.hide();
      this.entryFormService.resetState();

      if (source === 'home') {
        this.router.navigate(['/notes']);
      }
    })
  ), { dispatch: false });

  createNoteFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createNoteFailure),
    tap(({ error }) => {
      console.error('Error writing note:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update note
  // ...
  updateNote$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateNote),
    switchMap(async ({ id, data }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('notes')
          .update(data)
          .eq('id', id)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.updateNoteSuccess({ data: result });
      } catch (error) {
        console.error('Error updating note:', error);
        return AppActions.updateNoteFailure({ error });
      }
    })
  ));

  updateNoteSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateNoteSuccess),
    tap(({ data }) => {
      console.log('Note updated successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  updateNoteFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateNoteFailure),
    tap(({ error }) => {
      console.error('Error updating note:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Delete note
  // ...
  deleteNote$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteNote),
    switchMap(async ({ id }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('notes')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.deleteNoteSuccess({ id });
      } catch (error) {
        console.error('Error deleting note:', error);
        return AppActions.deleteNoteFailure({ id, error });
      }
    })
  ));

  deleteNoteSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteNoteSuccess),
    tap(({ id }) => {
      console.log('Note deleted successfully:', id);
      this.spinner.hide();
    })
  ), { dispatch: false });

  deleteNoteFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteNoteFailure),
    tap(({ error }) => {
      console.error('Error deleting note:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Get notes
  // ...
  getNotes$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getNotes),
    switchMap(async ({ filter, metadata }) => {
      if (!metadata?.isLoadMore) {
        this.spinner.show();
      }

      const lt = filter.lt_date;
      const gt = filter.gt_date;

      try {
        let query = this.supabaseService.getSupabase()
          .from('notes')
          .select(`*`)
          .eq('user', filter.user_id);

        if (lt) {
          query = query.gte('created_at', new Date(subDays(lt, 0)).toISOString());
        }

        if (gt) {
          query = query.lt('created_at', new Date(addDays(gt, 1)).toISOString());
        }

        query = query.is('deleted_at', null)
          .range(filter.from_page, filter.to_page)
          .order('created_at', { ascending: false })
          .limit(environment.queryPerPage);
          
        const { data, error } = await query;

        if (error) {
          throw error;
        }
        return AppActions.getNotesSuccess({ data, filter, metadata });
      } catch (error) {
        console.error('Error getting notes:', error);
        return AppActions.getNotesFailure({ error, filter, metadata });
      }
    })
  ));

  getNotesSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getNotesSuccess),
    tap(({ data }) => {
      console.log('Notes retrieved successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  getNotesFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getNotesFailure),
    tap(({ error }) => {
      console.error('Error getting notes:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Create Todo
  // ...
  createTodo$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createTodo),
    switchMap(async ({ data, source }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('todos')
          .insert(data)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.createTodoSuccess({ data: result, source: source });
      } catch (error) {
        console.error('Error saving Todo:', error);
        return AppActions.createTodoFailure({ error, source });
      }
    })
  ));

  createTodoSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createTodoSuccess),
    tap(({ data, source }) => {
      console.log('Todo created successfully:', data);
      this.spinner.hide();
      this.entryFormService.resetState();

      if (source === 'home') {
        this.router.navigate(['/todos']);
      }
    })
  ), { dispatch: false });

  createTodoFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.createTodoFailure),
    tap(({ error }) => {
      console.error('Error creating Todo:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Update Todo
  // ...
  updateTodo$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateTodo),
    switchMap(async ({ id, data }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('todos')
          .update(data)
          .eq('id', id)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.updateTodoSuccess({ data: result });
      } catch (error) {
        console.error('Error updating Todo:', error);
        return AppActions.updateTodoFailure({ error });
      }
    })
  ));

  updateTodoSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateTodoSuccess),
    tap(({ data }) => {
      console.log('Todo updated successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  updateTodoFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.updateTodoFailure),
    tap(({ error }) => {
      console.error('Error updating Todo:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Delete Todo
  // ...
  deleteTodo$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteTodo),
    switchMap(async ({ id }) => {
      this.spinner.show();

      try {
        const { data: result, error } = await this.supabaseService.getSupabase()
          .from('todos')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .select('*');

        if (error) {
          throw error;
        }
        return AppActions.deleteTodoSuccess({ id });
      } catch (error) {
        console.error('Error deleting Todo:', error);
        return AppActions.deleteTodoFailure({ id, error });
      }
    })
  ));

  deleteTodoSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteTodoSuccess),
    tap(({ id }) => {
      console.log('Todo deleted successfully:', id);
      this.spinner.hide();
    })
  ), { dispatch: false });

  deleteTodoFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.deleteTodoFailure),
    tap(({ error }) => {
      console.error('Error deleting Todo:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });


  // ...
  // Get Todos
  // ...
  getTodos$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getTodos),
    switchMap(async ({ filter, metadata }) => {
      if (!metadata?.isLoadMore) {
        this.spinner.show();
      }

      const lt = filter.lt_date;
      const gt = filter.gt_date;

      try {
        let query = this.supabaseService.getSupabase()
          .from('todos')
          .select(`*`)
          .eq('user', filter.user_id);

        if (filter.lesson) {
          query = query.eq('lesson', filter.lesson);
        }

        if (lt) {
          query = query.gte('created_at', new Date(subDays(lt, 0)).toISOString());
        }

        if (gt) {
          query = query.lt('created_at', new Date(addDays(gt, 1)).toISOString());
        }

        query = query.is('deleted_at', null)
          .range(filter.from_page, filter.to_page)
          .order('created_at', { ascending: false })
          .limit(environment.queryPerPage);
          
        const { data, error } = await query;

        if (error) {
          throw error;
        }
        return AppActions.getTodosSuccess({ data, filter, metadata });
      } catch (error) {
        console.error('Error getting Todos:', error);
        return AppActions.getTodosFailure({ error, filter, metadata });
      }
    })
  ));

  getTodosSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getTodosSuccess),
    tap(({ data }) => {
      console.log('Todos retrieved successfully:', data);
      this.spinner.hide();
    })
  ), { dispatch: false });

  getTodosFailure$ = createEffect(() => this.actions$.pipe(
    ofType(AppActions.getTodosFailure),
    tap(({ error }) => {
      console.error('Error getting Todos:', error);
      this.spinner.hide();
    })
  ), { dispatch: false });
}
