import { useSidebar } from "../Context/SidebarContext";

export default function GraffitiBackground() {
  const { isCollapsed } = useSidebar();

  return (
    <div 
      className={`fixed top-0 bottom-0 right-0 pointer-events-none z-[0] overflow-hidden hidden dark:block transition-all duration-300 ease-in-out left-0 ${isCollapsed ? "lg:left-20" : "lg:left-60"}`}
    >
      {/* 
        Graffiti 1: Margen inferior izquierdo del fondo principal.
        Posicionado dinámicamente con el sidebar (ahora el contenedor empieza donde termina el NavBar).
      */}
      <div 
        className="absolute bottom-0 left-0 w-[24rem] h-[24rem] opacity-70 mix-blend-screen"
        style={{
          backgroundImage: "url('/graffiti1.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom left',
          filter: 'drop-shadow(0 0 15px rgba(255, 115, 0, 0.3))' // FF7300
        }}
      />

      {/* 
        Graffiti 2: Margen inferior derecho del fondo principal.
      */}
      <div 
        className="absolute bottom-0 right-0 w-[24rem] h-[24rem] opacity-70 mix-blend-screen"
        style={{
          backgroundImage: "url('/graffiti2.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          filter: 'drop-shadow(0 0 15px rgba(255, 115, 0, 0.3))' // FF7300
        }}
      />
    </div>
  );
}
