
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AuthProvider, useAuth, usePendingValidation } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Confirmation from "@/pages/Confirmation";
import ResetPassword from "@/pages/ResetPassword";
import { UserProfileGamified } from '@/components/pages/UserProfileGamified';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function PendingValidationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-pulse rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
        <h1 className="mt-6 text-2xl font-bold text-yellow-700">Inscription en attente</h1>
        <p className="mt-2 text-gray-600">Votre compte est en attente de validation par un administrateur.<br/>Vous recevrez un email dès qu'il sera activé.</p>
      </div>
    </div>
  );
}

const App = () => {
  // Ne pas utiliser useAuth ou usePendingValidation ici !
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pending-validation" element={<PendingValidationPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
