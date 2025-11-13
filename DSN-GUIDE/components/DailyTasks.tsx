import { CheckCircle2, Circle, Clock, Bell, Utensils, Footprints, Droplets, Pill } from "lucide-react";
import { Badge } from "./ui/badge";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  priority?: "high" | "medium" | "low";
  icon: any;
}

type FilterType = "all" | "completed" | "incomplete";

export function DailyTasks() {
  const [filter, setFilter] = useState<FilterType>("all");
  const tasks: Task[] = [
    { id: "1", title: "Morning feeding", time: "7:00 AM", completed: true, icon: Utensils, priority: "high" },
    { id: "2", title: "Morning walk", time: "8:30 AM", completed: true, icon: Footprints },
    { id: "3", title: "Give vitamins", time: "9:00 AM", completed: true, icon: Pill, priority: "medium" },
    { id: "4", title: "Refill water bowl", time: "12:00 PM", completed: true, icon: Droplets },
    { id: "5", title: "Afternoon playtime", time: "2:00 PM", completed: false, icon: Footprints },
    { id: "6", title: "Evening feeding", time: "6:00 PM", completed: false, icon: Utensils, priority: "high" },
    { id: "7", title: "Evening walk", time: "7:30 PM", completed: false, icon: Footprints },
    { id: "8", title: "Grooming session", time: "8:00 PM", completed: false, icon: Utensils, priority: "medium" },
  ];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700";
      case "medium":
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  const completedTasksList = tasks.filter(t => t.completed);
  const incompleteTasksList = tasks.filter(t => !t.completed);
  const nextTask = tasks.find(t => !t.completed);

  const showCompleted = filter === "all" || filter === "completed";
  const showIncomplete = filter === "all" || filter === "incomplete";

  return (
    <div className="space-y-3">
      {/* Next Up Card */}
      {nextTask && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Bell className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-700 dark:text-orange-400">Next Up</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <nextTask.icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-gray-100">{nextTask.title}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {nextTask.time}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900 dark:text-gray-100">Today's Tasks</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monday, November 10, 2025</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filter === "all"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filter === "completed"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Done
          </button>
          <button
            onClick={() => setFilter("incomplete")}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filter === "incomplete"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Incomplete Tasks Section */}
      {showIncomplete && incompleteTasksList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm text-gray-700 dark:text-gray-300">To Do ({incompleteTasksList.length})</h4>
          <div className="space-y-1.5">
            {incompleteTasksList.map((task) => {
              const TaskIcon = task.icon;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 p-3 rounded-lg transition-all bg-white dark:bg-gray-700 border border-orange-100 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-500"
                >
                  <button className="flex-shrink-0">
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" />
                  </button>
                  
                  <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <TaskIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{task.time}</p>
                      {task.priority && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Tasks Section */}
      {showCompleted && completedTasksList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm text-gray-700 dark:text-gray-300">Completed ({completedTasksList.length})</h4>
          <div className="space-y-1.5">
            {completedTasksList.map((task) => {
              const TaskIcon = task.icon;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 p-3 rounded-lg transition-all bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                >
                  <button className="flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-gray-500 fill-gray-100 dark:fill-gray-600" />
                  </button>
                  
                  <div className="w-8 h-8 bg-orange-50 dark:bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <TaskIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 dark:text-gray-500 line-through">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-600">{task.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
