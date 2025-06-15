import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Upload, 
  CloudUpload, 
  FileText, 
  File, 
  Trash2 
} from "lucide-react";

export default function KnowledgeBaseCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mock data for demonstration
  const files = [
    {
      id: 1,
      originalName: "company-handbook.pdf",
      mimeType: "application/pdf",
      fileSize: 2547892,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      originalName: "product-guide.docx", 
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 1234567,
      createdAt: new Date().toISOString()
    }
  ];
  const isLoading = false;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await apiRequest("POST", "/api/knowledge-files", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
      toast({
        title: "Файл загружен",
        description: "Файл успешно добавлен в базу знаний",
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
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return await apiRequest("DELETE", `/api/knowledge-files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
      toast({
        title: "Файл удален",
        description: "Файл удален из базы знаний",
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
        description: "Не удалось удалить файл",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла: 10MB",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word')) return <File className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>База знаний</CardTitle>
          <Button 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            Загрузить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors cursor-pointer ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Перетащите файлы сюда или</p>
          <Button variant="link" className="text-primary p-0">
            выберите файлы
          </Button>
          <p className="text-xs text-gray-500 mt-2">PDF, DOCX, TXT до 10MB</p>
        </div>

        {/* Files List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Загруженные файлы</h4>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-5 h-5" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8" />
                </div>
              ))}
            </div>
          ) : files && files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.mimeType)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(file.fileSize)} • Загружен {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Нет загруженных файлов</p>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => toast({
            title: "Функция в разработке",
            description: "Подключение Google Docs будет доступно в следующих версиях",
          })}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          Подключить Google Docs
        </Button>
      </CardContent>
    </Card>
  );
}
