import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Send, 
  MessageCircle, 
  Instagram, 
  RefreshCw, 
  Plus,
  Bot
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

export default function BotStatusCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: bots, isLoading } = useQuery({
    queryKey: ["/api/bots"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Обновлено",
        description: "Статус ботов обновлен",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус ботов",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  const handleAddBot = () => {
    toast({
      title: "Функция в разработке",
      description: "Добавление новых ботов будет доступно в следующих версиях",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Активен
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        Настройка
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Статус ботов</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-6 h-6" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {bots && bots.length > 0 ? (
              bots.map((bot: any) => {
                const Icon = platformIcons[bot.platform as keyof typeof platformIcons] || Send;
                const colorClass = platformColors[bot.platform as keyof typeof platformColors] || "text-gray-500";
                
                return (
                  <div key={bot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${colorClass}`} />
                      <div>
                        <p className="font-medium text-gray-900">{bot.name}</p>
                        <p className="text-sm text-gray-600">
                          {bot.isActive 
                            ? `Последняя активность: ${new Date(bot.updatedAt).toLocaleString('ru-RU')}`
                            : "Настройка не завершена"
                          }
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(bot.isActive)}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Нет настроенных ботов</p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400"
              onClick={handleAddBot}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить новый бот
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
