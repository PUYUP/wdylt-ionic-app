import { createReducer, on } from '@ngrx/store';
import { AppActions } from '../actions/app.actions';
import { state } from '@angular/animations';
import { calculatePoints } from '../../helpers';

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
  profile: {
    update: {
      data: any;
      error: any | null;
      isLoading: boolean;
    }
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
  },
  AI: {
    generateMCQ: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    },
    generateEssay: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    }
  },
  questions: {
    mcq: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    },
    essay: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    },
    saveAnsweredEssay: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    },
    saveAnsweredMCQ: {
      data: any | null;
      error: any | null;
      isLoading: boolean;
    },
  },
  uploadAudio: {
    data: null,
    error: null,
    isLoading: false,
  },
  transcribeAudio: {
    data: null,
    error: null,
    isLoading: false,
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
  profile: {
    update: {
      data: null,
      error: null,
      isLoading: false,
    }
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
  },
  AI: {
    generateMCQ: {
      data: null,
      error: null,
      isLoading: false,
    },
    generateEssay: {
      data: null,
      error: null,
      isLoading: false,
    }
  },
  questions: {
    mcq: {
      data: null,
      error: null,
      isLoading: false,
    },
    essay: {
      data: null,
      error: null,
      isLoading: false,
    },
    saveAnsweredEssay: {
      data: null,
      error: null,
      isLoading: false,
    },
    saveAnsweredMCQ: {
      data: null,
      error: null,
      isLoading: false,
    }
  },
  uploadAudio: {
    data: null,
    error: null,
    isLoading: false,
  },
  transcribeAudio: {
    data: null,
    error: null,
    isLoading: false,
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
  on(AppActions.updateEnrollment, (state) => ({
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

  on(AppActions.updateEnrollmentSuccess, (state, { data, source }) => {
    const index = state.enrollment.latest.data.findIndex(item => item.id === data[0].id);
    const status = data[0].status;

    // latest enrollment
    let latest = {
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

    // list enrollment
    let list = {
      ...state.enrollment.list,
      data: [
        ...state.enrollment.list.data.slice(0, index),
        {
          ...state.enrollment.list.data[index],
          ...data[0],
        },
        ...state.enrollment.list.data.slice(index + 1)
      ],
      isLoading: false,
      error: null,
    }

    if (status === 'completed') {
      // remove from list if status is completed
      latest = {
        ...latest,
        data: latest.data.filter(item => item.status !== status),
      }
    }

    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        update: {
          data: data,
          error: null,
          isLoading: false,
        },
        latest: source != 'save-answered-essay' && source != 'save-answered-mcq' ? latest : state.enrollment.latest,
        list:  source != 'save-answered-essay' && source != 'save-answered-mcq' ? list : state.enrollment.list,
      }
    }
  }),

  on(AppActions.updateEnrollmentFailure, (state, { error }) => ({
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
  on(AppActions.getLatestEnrollments, (state) => ({
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
  on(AppActions.getLatestEnrollmentsSuccess, (state, { data }) => ({
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
  on(AppActions.getLatestEnrollmentsFailure, (state, { error }) => ({
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
  on(AppActions.deleteEnrollment, (state) => ({
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
  on(AppActions.deleteEnrollmentSuccess, (state, { id }) => {
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

  on(AppActions.deleteEnrollmentFailure, (state, { id, error }) => ({
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
  on(AppActions.getEnrollments, (state, { metadata }) => {
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

  on(AppActions.getEnrollmentsSuccess, (state, { data, metadata }) => {
    const isLoadMore = metadata?.isLoadMore;
    const combinedData = isLoadMore ? [...state.enrollment.list.data, ...data] : data;

    return {
      ...state,
      enrollment: {
        ...state.enrollment,
        list: {
          data: combinedData,
          error: null,
          isLoading: false,
          metadata: data.metadata,
        }
      }
    }
  }),

  on(AppActions.getEnrollmentsFailure, (state, { error }) => {
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
  on(AppActions.getEnrollment, (state) => ({
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
  on(AppActions.getEnrollmentSuccess, (state, { data }) => ({
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
  on(AppActions.getEnrollmentFailure, (state, { error }) => ({
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


  // ...
  // Update Profile
  // ...
  on(AppActions.updateProfile, (state) => ({
    ...state,
    profile: {
      ...state.profile,
      update: {
        ...state.profile.update,
        error: null,
        isLoading: true,
      }
    }
  })),

  on(AppActions.updateProfileSuccess, (state, { data }) => ({
    ...state,
    profile: {
      ...state.profile,
      update: {
        ...state.profile.update,
        data: data,
        error: null,
        isLoading: false,
      }
    }
  })),

  on(AppActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    profile: {
      ...state.profile,
      update: {
        ...state.profile.update,
        error: error,
        isLoading: false,
      }
    }
  })),


  // ...
  // Generate MCQ
  // ...
  on(AppActions.aIGenerateMCQ, (state) => ({
    ...state,
    AI: {
      ...state.AI,
      generateMCQ: {
        ...state.AI.generateMCQ,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.aIGenerateMCQSuccess, (state, { data }) => ({
    ...state,
    AI: {
      ...state.AI,
      generateMCQ: {
        ...state.AI.generateMCQ,
        error: null,
        isLoading: false,
        data: data,
      }
    }
  })),
  on(AppActions.aIGenerateMCQFailure, (state, { error }) => ({
    ...state,
    AI: {
      ...state.AI,
      generateMCQ: {
        ...state.AI.generateMCQ,
        isLoading: false,
        error: error,
      }
    }
  })),


  // ...
  // Generate Essay
  // ...
  on(AppActions.aIGenerateEssay, (state) => ({
    ...state,
    AI: {
      ...state.AI,
      generateEssay: {
        ...state.AI.generateEssay,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.aIGenerateEssaySuccess, (state, { data }) => ({
    ...state,
    AI: {
      ...state.AI,
      generateEssay: {
        ...state.AI.generateEssay,
        isLoading: false,
        data: data,
        error: null,
      }
    }
  })),
  on(AppActions.aIGenerateEssayFailure, (state, { error }) => ({
    ...state,
    AI: {
      ...state.AI,
      generateEssay: {
        ...state.AI.generateEssay,
        isLoading: false,
        error: error,
      }
    }
  })),


  // ...
  // Get MCQ Questions
  // ...
  on(AppActions.getMCQQuestions, (state) => ({
    ...state,
    questions: {
      ...state.questions,
      mcq: {
        ...state.questions.mcq,
        data: null,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.getMCQQuestionsSuccess, (state, { data }) => {
    const lessonId = data?.[0]?.lesson;
    const latestEnrollmentIndex = state.enrollment.latest.data.findIndex((item: any) => item.lesson.id == lessonId);
    const listEnrollmentIndex = state.enrollment.list.data.findIndex((item: any) => item.lesson.id == lessonId);
    
    let listEnrollmentData = state.enrollment.list.data;
    if (listEnrollmentIndex !== -1) {
      listEnrollmentData = [
        ...listEnrollmentData.slice(0, listEnrollmentIndex),
        {
          ...listEnrollmentData[listEnrollmentIndex],
          lesson: {
            ...listEnrollmentData[listEnrollmentIndex].lesson,
            mcq_questions: data,
          }
        },
        ...listEnrollmentData.slice(listEnrollmentIndex + 1),
      ];
    }

    let latestEnrollmentData = state.enrollment.latest.data;
    if (latestEnrollmentIndex !== -1) {
      latestEnrollmentData = [
        ...latestEnrollmentData.slice(0, latestEnrollmentIndex),
        {
          ...latestEnrollmentData[latestEnrollmentIndex],
          lesson: {
            ...latestEnrollmentData[latestEnrollmentIndex].lesson,
            mcq_questions: data,
          }
        },
        ...latestEnrollmentData.slice(latestEnrollmentIndex + 1),
      ];
    }

    return {
      ...state,
      questions: {
        ...state.questions,
        mcq: {
          ...state.questions.mcq,
          data: data,
          isLoading: false,
          error: null,
        }
      },
      enrollment: {
        ...state.enrollment,
        list: {
          ...state.enrollment.list,
          data: data.length > 0 ? calculatePoints(listEnrollmentData) : listEnrollmentData,
        },
        latest: {
          ...state.enrollment.latest,
          data: data.length > 0 ? calculatePoints(latestEnrollmentData) : latestEnrollmentData,
        }
      }
    }
  }),
  on(AppActions.getMCQQuestionsFailure, (state, { error }) => ({
    ...state,
    questions: {
      ...state.questions,
      mcq: {
        ...state.questions.mcq,
        isLoading: false,
        error: error,
      }
    }
  })),


  // ...
  // Get Essay Questions
  // ...
  on(AppActions.getEssayQuestions, (state) => ({
    ...state,
    questions: {
      ...state.questions,
      essay: {
        ...state.questions.essay,
        data: null,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.getEssayQuestionsSuccess, (state, { data }) => {
    const lessonId = data?.[0]?.lesson;
    const latestEnrollmentIndex = state.enrollment.latest.data.findIndex((item: any) => item.lesson.id == lessonId);
    const listEnrollmentIndex = state.enrollment.list.data.findIndex((item: any) => item.lesson.id == lessonId);
    
    let listEnrollmentData = state.enrollment.list.data;
    if (listEnrollmentIndex !== -1) {
      listEnrollmentData = [
        ...listEnrollmentData.slice(0, listEnrollmentIndex),
        {
          ...listEnrollmentData[listEnrollmentIndex],
          lesson: {
            ...listEnrollmentData[listEnrollmentIndex].lesson,
            essay_questions: data,
          }
        },
        ...listEnrollmentData.slice(listEnrollmentIndex + 1),
      ];
    }

    let latestEnrollmentData = state.enrollment.latest.data;
    if (latestEnrollmentIndex !== -1) {
      latestEnrollmentData = [
        ...latestEnrollmentData.slice(0, latestEnrollmentIndex),
        {
          ...latestEnrollmentData[latestEnrollmentIndex],
          lesson: {
            ...latestEnrollmentData[latestEnrollmentIndex].lesson,
            essay_questions: data,
          }
        },
        ...latestEnrollmentData.slice(latestEnrollmentIndex + 1),
      ];
    }

    return {
      ...state,
      questions: {
        ...state.questions,
        essay: {
          ...state.questions.essay,
          data: data,
          isLoading: false,
          error: null,
        }
      },
      enrollment: {
        ...state.enrollment,
        list: {
          ...state.enrollment.list,
          data: data.length > 0 ? calculatePoints(listEnrollmentData) : listEnrollmentData,
        },
        latest: {
          ...state.enrollment.latest,
          data: data.length > 0 ? calculatePoints(latestEnrollmentData) : latestEnrollmentData,
        }
      }
    };
  }),
  on(AppActions.getEssayQuestionsFailure, (state, { error }) => ({
    ...state,
    questions: {
      ...state.questions,
      essay: {
        ...state.questions.essay,
        isLoading: false,
        error: error,
      }
    }
  })),


  // ...
  // Save Answered Essay
  // ...
  on(AppActions.saveAnsweredEssay, (state) => ({
    ...state,
    questions: {
      ...state.questions,
      saveAnsweredEssay: {
        ...state.questions.saveAnsweredEssay,
        data: null,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.saveAnsweredEssaySuccess, (state, { data }) => {
    const questions = state.questions.essay.data || [];
    const questionsWithAnswers = questions.map((question: any) => {
      const answered = data.find((answer: any) => answer.question === question.id);
      return {
        ...question,
        answers: [
          { 
            id: answered?.id || null,
            content: answered?.content || '',
          }
        ]
      };
    });

   // insert answers to enrollment
    const enrollmentId = data[0]?.enrollment;
    const latestEnrollment = state.enrollment.latest;
    const latestEnrollmentIndex = latestEnrollment.data.findIndex((item: any) => item.id === enrollmentId);
    const listEnrollment = state.enrollment.list;
    const listEnrollmentIndex = listEnrollment.data.findIndex((item: any) => item.id === enrollmentId);

    // latest enrollment
    let enrollmentLatest = state.enrollment.latest;
    if (latestEnrollmentIndex !== -1) {
      enrollmentLatest = {
        ...enrollmentLatest,
        data: [
          ...enrollmentLatest.data.slice(0, latestEnrollmentIndex),
          {
            ...enrollmentLatest.data[latestEnrollmentIndex],
            essay_answers: data,
          },
          ...enrollmentLatest.data.slice(latestEnrollmentIndex + 1),
        ],
      }
    }

    // list enrollment
    let enrollmentList = state.enrollment.list;
    if (listEnrollmentIndex !== -1) {
      enrollmentList = {
        ...listEnrollment,
        data: [
          ...listEnrollment.data.slice(0, listEnrollmentIndex),
          {
            ...listEnrollment.data[listEnrollmentIndex],
            essay_answers: data,
          },
          ...listEnrollment.data.slice(listEnrollmentIndex + 1),
        ],
      }
    }

    return {
      ...state,
      questions: {
        ...state.questions,
        saveAnsweredEssay: {
          ...state.questions.saveAnsweredEssay,
          data: data,
          isLoading: false,
          error: null,
        },
        essay: {
          ...state.questions.essay,
          data: questionsWithAnswers,
        }
      },
      enrollment: {
        ...state.enrollment,
        latest: {
          ...enrollmentLatest,
          data: calculatePoints(enrollmentLatest.data),
        },
        list: {
          ...enrollmentList,
          data: calculatePoints(enrollmentList.data),
        },
      }
    };
  }),
  on(AppActions.saveAnsweredEssayFailure, (state, { error }) => ({
    ...state,
    questions: {
      ...state.questions,
      saveAnsweredEssay: {
        ...state.questions.saveAnsweredEssay,
        isLoading: false,
        error: error,
      }
    }
  })),


   // ...
  // Save Answered MCQ
  // ...
  on(AppActions.saveAnsweredMCQ, (state) => ({
    ...state,
    questions: {
      ...state.questions,
      saveAnsweredMCQ: {
        ...state.questions.saveAnsweredMCQ,
        data: null,
        isLoading: true,
        error: null,
      }
    }
  })),
  on(AppActions.saveAnsweredMCQSuccess, (state, { data }) => {
    const questions = state.questions.mcq.data || [];
    const questionsWithAnswers = questions.map((question: any) => {
      const chosenAnswers = data.filter((ans: any) => ans.question === question.id);
      return {
        ...question,
        chosen_options: chosenAnswers,
      };
    });

    // insert answers to enrollment
    const enrollmentId = data[0]?.enrollment;

    let latestEnrollment = state.enrollment.latest;
    const latestEnrollmentIndex = latestEnrollment.data.findIndex((item: any) => item.id === enrollmentId);
    
    let listEnrollment = state.enrollment.list;
    const listEnrollmentIndex = listEnrollment.data.findIndex((item: any) => item.id === enrollmentId);

    // latest enrollment
    if (latestEnrollmentIndex !== -1) {
      latestEnrollment = {
        ...latestEnrollment,
        data: [
          ...latestEnrollment.data.slice(0, latestEnrollmentIndex),
          {
            ...latestEnrollment.data[latestEnrollmentIndex],
            mcq_answers: data,
          },
          ...latestEnrollment.data.slice(latestEnrollmentIndex + 1),
        ],
      }
    }

    // list enrollment
    if (listEnrollmentIndex !== -1) {
      listEnrollment = {
        ...listEnrollment,
        data: [
          ...listEnrollment.data.slice(0, listEnrollmentIndex),
          {
            ...listEnrollment.data[listEnrollmentIndex],
            mcq_answers: data,
          },
          ...listEnrollment.data.slice(listEnrollmentIndex + 1),
        ],
      }
    }

    return {
      ...state,
      questions: {
        ...state.questions,
        saveAnsweredMCQ: {
          ...state.questions.saveAnsweredMCQ,
          data: data,
          isLoading: false,
          error: null,
        },
        mcq: {
          ...state.questions.mcq,
          data: questionsWithAnswers,
        }
      },
      enrollment: {
        ...state.enrollment,
        latest: {
          ...latestEnrollment,
          data: calculatePoints(latestEnrollment.data),
        },
        list: {
          ...listEnrollment,
          data: calculatePoints(listEnrollment.data),
        },
      }
    }
  }),
  on(AppActions.saveAnsweredMCQFailure, (state, { error }) => ({
    ...state,
    questions: {
      ...state.questions,
      saveAnsweredMCQ: {
        ...state.questions.saveAnsweredMCQ,
        isLoading: false,
        error: error,
      }
    }
  })),


  // Upload audio
  on(AppActions.uploadAudio, (state) => ({
    ...state,
    uploadAudio: {
      ...state.uploadAudio,
      loading: true,
      error: null,
    }
  })),
  on(AppActions.uploadAudioSuccess, (state, { data }) => ({
    ...state,
    uploadAudio: {
      ...state.uploadAudio,
      data: data,
      loading: false,
      error: null,
    }
  })),
  on(AppActions.uploadAudioFailure, (state, { error }) => ({
    ...state,
    uploadAudio: {
      ...state.uploadAudio,
      loading: false,
      error: error,
    }
  })),


  // transcribe audio
  on(AppActions.transcribeAudio, (state) => ({
    ...state,
    transcribeAudio: {
      ...state.transcribeAudio,
      loading: true,
      error: null,
    }
  })),
  on(AppActions.transcribeAudioSuccess, (state, { data }) => ({
    ...state,
    transcribeAudio: {
      ...state.transcribeAudio,
      data: data,
      loading: false,
      error: null,
    }
  })),
  on(AppActions.transcribeAudioFailure, (state, { error }) => ({
    ...state,
    transcribeAudio: {
      ...state.transcribeAudio,
      loading: false,
      error: error,
    }
  }))
)
