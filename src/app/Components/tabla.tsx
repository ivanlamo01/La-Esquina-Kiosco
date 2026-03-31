"use client";
import React, { useState, useEffect, FormEvent, useRef } from "react";
import { FaCogs, FaQuestionCircle, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

import Producto from "./Producto";
import Loading from "./Loading/Loading";
import Pagination from "./Pagination";
import { ProductoProps } from "../types/productTypes";
import { productService } from "../lib/services/productService";
import { categoryService } from "../lib/services/categoryService";

import BulkUpdateModal, { BulkActionPayload } from "./BulkUpdateModal";
import CustomAlert, { AlertType } from "./CustomAlert";
import { useAuthContext } from "../Context/AuthContext";
import { useTutorial } from "../Context/TutorialContext";

const Tabla: React.FC = () => {
  const { login } = useAuthContext();
  const { startTutorial } = useTutorial();

  // --- Estados de Datos ---
  const [allProductos, setAllProductos] = useState<ProductoProps[]>([]); // Todos los productos (raw)
  const [filteredProductos, setFilteredProductos] = useState<ProductoProps[]>([]); // Productos filtrados para mostrar
  const [loading, setLoading] = useState<boolean>(true);

  // --- Estados de Filtros ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStock, setFilterStock] = useState<string>("todos"); // todos, bajo, sin
  const [sortBy, setSortBy] = useState<string>("default");
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // --- Paginación ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 10;

  // --- Selección Masiva ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);

  // --- Categorías Mapping ---
  const [categoriasMap, setCategoriasMap] = useState<Record<string, string>>({});
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // --- Modales ---
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoProps | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
    showCancel?: boolean;
    confirmText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => { },
  });

  // --- Formularios ---
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "" as number | "",
    category: "",
    stock: "" as number | "",
    Barcode: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
  });

  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, isOpen: false }));

  const showMessage = (title: string, message: string, type: AlertType = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      showCancel: false,
      confirmText: "Entendido",
      onConfirm: closeAlert,
    });
  };

  const showConfirm = (title: string, message: string, onConfirmAction: () => void) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type: "warning",
      showCancel: true,
      confirmText: "Confirmar",
      onConfirm: () => {
        closeAlert();
        onConfirmAction();
      },
      onCancel: closeAlert,
    });
  };

  // 1. CARGA INICIAL DE DATOS
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar Categorías
        const categories = await categoryService.getAll();
        const catMap: Record<string, string> = {};
        categories.forEach((cat) => {
          catMap[cat.id] = cat.name;
        });
        setCategoriasMap(catMap);

        // Cargar Productos usando servicio unificado
        const products = await productService.getAll();

        const productosAdaptados: ProductoProps[] = products.map((item: { id: string; title?: string; name?: string; stock?: number; price?: number; category?: string; Barcode?: string; variablePrice?: boolean }) => ({
          id: item.id,
          title: item.title || item.name || "",
          stock: item.stock ?? 0,
          price: item.price ?? 0,
          category: item.category ?? "",
          Barcode: item.Barcode ?? "",
          variablePrice: item.variablePrice,
        }));

        setAllProductos(productosAdaptados);
        setFilteredProductos(productosAdaptados); // Inicialmente mostramos todo

      } catch (e) {
        console.error("Error cargando datos:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // 2. LÓGICA DE FILTRADO (Se ejecuta cuando cambia algun filtro o la lista base)
  useEffect(() => {
    let result = [...allProductos];

    // A. Filtro por Texto (Nombre O Código de Barras)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(lowerTerm) ||
        p.Barcode.includes(lowerTerm)
      );
    }

    // B. Filtro por Categoría
    if (filterCategory) {
      if (filterCategory === "none") {
        result = result.filter(p => !p.category || p.category === "" || !categoriasMap[p.category]);
      } else {
        result = result.filter(p => p.category === filterCategory);
      }
    }

    // C. Filtro por Estado de Stock
    if (filterStock === "bajo") {
      result = result.filter(p => p.stock > 0 && p.stock <= 5);
    } else if (filterStock === "sin") {
      result = result.filter(p => p.stock === 0);
    }

    // D. Ordenamiento
    if (sortBy === "name-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => b.title.localeCompare(a.title, "es", { sensitivity: "base" }));
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "stock-asc") {
      result.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === "stock-desc") {
      result.sort((a, b) => b.stock - a.stock);
    }

    setFilteredProductos(result);
    setCurrentPage(1); // Volver a pág 1 al filtrar
    setSelectedIds(new Set()); // Limpiar selección al filtrar
  }, [searchTerm, filterCategory, filterStock, sortBy, allProductos, categoriasMap]);

  useEffect(() => {
    if (!isCategoryDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryDropdownOpen]);

  // --- Paginación Lógica ---
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProductos.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- SELECCIÓN ---
  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    checked ? newSelected.add(id) : newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentProducts.map(p => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const isAllSelected = currentProducts.length > 0 && currentProducts.every(p => selectedIds.has(p.id));

  // --- CRUD OPERATIONS WRAPPERS ---
  const refreshLocalData = (updatedProduct: ProductoProps) => {
    setAllProductos(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const addToLocalData = (newP: ProductoProps) => {
    setAllProductos(prev => [newP, ...prev]);
  };

  const removeFromLocalData = (id: string) => {
    setAllProductos(prev => prev.filter(p => p.id !== id));
  };

  // --- ACTIONS ---
  const handleBulkUpdate = async (payload: BulkActionPayload) => {
    try {
      const { type, value, operation } = payload;

      const promises = Array.from(selectedIds).map(async (id) => {
        if (type === "price") {
          await productService.update(id, { price: Number(value) });
        } else if (type === "category") {
          await productService.update(id, { category: String(value) });
        } else if (type === "stock") {
          const p = allProductos.find(prod => prod.id === id);
          if (!p) return;
          let newStock = p.stock;
          const val = Number(value);
          if (operation === "set") newStock = val;
          if (operation === "add") newStock = p.stock + val;
          if (operation === "subtract") newStock = p.stock - val;
          
          await productService.updateStock(id, newStock);
        } else if (type === "delete") {
          await productService.delete(id);
        }
      });

      await Promise.all(promises);

      // Refresh Data (simplest way to ensure consistency, though less efficient than local map)
      if (type === "delete") {
        setAllProductos(prev => prev.filter(p => !selectedIds.has(p.id)));
      } else {
        setAllProductos(prev => prev.map(p => {
          if (!selectedIds.has(p.id)) return p;
          if (type === "price") return { ...p, price: Number(value) };
          if (type === "category") return { ...p, category: String(value) };
          if (type === "stock") {
            let newStock = p.stock;
            const val = Number(value);
            if (operation === "set") newStock = val;
            else if (operation === "add") newStock = p.stock + val;
            else if (operation === "subtract") newStock = p.stock - val;
            return { ...p, stock: newStock };
          }
          return p;
        }));
      }

      showMessage("Operación completada", `Operación masiva exitosa en ${selectedIds.size} productos`, "success");
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
      showMessage("Error", "Error en operación masiva", "error");
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate title
    const duplicate = allProductos.find(p => p.title.toLowerCase() === newProduct.title.toLowerCase());
    
    if (duplicate) {
      showConfirm(
        "Producto duplicado",
        `Ya existe un producto llamado "${newProduct.title}". ¿Estás seguro de que quieres agregarlo de nuevo?`,
        () => { void executeAddProduct(); }
      );
    } else {
      void executeAddProduct();
    }
  };

  const executeAddProduct = async () => {
    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        name: newProduct.title, 
        title: newProduct.title,
      };

      const result = await productService.add(payload);
      
      if (result.success && result.id) {
          addToLocalData({ ...payload, id: result.id, Barcode: payload.Barcode } as ProductoProps);
          showMessage("Producto agregado", "El producto se agregó correctamente.", "success");
          setShowProductForm(false);
          setNewProduct({ title: "", price: "", category: "", stock: "", Barcode: "" });
      } else {
        showMessage("Error", "Error al agregar producto: " + result.error, "error");
      }
    } catch (error) {
       console.error(error);
      showMessage("Error", "Error al agregar producto", "error");
    }
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.id) return;
    try {
      const payload = {
        title: editingProduct.title,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        stock: Number(editingProduct.stock),
        Barcode: editingProduct.Barcode,
      };
      
      await productService.update(editingProduct.id, payload);

      refreshLocalData({ ...editingProduct, ...payload });
      showMessage("Producto actualizado", "Los cambios se guardaron correctamente.", "success");
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      showMessage("Error", "Error al actualizar", "error");
    }
  };

  const executeDeleteProduct = async (id: string) => {
    try {
      await productService.delete(id);
      removeFromLocalData(id);
      showMessage("Producto eliminado", "El producto se eliminó correctamente.", "success");
    } catch (error) {
      console.error(error);
      showMessage("Error", "Error al eliminar", "error");
    }
  };

  const handleDeleteProduct = (id: string) => {
    showConfirm("Eliminar producto", "¿Estás seguro de eliminar este producto?", () => {
      void executeDeleteProduct(id);
    });
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    
    // Verification: Check if category already exists
    const exists = Object.values(categoriasMap).some(
      name => name.toLowerCase() === newCategory.name.toLowerCase()
    );

    if (exists) {
      showMessage(
        "Categoría existente", 
        `La categoría "${newCategory.name}" ya existe. Por favor, usa un nombre diferente.`, 
        "warning"
      );
      return;
    }

    try {
      const result = await categoryService.add(newCategory);
      if (result.success && result.id) {
          setCategoriasMap(prev => ({ ...prev, [result.id!]: newCategory.name }));
          showMessage("Categoría creada", "La categoría se creó correctamente.", "success");
          setShowCategoryForm(false);
          setNewCategory({ name: "" });
      } else {
        showMessage("Error", "Error creando categoría: " + result.error, "error");
      }
    } catch (error) {
      showMessage("Error", "Error creando categoría", "error");
    }
  };

  const executeDeleteCategory = async () => {
    if (!filterCategory) return;

    try {
      await categoryService.delete(filterCategory);

      // Update local state
      const newMap = { ...categoriasMap };
      delete newMap[filterCategory];
      setCategoriasMap(newMap);

      // Reset filter
      setFilterCategory("");

      showMessage("Categoría eliminada", "La categoría se eliminó correctamente.", "success");
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      showMessage("Error", "Error al eliminar categoría", "error");
    }
  };

  const handleDeleteCategory = () => {
    if (!filterCategory) return;
    showConfirm(
      "Eliminar categoría",
      `¿Estás seguro de eliminar la categoría "${categoriasMap[filterCategory]}"? Esta acción no se puede deshacer.`,
      () => {
        void executeDeleteCategory();
      }
    );
  };

  const sortedCategoryEntries = Object.entries(categoriasMap).sort((a, b) =>
    a[1].localeCompare(b[1], "es", { sensitivity: "base" })
  );

  const filteredCategoryEntries = sortedCategoryEntries.filter(([id, name]) => {
    const term = categorySearchTerm.trim().toLowerCase();
    if (!term) return true;
    return name.toLowerCase().includes(term) || id === filterCategory;
  });

  return (
    <div className="w-full">
      <Loading loading={loading} />

      {/* --- PANEL DE CONTROL Y FILTROS --- */}
      <div className="bg-card border border-border p-5 rounded-2xl mb-6 shadow-sm flex flex-col gap-4">

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">
              Total Productos: <span className="text-primary">{filteredProductos.length}</span>
            </h2>
            <button
              onClick={() => startTutorial('specific')}
              className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
              title="Ver ayuda de inventario"
            >
              <FaQuestionCircle />
              <span>Tutorial</span>
            </button>
          </div>

          {/* Botones Acciones Generales */}
          <div className="flex gap-2 w-full md:w-auto">
            {login && (
              <>
                <button id="btn-add-product" onClick={() => setShowProductForm(true)} className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-lg font-bold shadow-md transition-all text-sm flex-1 md:flex-none whitespace-nowrap">
                  + Producto
                </button>
                <button id="btn-add-category" onClick={() => setShowCategoryForm(true)} className="bg-secondary text-foreground hover:bg-secondary/80 border border-border px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm flex-1 md:flex-none whitespace-nowrap">
                  + Categoría
                </button>
              </>
            )}
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

          <div id="search-input" className="md:col-span-5 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 2. Filtro Categoría */}
          <div className="md:col-span-3 flex gap-2">
            <div ref={categoryDropdownRef} className="relative w-full">
              <button
                id="filter-category"
                type="button"
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className={`w-full h-full ${filterCategory ? 'pr-10' : 'pr-6'} pl-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none cursor-pointer text-foreground transition-all text-left`}
                aria-haspopup="listbox"
                aria-expanded={isCategoryDropdownOpen}
              >
                {filterCategory === "none" ? "Sin Categoría" : (filterCategory ? categoriasMap[filterCategory] || "Todas las Categorías" : "Todas las Categorías")}
              </button>
              {filterCategory && (
                <button
                  type="button"
                  onClick={() => setFilterCategory("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Quitar filtro de categoría"
                >
                  <FaTimes />
                </button>
              )}

              {isCategoryDropdownOpen && (
                <div className="absolute z-30 mt-2 w-full rounded-xl border border-border bg-card shadow-xl p-2">
                  <div className="relative mb-2">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <input
                      type="text"
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      placeholder="Buscar categoría..."
                      className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                    />
                  </div>

                  <ul className="max-h-56 overflow-auto" role="listbox" aria-label="Categorías">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCategory("");
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!filterCategory ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                      >
                        Todas las Categorías
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCategory("none");
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${filterCategory === "none" ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                      >
                        Sin Categoría
                      </button>
                    </li>
                    {filteredCategoryEntries.map(([id, name]) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterCategory(id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${filterCategory === id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                    {filteredCategoryEntries.length === 0 && (
                      <li className="px-3 py-2 text-sm text-muted-foreground">No se encontraron categorías</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            {login && filterCategory && (
              <button
                onClick={handleDeleteCategory}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-3 rounded-xl transition-colors shrink-0"
                title="Eliminar categoría de la base de datos"
              >
                <FaTrash />
              </button>
            )}
          </div>

          <div className="md:col-span-2">
            <select
              id="filter-stock"
              className={`w-full pl-4 pr-6 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none font-medium
                        ${filterStock === 'bajo' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  filterStock === 'sin' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-input text-foreground'}
                    `}
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
            >
              <option value="todos">Stock: Todos</option>
              <option value="bajo">Stock Bajo (1-5)</option>
              <option value="sin">Sin Stock (0)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              id="sort-products"
              className="w-full pl-4 pr-6 py-3 border border-border rounded-xl bg-input text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Orden: Predeterminado</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="stock-asc">Stock: Menor a Mayor</option>
              <option value="stock-desc">Stock: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div id="inventory-table" className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                {login && (
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                )}
                <th className="p-4 font-semibold">Barcode</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Precio</th>
                <th className="p-4 font-semibold">Categoría</th>
                <th className="p-4 font-semibold text-center">Stock</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground text-sm">
              {currentProducts.map((product) => (
                <Producto
                  key={product.id}
                  {...product}
                  categoryName={categoriasMap[product.category] || "Sin Categoría"}
                  isSelected={selectedIds.has(product.id)}
                  onSelect={(checked) => handleSelectProduct(product.id, checked)}
                  onEdit={() => setEditingProduct(product)}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              ))}
              {currentProducts.length === 0 && (
                <tr>
                  <td colSpan={login ? 7 : 6} className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center w-full">
                    <FaSearch className="text-4xl mb-2" />
                    <p>No se encontraron productos con esos filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex justify-center mb-24">
        <Pagination productsPerPage={productsPerPage} totalProducts={filteredProductos.length} currentPage={currentPage} paginate={paginate} />
      </div>

      {/* --- FLOATING TOOLBAR --- */}
      {selectedIds.size > 0 && login && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-slide-up border border-border/20">
          <span className="font-bold whitespace-nowrap">{selectedIds.size} seleccionados</span>
          <div className="h-6 w-px bg-background/20"></div>
          <button
            onClick={() => setShowBulkUpdateModal(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm whitespace-nowrap flex items-center gap-2"
          >
            <FaCogs /> Gestionar
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm opacity-70 hover:opacity-100 hover:text-red-400 transition-colors"
          >
            <FaTimes className="inline mr-1" /> Cancelar
          </button>
        </div>
      )}

      {/* --- MODALES --- */}

      {/* Bulk Update */}
      {showBulkUpdateModal && (
        <BulkUpdateModal
          count={selectedIds.size}
          categories={categoriasMap}
          onClose={() => setShowBulkUpdateModal(false)}
          onConfirm={handleBulkUpdate}
        />
      )}

      {/* Agregar Producto */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <form onSubmit={handleAddProduct} className="bg-card border border-border p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold">Nuevo Producto</h2>
            <input type="text" placeholder="Título" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-bold mb-1 block">Precio</span>
                <input 
                  type="number" 
                  placeholder="Precio" 
                  className="w-full p-3 border border-border rounded-xl bg-input text-foreground" 
                  value={newProduct.price} 
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value === "" ? "" : Number(e.target.value) })} 
                  required={categoriasMap[newProduct.category] !== "Variables"} 
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold mb-1 block">Stock</span>
                <input type="number" placeholder="Stock" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value === "" ? "" : Number(e.target.value) })} required />
              </label>
            </div>
            <select className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} required >
              <option value="">Seleccionar categoría</option>
              {sortedCategoryEntries.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <label>
              Codigo de Barras
              <input type="text" placeholder="Código de Barras" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={newProduct.Barcode} onChange={(e) => setNewProduct({ ...newProduct, Barcode: e.target.value })} />
            </label>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setShowProductForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Agregar Categoría */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <form onSubmit={handleAddCategory} className="bg-card border border-border p-6 rounded-2xl shadow-xl w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold">Nueva Categoría</h2>
            <label>
              Nombre
              <input type="text" placeholder="Nombre" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} required />
            </label>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setShowCategoryForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <form onSubmit={handleUpdateProduct} className="bg-card border border-border p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold">Editar Producto</h2>
            <label>
              Título
              <input type="text" placeholder="Título" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={editingProduct.title} onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })} required />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-bold mb-1 block">Precio</span>
                <input 
                  type="number" 
                  placeholder="Precio" 
                  className="w-full p-3 border border-border rounded-xl bg-input text-foreground" 
                  value={editingProduct.price} 
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} 
                  required={categoriasMap[editingProduct.category] !== "Variables"} 
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold mb-1 block">Stock</span>
                <input type="number" placeholder="Stock" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} required />
              </label>
            </div>
            <label>
              Categoría
              <select className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} required >
                <option value="">Seleccionar categoría</option>
                {sortedCategoryEntries.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label>
              Codigo de Barras
              <input type="text" placeholder="Código de Barras" className="w-full p-3 border border-border rounded-xl bg-input text-foreground" value={editingProduct.Barcode} onChange={(e) => setEditingProduct({ ...editingProduct, Barcode: e.target.value })} />
            </label>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg">Actualizar</button>
            </div>
          </form>
        </div>
      )}

      <CustomAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
    </div>
  );
};

export default Tabla;