import { useState, useRef } from 'react';
import { Users, UserPlus, Check, X, Search, UserMinus } from 'lucide-react';
import { useFriends, UserSearchResult } from '@/hooks/useFriends';
import { toast } from 'sonner';

const FriendsSection = () => {
  const { friends, incomingRequests, sendRequest, acceptRequest, rejectRequest, unfriend, searchUsers } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(q);
        setSearchResults(results);
      } catch {
        toast.error('שגיאה בחיפוש');
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId);
      toast.success('בקשת חברות נשלחה!');
      setSearchResults(prev =>
        prev.map(r => r.userId === userId ? { ...r, friendshipStatus: 'pending' as const, isRequester: true } : r)
      );
    } catch (e: any) {
      toast.error(e.message || 'שגיאה בשליחת בקשה');
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptRequest(friendshipId);
      toast.success('חברות אושרה!');
    } catch {
      toast.error('שגיאה');
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      await rejectRequest(friendshipId);
    } catch {
      toast.error('שגיאה');
    }
  };

  const handleUnfriend = async (friendshipId: string) => {
    try {
      await unfriend(friendshipId);
    } catch {
      toast.error('שגיאה');
    }
  };

  return (
    <div className="rounded-xl bg-card p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h3 className="font-serif font-bold text-sm">חברים</h3>
          {friends.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
              {friends.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]); }}
          className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          title="מצא חברים"
        >
          <UserPlus size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Pending incoming requests */}
      {incomingRequests.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">בקשות ממתינות</p>
          {incomingRequests.map(({ friendship, profile }) => (
            <div key={friendship.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium truncate">{profile.displayName}</span>
              <button
                onClick={() => handleAccept(friendship.id)}
                className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="אשר"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => handleReject(friendship.id)}
                className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                title="דחה"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User search */}
      {showSearch && (
        <div className="mb-3">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="חפש לפי שם..."
              dir="rtl"
              className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
          {searching && (
            <p className="text-xs text-muted-foreground text-center py-2">מחפש...</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {searchResults.map(result => (
                <div key={result.userId} className="flex items-center gap-2 px-3 py-2 border-b border-border/50 last:border-0">
                  <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {result.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium">{result.displayName}</span>
                  {!result.friendshipStatus && (
                    <button
                      onClick={() => handleSendRequest(result.userId)}
                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 hover:bg-primary/20 transition-colors"
                    >
                      <UserPlus size={11} />
                      הוסף
                    </button>
                  )}
                  {result.friendshipStatus === 'pending' && (
                    <span className="text-xs text-muted-foreground">
                      {result.isRequester ? 'ממתין לאישור' : 'שלח בקשה חזרה'}
                    </span>
                  )}
                  {result.friendshipStatus === 'accepted' && (
                    <span className="text-xs text-primary font-medium">חבר ✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">לא נמצאו משתמשים</p>
          )}
        </div>
      )}

      {/* Friends list */}
      {friends.length === 0 && !showSearch && incomingRequests.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">
          עדיין אין חברים — לחץ על + כדי למצוא חברים
        </p>
      )}
      {friends.length > 0 && (
        <div className="space-y-2">
          {friends.map(({ friendship, profile }) => (
            <div key={friendship.id} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium">{profile.displayName}</span>
              <button
                onClick={() => handleUnfriend(friendship.id)}
                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="הסר חבר"
              >
                <UserMinus size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsSection;
