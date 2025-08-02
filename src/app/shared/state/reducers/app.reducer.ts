import { createReducer, on } from '@ngrx/store';
import { AppActions } from '../actions/app.actions';

export const appFeatureKey = 'app';

export interface GlobalState {
  signInWithGoogle: {
    isLoading: boolean;
    error: any | null;
  };
  user: {
    data: any;
    error: any;
    isLoading: boolean;
  },
  enrollment: {
    create: {
      data: any;
      error: any | null;
      isLoading: boolean;
    },
    update: {
      data: any;
      error: any | null;
      isLoading: boolean;
    },
    delete: {
      data: any;
      error: any | null;
      isLoading: boolean;
    },
    latest: {
      data: any[];
      error: any | null;
      isLoading: boolean;
    },
    list: {
      data: any[];
      error: any | null;
      isLoading: boolean;
      metadata?: any;
    },
    single: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    }
  },
  lesson: {
    create: {
      data: any;
      error: any | null;
      isLoading: boolean;
    },
    update: {
      data: any;
      error: any | null;
      isLoading: boolean;
    },
    list: {
      data: any[];
      error: any | null;
      isLoading: boolean;
      metadata?: any;
    }
  }
}

export const initialState: GlobalState = {
  signInWithGoogle: {
    isLoading: false,
    error: null,
  },
  user: {
    data: null,
    error: null,
    isLoading: false,
  },
  enrollment: {
    create: {
      data: null,
      error: null,
      isLoading: false,
    },
    update: {
      data: null,
      error: null,
      isLoading: false,
    },
    delete: {
      data: null,
      error: null,
      isLoading: false,
    },
    latest: {
      data: [],
      error: null,
      isLoading: false,
    },
    list: {
      data: [],
      error: null,
      isLoading: false,
      metadata: null,
    },
    single: {
      data: null,
      error: null,
      isLoading: false,
    }
  },
  lesson: {
    create: {
      data: null,
      error: null,
      isLoading: false,
    },
    update: {
      data: null,
      error: null,
      isLoading: false,
    },
    list: {
      data: [],
      error: null,
      isLoading: false,
      metadata: null,
    }
  }
};

