"use client";
import React, { useState, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, User } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import CustomCarousel from "./customCarousel";
import { db } from "../config/firebase";
import WeeklySalesChart from "./weeklySalesChart";
import { useAuthContext } from "../Context/AuthContext";
import CustomAlert from "./CustomAlert";
import { ACTIVE_MODULES } from "../../config/features";
import Image from "next/image";
const auth = getAuth();

const isPermissionDeniedError = (error: unknown): boolean => {
  const firebaseError = error as FirebaseError;
  return firebaseError?.code === "permission-denied" || firebaseError?.code === "firestore/permission-denied";
};

interface TopProduct {
  title: string;
  quantity: number;
}

const Main: React.FC = () => {
  const { user: dbUser } = useAuthContext();
  const isAdmin = dbUser?.isAdmin;

  const [totalWeeklySales, setTotalWeeklySales] = useState<number>(0);
  const [totalWeeklyQuantity, setTotalWeeklyQuantity] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ variant: string; text: string } | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Keep this line to update the local 'user' state
      if (currentUser?.email) {
        Promise.all([loadTopProducts()]);
      } else {
        setTopProducts([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);


  const loadTopProducts = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayThisWeek = new Date();
      mondayThisWeek.setDate(today.getDate() - daysSinceMonday);
      mondayThisWeek.setHours(0, 0, 0, 0);

      const salesQuery = query(
        collection(db, "sales"),
        where("timestamp", ">=", mondayThisWeek)
      );

      const querySnapshot = await getDocs(salesQuery);
      const productSales: Record<string, number> = {};
      let totalSalesAmount = 0;
      let totalQuantity = 0;

      querySnapshot.forEach((docSnap) => {
        const sale = docSnap.data();
        let saleTotal = 0;
        let quantity = 0;

        (sale.products as { title: string; price: number; quantity: number }[]).forEach((product) => {
          if (product.price && product.quantity) {
            saleTotal += product.price * product.quantity;
            quantity += product.quantity;
            productSales[product.title] = (productSales[product.title] || 0) + product.quantity;
          }
        });

        totalQuantity += quantity;
        totalSalesAmount += saleTotal;
      });

      const sortedProducts: TopProduct[] = Object.entries(productSales)
        .map(([title, quantity]) => ({ title, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setTotalWeeklyQuantity(totalQuantity);
      setTotalWeeklySales(totalSalesAmount);
      setTopProducts(sortedProducts);
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        console.error("Error loading top products:", error);
      }
    }
  };

  useEffect(() => {
    if (alert) {
      const timeout = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [alert]);

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 sm:p-6 lg:p-8 transition-colors duration-300 overflow-x-hidden relative">

      {alert && (
        <div
          className={`mb-6 p-4 rounded-xl border ${alert.variant === "success"
            ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
            : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
            } flex items-center gap-2 animate-fade-in`}
        >
          <FaExclamationCircle />
          {alert.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mb-6 text-primary animate-pulse font-medium">Cargando datos...</div>
      )}

      {/* Hero Logo Area - Always visible now */}
      <div className="flex justify-center items-center w-full mb-12 mt-0 h-40 md:h-64 lg:h-80 relative overflow-visible">
         <div className="animate-bounce-in-right h-full flex flex-col items-center justify-start">
           <div className="relative group">
              <div 
                className="absolute inset-0 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ backgroundColor: 'color-mix(in srgb, var(--glow-color) 20%, transparent)' }}
              ></div>
               <Image
                src="/Logo.png"
                alt="Logo La Esquina 24hs"
                width={512}
                height={512}
                sizes="(max-width: 768px) 160px, (max-width: 1024px) 256px, 320px"
                className="h-40 md:h-64 lg:h-80 w-auto drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500 origin-center logo-glow"
               />
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left Column: Charts */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm backdrop-blur-sm hover:border-primary/50 transition-all">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Ventas Semanales
            </h2>
            <WeeklySalesChart />
          </div>
        </div>

        {/* Right Column: Novedades */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm backdrop-blur-sm hover:border-primary/50 transition-all">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Novedades
            </h2>
            <CustomCarousel />
          </div>
        </div>

        <div className="hidden">
           {totalWeeklySales} {totalWeeklyQuantity} {topProducts.length}
        </div>
      </div>
    </div>
  );
};

export default Main;
