// ============================================
// Admin — Create Task Page
// Simple form to assign tasks to workers
// ============================================
import { useState, useEffect } from "react";
import { fetchUsers, createTask } from "../api";

export default function CreateTaskPage({ onBack, onCreated }) {
    const [workers, setWorkers] = useState([]);
    const [title, setTitle] = useState("");
    const [assignedUserId, setAssignedUserId] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Fetch workers on mount
    useEffect(() => {
        fetchUsers().then((users) => {
            setWorkers(users.filter((u) => u.role === "worker"));
        });
    }, []);

    // Pre-fill today's date
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setScheduledDate(today);
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title || !assignedUserId || !scheduledDate) {
            setError("Please fill all fields");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await createTask(title, parseInt(assignedUserId), scheduledDate);
            setSuccess(true);
            setTitle("");
            // Reset after a moment
            setTimeout(() => {
                setSuccess(false);
                if (onCreated) onCreated();
            }, 1500);
        } catch {
            setError("Failed to create task");
        }
        setLoading(false);
    }

    // Quick task templates — big buttons for common tasks
    const templates = [
        "Sowing -",
        "Irrigation -",
        "Pest Control -",
        "Fertilizer -",
        "Harvest -",
        "Weeding -",
        "Transplant -",
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <button
                        onClick={onBack}
                        className="text-sm text-gray-500 hover:text-gray-800 mb-1 flex items-center gap-1"
                    >
                        ← Back to Calendar
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Create New Task</h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6">
                {/* Success message */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center font-medium">
                        ✅ Task created successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Quick templates */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quick Start (tap to prefill):
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {templates.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTitle(t + " ")}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Task title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Task Name *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Irrigation - Zone 1 drip system"
                            className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-base focus:border-gray-800 focus:outline-none"
                        />
                    </div>

                    {/* Assign to worker */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Assign to Worker *
                        </label>
                        <div className="space-y-2">
                            {workers.map((w) => (
                                <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => setAssignedUserId(String(w.id))}
                                    className={`w-full py-3 px-4 border-2 rounded-xl text-left text-base font-medium transition-colors
                    ${String(w.id) === assignedUserId
                                            ? "border-gray-800 bg-gray-800 text-white"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                                        }
                  `}
                                >
                                    👤 {w.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scheduled date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Scheduled Date *
                        </label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-base focus:border-gray-800 focus:outline-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl text-lg font-bold transition-all
              ${loading
                                ? "bg-gray-300 text-gray-500 cursor-wait"
                                : "bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600 active:scale-[0.98]"
                            }
            `}
                    >
                        {loading ? "Creating..." : "Create Task"}
                    </button>
                </form>
            </div>
        </div>
    );
}
