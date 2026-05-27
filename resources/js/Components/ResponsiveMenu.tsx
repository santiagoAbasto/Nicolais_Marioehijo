import { useState, useEffect, useCallback } from 'react';

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

interface ResponsiveMenuProps {
  items: MenuItem[];
  logo?: React.ReactNode;
  cta?: {
    label: string;
    href: string;
  };
  transparentHeader?: boolean;
  currentPath?: string;
}

export default function ResponsiveMenu({
  items,
  logo,
  cta,
  transparentHeader = false,
  currentPath = '/',
}: ResponsiveMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Detect scroll to adjust header style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
    setActiveSubmenu(null);
  }, []);

  const toggleSubmenu = useCallback((label: string) => {
    setActiveSubmenu((prev) => (prev === label ? null : label));
  }, []);

  const isLightBackground = !transparentHeader || isScrolled;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
          --menu-font: 'Plus Jakarta Sans', sans-serif;
          --menu-dark: #0f172a;
          --menu-light: #ffffff;
          --menu-accent: #2563eb;
          --menu-accent-hover: #1d4ed8;
          --menu-transition: 300ms cubic-bezier(0.4, 0, 0.2, 1);
          --menu-backdrop: rgba(15, 23, 42, 0.6);
        }

        .menu-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: background-color var(--menu-transition),
                      backdrop-filter var(--menu-transition),
                      box-shadow var(--menu-transition);
        }

        .menu-header.scrolled {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .menu-header.transparent {
          background-color: transparent;
        }

        .menu-header.transparent.scrolled {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .menu-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .menu-logo {
          font-family: var(--menu-font);
          font-weight: 700;
          font-size: 1.5rem;
          text-decoration: none;
          transition: opacity 200ms ease;
        }

        .menu-logo:hover {
          opacity: 0.8;
        }

        .menu-logo.light {
          color: var(--menu-light);
        }

        .menu-logo.dark {
          color: var(--menu-dark);
        }

        .menu-desktop-nav {
          display: none;
          align-items: center;
          gap: 0.25rem;
        }

        @media (min-width: 1024px) {
          .menu-desktop-nav {
            display: flex;
          }
        }

        .menu-desktop-item {
          position: relative;
        }

        .menu-desktop-link {
          font-family: var(--menu-font);
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .menu-desktop-link.light {
          color: var(--menu-light);
        }

        .menu-desktop-link.dark {
          color: var(--menu-dark);
        }

        .menu-desktop-link:hover {
          background-color: rgba(37, 99, 235, 0.08);
        }

        .menu-desktop-link.light:hover {
          color: var(--menu-accent);
        }

        .menu-desktop-link.dark:hover {
          color: var(--menu-accent);
        }

        .menu-desktop-link.active {
          color: var(--menu-accent);
        }

        .menu-desktop-link svg {
          width: 1rem;
          height: 1rem;
          transition: transform 200ms ease;
        }

        .menu-desktop-item:hover .menu-desktop-link svg {
          transform: rotate(180deg);
        }

        .menu-desktop-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          min-width: 220px;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12),
                      0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 0.5rem;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 200ms ease;
        }

        .menu-desktop-item:hover .menu-desktop-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .menu-dropdown-item {
          display: block;
          font-family: var(--menu-font);
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          padding: 0.625rem 1rem;
          border-radius: 0.5rem;
          color: var(--menu-dark);
          transition: all 150ms ease;
        }

        .menu-dropdown-item:hover,
        .menu-dropdown-item.active {
          background-color: rgba(37, 99, 235, 0.08);
          color: var(--menu-accent);
        }

        .menu-desktop-actions {
          display: none;
          align-items: center;
          gap: 0.75rem;
          margin-left: 1rem;
          padding-left: 1rem;
          border-left: 1px solid rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 1024px) {
          .menu-desktop-actions {
            display: flex;
          }
        }

        .menu-cta {
          font-family: var(--menu-font);
          font-size: 0.9375rem;
          font-weight: 600;
          text-decoration: none;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          background-color: var(--menu-accent);
          color: white;
          transition: all 200ms ease;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .menu-cta:hover {
          background-color: var(--menu-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }

        .menu-cta:active {
          transform: translateY(0);
        }

        /* Hamburger Button */
        .menu-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          border-radius: 0.5rem;
          transition: background-color 200ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        @media (min-width: 1024px) {
          .menu-hamburger {
            display: none;
          }
        }

        .menu-hamburger:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .menu-hamburger.light:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .menu-hamburger:focus-visible {
          outline: 2px solid var(--menu-accent);
          outline-offset: 2px;
        }

        .menu-hamburger-icon {
          width: 1.5rem;
          height: 1.125rem;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .menu-hamburger-line {
          display: block;
          width: 100%;
          height: 2px;
          border-radius: 1px;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }

        .menu-hamburger.light .menu-hamburger-line {
          background-color: var(--menu-light);
        }

        .menu-hamburger.dark .menu-hamburger-line {
          background-color: var(--menu-dark);
        }

        .menu-hamburger.open .menu-hamburger-line:nth-child(1) {
          transform: translateY(0.4625rem) rotate(45deg);
        }

        .menu-hamburger.open .menu-hamburger-line:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }

        .menu-hamburger.open .menu-hamburger-line:nth-child(3) {
          transform: translateY(-0.4625rem) rotate(-45deg);
        }

        /* Mobile Menu Overlay */
        .menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background-color: var(--menu-backdrop);
          backdrop-filter: blur(4px);
          opacity: 0;
          visibility: hidden;
          transition: all 350ms ease;
        }

        .menu-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        /* Mobile Menu Panel */
        .menu-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 201;
          width: min(400px, 85vw);
          background: white;
          transform: translateX(100%);
          transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0, 0, 0, 0.15);
        }

        .menu-panel.open {
          transform: translateX(0);
        }

        .menu-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .menu-panel-logo {
          font-family: var(--menu-font);
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--menu-dark);
          text-decoration: none;
        }

        .menu-panel-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border: none;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 200ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .menu-panel-close:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .menu-panel-close:focus-visible {
          outline: 2px solid var(--menu-accent);
          outline-offset: 2px;
        }

        .menu-panel-close svg {
          width: 1.25rem;
          height: 1.25rem;
          color: var(--menu-dark);
        }

        .menu-panel-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
          overscroll-behavior: contain;
        }

        .menu-panel-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--menu-font);
          font-size: 1.0625rem;
          font-weight: 500;
          text-decoration: none;
          color: var(--menu-dark);
          padding: 0.875rem 1.5rem;
          margin: 0 0.75rem;
          border-radius: 0.625rem;
          transition: all 200ms ease;
          min-height: 3rem;
        }

        .menu-panel-link:hover {
          background-color: rgba(37, 99, 235, 0.06);
          color: var(--menu-accent);
        }

        .menu-panel-link.active {
          background-color: rgba(37, 99, 235, 0.1);
          color: var(--menu-accent);
          font-weight: 600;
        }

        .menu-panel-link svg {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 300ms ease;
          flex-shrink: 0;
        }

        .menu-panel-link.expanded svg {
          transform: rotate(180deg);
        }

        .menu-panel-submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 300ms cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(0, 0, 0, 0.02);
          border-radius: 0.5rem;
          margin: 0 0.75rem;
        }

        .menu-panel-submenu.open {
          max-height: 500px;
        }

        .menu-panel-submenu-item {
          display: block;
          font-family: var(--menu-font);
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          color: #475569;
          padding: 0.75rem 1.5rem 0.75rem 2.25rem;
          border-radius: 0.5rem;
          margin: 0.25rem 0.5rem;
          transition: all 200ms ease;
        }

        .menu-panel-submenu-item:hover,
        .menu-panel-submenu-item.active {
          background-color: rgba(37, 99, 235, 0.08);
          color: var(--menu-accent);
        }

        .menu-panel-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .menu-panel-cta {
          display: block;
          width: 100%;
          font-family: var(--menu-font);
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          padding: 0.875rem 1.5rem;
          border-radius: 0.625rem;
          background-color: var(--menu-accent);
          color: white;
          transition: all 200ms ease;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .menu-panel-cta:hover {
          background-color: var(--menu-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }

        .menu-panel-cta:active {
          transform: translateY(0);
        }

        .menu-panel-cta:focus-visible {
          outline: 2px solid var(--menu-accent);
          outline-offset: 2px;
        }

        /* Animation for menu items */
        @keyframes menuItemReveal {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .menu-panel.open .menu-panel-link {
          animation: menuItemReveal 300ms ease forwards;
        }

        .menu-panel.open .menu-panel-link:nth-child(1) { animation-delay: 50ms; }
        .menu-panel.open .menu-panel-link:nth-child(2) { animation-delay: 100ms; }
        .menu-panel.open .menu-panel-link:nth-child(3) { animation-delay: 150ms; }
        .menu-panel.open .menu-panel-link:nth-child(4) { animation-delay: 200ms; }
        .menu-panel.open .menu-panel-link:nth-child(5) { animation-delay: 250ms; }
        .menu-panel.open .menu-panel-link:nth-child(6) { animation-delay: 300ms; }
        .menu-panel.open .menu-panel-link:nth-child(7) { animation-delay: 350ms; }
      `}</style>

      {/* Header */}
      <header
        className={`menu-header ${transparentHeader ? 'transparent' : ''} ${isScrolled ? 'scrolled' : ''}`}
        role="banner"
      >
        <div className="menu-container">
          {/* Logo */}
          {logo || (
            <a href="/" className={`menu-logo ${isLightBackground ? 'dark' : 'light'}`}>
              TuMarca
            </a>
          )}

          {/* Desktop Navigation */}
          <nav className="menu-desktop-nav" role="navigation" aria-label="Main navigation">
            {items.map((item) => (
              <div key={item.label} className="menu-desktop-item">
                {item.children ? (
                  <>
                    <a
                      href={item.href}
                      className={`menu-desktop-link ${isLightBackground ? 'dark' : 'light'}`}
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      {item.label}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </a>
                    <div className="menu-desktop-dropdown" role="menu">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="menu-dropdown-item"
                          role="menuitem"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    className={`menu-desktop-link ${isLightBackground ? 'dark' : 'light'} ${
                      currentPath === item.href ? 'active' : ''
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTA */}
          {cta && (
            <div className="menu-desktop-actions">
              <a href={cta.href} className="menu-cta">
                {cta.label}
              </a>
            </div>
          )}

          {/* Hamburger Button */}
          <button
            className={`menu-hamburger ${isLightBackground ? 'dark' : 'light'} ${isOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="menu-hamburger-icon">
              <span className="menu-hamburger-line" />
              <span className="menu-hamburger-line" />
              <span className="menu-hamburger-line" />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`menu-overlay ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <nav
        id="mobile-menu"
        className={`menu-panel ${isOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="menu-panel-header">
          {logo || (
            <a href="/" className="menu-panel-logo">
              TuMarca
            </a>
          )}
          <button
            className="menu-panel-close"
            onClick={toggleMenu}
            aria-label="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="menu-panel-nav">
          {items.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <a
                    href={item.href}
                    className={`menu-panel-link ${
                      activeSubmenu === item.label ? 'expanded' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSubmenu(item.label);
                    }}
                    aria-expanded={activeSubmenu === item.label}
                  >
                    {item.label}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </a>
                  <div className={`menu-panel-submenu ${activeSubmenu === item.label ? 'open' : ''}`}>
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="menu-panel-submenu-item"
                        onClick={toggleMenu}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <a
                  href={item.href}
                  className={`menu-panel-link ${currentPath === item.href ? 'active' : ''}`}
                  onClick={toggleMenu}
                >
                  {item.label}
                </a>
              )}
            </div>
          ))}
        </div>

        {cta && (
          <div className="menu-panel-footer">
            <a href={cta.href} className="menu-panel-cta" onClick={toggleMenu}>
              {cta.label}
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
