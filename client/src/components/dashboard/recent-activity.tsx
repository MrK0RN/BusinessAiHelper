import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Send, 
  MessageCircle, 
  Instagram 
} from "lucide-react";

const platformIcons = {
  telegram: Send,
  whatsapp: MessageCircle,
  instagram: Instagram,
};

const platformColors = {
  telegram: "text-blue-500",
  whatsapp: "text-green-500",
  instagram: "text-pink-500",
};

const getStatusBadge = (isAutoResponse: boolean) => {
  if (isAutoResponse) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
        Отвечено
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
      Ожидает
    </Badge>
  );
};

export default function RecentActivity() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["/api/recent-activity"],
  });

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн назад`;
  };

  const maskSender = (senderId: string, platform: string) => {
    if (platform === 'telegram') {
      return `@user_${senderId.slice(-4)}`;
    }
    if (platform === 'whatsapp') {
      return `+7 *** ***-${senderId.slice(-4)}`;
    }
    if (platform === 'instagram') {
      return `@user_${senderId.slice(-4)}`;
    }
    return senderId;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Последняя активность</CardTitle>
          <Button variant="ghost" size="sm">
            Смотреть все
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Skeleton className="w-6 h-6 mt-0.5" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-4">
            {activity.map((item: any) => {
              const Icon = platformIcons[item.platform as keyof typeof platformIcons] || Send;
              const colorClass = platformColors[item.platform as keyof typeof platformColors] || "text-gray-500";
              
              return (
                <div key={item.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Icon className={`w-6 h-6 mt-0.5 ${colorClass}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {maskSender(item.senderId, item.platform)}
                      </span>{" "}
                      {item.messageText ? `: "${item.messageText.slice(0, 50)}${item.messageText.length > 50 ? '...' : ''}"` : "отправил сообщение"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatTimeAgo(item.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.isAutoResponse ? "Ответ сгенерирован автоматически" : "Требует ручной обработки"}
                    </p>
                  </div>
                  {getStatusBadge(item.isAutoResponse)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Нет активности</p>
            <p className="text-sm">Сообщения появятся здесь после настройки ботов</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
