import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchPanel from './components/SearchPanel';
import LoginModal from './components/LoginModal';
import Footer from './components/Footer';
import SeoManager from './components/SeoManager';
import HomeView from './views/HomeView';
import { products as initialProducts } from './data/products';
import {
  findTransactionByInvoiceId,
  normalizeStoredProducts,
  readUserTransactions,
} from './lib/storage';
import { autoRestockProducts } from './lib/productStock';
import { hydrateCloudStateKeys, writeCloudBackedValue } from './lib/cloudState';
import { trackTrafficView } from './lib/trafficTracker';
import { getAccountBlock, isAccountBlocked } from './lib/accountBlocks';
import { upsertUserActivity } from './lib/userActivity';

const OrderView = React.lazy(() => import('./views/OrderView'));
const InvoiceView = React.lazy(() => import('./views/InvoiceView'));
const TransactionsView = React.lazy(() => import('./views/TransactionsView'));
const PageView = React.lazy(() => import('./views/PageView'));
const WalletView = React.lazy(() => import('./views/WalletView'));
const ChatWidget = React.lazy(() => import('./components/ChatWidget'));
const AdminLogin = React.lazy(() => import('./views/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./views/AdminDashboard'));

const isAdminUrl = () =>
  window.location.pathname === '/bolehnihadmin' ||
  window.location.hash === '#/bolehnihadmin';

const parseRoute = () => {
  if (isAdminUrl()) return { view: 'admin' };

  const hash = window.location.hash || '';
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'order' && segments[1]) {
    const productId = segments[1] === 'game' ? segments[2] : segments[1];
    return { view: 'order', productId: decodeURIComponent(productId || '') };
  }
  if (segments[0] === 'invoice' && segments[1]) {
    return { view: 'invoice', invoiceId: decodeURIComponent(segments[1]) };
  }
  if (segments[0] === 'transactions') return { view: 'transactions' };
  if (segments[0] === 'wallet') return { view: 'wallet' };
  if (segments[0] === 'blog') return { view: 'page', page: 'blog' };
  if (segments[0] === 'page') {
    const allowedPages = ['privacy', 'terms', 'disclaimer'];
    const page = decodeURIComponent(segments[1] || 'privacy');
    return { view: 'page', page: allowedPages.includes(page) ? page : 'privacy' };
  }

  if (hash.startsWith('#/order/game/')) {
    return { view: 'order', productId: decodeURIComponent(hash.replace('#/order/game/', '')) };
  }
  if (hash.startsWith('#/order/')) {
    return { view: 'order', productId: decodeURIComponent(hash.replace('#/order/', '')) };
  }
  if (hash.startsWith('#/invoice/')) {
    return { view: 'invoice', invoiceId: decodeURIComponent(hash.replace('#/invoice/', '')) };
  }
  if (hash === '#/transactions') {
    return { view: 'transactions' };
  }
  if (hash === '#/wallet') {
    return { view: 'wallet' };
  }
  if (hash === '#/blog') {
    return { view: 'page', page: 'blog' };
  }
  if (hash.startsWith('#/page/')) {
    const page = decodeURIComponent(hash.replace('#/page/', ''));
    const allowedPages = ['privacy', 'terms', 'disclaimer'];
    return { view: 'page', page: allowedPages.includes(page) ? page : 'privacy' };
  }
  return { view: 'home' };
};

const routePath = (view, data) => {
  if (view === 'order' && data) return `/order/${encodeURIComponent(data)}`;
  if (view === 'invoice' && data?.invoiceId) return `/invoice/${encodeURIComponent(data.invoiceId)}`;
  if (view === 'transactions') return '/transactions';
  if (view === 'wallet') return '/wallet';
  if (view === 'page') return data === 'blog' ? '/blog' : `/page/${encodeURIComponent(data || 'privacy')}`;
  return '/';
};

