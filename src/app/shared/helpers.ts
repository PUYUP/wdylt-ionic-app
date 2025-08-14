import { inject } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { EntryFormService } from "./services/entry-form.service";

export const calculatePoints = (data: any[]): any[] => {
    const newData = data.map((item: any) => {
        // sum points from each lesson questions
        const correctAnsweredMCQPoints = item?.mcq_answers?.reduce((sum: number, answer: any) => {
            if (answer.is_correct) {
                return sum + (answer.points_earned || 0);
            }
            return sum;
        }, 0);

        // total points from all questions
        const totalMCQPoints = item.lesson?.mcq_questions?.reduce((sum: number, question: any) => {
            return sum + (question.points || 0);
        }, 0);

        // total correct answer
        const totalMCQCorrectAnswer = item.mcq_answers?.filter((answer: any) => answer.is_correct).length;
        
        // total questions
        const totalMCQQuestions = item.lesson?.mcq_questions?.length ?? 0;
        const totalEssayQuestions = item.lesson?.essay_questions?.length ?? 0;

        // success rate
        const mcqSuccessRate = totalMCQQuestions > 0 ? (totalMCQCorrectAnswer / totalMCQQuestions) * 100 : 0;
        
        // total essay points
        const totalEssayPoints = item.essay_answers?.reduce((sum: number, answer: any) => {
            return sum + (answer.points || 0);
        }, 0);

        return {
            ...item,
            summary: {
                mcq: {
                    correct_answer: totalMCQCorrectAnswer,
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

export const msToAudioDuration = (milliseconds: number, format = 'mm:ss') => {
  if (milliseconds < 0) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Pad with leading zeros
  const pad = (num: number) => num.toString().padStart(2, '0');

  switch (format) {
    case 'h:mm:ss':
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    
    case 'hh:mm:ss':
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    
    case 'm:ss':
      const totalMinutes = Math.floor(totalSeconds / 60);
      return `${totalMinutes}:${pad(seconds)}`;
    
    case 'mm:ss':
    default:
      return `${pad(minutes)}:${pad(seconds)}`;
  }
}

export const canDismissDialog = async (): Promise<boolean> => {
    const alertController = new AlertController();
    const alert = await alertController.create({
        header: 'Confirm',
        message: 'Do you really want to discard your changes?',
        buttons: [
            {
                text: 'Cancel',
                role: 'cancel',
                handler: () => false // Prevent dismissal
            },
            {
                text: 'Discard',
                role: 'discard',
                handler: () => true // Allow dismissal
            }
        ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'discard'; // Only allow if 'Discard' is chosen
}
