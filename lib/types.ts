export interface GeneratedQuestion {
  id: number;
  category: string;
  question: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FeedbackCategory {
  name: string;
  score: number; // 0 - 10
  comment: string;
}

export interface InterviewFeedback {
  overallScore: number; // 0 - 100
  verdict: string;
  categories: FeedbackCategory[];
  strengths: string[];
  improvements: string[];
}
