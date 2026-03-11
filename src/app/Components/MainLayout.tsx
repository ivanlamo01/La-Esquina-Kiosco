"use client";
import React from "react";
import { useSidebar } from "../Context/SidebarContext";
import GraffitiBackground from "./GraffitiBackground";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <>
            <GraffitiBackground />
            <main
                className={`relative z-10 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-20" : "lg:ml-60"
                }`}
        >
            {children}
            </main>
        </>
    );
}
