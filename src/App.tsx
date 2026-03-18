import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import Onboarding from "./pages/Onboarding";
import Friends from "./pages/Friends";
import BookDetailPage from "./pages/BookDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import BottomNav from "./components/BottomNav";
import ReadingFAB from "./components/ReadingFAB";
import HamburgerMenu from "./components/HamburgerMenu";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const AppLayout = () => (
  <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<Home />} />
      <Route path="/challenges" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/user/:userId" element={<UserProfilePage />} />
      <Route path="/posts" element={<PostsFeed />} />
      <Route path="/post/:postId" element={<PostThread />} />
      <Route path="/challenge/:id" element={<ChallengeDetail />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/book/:bookId" element={<BookDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ReadingFAB />
    <HamburgerMenu />
    <BottomNav />
  </>
);

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
            <Navigate to="/auth" replace />
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
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
