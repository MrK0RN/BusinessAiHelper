import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Integrations from "@/components/landing/integrations";
import CTA from "@/components/landing/cta";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Bot className="h-8 w-8 text-primary mr-2" />
                <span className="font-semibold text-xl text-gray-900">AI Assistant</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Возможности
                </a>
                <a href="#integrations" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Интеграции
                </a>
                <a href="#cta" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Тарифы
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin} className="text-gray-600 hover:text-gray-900">
                Войти
              </Button>
              <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                Личный кабинет
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Hero onGetStarted={handleGetStarted} />
        <Features />
        <Integrations />
        <CTA onGetStarted={handleGetStarted} />
      </main>
    </div>
  );
}
