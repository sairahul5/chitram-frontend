"use client";

import { useState } from "react";

type AvatarProps = {
    src?: string | null;
    name?: string | null;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
};

// Deterministic pleasing palette for user avatars
const avatarColors = [
    "bg-[#1f2925]", // Deep dark slate
    "bg-[#d2643b]", // Warm terracotta
    "bg-[#3b795c]", // Forest emerald
    "bg-[#7a528a]", // Muted plum
    "bg-[#30668e]", // Deep ocean
    "bg-[#9e5a3f]", // Warm rust
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
}

export function Avatar({ src, name = "User", size = "md", className = "" }: AvatarProps) {
    const [loadFailed, setLoadFailed] = useState(false);

    const displayName = name || "User";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

    const bgColor = getAvatarColor(displayName);

    const sizeStyles = {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-9 w-9 text-xs",
        md: "h-12 w-12 text-sm",
        lg: "h-16 w-16 text-xl",
        xl: "h-20 w-20 text-2xl font-bold border-4 border-[#f5f1e9]",
    }[size];

    if (!src || loadFailed) {
        return (
            <div
                className={`flex shrink-0 items-center justify-center rounded-full text-white font-semibold shadow-sm select-none ${bgColor} ${sizeStyles} ${className}`}
                title={displayName}
                aria-label={displayName}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={displayName}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setLoadFailed(true)}
            className={`shrink-0 rounded-full object-cover shadow-sm ${sizeStyles} ${className}`}
        />
    );
}
