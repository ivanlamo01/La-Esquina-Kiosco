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
        className="absolute bottom-0 left-0 w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-100 dark:opacity-90 mix-blend-normal dark:mix-blend-screen transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti1.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom left',
          filter: 'saturate(1.5) contrast(1.25) drop-shadow(0 0 15px var(--glow-color))',
        }}
      />

      {/* 
        Graffiti 5: Margen superior izquierdo, simétrico al Graffiti 3.
      */}
      <div 
        className="absolute top-8 left-[-30px] w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-100 dark:opacity-90 mix-blend-normal dark:mix-blend-screen transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti5.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top left',
          filter: 'saturate(1.5) contrast(1.25) drop-shadow(0 0 15px var(--glow-color))',
          transform: 'rotate(-20deg)',
          transformOrigin: 'top left'
        }}
      />

      {/* 
        Graffiti 3: Margen superior derecho del fondo principal.
      */}
      <div 
        className="absolute top-0 right-4 sm:right-10 lg:right-20 w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-100 dark:opacity-90 mix-blend-normal dark:mix-blend-screen transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti3.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top right',
          filter: 'saturate(1.5) contrast(1.25) drop-shadow(0 0 15px var(--glow-color))',
        }}
      />

      {/* 
        Graffiti 2: Margen inferior derecho, más hacia el centro.
      */}
      <div 
        className="absolute bottom-0 right-4 sm:right-10 lg:right-20 w-[10rem] h-[10rem] sm:w-[15rem] sm:h-[15rem] lg:w-[24rem] lg:h-[24rem] opacity-100 dark:opacity-90 mix-blend-normal dark:mix-blend-screen transition-all duration-300"
        style={{
          backgroundImage: "url('/graffiti2.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          filter: 'saturate(1.5) contrast(1.25) drop-shadow(0 0 15px var(--glow-color))',
        }}
      />

    </div>
  );
}
