import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RecordingData } from 'capacitor-voice-recorder';

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

    'Update Enrollment': props<{ id: string | number, data: any, source?: string, metadata?: any }>(),
    'Update Enrollment Success': props<{ id: string | number, data: any, source?: string, metadata?: any }>(),
    'Update Enrollment Failure': props<{ id: string | number, error: any, source?: string, metadata?: any }>(),

    'Delete Enrollment': props<{ id: string | number }>(),
    'Delete Enrollment Success': props<{ id: string | number }>(),
    'Delete Enrollment Failure': props<{ id: string | number, error: any }>(),

    'Get Enrollments': props<{ 
      filter: { 
        user_id: string | number,
        from_page: number,
        to_page: number,
        lt_date?: string,
        gt_date?: string,
      },
      metadata?: any
    }>(),
    'Get Enrollments Success': props<{ 
      data: any,
      filter: { 
        user_id: string | number,
        from_page: number,
        to_page: number,
        lt_date?: string,
        gt_date?: string,
      },
      metadata?: any
    }>(),
    'Get Enrollments Failure': props<{ error: any }>(),

    'Get Enrollment': props<{ id: string | number }>(),
    'Get Enrollment Success': props<{ data: any }>(),
    'Get Enrollment Failure': props<{ id: string | number, error: any }>(),

    'Get Latest Enrollments': props<{ filter: { 
      user_id: string | number, 
      created_at: Date | string, 
      target_completion_datetime: Date | string
    } }>(),
    'Get Latest Enrollments Success': props<{ data: any }>(),
    'Get Latest Enrollments Failure': props<{ error: any }>(),

    'Update Profile': props<{ id: string, data: any }>(),
    'Update Profile Success': props<{ id: string, data: any }>(),
    'Update Profile Failure': props<{ id: string, error: any }>(),

    'Create Reminder': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Reminder Success': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Reminder Failure': props<{ error: any, source?: string, metadata?: any }>(),

    'Update Reminder': props<{ data: any, source?: string, metadata?: any }>(),
    'Update Reminder Success': props<{ data: any, source?: string, metadata?: any }>(),
    'Update Reminder Failure': props<{ error: any, source?: string, metadata?: any }>(),

    'Create Attempt': props<{ data: { user: string, lessonId: number, enrollmentId: number }, source?: string, metadata?: any }>(),
    'Create Attempt Success': props<{ data: any, source?: string, metadata?: any }>(),
    'Create Attempt Failure': props<{ error: any, source?: string, metadata?: any }>(),

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

    'Save Answered Essay': props<{ data: any[], enrollmentId?: number | string; source?: string }>(),
    'Save Answered Essay Success': props<{ data: any[], enrollmentId?: number | string; source?: string }>(),
    'Save Answered Essay Failure': props<{ error: any, enrollmentId?: number | string; source?: string }>(),

    'Save Answered MCQ': props<{ data: any[], enrollmentId?: number | string; source?: string }>(),
    'Save Answered MCQ Success': props<{ data: any[], enrollmentId?: number | string; source?: string }>(),
    'Save Answered MCQ Failure': props<{ error: any, enrollmentId?: number | string; source?: string }>(),

    'Upload Audio': props<{ fileData: RecordingData }>(),
    'Upload Audio Success': props<{ data: any }>(),
    'Upload Audio Failure': props<{ error: any }>(),

    'Transcribe Audio': props<{ gcsUri: string }>(),
    'Transcribe Audio Success': props<{ data: any }>(),
    'Transcribe Audio Failure': props<{ error: any }>()
  }
});
