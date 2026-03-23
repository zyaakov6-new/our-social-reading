import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import SharePage from "./pages/SharePage";
import BottomNav from "./components/BottomNav";
import ReadingFAB from "./components/ReadingFAB";
import HamburgerMenu from "./components/HamburgerMenu";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 3 * 60 * 1000 } },
});

/** Stores referral ID in localStorage then redirects to /auth or / */
const JoinRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("amud_referral", ref);
    navigate(user ? "/" : "/auth", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

const AppLayout = () => (
  <>
    <Routes>
      <Route path="/"               element={<Home />} />
      <Route path="/feed"           element={<Home />} />
      <Route path="/books"          element={<Home />} />
      <Route path="/challenges"     element={<Home />} />
      <Route path="/profile"        element={<Profile />} />
      <Route path="/user/:userId"   element={<UserProfilePage />} />
      <Route path="/posts"          element={<PostsFeed />} />
      <Route path="/post/:postId"   element={<PostThread />} />
      <Route path="/challenge/:id"  element={<ChallengeDetail />} />
      <Route path="/friends"        element={<Friends />} />
      <Route path="/onboarding"     element={<Onboarding />} />
      <Route path="/share/:userId"  element={<SharePage />} />
      <Route path="*"               element={<NotFound />} />
    </Routes>
    <ReadingFAB />
    <HamburgerMenu />
    <BottomNav />
  </>
);

/** Routes accessible to guests (read-only view of the app) */
const GUEST_BROWSEABLE = ['/feed', '/books', '/challenges'];

/** When unauthenticated: landing page at /, read-only app at /feed /books /challenges */
const GuestRoutes = () => {
  const location = useLocation();
  if (GUEST_BROWSEABLE.includes(location.pathname)) return <AppLayout />;
  return <LandingPage />;
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

  const needsOnboarding =
    !!user &&
    !localStorage.getItem("onboarding_complete") &&
    !user.user_metadata?.full_name;

  return (
    <Routes>
      {/* Always public */}
      <Route path="/share/:userId" element={<SharePage />} />
      <Route path="/join"          element={<JoinRedirect />} />

      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <Auth />}
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Analytics />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
