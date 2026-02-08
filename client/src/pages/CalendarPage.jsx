// ============================================
// Calendar Page — Month view with task indicators
// Matches the reference wireframe closely
// ============================================
import { useState, useEffect } from "react";
import { fetchCalendar } from "../api";
import {
    getCalendarDays,
    formatMonth,
    formatDate,
    getMonthName,
    isSameDay,
} from "../utils/dates";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Color coding for task types (matches reference design)
const TASK_COLORS = {
    pest: "bg-gray-800 text-white",
    irrigation: "bg-gray-200 text-gray-800",
    sowing: "bg-gray-100 text-gray-700",
    fertilizer: "bg-gray-300 text-gray-800",
    harvest: "bg-gray-400 text-white",
    transplant: "bg-gray-500 text-white",
    weeding: "bg-gray-100 text-gray-700",
    default: "bg-gray-100 text-gray-700",
};

/**
 * Determine task type from title for color coding
 */
function getTaskType(title) {
    const lower = title.toLowerCase();
    if (lower.includes("pest")) return "pest";
    if (lower.includes("irrigation")) return "irrigation";
    if (lower.includes("sowing")) return "sowing";
    if (lower.includes("fertilizer")) return "fertilizer";
    if (lower.includes("harvest")) return "harvest";
    if (lower.includes("transplant")) return "transplant";
    if (lower.includes("weeding")) return "weeding";
    return "default";
}

/**
 * Build a short label for calendar cell like "Z1: Pest ×1"
 */
function buildTaskLabels(tasks) {
    // Group by zone (extracted from title) and type
    const groups = {};
    for (const task of tasks) {
        const type = getTaskType(task.title);
        // Try to extract zone from title like "... Zone 1" or "Zone 2"
        const zoneMatch = task.title.match(/zone\s*(\d)/i);
        const zone = zoneMatch ? `Z${zoneMatch[1]}` : "Z?";
        const key = `${zone}:${type}`;
        if (!groups[key]) groups[key] = { zone, type, count: 0 };
        groups[key].count++;
    }

    return Object.values(groups).map((g) => ({
        label: `${g.zone}: ${g.type.charAt(0).toUpperCase() + g.type.slice(1)} ×${g.count}`,
        type: g.type,
    }));
}

export default function CalendarPage({ user, onSelectDate, onLogout, refreshTrigger }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [calendarData, setCalendarData] = useState({});
    const [carryForwardCount, setCarryForwardCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthStr = formatMonth(viewDate);

    // Fetch calendar data when month changes or refresh triggered
    useEffect(() => {
        setLoading(true);
        const userId = user.role === "worker" ? user.id : null;
        fetchCalendar(monthStr, userId)
            .then((data) => {
                setCalendarData(data.calendar || {});
                setCarryForwardCount(data.carryForwardCount || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [monthStr, user, refreshTrigger]);

    // Navigate months
    function prevMonth() {
        setViewDate(new Date(year, month - 1, 1));
    }
    function nextMonth() {
        setViewDate(new Date(year, month + 1, 1));
    }
    function goToToday() {
        setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }

    // Get calendar grid
    const days = getCalendarDays(year, month);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top header bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-800">🌱</span>
                        <span className="text-sm text-gray-500 hidden sm:inline">
                            {user.name} ({user.role})
                        </span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1 border border-gray-200 rounded-lg"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4">
                {/* Month navigation — large touch targets */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevMonth}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-50 active:bg-gray-100"
                        >
                            ← Prev
                        </button>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mx-2">
                            {getMonthName(month)} {year}
                        </h2>
                        <button
                            onClick={nextMonth}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-50 active:bg-gray-100"
                        >
                            Next →
                        </button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 active:bg-gray-600"
                    >
                        Go to Today
                    </button>
                </div>

                {/* Carry-forward indicator */}
                {carryForwardCount > 0 && (
                    <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        ⚠️ {carryForwardCount} pending task{carryForwardCount > 1 ? "s" : ""} carried forward from previous days
                    </div>
                )}

                {/* Calendar loading indicator */}
                {loading && (
                    <div className="text-center py-2 text-gray-400 text-sm">Loading calendar...</div>
                )}

                {/* Calendar grid */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-gray-800 text-white">
                        {DAY_NAMES.map((d) => (
                            <div key={d} className="py-2 text-center text-xs sm:text-sm font-semibold">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7">
                        {days.map(({ date, isCurrentMonth }, idx) => {
                            const dateStr = formatDate(date);
                            const isToday = isSameDay(date, today);
                            const tasks = calendarData[dateStr] || [];
                            const taskLabels = buildTaskLabels(tasks);
                            const hasCarryForward = carryForwardCount > 0 && isToday;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => onSelectDate(dateStr)}
                                    className={`
                    relative min-h-17.5 sm:min-h-25 p-1 border-b border-r border-gray-200
                    text-left align-top transition-colors
                    ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                    ${isToday ? "bg-teal-50 ring-2 ring-inset ring-teal-400" : ""}
                    hover:bg-gray-50 active:bg-gray-100
                  `}
                                >
                                    {/* Date number */}
                                    <div className="flex items-start justify-between">
                                        <span
                                            className={`text-xs sm:text-sm font-medium
                        ${isCurrentMonth ? "text-gray-800" : "text-gray-300"}
                        ${isToday ? "text-teal-700 font-bold" : ""}
                      `}
                                        >
                                            {date.getDate()}
                                        </span>
                                        {/* Task count badge */}
                                        {tasks.length > 0 && (
                                            <span className="bg-gray-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                                {tasks.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Task labels (compact view) */}
                                    <div className="mt-1 space-y-0.5 overflow-hidden">
                                        {taskLabels.slice(0, 3).map((item, i) => (
                                            <div
                                                key={i}
                                                className={`text-[9px] sm:text-[11px] leading-tight px-1 py-0.5 rounded truncate
                          ${TASK_COLORS[item.type] || TASK_COLORS.default}
                        `}
                                            >
                                                {item.label}
                                            </div>
                                        ))}
                                        {taskLabels.length > 3 && (
                                            <div className="text-[9px] text-gray-400 px-1">
                                                +{taskLabels.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-800"></span> Pest
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-200 border"></span> Irrigation
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-100 border"></span> Sowing
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-300"></span> Fertilizer
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-400"></span> Harvest
                    </span>
                </div>
            </div>
        </div>
    );
}
