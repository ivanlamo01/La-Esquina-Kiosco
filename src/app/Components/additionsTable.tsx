"use client";

import React, { useState, useEffect } from "react";
import { Addition } from "../types/additionTypes";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import { db } from "../config/firebase";

import { productService } from "../lib/services/productService";

const isPermissionDeniedError = (error: unknown): boolean => {
  const firebaseError = error as FirebaseError;
  return firebaseError?.code === "permission-denied" || firebaseError?.code === "firestore/permission-denied";
};

const AdditionsTable: React.FC = () => {
  const [additions, setAdditions] = useState<Addition[]>([]);

  useEffect(() => {
    const loadAdditions = async () => {
      try {
        const allProducts = await productService.getAll();

        const mapped = allProducts
          .map((data: any) => {
            let date = new Date(0);
            if (data.dateAdded) {
              if (data.dateAdded.toDate) {
                date = data.dateAdded.toDate();
              } else if (data.dateAdded.seconds) {
                date = new Date(data.dateAdded.seconds * 1000);
              } else {
                date = new Date(data.dateAdded);
              }
            } else if (data.id) {
               // Simple fallback: some timestamp extraction if id is predictable, otherwise date 0
            }

            return {
              title: data.title || data.name || "Sin título",
              dateAdded: date,
            };
          })
          .filter(p => p.dateAdded.getTime() > 0) // Filter out items with no explicit date Added
          .sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
          .slice(0, 5);

        setAdditions(mapped);
      } catch (error) {
        if (!isPermissionDeniedError(error)) {
          console.error("Error loading additions:", error);
        }
        setAdditions([]);
      }
    };

    loadAdditions();
  }, []);

  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
      <h3 className="text-2xl font-bold text-primary mb-2">Últimas Adiciones</h3>
      <h5 className="text-sm text-muted-foreground mb-4">Productos añadidos recientemente</h5>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-secondary text-secondary-foreground uppercase text-xs">
              <th className="px-4 py-3 rounded-tl-lg">Producto</th>
              <th className="px-4 py-3 rounded-tr-lg">Fecha de adición</th>
            </tr>
          </thead>
          <tbody>
            {additions.map((addition, index) => (
              <tr
                key={index}
                className="hover:bg-muted/50 transition-colors border-b border-border last:border-none"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {addition.title}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {addition.dateAdded instanceof Date &&
                    !isNaN(addition.dateAdded.getTime())
                    ? addition.dateAdded.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                    : "Fecha inválida"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdditionsTable;
