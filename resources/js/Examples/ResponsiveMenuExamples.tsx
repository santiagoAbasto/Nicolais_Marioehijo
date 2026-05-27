import ResponsiveMenu from '@/Components/ResponsiveMenu';

// Ejemplo de uso con header transparente
export default function ExampleTransparent() {
  const menuItems = [
    { label: 'Inicio', href: '/' },
    {
      label: 'Productos',
      href: '/productos',
      children: [
        { label: 'Categorías', href: '/productos/categorias' },
        { label: 'Novedades', href: '/productos/novedades' },
        { label: 'Ofertas', href: '/productos/ofertas' },
      ],
    },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
      {/* Spacer for fixed header */}
      <div style={{ height: '4rem' }} />

      {/* Header con menú transparente */}
      <ResponsiveMenu
        items={menuItems}
        transparentHeader
        cta={{ label: 'Cotizar', href: '/contacto' }}
      />

      {/* Contenido de ejemplo */}
      <main style={{ padding: '2rem', color: 'white', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
          Header Transparente
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '600px' }}>
          El menú hamburguesa cambia a blanco sobre fondos oscuros.
          Scroll down para ver el cambio de estilo.
        </p>
      </main>
    </div>
  );
}

// Ejemplo de uso con header sólido
export function ExampleSolid() {
  const menuItems = [
    { label: 'Inicio', href: '/' },
    {
      label: 'Servicios',
      href: '/servicios',
      children: [
        { label: 'Desarrollo Web', href: '/servicios/web' },
        { label: 'Apps Móviles', href: '/servicios/moviles' },
        { label: 'Consultoría', href: '/servicios/consultoria' },
      ],
    },
    { label: 'Precios', href: '/precios' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header con fondo sólido */}
      <ResponsiveMenu
        items={menuItems}
        transparentHeader={false}
        cta={{ label: 'Comenzar', href: '/registro' }}
      />

      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Header Sólido
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#475569', lineHeight: 1.7 }}>
          El menú hamburguesa cambia a negro sobre fondos claros.
          Accesible y fácil de ver.
        </p>
      </main>
    </div>
  );
}
