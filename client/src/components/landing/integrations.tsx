import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Send, 
  Instagram, 
  Handshake, 
  Briefcase, 
  FileText 
} from "lucide-react";

const integrations = [
  {
    icon: Send,
    name: "Telegram",
    color: "text-blue-500"
  },
  {
    icon: MessageCircle,
    name: "WhatsApp",
    color: "text-green-500"
  },
  {
    icon: Instagram,
    name: "Instagram",
    color: "text-pink-500"
  },
  {
    icon: Handshake,
    name: "amoCRM",
    color: "text-orange-500"
  },
  {
    icon: Briefcase,
    name: "Bitrix24",
    color: "text-blue-600"
  },
  {
    icon: FileText,
    name: "Google Docs",
    color: "text-blue-700"
  }
];

export default function Integrations() {
  return (
    <section id="integrations" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Интеграции
          </h2>
          <p className="text-xl text-gray-600">
            Работаем с популярными мессенджерами и CRM-системами
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {integrations.map((integration, index) => (
            <Card key={index} className="text-center shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <integration.icon className={`w-12 h-12 mx-auto mb-2 ${integration.color}`} />
                <p className="text-sm font-medium text-gray-900">
                  {integration.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
