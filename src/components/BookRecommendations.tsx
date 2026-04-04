import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Book } from "@/hooks/useBooks";
import ProGate from "@/components/ProGate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Recommendation {
  title: string;
  author: string;
  reason: string;
  coverUrl?: string;
  googleBooksId?: string;
}

interface CachedRecs {
  recommendations: Recommendation[];
  bookHash: string;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY = "amud_recommendations_cache";

function hashBooks(books: Book[]): string {
  return books
    .map((b) => b.id)
    .sort()
    .join(",");
}

async function fetchGoogleBooksCover(
  title: string,
  author: string
): Promise<{ coverUrl: string | null; googleBooksId: string | null }> {
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&orderBy=relevance`
    );
    if (!res.ok) return { coverUrl: null, googleBooksId: null };
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return { coverUrl: null, googleBooksId: null };

    const covers = item.volumeInfo?.imageLinks;
    const coverUrl =
      covers?.thumbnail
        ?.replace("http://", "https://")
        ?.replace("&edge=curl", "") ?? null;

    return { coverUrl, googleBooksId: item.id ?? null };
  } catch {
    return { coverUrl: null, googleBooksId: null };
  }
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
const RecommendationSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex-shrink-0 w-[110px] space-y-2">
        <Skeleton className="w-[110px] h-[160px] rounded-lg" />
        <Skeleton className="h-3 w-4/5 rounded" />
        <Skeleton className="h-2.5 w-3/5 rounded" />
      </div>
    ))}
  </div>
);

// ── Single book card ─────────────────────────────────────────────────────────
const RecCard = ({
  rec,
  onClick,
}: {
  rec: Recommendation;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex-shrink-0 w-[110px] text-right group"
  >
    <div className="relative w-[110px] h-[160px] rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow">
      {rec.coverUrl ? (
        <img
          src={rec.coverUrl}
          alt={rec.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="w-full h-full flex items-end p-2"
          style={{ background: "hsl(126 15% 28%)" }}
        >
          <span className="text-[10px] font-bold text-white/90 leading-tight line-clamp-4">
            {rec.title}
          </span>
        </div>
      )}

      {/* Reason tooltip overlay on hover */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 rounded-lg">
        <p className="text-white text-[10px] text-center leading-tight font-medium">
          {rec.reason}
        </p>
      </div>
    </div>

    <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2 text-foreground">
      {rec.title}
    </p>
    <p className="text-[10px] text-muted-foreground truncate">{rec.author}</p>
  </button>
);

// ── Main component ───────────────────────────────────────────────────────────
interface BookRecommendationsProps {
  books: Book[];
}

const BookRecommendations = ({ books }: BookRecommendationsProps) => {
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (books.length < 1) return;
    // Only fetch if the user is Pro (avoid burning Claude API credits for free users)
    if (!isPro) return;

    const bookHash = hashBooks(books);

    // Check localStorage cache
    try {
      const cached: CachedRecs | null = JSON.parse(
        localStorage.getItem(CACHE_KEY) ?? "null"
      );
      if (
        cached &&
        cached.bookHash === bookHash &&
        Date.now() - cached.timestamp < CACHE_TTL
      ) {
        setRecommendations(cached.recommendations);
        return;
      }
    } catch {
      // ignore parse errors
    }

    // Fetch fresh recommendations
    const fetchRecs = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            books: books.map((b) => ({
              title: b.title,
              author: b.author,
              status: b.status,
            })),
          }),
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const recs: Recommendation[] = data.recommendations ?? [];

        // Fetch covers in parallel from Google Books (no langRestrict)
        const recsWithCovers = await Promise.all(
          recs.map(async (rec) => {
            const { coverUrl, googleBooksId } = await fetchGoogleBooksCover(
              rec.title,
              rec.author
            );
            return { ...rec, coverUrl: coverUrl ?? undefined, googleBooksId: googleBooksId ?? undefined };
          })
        );

        setRecommendations(recsWithCovers);

        // Save to cache
        const toCache: CachedRecs = {
          recommendations: recsWithCovers,
          bookHash,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [books]);

  if (books.length < 1) return null;

  const handleCardClick = (rec: Recommendation) => {
    navigate(`/search?q=${encodeURIComponent(`${rec.title} ${rec.author}`.trim())}`);
  };

  const content = (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="section-heading">בשבילך</h3>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: "hsl(126 15% 28%)",
              color: "hsl(44 30% 93%)",
            }}
          >
            AI
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          מבוסס על הספרים שלך
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <RecommendationSkeleton />
      ) : error ? null : recommendations.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {recommendations.map((rec, i) => (
            <RecCard
              key={i}
              rec={rec}
              onClick={() => handleCardClick(rec)}
            />
          ))}
        </div>
      ) : (
        // Show skeleton as a preview for non-Pro users (they'll see it blurred)
        <RecommendationSkeleton />
      )}
    </section>
  );

  return (
    <ProGate
      title={t.subscription.gateTitle}
      desc={t.subscription.gateDesc}
    >
      {content}
    </ProGate>
  );
};

export default BookRecommendations;
