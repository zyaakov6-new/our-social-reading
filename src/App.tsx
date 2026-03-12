import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ChallengeDetail from "./pages/ChallengeDetail";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import ReadingFAB from "./components/ReadingFAB";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
