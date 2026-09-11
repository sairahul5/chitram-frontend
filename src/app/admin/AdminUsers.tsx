"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { useEffect, useState } from "react";

type AdminUser = {
    id: number;
    email: string;
    displayName: string;
    pictureUrl?: string | null;
    role: string;
    createdAt: string;
};

interface AdminUsersProps {
    /** When set, this live list from the WebSocket replaces the locally fetched list. */
    liveUsers?: AdminUser[] | null;
}

export default function AdminUsers({ liveUsers }: AdminUsersProps) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = () => {
        apiClient<AdminUser[]>("/admin/users")
            .then(setUsers)
            .catch(() => setError("Unable to load users."))
            .finally(() => setLoadingUsers(false));
    };

    useEffect(loadUsers, []);

    // When the parent receives a fresh user list from the WebSocket, apply it
    useEffect(() => {
        if (liveUsers && liveUsers.length > 0) {
            setUsers(liveUsers);
            setLoadingUsers(false);
        }
    }, [liveUsers]);

    async function changeRole(userId: number, role: string) {
        setError(null);
        setUpdatingUserId(userId);
        try {
            await apiClient<void>(`/admin/users/${userId}/role`, {
                body: JSON.stringify({ role }),
                method: "PUT",
            });
            // The role change triggers a WS push — no need to manually reload
        } catch {
            setError("Unable to update this user role.");
        } finally {
            setUpdatingUserId(null);
        }
    }

    return (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
            <div className="flex flex-col items-start gap-3 border-b border-[#e8ece8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div>
                    <h2 className="font-semibold">User access</h2>
                    <p className="mt-1 text-sm text-[#68736d]">Manage roles for accounts that have signed in with Google.</p>
                </div>
                {liveUsers !== null && liveUsers !== undefined && (
                    <span className="flex items-center gap-1.5 text-xs text-[#438268] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#438268] animate-pulse" />
                        Live
                    </span>
                )}
            </div>
            {error && <p className="border-b border-[#e8b9ad] bg-[#fff5f2] px-4 py-4 text-sm text-[#a84f37] sm:px-6">{error}</p>}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-[#f8faf7] text-xs uppercase tracking-[0.12em] text-[#68736d]">
                        <tr>
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Role</th>
                            <th className="px-6 py-4 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingUsers ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr className="border-t border-[#e8ece8]" key={i}>
                                    <td className="px-6 py-4 space-y-2">
                                        <div className="h-4 w-36 rounded-md animate-shimmer" />
                                        <div className="h-3 w-48 rounded-md animate-shimmer" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 w-16 rounded-md animate-shimmer" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-9 w-24 rounded-lg animate-shimmer" />
                                    </td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-[#68736d]">
                                    No accounts registered yet.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr className="border-t border-[#e8ece8] transition-colors hover:bg-[#fafaf8]" key={user.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.pictureUrl} name={user.displayName} size="sm" />
                                            <div>
                                                <p className="font-medium">{user.displayName}</p>
                                                <p className="mt-0.5 text-xs text-[#68736d]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[#68736d]">{user.role}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <select
                                                disabled={updatingUserId === user.id}
                                                className="rounded-lg border border-[#d8ded8] bg-white px-3 py-2 text-sm disabled:opacity-60 transition"
                                                onChange={(event) => changeRole(user.id, event.target.value)}
                                                value={user.role.includes("ADMIN") ? "ADMIN" : "USER"}
                                            >
                                                <option value="USER">User</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                            {updatingUserId === user.id && (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d2643b] border-t-transparent" />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
