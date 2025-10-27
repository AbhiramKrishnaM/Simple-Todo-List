import * as React from "react";
import { useTasksStore } from "../store/tasks";
import { motion } from "motion/react";

function DashboardPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = React.useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const highPriority = tasks.filter(
      (t) => t.priority === "high" && !t.completed
    ).length;
    const mediumPriority = tasks.filter(
      (t) => t.priority === "medium" && !t.completed
    ).length;
    const lowPriority = tasks.filter(
      (t) => t.priority === "low" && !t.completed
    ).length;

    return {
      total: tasks.length,
      completed,
      pending,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate:
        tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  return (
    <motion.div
      className="flex flex-1 flex-col items-center gap-6 px-6 py-8 overflow-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Tasks */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Total Tasks
            </h3>
            <p className="text-4xl font-bold text-foreground">{stats.total}</p>
          </motion.div>

          {/* Completed Tasks */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Completed
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-500">
              {stats.completed}
            </p>
          </motion.div>

          {/* Pending Tasks */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Pending
            </h3>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-500">
              {stats.pending}
            </p>
          </motion.div>

          {/* Completion Rate */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card md:col-span-2 lg:col-span-3"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Completion Rate
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {stats.completionRate}%
              </span>
            </div>
          </motion.div>

          {/* Priority Breakdown */}
          <motion.div
            className="p-6 rounded-lg border border-border bg-card md:col-span-2 lg:col-span-3"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Pending by Priority
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                  {stats.highPriority}
                </div>
                <div className="text-sm text-muted-foreground mt-1">High</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                  {stats.mediumPriority}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                  {stats.lowPriority}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Low</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardPage;
