import { Button } from "@/components/ui/button";

interface CTAProps {
  onGetStarted: () => void;
}

export default function CTA({ onGetStarted }: CTAProps) {
  return (
    <section id="cta" className="py-20 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Готовы автоматизировать ваш бизнес?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Начните использовать AI-ассистента уже сегодня. Первые 14 дней бесплатно.
        </p>
        <Button 
          size="lg" 
          onClick={onGetStarted}
          className="bg-white hover:bg-gray-100 text-primary"
        >
          Начать бесплатный период
        </Button>
      </div>
    </section>
  );
}
