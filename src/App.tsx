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
import BottomNav from "./components/BottomNav";
import ReadingFAB from "./components/ReadingFAB";

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
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ReadingFAB />
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

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <Auth />}
      />
      <Route
        path="/*"
        element={user ? <AppLayout /> : <Navigate to="/auth" replace />}
      />
    </Routes>
  );
};

const App = () => (
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
);

export default App;
