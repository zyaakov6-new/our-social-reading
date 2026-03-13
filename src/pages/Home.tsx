import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mockChallenges } from "@/lib/mockData";
import { useBooks } from "@/hooks/useBooks";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import FeedItemCard from "@/components/FeedItemCard";
import ChallengeCard from "@/components/ChallengeCard";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import { BookOpen, Users, Trophy } from "lucide-react";

type Tab = 'feed' | 'challenges' | 'books';

const pathToTab: Record<string, Tab> = {
  '/': 'feed',
  '/challenges': 'challenges',
  '/books': 'books',
};

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(pathToTab[location.pathname] || 'feed');
  const { books, refetch: refetchBooks, deleteBook } = useBooks();
  const { sessions } = useReadingSessions();

  useEffect(() => {
    const tab = pathToTab[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; path: string }[] = [
    { key: 'feed', label: 'הפיד שלי', icon: Users, path: '/' },
    { key: 'challenges', label: 'אתגרים', icon: Trophy, path: '/challenges' },
    { key: 'books', label: 'הספרים שלי', icon: BookOpen, path: '/books' },
  ];

  const readingBooks = books.filter(b => b.status === 'reading');
  const finishedBooks = books.filter(b => b.status === 'finished');
  const wantBooks = books.filter(b => b.status === 'want');

  const handleTabChange = (tab: typeof tabs[0]) => {
    setActiveTab(tab.key);
    navigate(tab.path);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 pt-6 pb-3">
        <h1 className="font-serif text-2xl font-bold mb-4">ספר ביחד</h1>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-card text-foreground card-shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto">
        {activeTab === 'feed' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">עדיין אין פעילות קריאה</p>
                <p className="text-sm text-muted-foreground mt-1">התחל לקרוא כדי לראות את הפיד שלך</p>
              </div>
            ) : (
              sessions.map(session => (
                <FeedItemCard key={session.id} item={session} />
              ))
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-3">
            <button className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold hover:bg-primary/5 transition-colors">
              + אתגר חדש
            </button>
            {mockChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}

        {activeTab === 'books' && (
          <div className="space-y-6">
            <AddBookDialog onBookAdded={refetchBooks} />

            {books.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">עדיין אין ספרים</p>
                <p className="text-sm text-muted-foreground mt-1">הוסף ספר כדי להתחיל לעקוב אחרי הקריאה</p>
              </div>
            ) : (
              <>
                {readingBooks.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-3">קורא עכשיו</h3>
                    <div className="space-y-2">
                      {readingBooks.map(book => (
                        <BookCard key={book.id} book={book} compact onDelete={deleteBook} />
                      ))}
                    </div>
                  </section>
                )}

                {finishedBooks.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-3">סיימתי</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {finishedBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} />
                      ))}
                    </div>
                  </section>
                )}

                {wantBooks.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-3">רוצה לקרוא</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {wantBooks.map(book => (
                        <BookCard key={book.id} book={book} onDelete={deleteBook} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
