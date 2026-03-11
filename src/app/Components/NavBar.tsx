"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "../Context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../Context/SidebarContext";
import { useTutorial } from "../Context/TutorialContext";
import ThemeToggle from "./ThemeToggle";
import { ACTIVE_MODULES } from "../../config/features";
import {
  FaHome,
  FaBoxOpen,
  FaShoppingCart,
  FaUsers,
  FaUserFriends,
  FaChartLine,
  FaFileInvoiceDollar,
  FaFileInvoice,
  FaChartPie,
  FaSignInAlt,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaQuestionCircle,
  FaUserCircle,
  FaUserCog,
  FaCaretDown
} from "react-icons/fa";

const NavBar: React.FC = () => {
  const { login, handleLogout, user } = useAuthContext();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { startTutorial } = useTutorial();
  const [mounted, setMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* --- MOBILE HEADER (Visible only on lg:hidden) --- */}
      {/* --- MOBILE MENU BUTTON (Floating) --- */}
      {user && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 right-4 z-50 text-white focus:outline-none p-3 rounded-full bg-primary shadow-lg hover:bg-primary/80 lg:hidden transition-all active:scale-90"
          aria-label="Abrir menú de navegación"
        >
          <FaBars className="h-6 w-6" />
        </button>
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-card border-r border-border text-muted-foreground flex flex-col shadow-xl z-40
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        w-64
        `}
      >
        {/* LOGO AREA (Desktop) */}
        <div id="sidebar-logo" className={`flex items-center justify-between lg:justify-center border-b border-border transition-all duration-300 ${isCollapsed ? "py-4" : "py-6"} px-4 lg:px-0`}>
          <img src="/logo.png" alt="Logo Kiosco" className={`w-auto drop-shadow-xl transition-all duration-300 ${isCollapsed ? "h-16" : "h-36"}`} />
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* USER INFO */}
        {login && (
          <div className="relative">
            <div
              id="sidebar-user"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex items-center p-4 border-b border-border transition-all duration-300 cursor-pointer hover:bg-muted/50 ${isCollapsed ? "justify-center" : "gap-3"}`}
            >
              <div className="bg-secondary p-2.5 rounded-full text-foreground/80">
                <FaUserCircle size={20} />
              </div>
              {!isCollapsed && (
                <>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-semibold text-foreground truncate w-24">
                      {user?.nombre || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate w-24">
                      {user?.email}
                    </p>
                  </div>
                  <FaCaretDown className={`text-muted-foreground transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`} size={12} />
                </>
              )}
            </div>

            {/* User Dropdown */}
            {userDropdownOpen && (
              <div className={`absolute z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 w-48 
                ${isCollapsed ? "left-full top-0 ml-2" : "left-4 right-4 top-full mt-2"}`}>
                <Link
                  href="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <FaUserCog className="text-primary" /> Mi Perfil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                >
                  <FaSignOutAlt /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 flex flex-col py-4 gap-1 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <NavItem id="nav-home" href="/" icon={<FaHome size={18} />} label="Home" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />

          {ACTIVE_MODULES.inventario && /* (user?.isAdmin || user?.permissions?.inventario) && */ (
            <NavItem id="nav-inventory" href="/inventario" icon={<FaBoxOpen size={18} />} label="Inventario" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.pos && /* (user?.isAdmin || user?.permissions?.cart) && */ (
            <NavItem id="nav-cart" href="/cart" icon={<FaShoppingCart size={18} />} label="Punto de Venta" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.deudores && /* (user?.isAdmin || user?.permissions?.debtors) && */ (
            <NavItem id="nav-debtors" href="/debtors" icon={<FaUsers size={18} />} label="Deudores" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.usuarios && /* (user?.isAdmin || user?.permissions?.users) && */ (
            <NavItem id="nav-users" href="/users" icon={<FaUserFriends size={18} />} label="Usuarios" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.ventas && /* (user?.isAdmin || user?.permissions?.sales) && */ (
            <NavItem id="nav-sales" href="/sales" icon={<FaFileInvoiceDollar size={18} />} label="Ventas" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.facturacion && /* (user?.isAdmin || user?.permissions?.facturacion) && */ (
            <NavItem id="nav-billing" href="/facturacion" icon={<FaFileInvoiceDollar size={18} />} label="Facturación" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.facturas && /* (user?.isAdmin || user?.permissions?.facturas) && */ (
            <NavItem href="/facturas" icon={<FaFileInvoice size={18} />} label="Facturas" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.gastos && /* (user?.isAdmin || user?.permissions?.expenses) && */ (
            <NavItem id="nav-expenses" href="/expenses" icon={<FaChartLine size={18} />} label="Gastos" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}

          {ACTIVE_MODULES.graficos && /* (user?.isAdmin || user?.permissions?.graficos) && */ (
            <NavItem id="nav-charts" href="/graficos" icon={<FaChartPie size={18} />} label="Gráficos" collapsed={isCollapsed} onClick={() => setIsMobileOpen(false)} />
          )}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-border flex flex-col gap-2 bg-card">
          {/* Menú Usuario Desktop Oculto Temporalmente */}
          {user && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center w-full p-2 rounded-xl bg-primary/90 hover:bg-primary text-white transition-all shadow-md hover:shadow-primary/40"
              title={isCollapsed ? "Expandir" : "Contraer"}
            >
              {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          )}

          <ThemeToggle collapsed={isCollapsed} />

          {/* Tutorial Button */}
          {user && (
            <button
              id="btn-tutorial"
              onClick={() => startTutorial('general')}
              className={`hidden lg:flex items-center justify-center w-full p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors ${isCollapsed ? "justify-center" : "gap-3"}`}
              title="Ver Tutorial"
            >
              <FaQuestionCircle className={isCollapsed ? "mr-0" : "mr-2 mb-0.5"} />
              {!isCollapsed && <span className="font-semibold text-sm">Tutorial</span>}
            </button>
          )}

          {login ? null : (
            <Link
              href="/login"
              className={`flex items-center gap-3 p-3 rounded-xl text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all ${isCollapsed ? "justify-center" : ""}`}
              title="Iniciar Sesión"
            >
              <FaSignInAlt size={18} />
              {!isCollapsed && <span className="font-semibold text-sm">Entrar</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

// Helper Component for Nav Items
const NavItem = ({ href, icon, label, collapsed, onClick, id }: { href: string; icon: React.ReactNode; label: string; collapsed: boolean; onClick?: () => void; id?: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      id={id}
      onClick={onClick}
      className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
                ${isActive 
                    ? "bg-secondary text-primary font-semibold sidebar-item-active shadow-sm shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover-primary"}
                ${collapsed ? "justify-center" : ""}
            `}
      title={collapsed ? label : ""}
    >
      <div className={`${isActive ? "text-primary" : "group-hover:text-primary"} transition-colors`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">
          {label}
        </span>
      )}

      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-16 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden lg:block">
          {label}
        </div>
      )}
    </Link>
  )
}

export default NavBar;
