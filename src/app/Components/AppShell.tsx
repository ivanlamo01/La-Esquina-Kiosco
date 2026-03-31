"use client";

import { useAuthContext } from "../Context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import MainLayout from "./MainLayout";
import type { FirebaseError } from "firebase/app";


export default function AppShell({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <AppShellClient>{children}</AppShellClient>;
}

function AppShellClient({ children }: { children: React.ReactNode }) {
    const { login, loading, user } = useAuthContext();
    const router = useRouter();
    const pathname = usePathname();

    const isPermissionDeniedError = (error: unknown) => {
        const firebaseError = error as FirebaseError;
        return firebaseError?.code === "permission-denied" || firebaseError?.code === "firestore/permission-denied";
    };

    useEffect(() => {
        // One-time Data Normalization (Firestore)
        const normalizeExistingData = async () => {
            const hasNormalizedV3 = localStorage.getItem('data_normalized_v3');
            if (hasNormalizedV3 || !login || !user?.isAdmin) return;

            console.log('[Maintenance] Starting one-time data normalization (V3)...');
            try {
                const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../config/firebase');

                // 1. Normalize Products
                const productsSnap = await getDocs(collection(db, 'Productos'));
                for (const pDoc of productsSnap.docs) {
                    const data = pDoc.data();
                    const title = data.title || data.name || '';
                    if (title && title.length > 0 && title[0] !== title[0].toUpperCase()) {
                        const newTitle = title.charAt(0).toUpperCase() + title.slice(1);
                        await updateDoc(doc(db, 'Productos', pDoc.id), { title: newTitle, name: newTitle });
                    }
                }

                // 2. Normalize Debtors
                const debtorsSnap = await getDocs(collection(db, 'debtors'));
                for (const dDoc of debtorsSnap.docs) {
                    const data = dDoc.data();
                    const name = data.name || '';
                    if (name && name.length > 0 && name[0] !== name[0].toUpperCase()) {
                        const newName = name.charAt(0).toUpperCase() + name.slice(1);
                        await updateDoc(doc(db, 'debtors', dDoc.id), { name: newName });
                    }
                }

                // 3. Normalize Categories
                const catsSnap = await getDocs(collection(db, 'Categorias'));
                for (const cDoc of catsSnap.docs) {
                    const data = cDoc.data();
                    const name = data.name || '';
                    
                    if (name && name.length > 0 && name[0] !== name[0].toUpperCase()) {
                        const newName = name.charAt(0).toUpperCase() + name.slice(1);
                        await updateDoc(doc(db, 'Categorias', cDoc.id), { name: newName });
                    }
                }

                localStorage.setItem('data_normalized_v3', 'true');
                console.log('[Maintenance] Data normalization V3 complete.');
            } catch (err) {
                if (!isPermissionDeniedError(err)) {
                    console.error('[Maintenance] Normalization failed:', err);
                }
            }
        };

        normalizeExistingData();
    }, [login, user?.isAdmin]);

    useEffect(() => {
        // Intentar sincronizar productos y ventas si estamos en Electron
        const syncData = async () => {
            try {
                const { productService } = await import("../lib/services/productService");
                const { saleService } = await import("../lib/services/saleService");
                const { categoryService } = await import("../lib/services/categoryService");

                await productService.syncPendingProducts();
                await productService.syncFromFirestore();
                await saleService.syncPendingSales();
                await saleService.syncFromFirestore();
                await categoryService.syncFromFirestore();
            } catch (err) {
                if (!isPermissionDeniedError(err)) {
                    console.error("[Sync] Error al sincronizar datos:", err);
                }
            }
        };
        syncData();

        // Global Input Capitalization Listener (First Letter Only)
        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (
                target.tagName === 'INPUT' && 
                (target.type === 'text' || !target.type) &&
                !target.name?.toLowerCase().includes('barcode') &&
                !target.name?.toLowerCase().includes('email') &&
                !target.name?.toLowerCase().includes('password')
            ) {
                if (target.value.length > 0) {
                    const firstChar = target.value.charAt(0);
                    if (firstChar !== firstChar.toUpperCase()) {
                        const newValue = firstChar.toUpperCase() + target.value.slice(1);
                        target.value = newValue;
                        // Trigger synthetic input event to update React state/Hook Form
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        };

        document.addEventListener('input', handleInput, true);
        return () => document.removeEventListener('input', handleInput, true);
    }, []);

    useEffect(() => {
        // Wait for auth to finish loading before redirecting
        if (loading) return;

        // Si no está logueado y no está en login o afip-cert, redirigir
        if (!login && pathname !== "/login" && pathname !== "/afip-cert") {
            router.push("/login");
        }
    }, [login, loading, pathname, router]);

    // Show loading state while auth is being checked
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-yellow-500/80 animate-pulse font-medium">Cargando aplicación...</p>
                </div>
            </div>
        );
    }

    if (pathname === "/login" || pathname === "/afip-cert" || pathname?.startsWith("/login")) {
        return <>{children}</>;
    }

    if (!login) {
        return null; // Silent redirect handled by useEffect
    }

    return (
        <>
            <NavBar />
            <MainLayout>
                {children}
            </MainLayout>
        </>
    );
}
