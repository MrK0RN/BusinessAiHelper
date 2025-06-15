import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Bot, 
  Clock, 
  TrendingUp 
} from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего сообщений</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalMessages || 0}
              </p>
            </div>
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            +12% от прошлого месяца
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Активные боты</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activeBots || 0}
              </p>
            </div>
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Telegram, WhatsApp, Instagram
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Время ответа</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.avgResponseTime ? formatResponseTime(stats.avgResponseTime) : "0ms"}
              </p>
            </div>
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Оптимальное время
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Конверсия</p>
              <p className="text-2xl font-bold text-gray-900">24.5%</p>
            </div>
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            +3.2% от цели
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
