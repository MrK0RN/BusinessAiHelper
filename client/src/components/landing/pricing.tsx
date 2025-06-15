import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant?: "default" | "outline";
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Стартовый",
    price: "1,990",
    period: "мес",
    description: "Идеально для малого бизнеса и стартапов",
    features: [
      "1 AI-бот",
      "До 1,000 сообщений/мес",
      "1 канал интеграции",
      "Базовая аналитика",
      "Email поддержка",
      "Готовые шаблоны ответов"
    ],
    buttonText: "Начать",
    buttonVariant: "outline"
  },
  {
    name: "Бизнес",
    price: "4,990",
    period: "мес",
    description: "Для растущих компаний с активными продажами",
    features: [
      "5 AI-ботов",
      "До 10,000 сообщений/мес",
      "Все каналы (Telegram, WhatsApp, Instagram)",
      "Продвинутая аналитика",
      "CRM интеграции",
      "Приоритетная поддержка",
      "Настройка базы знаний",
      "API доступ"
    ],
    popular: true,
    buttonText: "Выбрать план",
    buttonVariant: "default"
  },
  {
    name: "Корпоративный",
    price: "По запросу",
    period: "",
    description: "Для крупных компаний с особыми требованиями",
    features: [
      "Неограниченное количество ботов",
      "Безлимитные сообщения",
      "Все возможности платформы",
      "Персональный менеджер",
      "SLA 99.9%",
      "Белая маркировка",
      "Индивидуальная настройка",
      "Обучение команды"
    ],
    buttonText: "Связаться",
    buttonVariant: "outline"
  }
];

interface PricingProps {
  onGetStarted: () => void;
}

export default function Pricing({ onGetStarted }: PricingProps) {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Тарифные планы
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите подходящий план для вашего бизнеса. Все планы включают 14-дневный бесплатный период.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-2 border-blue-500 shadow-lg scale-105' : 'border border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    Популярный
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price.includes("По") ? plan.price : `₽${plan.price}`}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  )}
                </div>
                <CardDescription className="mt-4 text-gray-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full py-3 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.buttonVariant}
                  onClick={onGetStarted}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Нужна помощь в выборе плана? 
          </p>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => window.open('mailto:support@ai-assistant.ru')}>
              Написать нам
            </Button>
            <Button variant="outline" onClick={() => window.open('tel:+7-800-123-45-67')}>
              Позвонить: +7 (800) 123-45-67
            </Button>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Часто задаваемые вопросы
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Можно ли изменить план?
              </h4>
              <p className="text-gray-600">
                Да, вы можете повысить или понизить тарифный план в любое время. 
                Изменения вступают в силу с начала следующего расчетного периода.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Есть ли бесплатный период?
              </h4>
              <p className="text-gray-600">
                Все планы включают 14-дневный бесплатный период. 
                Никаких комиссий до окончания пробного периода.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Что включает техподдержка?
              </h4>
              <p className="text-gray-600">
                Email поддержка для всех планов, приоритетная поддержка для Бизнес плана, 
                и персональный менеджер для Корпоративного.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Безопасны ли мои данные?
              </h4>
              <p className="text-gray-600">
                Мы используем шифрование данных, соответствуем GDPR, 
                и храним данные в защищенных дата-центрах с резервным копированием.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}