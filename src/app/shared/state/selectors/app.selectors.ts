import { createFeatureSelector, createSelector } from '@ngrx/store';
import { appFeatureKey, GlobalState } from '../reducers/app.reducer';

export const selectAppState = createFeatureSelector<GlobalState>(appFeatureKey);

export const selectSignInWithGoogleState = createSelector(
  selectAppState,
  (state: GlobalState) => state.signInWithGoogle
);

export const selectUpdateLesson = createSelector(
  selectAppState,
  (state: GlobalState) => state.lesson.update
);

export const selectLatestEnrolledLessons = createSelector(
  selectAppState,
  (state: GlobalState) => state.enrollment.latest
);

export const selectEnrolledLessons = createSelector(
  selectAppState,
  (state: GlobalState) => state.enrollment.list
);

export const selectUpdateEnrollment = createSelector(
  selectAppState,
  (state: GlobalState) => state.enrollment.update
);

export const selectEnrolledLesson = (props: { id: string | number }) => createSelector(
  selectAppState,
  (state: GlobalState) => {
    const findFromList = state.enrollment.list.data.find((item: any) => item.id == props.id);
    if (findFromList) {
      return {
        data: findFromList,
        isLoading: false,
        error: null,
      };
    }

    return state.enrollment.single;
  }
);

export const selectUpdateProfile = createSelector(
  selectAppState,
  (state: GlobalState) => state.profile.update
);
