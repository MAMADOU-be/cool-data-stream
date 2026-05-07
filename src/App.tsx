import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { FridgeDataProvider } from "@/hooks/useFridgeData";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Historique from "./pages/Historique";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const protectedRoute = (el: JSX.Element) => (
  <ProtectedRoute>
    <FridgeDataProvider>
      <AppLayout>{el}</AppLayout>
    </FridgeDataProvider>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={protectedRoute(<Dashboard />)} />
            <Route path="/historique" element={protectedRoute(<Historique />)} />
            <Route path="/alerts" element={protectedRoute(<Alerts />)} />
            <Route path="/admin" element={protectedRoute(<Admin />)} />
            <Route path="/settings" element={protectedRoute(<Settings />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
