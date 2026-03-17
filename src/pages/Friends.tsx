import FriendsSection from "@/components/FriendsSection";
import Leaderboard from "@/components/Leaderboard";

const Friends = () => {
  return (
    <div className="min-h-screen pb-28">
      {/* Header — matches the app-wide sticky header pattern */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-16 pt-3 pb-2.5"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
        }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <span style={{ display: 'block', width: '3px', height: '30px', background: 'hsl(126 15% 28%)', borderRadius: '2px', flexShrink: 0 }} />
          <div>
            <h1 className="font-display text-[1.75rem] tracking-[0.14em] leading-none">FRIENDS</h1>
            <p className="font-quote text-[10px] text-muted-foreground mt-0.5">חברים וקהילה</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-4">
        <Leaderboard onAddFriendsClick={() => document.getElementById('friends-section')?.scrollIntoView({ behavior: 'smooth' })} />
        <div id="friends-section">
          <FriendsSection />
        </div>
      </div>
    </div>
  );
};

export default Friends;
