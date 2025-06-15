import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const handleWatchDemo = () => {
    // Demo functionality would be implemented here
    console.log("Opening demo modal...");
  };

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            AI-ассистент для{" "}
            <span className="text-primary">вашего бизнеса</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Подключите умного помощника к мессенджерам и CRM. Автоматизируйте общение с клиентами, 
            используя вашу базу знаний и возможности GPT-4.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={onGetStarted} className="bg-primary hover:bg-primary/90">
              Начать бесплатно
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleWatchDemo}
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Смотреть демо
            </Button>
          </div>
        </div>

        <div className="mt-16 relative">
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800" 
            alt="AI Assistant Dashboard Preview" 
            className="rounded-xl shadow-2xl w-full object-cover h-96 lg:h-[500px]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl"></div>
        </div>
      </div>
    </section>
  );
}
