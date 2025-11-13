import { Home, Calendar, Heart, Settings, User, Award, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

interface NavigationProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Navigation({ isOpen, onClose }: NavigationProps) {
  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: User, label: "My Pets" },
    { icon: Calendar, label: "Schedule" },
    { icon: Heart, label: "Health" },
    { icon: Award, label: "Achievements" },
    { icon: MessageCircle, label: "Community" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-gray-100">PetCare</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Your pet's companion</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  item.active
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-gray-100">Sarah Johnson</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Premium Member</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
