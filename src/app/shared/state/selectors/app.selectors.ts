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

export const selectLatestEnrollments = createSelector(
  selectAppState,
  (state: GlobalState) => state.enrollment.latest
);

export const selectEnrollments = createSelector(
  selectAppState,
  (state: GlobalState) => state.enrollment.list
);

export const selectUpdateEnrollment = createSelector(
  selectAppState,
  (state: GlobalState) => state.enrollment.update
);

export const selectEnrollment = (props: { id: string | number }) => createSelector(
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

export const selectGenerateMCQ = createSelector(
  selectAppState,
  (state: GlobalState) => state.AI.generateMCQ
);

export const selectGenerateEssay = createSelector(
  selectAppState,
  (state: GlobalState) => state.AI.generateEssay
);

export const selectMCQQuestions = createSelector(
  selectAppState,
  (state: GlobalState) => state.questions.mcq
);

export const selectEssayQuestions = createSelector(
  selectAppState,
  (state: GlobalState) => state.questions.essay
);

export const selectSaveAnsweredEssay = createSelector(
  selectAppState,
  (state: GlobalState) => state.questions.saveAnsweredEssay
);

export const selectSaveAnsweredMCQ = createSelector(
  selectAppState,
  (state: GlobalState) => state.questions.saveAnsweredMCQ
);

export const selectUploadAudio = createSelector(
  selectAppState,
  (state: GlobalState) => state.uploadAudio
);

export const selectTranscribeAudio = createSelector(
  selectAppState,
  (state: GlobalState) => state.transcribeAudio
);

export const selectCreateNote = createSelector(
  selectAppState,
  (state: GlobalState) => state.notes.create
);

export const selectListNotes = createSelector(
  selectAppState,
  (state: GlobalState) => state.notes.list
);

export const selectCreateTodo = createSelector(
  selectAppState,
  (state: GlobalState) => state.todos.create
);

export const selectListTodos = createSelector(
  selectAppState,
  (state: GlobalState) => state.todos.list
);