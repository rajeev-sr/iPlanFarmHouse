// ============================================
// Login Page — Role selection (matches reference design)
// ============================================
import { useState, useEffect } from "react";
import { fetchUsers, loginUser } from "../api";

export default function LoginPage({ onLogin }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all users on mount
    useEffect(() => {
        fetchUsers()
            .then(setUsers)
            .catch(() => setError("Cannot connect to server"))
            .finally(() => setLoading(false));
    }, []);

    // Handle user selection — immediately log in
    async function handleSelect(userId) {
        try {
            const user = await loginUser(userId);
            onLogin(user);
        } catch {
            setError("Login failed. Try again.");
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
                {/* Logo / Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M12 22c0 0-8-4.5-8-11.8A4.2 4.2 0 0112 6a4.2 4.2 0 018 4.2C20 17.5 12 22 12 22z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M12 6v16" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">
                    Farm Management
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Select your role to continue
                </p>

                {/* Loading state */}
                {loading && (
                    <div className="text-center text-gray-400 py-8">Loading...</div>
                )}

                {/* Error state */}
                {error && (
                    <div className="text-center text-red-500 py-4 mb-4 bg-red-50 rounded-lg">
                        {error}
                    </div>
                )}

                {/* User list — big touch-friendly buttons */}
                {!loading && !error && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 mb-2">Login as:</p>

                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleSelect(user.id)}
                                className="w-full py-4 px-5 border-2 border-gray-200 rounded-xl
                  text-left text-lg font-medium text-gray-700
                  hover:border-gray-800 hover:bg-gray-50
                  active:bg-gray-100 transition-all
                  flex items-center justify-between"
                            >
                                <span>{user.name}</span>
                                <span className="text-xs uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 text-gray-500">
                                    {user.role}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Demo mode hint */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-400">
                        Demo Mode: Select any user to explore the platform
                    </p>
                </div>
            </div>
        </div>
    );
}
