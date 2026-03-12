// Mock data for the app
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
  currentPage: number;
  status: 'reading' | 'finished' | 'want';
}

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  minutesRead: number;
  pagesRead: number;
  date: string;
}

export interface FeedItem {
  id: string;
  userName: string;
  avatarUrl?: string;
  bookTitle: string;
  minutesRead: number;
  timestamp: string;
  likes: number;
  comments: number;
}

export interface Challenge {
  id: string;
  name: string;
  goalType: 'minutes' | 'books';
  goalValue: number;
  currentProgress: number;
  startDate: string;
  endDate: string;
  participants: { name: string; progress: number; rank: number }[];
  myRank: number;
}

export const mockBooks: Book[] = [
  { id: '1', title: 'עיר ושם', author: 'עמוס עוז', totalPages: 380, currentPage: 145, status: 'reading' },
  { id: '2', title: 'חיים מלאים', author: 'יובל נח הררי', totalPages: 420, currentPage: 420, status: 'finished' },
  { id: '3', title: 'הסיפור על האהבה והחושך', author: 'עמוס עוז', totalPages: 530, currentPage: 280, status: 'reading' },
  { id: '4', title: 'ארץ הצבי', author: 'מאיר שלו', totalPages: 340, currentPage: 0, status: 'want' },
  { id: '5', title: 'חומה ומגדל', author: 'דוד גרוסמן', totalPages: 450, currentPage: 0, status: 'want' },
  { id: '6', title: 'אל תגידי לילה', author: 'אמוס עוז', totalPages: 290, currentPage: 290, status: 'finished' },
];

export const mockFeed: FeedItem[] = [
  { id: '1', userName: 'נועה כהן', bookTitle: 'עיר ושם', minutesRead: 45, timestamp: 'לפני 20 דקות', likes: 3, comments: 1 },
  { id: '2', userName: 'יוסי לוי', bookTitle: 'סאפיינס', minutesRead: 30, timestamp: 'לפני שעה', likes: 5, comments: 2 },
  { id: '3', userName: 'מיכל אברהם', bookTitle: 'ההיסטוריה של הכל', minutesRead: 60, timestamp: 'לפני 2 שעות', likes: 8, comments: 0 },
  { id: '4', userName: 'דני גולד', bookTitle: 'הנסיך הקטן', minutesRead: 15, timestamp: 'לפני 3 שעות', likes: 2, comments: 1 },
];

export const mockChallenges: Challenge[] = [
  {
    id: '1',
    name: 'מועדון הקריאה של ינואר',
    goalType: 'minutes',
    goalValue: 600,
    currentProgress: 340,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    participants: [
      { name: 'נועה כהן', progress: 450, rank: 1 },
      { name: 'אתה', progress: 340, rank: 2 },
      { name: 'יוסי לוי', progress: 280, rank: 3 },
    ],
    myRank: 2,
  },
  {
    id: '2',
    name: 'אתגר 5 ספרים',
    goalType: 'books',
    goalValue: 5,
    currentProgress: 2,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    participants: [
      { name: 'מיכל אברהם', progress: 3, rank: 1 },
      { name: 'אתה', progress: 2, rank: 2 },
      { name: 'דני גולד', progress: 1, rank: 3 },
    ],
    myRank: 2,
  },
];

export const mockRecentSessions: ReadingSession[] = [
  { id: '1', bookId: '1', bookTitle: 'עיר ושם', minutesRead: 35, pagesRead: 22, date: '2026-03-12' },
  { id: '2', bookId: '3', bookTitle: 'הסיפור על האהבה והחושך', minutesRead: 20, pagesRead: 15, date: '2026-03-11' },
  { id: '3', bookId: '1', bookTitle: 'עיר ושם', minutesRead: 45, pagesRead: 30, date: '2026-03-10' },
  { id: '4', bookId: '3', bookTitle: 'הסיפור על האהבה והחושך', minutesRead: 25, pagesRead: 18, date: '2026-03-09' },
  { id: '5', bookId: '1', bookTitle: 'עיר ושם', minutesRead: 40, pagesRead: 25, date: '2026-03-08' },
];

export const userStats = {
  currentStreak: 7,
  weekMinutes: 120,
  weekBooks: 0,
  monthMinutes: 340,
  monthBooks: 1,
  allTimeBooks: 12,
};
