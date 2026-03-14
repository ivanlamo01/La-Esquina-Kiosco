"use client";
import React, { useState, useEffect } from "react";
import { FaTimes, FaTrash, FaExclamationCircle, FaEdit } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, User } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import CustomCarousel from "./customCarousel";
import { Note } from "../types/taskTypes";
import { db } from "../config/firebase";
import WeeklySalesChart from "./weeklySalesChart";
import { getNotes, addNote, deleteNote, updateNote } from "../lib/services/notesServices";
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ variant: string; text: string } | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  // Notes state
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteImportance, setNewNoteImportance] = useState<'low' | 'medium' | 'high'>('low');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImportance, setEditImportance] = useState<'low' | 'medium' | 'high'>('low');
  const [editHasDeadline, setEditHasDeadline] = useState(false);
  const [editDeadline, setEditDeadline] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Keep this line to update the local 'user' state
      if (currentUser?.email) {
        Promise.all([loadTopProducts(), loadNotes()]);
      } else {
        setTopProducts([]);
        setNotes([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNotes = async () => {
    try {
      const fetchedNotes = await getNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        console.error("Error cargando notas:", error);
      }
      setNotes([]);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNoteContent.trim() || !newNoteTitle.trim()) return;
    try {
      await addNote(newNoteTitle, newNoteContent, newNoteImportance, user.uid, hasDeadline ? deadline : undefined);
      setNewNoteTitle("");
      setNewNoteContent("");
      setHasDeadline(false);
      setDeadline("");
      setIsAddingNote(false);
      loadNotes();
      setAlert({ variant: "success", text: "Nota agregada correctamente" });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error(error);
      setAlert({ variant: "error", text: "Error al agregar nota" });
    }
  };

  const toggleNote = (id: string) => {
    setExpandedNoteId(expandedNoteId === id ? null : id);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!isAdmin) return;
    try {
      await deleteNote(noteId);
      loadNotes();
      setAlert({ variant: "success", text: "Nota eliminada" });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error(error);
      setAlert({ variant: "error", text: "Error al eliminar nota" });
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditImportance(note.importance);
    if (note.deadline) {
      setEditHasDeadline(true);
      // Convert Firestore Timestamp to datetime-local string format (YYYY-MM-DDTHH:mm)
      // Check if it's a Firestore Timestamp (has seconds) or a Date object
      let date: Date;
      if (typeof note.deadline === 'object' && 'seconds' in note.deadline) {
          date = new Date(note.deadline.seconds * 1000);
      } else {
          date = new Date(note.deadline as string | number | Date);
      }
      
      const formattedDate = date.toISOString().slice(0, 16);
      setEditDeadline(formattedDate);
    } else {
      setEditHasDeadline(false);
      setEditDeadline("");
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditTitle("");
    setEditContent("");
    setEditImportance('low');
    setEditHasDeadline(false);
    setEditDeadline("");
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId || !editTitle.trim() || !editContent.trim()) return;

    try {
      const updateData = {
        title: editTitle,
        content: editContent,
        importance: editImportance,
        deadline: editHasDeadline ? new Date(editDeadline) : undefined
      };

      await updateNote(editingNoteId, updateData);

      setAlert({ variant: "success", text: "Nota actualizada correctamente" });
      handleCancelEdit();
      loadNotes();
    } catch (error) {
      console.error(error);
      setAlert({ variant: "error", text: "Error al actualizar nota" });
    }
  };


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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Charts & Carousel */}
        <div className="flex flex-col gap-6">
          {ACTIVE_MODULES.graficos && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm backdrop-blur-sm hover:border-primary/50 transition-all">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                Ventas Semanales
              </h2>
              <WeeklySalesChart />
            </div>
          )}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm backdrop-blur-sm hover:border-primary/50 transition-all">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Novedades
            </h2>
            <CustomCarousel />
          </div>
        </div>

        {/* Right Column: Notes & Top Products */}
        <div className="flex flex-col gap-6">

          {/* Notes Section */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm backdrop-blur-sm flex flex-col min-h-[200px] lg:max-h-[600px] h-fit">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full"></span>
                Notas Importantes
              </h2>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isAddingNote
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "bg-primary text-primary-foreground hover:opacity-90 hover:scale-110"
                  }`}
              >
                {isAddingNote ? <FaTimes /> : "+"}
              </button>
            </div>

            {isAddingNote && (
              <form onSubmit={handleAddNote} className="mb-6 p-4 bg-secondary/50 border border-border rounded-xl animate-slide-down">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Título de la nota..."
                  className="w-full bg-input text-foreground p-3 rounded-lg border border-input focus:border-primary outline-none mb-3 transition-colors"
                />
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <input
                    type="text"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Descripción..."
                    className="flex-1 bg-input text-foreground p-3 rounded-lg border border-input focus:border-primary outline-none transition-colors"
                  />
                  <select
                    value={newNoteImportance}
                    onChange={(e) => setNewNoteImportance(e.target.value as 'low' | 'medium' | 'high')}
                    className="bg-input text-foreground p-3 rounded-lg border border-input focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHasDeadline(!hasDeadline)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasDeadline ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                      {hasDeadline && <span className="text-xs">✓</span>}
                    </div>
                    <span className="text-muted-foreground text-sm select-none">¿Tiene plazo?</span>
                  </div>

                  {hasDeadline && (
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="bg-input text-foreground p-2 rounded-lg border border-input focus:border-primary outline-none text-sm"
                      required={hasDeadline}
                    />
                  )}
                </div>

                <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-colors shadow-md">
                  Agregar Nota
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-xl border border-l-4 transition-all hover:translate-x-1 ${note.importance === 'high' ? 'border-border border-l-red-500 bg-card hover:bg-accent/50' :
                    note.importance === 'medium' ? 'border-border border-l-amber-500 bg-card hover:bg-accent/50' :
                      'border-border border-l-blue-500 bg-card hover:bg-accent/50'
                    }`}
                >
                  {editingNoteId === note.id ? (
                    <form onSubmit={handleUpdateNote} className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-input text-foreground p-2 rounded border border-input focus:border-primary outline-none"
                        placeholder="Título"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-input text-foreground p-2 rounded border border-input focus:border-primary outline-none resize-none"
                        placeholder="Contenido"
                        rows={3}
                      />
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={editImportance}
                          onChange={(e) => setEditImportance(e.target.value as 'low' | 'medium' | 'high')}
                          className="bg-input text-foreground p-2 rounded border border-input outline-none text-sm"
                        >
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                        </select>
                        <div className="flex items-center gap-2 bg-input p-2 rounded border border-input">
                          <input
                            type="checkbox"
                            checked={editHasDeadline}
                            onChange={(e) => setEditHasDeadline(e.target.checked)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm text-muted-foreground">Plazo</span>
                        </div>
                        {editHasDeadline && (
                          <input
                            type="datetime-local"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="bg-input text-foreground p-2 rounded border border-input outline-none text-sm"
                          />
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={handleCancelEdit} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm transition-colors">Cancelar</button>
                        <button type="submit" className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm transition-colors">Guardar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start group">
                        <div className="flex-1 cursor-pointer" onClick={() => toggleNote(note.id)}>
                          <h6 className="font-bold text-foreground text-lg">{note.title || "Sin título"}</h6>
                          {expandedNoteId === note.id && (
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed animate-fade-in">{note.content}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleStartEdit(note); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar">
                              <FaEdit />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${note.importance === 'high' ? 'bg-red-500/10 text-red-500' :
                          note.importance === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                          <FaExclamationCircle />
                          <span className="capitalize font-medium">{note.importance}</span>
                        </div>
                        <span>
                          {note.createdAt && typeof note.createdAt === 'object' && 'seconds' in note.createdAt
                            ? new Date(note.createdAt.seconds * 1000).toLocaleDateString()
                            : ''}
                        </span>

                        {note.deadline && (
                          <div className="ml-auto flex items-center gap-1.5 text-amber-500 font-medium bg-amber-500/10 px-2 py-1 rounded-md">
                            <span>⏰ Vence:</span>
                            <span>
                              {(typeof note.deadline === 'object' && 'seconds' in note.deadline)
                                ? new Date(note.deadline.seconds * 1000).toLocaleString()
                                : new Date(note.deadline as string | number | Date).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {notes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <FaExclamationCircle className="text-4xl mb-2 opacity-20" />
                  <p>No hay notas importantes.</p>
                </div>
              )}
            </div>
          </div>
          {/* Top Products Section REMOVED */}
        </div>

        <div className="hidden">
          {totalWeeklySales}
        </div>
      </div>

      <CustomAlert
        isOpen={noteToDelete !== null}
        title="Eliminar nota"
        message="¿Estás seguro de eliminar esta nota?"
        type="warning"
        showCancel
        confirmText="Eliminar"
        onConfirm={() => {
          if (noteToDelete) {
            void handleDeleteNote(noteToDelete);
          }
        }}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};

export default Main;
