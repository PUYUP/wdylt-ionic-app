export const calculatePoints = (data: any[]): any[] => {
    const newData = data.map((item: any) => {
        // sum points from each lesson questions
        const correctAnsweredMCQPoints = item.mcq_answers.reduce((sum: number, answer: any) => {
            if (answer.is_correct) {
                return sum + (answer.points_earned || 0);
            }
            return sum;
        }, 0);

        // total points from all questions
        const totalMCQPoints = item.lesson.mcq_questions.reduce((sum: number, question: any) => {
            return sum + (question.points || 0);
        }, 0);

        // total correct answer
        const totalCorrectAnsweredMCQ = item.mcq_answers.filter((answer: any) => answer.is_correct).length;
        
        // total questions
        const totalMCQQuestions = item.lesson.mcq_questions.length;
        const totalEssayQuestions = item.essay_answers.length;

        // success rate
        const mcqSuccessRate = totalMCQQuestions > 0 ? (totalCorrectAnsweredMCQ / totalMCQQuestions) * 100 : 0;
        
        // total essay points
        const totalEssayPoints = item.essay_answers.reduce((sum: number, answer: any) => {
            return sum + (answer.points || 0);
        }, 0);

        return {
            ...item,
            summary: {
                mcq: {
                    correct_answer: totalCorrectAnsweredMCQ,
                    correct_answer_points: correctAnsweredMCQPoints,
                    total_points: totalMCQPoints,
                    total_questions: totalMCQQuestions,
                    success_rate: mcqSuccessRate.toFixed(2),
                },
                    essay: {
                    total_points: totalEssayPoints,
                    total_questions: totalEssayQuestions,
                }
            },
        }
    });

    return newData;
}