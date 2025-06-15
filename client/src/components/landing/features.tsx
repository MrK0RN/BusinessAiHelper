import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageSquare, 
  Brain, 
  Link, 
  BarChart3, 
  Settings, 
  Cloud 
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Мультиплатформенность",
    description: "Подключение к Telegram, WhatsApp, Instagram через единый интерфейс",
    color: "text-blue-600 bg-blue-100"
  },
  {
    icon: Brain,
    title: "База знаний",
    description: "Загрузка документов и Google Docs для персонализации ответов",
    color: "text-green-600 bg-green-100"
  },
  {
    icon: Link,
    title: "CRM интеграция",
    description: "Автоматическая передача данных в amoCRM и Bitrix24",
    color: "text-yellow-600 bg-yellow-100"
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    description: "Подробная статистика по всем каналам коммуникации",
    color: "text-purple-600 bg-purple-100"
  },
  {
    icon: Settings,
    title: "Настройка",
    description: "Гибкие настройки для каждой платформы отдельно",
    color: "text-red-600 bg-red-100"
  },
  {
    icon: Cloud,
    title: "Облачное решение",
    description: "Быстрое развертывание с помощью в настройке домена",
    color: "text-blue-600 bg-blue-100"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Возможности платформы
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Полный набор инструментов для автоматизации клиентского сервиса
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 bg-gray-50 hover:bg-gray-100">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