const pushCleanRoute = (view, data) => {
  const nextPath = routePath(view, data);
  if (`${window.location.pathname}${window.location.search}` !== nextPath || window.location.hash) {
    window.history.pushState({}, '', nextPath);
  }
};

function App() {
  const [initialRoute] = useState(parseRoute);
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [activeProductId, setActiveProductId] = useState(initialRoute.productId || null);
  const [activePage, setActivePage] = useState(initialRoute.page || null);
  const [invoiceData, setInvoiceData] = useState(() => (
    initialRoute.invoiceId ? findTransactionByInvoiceId(initialRoute.invoiceId) : null
  ));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [adminChecking, setAdminChecking] = useState(() => initialRoute.view === 'admin');
  const [blockedNotice, setBlockedNotice] = useState('');

  const [products, setProducts] = useState(() => {
    const normalizedProducts = normalizeStoredProducts(localStorage.getItem('wartop_products'), initialProducts);
    const restocked = autoRestockProducts(normalizedProducts);
    return restocked.products;
  });

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.status === 403 && data.blocked) {
          setBlockedNotice(data.error || 'Akun ini sedang dibatasi oleh admin.');
          setUser(null);
        } else if (response.ok && data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setSessionChecking(false);
        const url = new URL(window.location.href);
        if (url.searchParams.has('auth') || url.searchParams.has('authError')) {
          url.searchParams.delete('auth');
          url.searchParams.delete('authError');
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        }
      }
    };
    loadSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.email) return undefined;

    const enforceAccountBlock = () => {
      if (!isAccountBlocked(user.email)) return;
      const block = getAccountBlock(user.email);
      setBlockedNotice(block?.reason || 'Akun ini sedang dibatasi oleh admin.');
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
      setUser(null);
      setCurrentView('home');
      pushCleanRoute('home');
    };

    enforceAccountBlock();
    window.addEventListener('storage', enforceAccountBlock);
    window.addEventListener('wartop:cloud-state-updated', enforceAccountBlock);
    window.addEventListener('wartop:blocked-users-updated', enforceAccountBlock);
    const timer = setInterval(async () => {
      await hydrateCloudStateKeys(['wartop_blocked_users']);
      enforceAccountBlock();
    }, 60000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', enforceAccountBlock);
      window.removeEventListener('wartop:cloud-state-updated', enforceAccountBlock);
      window.removeEventListener('wartop:blocked-users-updated', enforceAccountBlock);
    };
  }, [user]);

  useEffect(() => {
    hydrateCloudStateKeys(['wartop_products', 'wartop_blocked_users']).then((result) => {
      if (result.ok && result.hydrated > 0) {
        const normalizedProducts = normalizeStoredProducts(localStorage.getItem('wartop_products'), initialProducts);
        const restocked = autoRestockProducts(normalizedProducts);
        setProducts(restocked.products);
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.email) return undefined;
    let cancelled = false;
    const loginMarkerKey = `wartop_login_seen:${user.email}`;

    const touch = async (event = 'online') => {
      await hydrateCloudStateKeys(['wartop_users', 'wartop_blocked_users']);
      if (cancelled) return;
      upsertUserActivity(user, event);
    };

    const firstEvent = sessionStorage.getItem(loginMarkerKey) ? 'online' : 'login';
    sessionStorage.setItem(loginMarkerKey, '1');
    touch(firstEvent);

    const timer = setInterval(() => touch('online'), 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') touch('online');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  const verifyAdminSession = async () => {
    setAdminChecking(true);
    try {
      const response = await fetch('/api/admin-verify', {
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (!response.ok || !data.valid) {
        setAdminUser(null);
        return;
      }
      setAdminUser(data.admin);
    } catch {
      setAdminUser(null);
    } finally {
      setAdminChecking(false);
    }
  };

  useEffect(() => {
    const checkUrl = () => {
      const route = parseRoute();
      if (window.location.hash.startsWith('#/') && route.view !== 'home') {
        const routeData = route.view === 'order'
          ? route.productId
          : route.view === 'invoice'
            ? { invoiceId: route.invoiceId }
            : route.view === 'page'
              ? route.page
              : undefined;
        window.history.replaceState({}, '', routePath(route.view, routeData));
      }

      if (route.view === 'admin') {
        setCurrentView('admin');
        verifyAdminSession();
        return;
      }

      if (['transactions', 'wallet'].includes(route.view)) {
        if (sessionChecking) return;
        if (!user) {
          setCurrentView('home');
          setIsLoginOpen(true);
          pushCleanRoute('home');
          return;
        }
        setCurrentView(route.view);
        return;
      }

      if (route.view === 'order') {
        setActiveProductId(route.productId);
        setCurrentView('order');
        return;
      }

      if (route.view === 'invoice') {
        const cachedInvoice = findTransactionByInvoiceId(route.invoiceId);
        setInvoiceData(cachedInvoice);
        if (!cachedInvoice) {
          hydrateCloudStateKeys(['wartop_transaction_deletions', 'wartop_transactions']).then(() => {
            setInvoiceData(findTransactionByInvoiceId(route.invoiceId));
          });
        }
        setCurrentView('invoice');
        return;
      }

      if (route.view === 'page') {
        setActivePage(route.page);
        setCurrentView('page');
        return;
      }

      setCurrentView('home');
      setActiveProductId(null);
      setActivePage(null);
      setInvoiceData(null);
    };

    checkUrl();
    window.addEventListener('hashchange', checkUrl);
    window.addEventListener('popstate', checkUrl);
    return () => {
      window.removeEventListener('hashchange', checkUrl);
      window.removeEventListener('popstate', checkUrl);
    };
  }, [user, sessionChecking]);

  useEffect(() => {
    trackTrafficView();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') trackTrafficView();
    };

    window.addEventListener('hashchange', trackTrafficView);
    window.addEventListener('popstate', trackTrafficView);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('hashchange', trackTrafficView);
      window.removeEventListener('popstate', trackTrafficView);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleLogout = async () => {
    if (user?.email) {
      upsertUserActivity(user, 'logout');
      sessionStorage.removeItem(`wartop_login_seen:${user.email}`);
    }
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    setUser(null);
  };

  const handleMemberAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);
    setBlockedNotice('');
    setSessionChecking(false);
  };

  const handleAdminLogin = (admin) => {
    setAdminUser(admin);
    setAdminChecking(false);
  };

  const handleAdminLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    setAdminUser(null);
    setCurrentView('home');
    window.location.href = '/';
  };

  const handleUpdateProducts = (newProducts, options = {}) => {
    const restocked = autoRestockProducts(newProducts);
    setProducts(restocked.products);
    if (options.persist) {
      writeCloudBackedValue('wartop_products', restocked.products);
    } else {
      localStorage.setItem('wartop_products', JSON.stringify(restocked.products));
    }
  };

  useEffect(() => {
    const runAutoRestock = () => {
      setProducts((currentProducts) => {
        const restocked = autoRestockProducts(currentProducts);
        if (restocked.changed > 0) {
          localStorage.setItem('wartop_products', JSON.stringify(restocked.products));
          return restocked.products;
        }
        return currentProducts;
      });
    };

    runAutoRestock();
    const timer = setInterval(runAutoRestock, 120 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigate = (view, data) => {
    if (view === 'home') {
      setCurrentView('home');
      setActiveProductId(null);
      setActivePage(null);
      setInvoiceData(null);
      pushCleanRoute('home');
    } else if (view === 'order') {
      if (!data) {
        setCurrentView('home');
        pushCleanRoute('home');
        return;
      }
      setCurrentView('order');
      setActiveProductId(data);
      pushCleanRoute('order', data);
    } else if (view === 'invoice') {
      if (!data?.invoiceId) {
        setCurrentView('home');
        pushCleanRoute('home');
        return;
      }
      setCurrentView('invoice');
      setInvoiceData(data);
      pushCleanRoute('invoice', data);
    } else if (view === 'transactions') {
      if (!user) {
        setIsLoginOpen(true);
        return;
      }
      setCurrentView('transactions');
      pushCleanRoute('transactions');
    } else if (view === 'wallet') {
      if (!user) {
        setIsLoginOpen(true);
        return;
      }
      setCurrentView('wallet');
      pushCleanRoute('wallet');
    } else if (view === 'page') {
      setActivePage(data);
      setCurrentView('page');
      pushCleanRoute('page', data);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId) => handleNavigate('order', productId);

  if (sessionChecking && ['transactions', 'wallet'].includes(currentView)) {
    return (
      <div className="main main-surface d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-success fw-bold">Memverifikasi sesi...</div>
      </div>
    );
  }

  if (currentView === 'admin') {
    if (adminChecking) {
      return (
        <div className="main main-surface d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
          <div className="text-success fw-bold">Memverifikasi sesi admin...</div>
        </div>
      );
    }

    if (!adminUser) {
      return (
        <React.Suspense fallback={<div className="main main-surface d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}><div className="text-success fw-bold">Memuat admin...</div></div>}>
          <AdminLogin onLogin={handleAdminLogin} />
        </React.Suspense>
      );
    }

    return (
      <React.Suspense fallback={<div className="main main-surface d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}><div className="text-success fw-bold">Memuat dashboard admin...</div></div>}>
        <AdminDashboard
          products={products}
          onUpdateProducts={(nextProducts) => handleUpdateProducts(nextProducts, { persist: true })}
          adminUser={adminUser}
          onLogout={handleAdminLogout}
          onNavigate={handleNavigate}
        />
      </React.Suspense>
    );
  }

  return (
    <>
      <Header
        currentView={currentView}
        onSearchOpen={() => setIsSearchOpen(true)}
        isSearchOpen={isSearchOpen}
        onLoginOpen={() => setIsLoginOpen(true)}
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />

      <SeoManager
        currentView={currentView}
        activeProductId={activeProductId}
        activePage={activePage}
        products={products}
      />

      <SearchPanel
        isOpen={isSearchOpen}
        products={products}
        onSelectProduct={(id) => {
          setIsSearchOpen(false);
          handleSelectProduct(id);
        }}
        onClose={() => setIsSearchOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onAuthenticated={handleMemberAuthenticated}
      />

      {blockedNotice && (
        <div className="account-block-notice" role="alert">
          <div>
            <strong>Akun dibatasi</strong>
            <span>{blockedNotice}</span>
          </div>
          <button type="button" onClick={() => setBlockedNotice('')} aria-label="Tutup notifikasi">
            ×
          </button>
        </div>
      )}

      <main id="main-content">
        {currentView === 'home' && (
          <HomeView products={products} onSelectProduct={handleSelectProduct} onNavigate={handleNavigate} />
        )}
        {currentView !== 'home' && (
          <React.Suspense fallback={<div className="main main-surface py-5 text-center text-success fw-bold">Memuat halaman...</div>}>
            {currentView === 'order' && (
              <OrderView
                productId={activeProductId}
                products={products}
                onNavigate={handleNavigate}
                user={user}
                onLoginOpen={() => setIsLoginOpen(true)}
                onUpdateProducts={handleUpdateProducts}
              />
            )}
            {currentView === 'invoice' && (
              <InvoiceView
                invoiceData={invoiceData}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'transactions' && (
              <TransactionsView
                user={user}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'wallet' && (
              <WalletView
                user={user}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'page' && (
              <PageView
                page={activePage}
                onNavigate={handleNavigate}
              />
            )}
          </React.Suspense>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <React.Suspense fallback={null}>
        <ChatWidget
          products={products}
          user={user}
          transactions={readUserTransactions(user)}
        />
      </React.Suspense>
    </>
  );
}

export default App;
