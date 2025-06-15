import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  Bot, 
  Database, 
  Link, 
  BarChart3, 
  Settings 
} from "lucide-react";

const menuItems = [
  { icon: PieChart, label: "Обзор", active: true },
  { icon: Bot, label: "Боты", active: false },
  { icon: Database, label: "База знаний", active: false },
  { icon: Link, label: "Интеграции", active: false },
  { icon: BarChart3, label: "Аналитика", active: false },
  { icon: Settings, label: "Настройки", active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0">
      <nav className="bg-white rounded-xl shadow-sm p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Button
                variant={item.active ? "default" : "ghost"}
                className={`w-full justify-start ${
                  item.active 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
