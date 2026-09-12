"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { useEffect, useRef, useState } from "react";

type AdminUser = {
    id: number;
    email: string;
    displayName: string;
    pictureUrl?: string | null;
    role: string;
    createdAt: string;
    accountStatus?: string;
    pins?: number;
    likes?: number;
    followers?: number;
    following?: number;
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
    const [search, setSearch] = useState("");
    const [processingUserId, setProcessingUserId] = useState<number | null>(null);
    const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);
    const roleMenuRef = useRef<HTMLDivElement>(null);

    const loadUsers = (query = search) => {
        apiClient<AdminUser[]>(`/admin/users?search=${encodeURIComponent(query)}`)
            .then(setUsers)
            .catch(() => setError("Unable to load users."))
            .finally(() => setLoadingUsers(false));
    };

    useEffect(loadUsers, []);

    useEffect(() => {
        const timer = window.setTimeout(() => void loadUsers(), 250);
        return () => window.clearTimeout(timer);
    }, [search]);

    // When the parent receives a fresh user list from the WebSocket, apply it
    useEffect(() => {
        if (liveUsers && liveUsers.length > 0) {
            setUsers(liveUsers); // eslint-disable-line react-hooks/set-state-in-effect
            setLoadingUsers(false);
        }
    }, [liveUsers]);

    useEffect(() => {
        function closeRoleMenu(event: MouseEvent) {
            if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
                setOpenRoleMenuId(null);
            }
        }
        if (openRoleMenuId !== null) {
            document.addEventListener("mousedown", closeRoleMenu);
        }
        return () => document.removeEventListener("mousedown", closeRoleMenu);
    }, [openRoleMenuId]);

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

    async function changeStatus(user: AdminUser) {
        setProcessingUserId(user.id);
        try {
            await apiClient(`/admin/users/${user.id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" }),
            });
            await loadUsers();
        } catch {
            setError("Unable to update this account status.");
        } finally {
            setProcessingUserId(null);
        }
    }

    async function deleteUser(user: AdminUser) {
        if (!window.confirm(`Delete ${user.displayName}'s account? This cannot be undone.`)) return;
        setProcessingUserId(user.id);
        try {
            await apiClient(`/admin/users/${user.id}`, { method: "DELETE" });
            setUsers((previous) => previous.filter((item) => item.id !== user.id));
        } catch {
            setError("Unable to delete this account.");
        } finally {
            setProcessingUserId(null);
        }
    }

    return (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
            <div className="flex flex-col items-start gap-3 border-b border-[#e8ece8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div>
                    <h2 className="font-semibold">User access</h2>
                    <p className="mt-1 text-sm text-[#68736d]">Manage roles for accounts that have signed in with Google.</p>
                </div>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="rounded-full border border-[#d8ded8] bg-white px-4 py-2 text-sm outline-none focus:border-[#438268]" />
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
                            <th className="px-6 py-4 font-semibold">Activity</th>
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
                                <td colSpan={4} className="px-6 py-8 text-center text-[#68736d]">
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
                                    <td className="px-6 py-4 text-[#68736d]">{user.role}<br /><span className={user.accountStatus === "SUSPENDED" ? "text-[#a84f37]" : "text-[#438268]"}>{user.accountStatus ?? "ACTIVE"}</span></td>
                                    <td className="px-6 py-4 text-xs text-[#68736d]">{user.pins ?? 0} pins · {user.likes ?? 0} likes<br />{user.followers ?? 0} followers · {user.following ?? 0} following</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="relative" ref={openRoleMenuId === user.id ? roleMenuRef : undefined}>
                                                <button
                                                    type="button"
                                                    disabled={updatingUserId === user.id}
                                                    onClick={() => setOpenRoleMenuId(openRoleMenuId === user.id ? null : user.id)}
                                                    className="flex min-w-[76px] items-center justify-between gap-3 rounded-lg border border-[#d8ded8] bg-white px-3 py-2 text-left text-xs font-semibold text-[#1f2925] shadow-sm transition hover:border-[#438268] disabled:cursor-wait disabled:opacity-60"
                                                    aria-haspopup="menu"
                                                    aria-expanded={openRoleMenuId === user.id}
                                                >
                                                    {user.role.includes("ADMIN") ? "Admin" : "User"}
                                                    <span className={`text-[#68736d] transition-transform ${openRoleMenuId === user.id ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
                                                </button>
                                                {openRoleMenuId === user.id && (
                                                    <div className="absolute right-0 top-full z-30 mt-2 w-32 overflow-hidden rounded-xl border border-[#d8ded8] bg-white p-1 shadow-[0_12px_30px_rgba(31,41,37,0.14)]" role="menu">
                                                        {[{ value: "USER", label: "User" }, { value: "ADMIN", label: "Admin" }].map((option) => {
                                                            const selected = (user.role.includes("ADMIN") ? "ADMIN" : "USER") === option.value;
                                                            return (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    role="menuitem"
                                                                    disabled={selected}
                                                                    onClick={() => {
                                                                        setOpenRoleMenuId(null);
                                                                        void changeRole(user.id, option.value);
                                                                    }}
                                                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${selected ? "bg-[#e9eee8] text-[#438268]" : "text-[#1f2925] hover:bg-[#f5f1e9]"}`}
                                                                >
                                                                    {option.label}
                                                                    {selected && <span aria-hidden="true">✓</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            {updatingUserId === user.id && (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d2643b] border-t-transparent" />
                                            )}
                                            <button type="button" disabled={processingUserId === user.id} onClick={() => void changeStatus(user)} className="rounded-lg border border-[#d8ded8] px-3 py-2 text-xs font-semibold">{user.accountStatus === "SUSPENDED" ? "Unsuspend" : "Suspend"}</button>
                                            <button type="button" disabled={processingUserId === user.id} onClick={() => void deleteUser(user)} className="rounded-lg border border-[#e8b9ad] px-3 py-2 text-xs font-semibold text-[#a84f37]">Delete</button>
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
