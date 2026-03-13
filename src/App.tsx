import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ChallengeDetail from "./pages/ChallengeDetail";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import BottomNav from "./components/BottomNav";
import ReadingFAB from "./components/ReadingFAB";

const queryClient = new QueryClient();
const ONBOARDING_STATUS_EVENT = "onboarding-status-changed";

const isOnboarded = () => localStorage.getItem("onboarding_complete") === "true";

const AppLayout = () => (
  <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<Home />} />
      <Route path="/challenges" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/challenge/:id" element={<ChallengeDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ReadingFAB />
    <BottomNav />
  </>
);

const App = () => {
  const [onboarded, setOnboarded] = useState(isOnboarded);

  useEffect(() => {
    const syncOnboardingStatus = () => setOnboarded(isOnboarded());

    window.addEventListener("storage", syncOnboardingStatus);
    window.addEventListener(ONBOARDING_STATUS_EVENT, syncOnboardingStatus);

    return () => {
      window.removeEventListener("storage", syncOnboardingStatus);
      window.removeEventListener(ONBOARDING_STATUS_EVENT, syncOnboardingStatus);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/onboarding"
              element={onboarded ? <Navigate to="/" replace /> : <Onboarding />}
            />
            <Route
              path="/*"
              element={onboarded ? <AppLayout /> : <Navigate to="/onboarding" replace />}
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

