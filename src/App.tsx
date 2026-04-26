import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import UserProfilePage from "./pages/UserProfilePage";
import PostsFeed from "./pages/PostsFeed";
import PostThread from "./pages/PostThread";
import ChallengeDetail from "./pages/ChallengeDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/Onboarding";
import Friends from "./pages/Friends";
import BookDetailPage from "./pages/BookDetailPage";
import BookSearchPage from "./pages/BookSearchPage";
import NotificationsPage from "./pages/NotificationsPage";
import LeaderboardShare from "./pages/LeaderboardShare";
import BottomNav from "./components/BottomNav";
import ReadingFAB from "./components/ReadingFAB";
import HamburgerMenu from "./components/HamburgerMenu";
import ErrorBoundary from "./components/ErrorBoundary";
import PWAInstallBanner from "./components/PWAInstallBanner";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import { trackEvent } from "@/lib/analytics";
import { clearAuthIntent, readAuthIntent, sanitizeReturnTo } from "@/lib/auth-flow";

// Routes guests can browse without signing up
const GUEST_BROWSEABLE = ["/feed", "/books", "/challenges", "/posts", "/search"];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes - avoid redundant refetches on navigation
      gcTime: 1000 * 60 * 10,
    },
  },
});

const AppLayout = () => {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Home />} />
        <Route path="/books" element={<Home />} />
        <Route path="/challenges" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:userId" element={<UserProfilePage />} />
        <Route path="/posts" element={<PostsFeed />} />
        <Route path="/post/:postId" element={<PostThread />} />
        <Route path="/challenge/:id" element={<ChallengeDetail />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/book/:bookId" element={<BookDetailPage />} />
        <Route path="/search" element={<BookSearchPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <ReadingFAB />}
      {user && <HamburgerMenu />}
      <BottomNav />
      <PWAInstallBanner />
      {user && <PushNotificationPrompt />}
    </>
  );
};

// For unauthenticated users: show AppLayout on browseable routes, LandingPage everywhere else
const GuestRoutes = () => {
  const location = useLocation();
  const browseable =
    GUEST_BROWSEABLE.includes(location.pathname) ||
    location.pathname.startsWith("/post/");
  if (browseable) return <AppLayout />;
  return <LandingPage />;
};

const AuthRoute = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Auth />;
  }

  const searchParams = new URLSearchParams(location.search);
  const pendingIntent = readAuthIntent();
  const nextPath =
    sanitizeReturnTo(searchParams.get("next")) ??
    sanitizeReturnTo(pendingIntent?.next) ??
    "/";

  if (pendingIntent) {
    trackEvent("auth_completed", {
      source: pendingIntent.source ?? "unknown",
      variant: pendingIntent.variant ?? "unknown",
      mode: pendingIntent.mode ?? "unknown",
      action: pendingIntent.action ?? "unknown",
      destination: nextPath,
    });
    clearAuthIntent();
  }

  return <Navigate to={nextPath} replace />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full reading-gradient animate-pulse" />
      </div>
    );
  }

  // Google OAuth populates user_metadata.full_name from Google, so we can't rely on it
  // to detect first-time users. Instead we use a dedicated onboarding_complete flag
  // that Onboarding.tsx writes to both localStorage and user_metadata.
  const needsOnboarding =
    !!user &&
    !localStorage.getItem("onboarding_complete") &&
    !user.user_metadata?.onboarding_complete;

  return (
    <Routes>
      {/* Public share page - no auth required */}
      <Route path="/share/leaderboard/:userId" element={<LeaderboardShare />} />

      <Route
        path="/auth"
        element={<AuthRoute />}
      />
      <Route
        path="/onboarding"
        element={user ? <Onboarding /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/*"
        element={
          !user ? (
            <GuestRoutes />
          ) : needsOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <AppLayout />
          )
        }
      />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
              <Analytics />
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ErrorBoundary>
);

export default App;
