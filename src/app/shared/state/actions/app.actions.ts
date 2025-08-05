import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AppActions = createActionGroup({
  source: 'App',
  events: {
    'Sign In With Google': props<{ source?: string }>(),
    'Sign In With Google Success': props<{ user: any, source?: string }>(),
    'Sign In With Google Failure': props<{ error: any, source?: string }>(),
    
    'Sign Out': emptyProps(),
    'Sign Out Success': emptyProps(),
    'Sign Out Failure': props<{ error: any }>(),

    'Create Lesson': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Lesson Success': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Lesson Failure': props<{ error: any, source?: string, metadata?: any }>(),

    'Update Lesson': props<{ id: string | number, data: any, source?: string }>(),
    'Update Lesson Success': props<{ id: string | number, data: any, source?: string }>(),
    'Update Lesson Failure': props<{ id: string | number, error: any, source?: string }>(),

    'Enroll Lesson': props<{ data: any }>(),
    'Enroll Lesson Success': props<{ data: any }>(),
    'Enroll Lesson Failure': props<{ error: any }>(),

    'Update Enrolled Lesson': props<{ id: string | number, data: any, source?: string, metadata?: any }>(),
    'Update Enrolled Lesson Success': props<{ id: string | number, data: any, source?: string, metadata?: any }>(),
    'Update Enrolled Lesson Failure': props<{ id: string | number, error: any, source?: string, metadata?: any }>(),

    'Delete Enrolled Lesson': props<{ id: string | number }>(),
    'Delete Enrolled Lesson Success': props<{ id: string | number }>(),
    'Delete Enrolled Lesson Failure': props<{ id: string | number, error: any }>(),

    'Get Enrolled Lessons': props<{ 
      filter: { 
        user_id: string | number,
        from_page: number,
        to_page: number,
      },
      metadata?: any
    }>(),
    'Get Enrolled Lessons Success': props<{ 
      data: any,
      filter: { 
        user_id: string | number,
        from_page: number,
        to_page: number,
      },
      metadata?: any
    }>(),
    'Get Enrolled Lessons Failure': props<{ error: any }>(),

    'Get Enrolled Lesson': props<{ id: string | number }>(),
    'Get Enrolled Lesson Success': props<{ data: any }>(),
    'Get Enrolled Lesson Failure': props<{ id: string | number, error: any }>(),

    'Get Latest Enrolled Lessons': props<{ filter: { 
      user_id: string | number, 
      start_datetime: Date | string, 
      target_completion_datetime: Date | string
    } }>(),
    'Get Latest Enrolled Lessons Success': props<{ data: any }>(),
    'Get Latest Enrolled Lessons Failure': props<{ error: any }>(),

    'Update Profile': props<{ id: string, data: any }>(),
    'Update Profile Success': props<{ id: string, data: any }>(),
    'Update Profile Failure': props<{ id: string, error: any }>(),

    'Create Reminder': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Reminder Success': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Reminder Failure': props<{ error: any, source?: string, metadata?: any }>(),

    'Update Reminder': props<{ data: any, source?: string, metadata?: any }>(),
    'Update Reminder Success': props<{ data: any, source?: string, metadata?: any }>(),
    'Update Reminder Failure': props<{ error: any, source?: string, metadata?: any }>(),

    'AI Generate MCQ': props<{ topic: string, source?: string }>(),
    'AI Generate MCQ Success': props<{ data: any, source?: string }>(),
    'AI Generate MCQ Failure': props<{ error: any, source?: string }>(),

    'AI Generate Essay': props<{ topic: string, source?: string }>(),
    'AI Generate Essay Success': props<{ data: any, source?: string }>(),
    'AI Generate Essay Failure': props<{ error: any, source?: string }>(),

    'Get MCQ Questions': props<{ lessonId: string | number }>(),
    'Get MCQ Questions Success': props<{ data: any }>(),
    'Get MCQ Questions Failure': props<{ error: any }>(),

    'Get Essay Questions': props<{ lessonId: string | number }>(),
    'Get Essay Questions Success': props<{ data: any }>(),
    'Get Essay Questions Failure': props<{ error: any }>(),

    'Save Answered Essay': props<{ data: any[], source?: string }>(),
    'Save Answered Essay Success': props<{ data: any[], source?: string }>(),
    'Save Answered Essay Failure': props<{ error: any, source?: string }>(),

    'Save Answered MCQ': props<{ data: any[], source?: string }>(),
    'Save Answered MCQ Success': props<{ data: any[], source?: string }>(),
    'Save Answered MCQ Failure': props<{ error: any, source?: string }>(),
  }
});