export const appReducer = createReducer(
  initialState,

  // ...
  // Sign In With Google Actions
  // ...
  on(AppActions.signInWithGoogle, (state) => ({
    ...state,
    signInWithGoogle: {
      isLoading: true,
      error: null,
    }
  })),
  
  on(AppActions.signInWithGoogleSuccess, (state, { user }) => ({
    ...state,
    user: {
      data: user,
      error: null,
      isLoading: false,
    }
  })),

  on(AppActions.signInWithGoogleFailure, (state, { error }) => ({
    ...state,
    signInWithGoogle: {
      isLoading: false,
      error: error,
    }
  })),


  // ...
  // Create Lesson Actions  
  // ...
  on(AppActions.createLesson, (state) => ({
    ...state,
    lesson: {
      ...state.lesson,
      create: {
        data: null,
        error: null,
        isLoading: true,
      }
    }
  })),
  on(AppActions.createLessonSuccess, (state, { data }) => ({
    ...state,
    lesson: {
      ...state.lesson,
      create: {
        data: data,
        error: null,
        isLoading: false,
      }
    }
  })),
  on(AppActions.createLessonFailure, (state, { error }) => ({
    ...state,
    lesson: {
      ...state.lesson,
      create: {
        data: null,
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Update Lesson Actions
  // ...
  on(AppActions.updateLesson, (state) => ({
    ...state,
    lesson: {
      ...state.lesson,
      update: {
        data: null,
        error: null,
        isLoading: true,
      }
    }
  })),
  on(AppActions.updateLessonSuccess, (state, { id, data }) => ({
    ...state,
    lesson: {
      ...state.lesson,
      update: {
        data: data,
        error: null,
        isLoading: false,
      }
    }
  })),
  on(AppActions.updateLessonFailure, (state, { id, error }) => ({
    ...state,
    lesson: {
      ...state.lesson,
      update: {
        data: null,
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Create enrollment lesson
  // ...
  on(AppActions.enrollLesson, (state) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      create: {
        data: null,
        error: null,
        isLoading: true,
      }
    }
  })),

  on(AppActions.enrollLessonSuccess, (state, { data }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      create: {
        data: data,
        error: null,
        isLoading: false,
      },
      latest: {
        ...state.enrollment.latest,
        data: [
          data[0],
          ...state.enrollment.latest.data,
        ],
        isLoading: false,
        error: null,
      }
    }
  })),

  on(AppActions.enrollLessonFailure, (state, { error }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      create: {
        data: null,
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Update enrolled lesson
  // ...
  on(AppActions.updateEnrolledLesson, (state) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      update: {
        data: null,
        error: null,
        isLoading: true,
      }
    }
  })),

  on(AppActions.updateEnrolledLessonSuccess, (state, { data }) => {
    const index = state.enrollment.latest.data.findIndex(item => item.id === data[0].id);

    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        update: {
          data: data,
          error: null,
          isLoading: false,
        },
        latest: {
          ...state.enrollment.latest,
          data: [
            ...state.enrollment.latest.data.slice(0, index),
            {
              ...state.enrollment.latest.data[index],
              ...data[0],
            },
            ...state.enrollment.latest.data.slice(index + 1)
          ],
          isLoading: false,
          error: null,
        }
      }
    }
  }),

  on(AppActions.updateEnrolledLessonFailure, (state, { error }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      update: {
        data: null,
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Get latest enrolled lessons
  // ...
  on(AppActions.getLatestEnrolledLessons, (state) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      latest: {
        ...state.enrollment.latest,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.getLatestEnrolledLessonsSuccess, (state, { data }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      latest: {
        data: data,
        error: null,
        isLoading: false,
      }
    }
  })),
  on(AppActions.getLatestEnrolledLessonsFailure, (state, { error }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      latest: {
        data: [],
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Delete enrolled lesson
  // ...
  on(AppActions.deleteEnrolledLesson, (state) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      delete: {
        data: null,
        error: null,
        isLoading: true,
      }
    }
  })),
  on(AppActions.deleteEnrolledLessonSuccess, (state, { id }) => {
    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        delete: {
          data: id,
          error: null,
          isLoading: false,
        },
        latest: {
          ...state.enrollment.latest,
          data: state.enrollment.latest.data.filter(item => item.id !== id),
          isLoading: false,
          error: null,
        }
      }
    }
  }),

  on(AppActions.deleteEnrolledLessonFailure, (state, { id, error }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      delete: {
        data: null,
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Get enrolled lessons
  // ...
  on(AppActions.getEnrolledLessons, (state, { metadata }) => {
    const isLoadMore = metadata?.isLoadMore;

    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        list: {
          ...state.enrollment.list,
          error: null,
          isLoading: isLoadMore ? false : true,
          metadata: null,
        }
      }
    }
  }),

  on(AppActions.getEnrolledLessonsSuccess, (state, { data, metadata }) => {
    const isLoadMore = metadata?.isLoadMore;

    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        list: {
          data: isLoadMore ? [...state.enrollment.list.data, ...data] : data,
          error: null,
          isLoading: false,
          metadata: data.metadata,
        }
      }
    }
  }),

  on(AppActions.getEnrolledLessonsFailure, (state, { error }) => {
    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        list: {
          data: [],
          error: error,
          isLoading: false,
          metadata: null,
        }
      }
    }
  }),


  // ...
  // Get enrolled lesson single
  // ...
  on(AppActions.getEnrolledLesson, (state) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      single: {
        ...state.enrollment.single,
        error: null,
        isLoading: true,
      }
    }
  })),
  on(AppActions.getEnrolledLessonSuccess, (state, { data }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      single: {
        ...state.enrollment.single,
        data: data,
        error: null,
        isLoading: false,
      }
    }
  })),
  on(AppActions.getEnrolledLessonFailure, (state, { error }) => ({
    ...state,
    enrollment: {
      ...state.enrollment,
      single: {
        ...state.enrollment.single,
        error: error,
        isLoading: false,
      }
    }
  })),
)
