import { useState, useEffect } from 'react';
import CustomerPage from './pages/CustomerPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [page, setPage] = useState<'customer' | 'admin'>('customer');

  useEffect(() => {
    const check = () => {
      setPage(window.location.hash === '#admin' ? 'admin' : 'customer');
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <img src="/logo.png" alt="Ingenio Digital" className="logo-img" />
          <p className="header-tagline">
            Bienvenido al mundo del ahorro,<br />eficiencia y sostenibilidad
          </p>
          <nav>
            {page === 'admin' ? (
              <a href="#" className="nav-link">Portal Cliente</a>
            ) : (
              <a href="#admin" className="nav-link">Panel Admin</a>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        {page === 'admin' ? <AdminPage /> : <CustomerPage />}
      </main>
    </div>
  );
}
