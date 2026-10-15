import { Rating } from 'ts-fsrs';
import { Priority, CardType, FsrsRating } from '@/types/database';

export interface CardWithMetadata {
  id: string;
  front: string;
  back: string;
  card_type: CardType;
  topic_id: string;
  topic_name?: string;
  subject_name?: string;
  exam_priority: Priority;
  priority_boost: number;
  fsrs_state?: {
    due: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    learning_steps: number;
    reps: number;
    lapses: number;
    state: number;
    last_review: string | null;
  };
}

export interface ScheduledIntervalPreview {
  rating: FsrsRating;
  ratingValue: Rating;
  label: string;
  shortcut: string;
  intervalText: string;
  nextDue: Date;
}
