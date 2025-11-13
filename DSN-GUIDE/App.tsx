import { useState } from "react";
import {
  Menu,
  X,
  Plus,
  Search,
  Bell,
  Footprints,
  Utensils,
  Heart,
  Moon,
  Sun,
} from "lucide-react";
import { Navigation } from "./components/Navigation";
import { PetProfile } from "./components/PetProfile";
import { DailyTasks } from "./components/DailyTasks";
import { HealthMetrics } from "./components/HealthMetrics";
import { Button } from "./components/ui/button";

export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const pets = [
    {
      petImage:
        "https://images.unsplash.com/photo-1747045200613-0dc76be6ded0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYyNzUwMzgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      name: "Charlie",
      breed: "Golden Retriever",
      age: "3 years",
      goalsCompleted: 6,
      goalsTotal: 8,
      nextTask: {
        title: "Afternoon playtime",
        time: "2:00 PM",
        icon: Footprints,
      },
    },
    {
      petImage:
        "https://images.unsplash.com/photo-1702914954859-f037fc75b760?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2F0JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYyNjcyMjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      name: "Luna",
      breed: "Siamese Cat",
      age: "2 years",
      goalsCompleted: 5,
      goalsTotal: 7,
      nextTask: {
        title: "Evening feeding",
        time: "6:00 PM",
        icon: Utensils,
      },
    },
    {
      petImage:
        "https://images.unsplash.com/photo-1761764777062-cae8dfd807e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWJiaXQlMjBwZXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2Mzk0MTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      name: "Snowball",
      breed: "Holland Lop",
      age: "1 year",
      goalsCompleted: 4,
      goalsTotal: 6,
      nextTask: {
        title: "Grooming session",
        time: "4:00 PM",
        icon: Heart,
      },
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-gray-900 ${isDarkMode ? "dark" : ""}`}
    >
      {/* Navigation */}
      <Navigation
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Overlay */}
      {isNavOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="min-h-screen max-w-md mx-auto bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              {isNavOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            <h1 className="text-gray-900 dark:text-gray-100">
              My Pet
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-3 space-y-3 pb-20">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search tasks, health records..."
              className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Pet Profile Card */}
          <PetProfile pets={pets} />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button className="group relative flex items-center justify-center gap-1.5 p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-md shadow-sm hover:shadow-md transition-all active:scale-[0.98] overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Plus className="w-3.5 h-3.5 relative z-10" />
              <span className="text-sm relative z-10">
                Add Task
              </span>
            </button>
            <button className="group relative flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500 transition-all active:scale-[0.98] overflow-hidden">
              <div className="absolute inset-0 bg-orange-50 dark:bg-orange-900/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Search className="w-3.5 h-3.5 relative z-10 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
              <span className="text-sm relative z-10 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Health Log
              </span>
            </button>
          </div>

          {/* Daily Tasks Section */}
          <DailyTasks />

          {/* Health Metrics Section */}
          <HealthMetrics petName={pets[0].name} />
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 safe-area-bottom">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-xs text-orange-600 dark:text-orange-400">
                Home
              </span>
            </button>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Explore
              </span>
            </button>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Add
              </span>
            </button>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Alerts
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}