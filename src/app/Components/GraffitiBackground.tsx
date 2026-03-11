import { useSidebar } from "../Context/SidebarContext";

export default function GraffitiBackground() {
  const { isCollapsed } = useSidebar();

  return (
    <div 
      className={`fixed top-0 bottom-0 right-0 pointer-events-none z-[0] overflow-hidden transition-all duration-300 ease-in-out left-0 ${isCollapsed ? "lg:left-20" : "lg:left-60"}`}
    >
      {/* 
        Graffiti 1: Margen inferior izquierdo del fondo principal.
        Posicionado dinámicamente con el sidebar (ahora el contenedor empieza donde termina el NavBar).
      */}
      <div 
        className="absolute bottom-0 left-0 w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-60 sm:opacity-90 dark:opacity-40 dark:sm:opacity-70 mix-blend-normal dark:mix-blend-screen drop-shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_15px_rgba(255,115,0,0.3)] transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti1.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom left',
        }}
      />

      {/* 
        Graffiti 3: Margen superior derecho del fondo principal.
      */}
      <div 
        className="absolute top-0 right-4 sm:right-10 lg:right-20 w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-60 sm:opacity-90 dark:opacity-40 dark:sm:opacity-70 mix-blend-normal dark:mix-blend-screen drop-shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_15px_rgba(255,115,0,0.3)] transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti3.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top right',
        }}
      />

      {/* 
        Graffiti 2: Margen inferior derecho, más hacia el centro.
      */}
      <div 
        className="absolute bottom-0 right-4 sm:right-10 lg:right-20 w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-60 sm:opacity-90 dark:opacity-40 dark:sm:opacity-70 mix-blend-normal dark:mix-blend-screen drop-shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_15px_rgba(255,115,0,0.3)] transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti2.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
        }}
      />

    </div>
  );
}
