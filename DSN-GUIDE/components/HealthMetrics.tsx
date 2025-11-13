import { Scale, Timer, Activity, TrendingUp, TrendingDown } from "lucide-react";

interface HealthMetricsProps {
  petName: string;
}

export function HealthMetrics({ petName }: HealthMetricsProps) {
  // Mock data - in a real app, this would come from props or API
  const healthData = {
    weight: {
      current: 28.5,
      unit: "kg",
      change: 0.3,
      trend: "up" as "up" | "down" | "stable",
      lastUpdated: "Nov 8"
    },
    exercise: {
      today: 45,
      goal: 60,
      unit: "min"
    },
    bowelMovement: {
      count: 2,
      lastTime: "10:30 AM",
      status: "normal" as "normal" | "attention"
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-gray-900 dark:text-gray-100">Health Overview</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Weight Card */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 hover:border-orange-200 dark:hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-6 h-6 bg-orange-50 dark:bg-orange-900/30 rounded flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">Weight</p>
            <div className="flex items-baseline gap-1">
              <p className="text-gray-900 dark:text-gray-100">{healthData.weight.current}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{healthData.weight.unit}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {healthData.weight.trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-orange-500 dark:text-orange-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-500 dark:text-green-400" />
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {healthData.weight.change > 0 ? "+" : ""}{healthData.weight.change} {healthData.weight.unit}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{healthData.weight.lastUpdated}</p>
          </div>
        </div>

        {/* Exercise Card */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 hover:border-orange-200 dark:hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-6 h-6 bg-orange-50 dark:bg-orange-900/30 rounded flex items-center justify-center">
              <Timer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">Exercise</p>
            <div className="flex items-baseline gap-1">
              <p className="text-gray-900 dark:text-gray-100">{healthData.exercise.today}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{healthData.exercise.unit}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1 mt-1">
              <div 
                className="bg-orange-500 dark:bg-orange-400 h-1 rounded-full transition-all"
                style={{ width: `${Math.min((healthData.exercise.today / healthData.exercise.goal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Goal: {healthData.exercise.goal} {healthData.exercise.unit}</p>
          </div>
        </div>

        {/* Bowel Movement Card */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 hover:border-orange-200 dark:hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-6 h-6 bg-orange-50 dark:bg-orange-900/30 rounded flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">BM Today</p>
            <div className="flex items-baseline gap-1">
              <p className="text-gray-900 dark:text-gray-100">{healthData.bowelMovement.count}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">times</span>
            </div>
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
              healthData.bowelMovement.status === "normal" 
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
            }`}>
              {healthData.bowelMovement.status}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Last: {healthData.bowelMovement.lastTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
