// ============================================
// Daily Tasks Page — checklist with one-tap complete
// Matches reference: large cards, clear layout
// ============================================
import { useState, useEffect } from "react";
import { fetchTasks, completeTask } from "../api";
import { formatDateDisplay } from "../utils/dates";

// Category filter buttons (matches reference)
const FILTERS = ["All", "Sowing", "Irrigation", "Pest", "Fertilizer", "Harvest"];

/**
 * Detect task category from title
 */
function getCategory(title) {
    const lower = title.toLowerCase();
    if (lower.includes("sowing")) return "Sowing";
    if (lower.includes("irrigation")) return "Irrigation";
    if (lower.includes("pest")) return "Pest";
    if (lower.includes("fertilizer")) return "Fertilizer";
    if (lower.includes("harvest")) return "Harvest";
    if (lower.includes("transplant")) return "Transplant";
    if (lower.includes("weeding")) return "Weeding";
    return "Other";
}

/**
 * Extract zone info from title
 */
function getZone(title) {
    const match = title.match(/zone\s*(\d)/i);
    return match ? `Zone ${match[1]}` : null;
}

export default function DailyTasksPage({ date, user, onBack }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [completingId, setCompletingId] = useState(null);

    // Load tasks for this date
    useEffect(() => {
        setLoading(true);
        const userId = user.role === "worker" ? user.id : null;
        fetchTasks(date, userId)
            .then(setTasks)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [date, user]);

    // Mark task complete — one tap
    async function handleComplete(taskId) {
        setCompletingId(taskId);
        try {
            await completeTask(taskId);
            // Update local state immediately
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId ? { ...t, status: "completed", completion_date: new Date().toISOString() } : t
                )
            );
        } catch (err) {
            console.error("Failed to complete task:", err);
        }
        setCompletingId(null);
    }

    // Apply category filter
    const filtered = filter === "All"
        ? tasks
        : tasks.filter((t) => getCategory(t.title) === filter);

    // Separate pending (at top) and completed
    const pendingTasks = filtered.filter((t) => t.status === "pending");
    const completedTasks = filtered.filter((t) => t.status === "completed");

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sticky header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <button
                        onClick={onBack}
                        className="text-sm text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-1"
                    >
                        ← Back to Calendar
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                        Activities on {formatDateDisplay(date)}
                    </h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Filter buttons — large, touch-friendly */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors
                ${filter === f
                                    ? "bg-gray-800 text-white border-gray-800"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                                }
              `}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12 text-gray-400">Loading tasks...</div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="text-gray-500 text-lg">No tasks for this day</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filter !== "All" ? "Try a different filter" : "Enjoy the break!"}
                        </p>
                    </div>
                )}

                {/* Pending tasks */}
                {pendingTasks.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {pendingTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={handleComplete}
                                isCompleting={completingId === task.id}
                                isWorker={user.role === "worker"}
                            />
                        ))}
                    </div>
                )}

                {/* Completed tasks */}
                {completedTasks.length > 0 && (
                    <>
                        <div className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                            ✅ Completed ({completedTasks.length})
                        </div>
                        <div className="space-y-3 opacity-60">
                            {completedTasks.map((task) => (
                                <TaskCard key={task.id} task={task} completed />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Individual Task Card — large, readable, one-tap complete
 */
function TaskCard({ task, onComplete, isCompleting, isWorker, completed }) {
    const category = getCategory(task.title);
    const zone = getZone(task.title);

    return (
        <div
            className={`bg-white rounded-xl border-2 p-4 sm:p-5
        ${completed ? "border-gray-200" : "border-gray-200 hover:border-gray-300"}
        ${task.carry_forward ? "border-l-4 border-l-amber-400" : ""}
      `}
        >
            {/* Top row: title + time */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className={`text-base sm:text-lg font-bold ${completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {task.title}
                </h3>
            </div>

            {/* Tags: zone + category */}
            <div className="flex flex-wrap gap-2 mb-3">
                {zone && (
                    <span className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-600 font-medium">
                        {zone}
                    </span>
                )}
                <span className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-600 font-medium">
                    {category}
                </span>
            </div>

            {/* Worker name */}
            {task.assigned_user_name && (
                <p className="text-sm text-gray-500 mb-2">
                    <span className="font-semibold">Worker:</span> {task.assigned_user_name}
                </p>
            )}

            {/* Carry-forward label */}
            {task.carry_forward && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md mb-3 inline-block">
                    ⏳ Pending from previous day
                </div>
            )}

            {/* Complete button — large, one-tap */}
            {!completed && isWorker && (
                <button
                    onClick={() => onComplete(task.id)}
                    disabled={isCompleting}
                    className={`w-full mt-2 py-3 rounded-xl text-base font-bold transition-all
            ${isCompleting
                            ? "bg-gray-300 text-gray-500 cursor-wait"
                            : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 active:scale-[0.98]"
                        }
          `}
                >
                    {isCompleting ? "Completing..." : "✅ Mark Complete"}
                </button>
            )}

            {/* Completed badge */}
            {completed && (
                <div className="text-sm text-green-600 font-medium mt-1">
                    ✅ Completed
                </div>
            )}
        </div>
    );
}
