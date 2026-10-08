"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

type User = { id: number; name: string; email: string; role: "customer" | "admin" };
type CustomerAccount = { id: number; name: string; email: string; orders_count: number; created_at: string };
type AdminAccount = { id: number; name: string; email: string; created_at: string };
type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: string | number;
  image_url: string;
  stock: number;
  is_featured: boolean;
};
type OrderItem = { id: number; product_name: string; quantity: number; unit_price: string | number };
type Order = {
  id: number;
  order_number: string;
  contact_name: string;
  phone_number: string;
  total: string | number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: string;
  created_at: string;
  user?: { name: string; email: string };
  items: OrderItem[];
};
type CartLine = { product: Product; quantity: number };
type ProductDraft = Omit<Product, "id">;

const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
const money = (amount: number | string) =>
  `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const emptyDraft: ProductDraft = {
  name: "",
  description: "",
  category: "Tops",
  price: 0,
  image_url: "",
  stock: 0,
  is_featured: false,
};

async function api<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const activeToken = token && typeof window !== "undefined"
    ? window.localStorage.getItem("master-shop-token") || undefined
    : token;
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = body.errors ? Object.values(body.errors as Record<string, string[]>).flat()[0] : null;
    throw new Error(validation || body.message || "Something went wrong. Please try again.");
  }
  return body as T;
}

function Mark({ small = false }: { small?: boolean }) {
  return (
    <a className={`brand-mark${small ? " brand-mark-small" : ""}`} href="#" aria-label="Master Shop home">
      <span className="brand-symbol">m</span>
      <span>master<span className="brand-word-light">shop</span></span>
    </a>
  );
}

function Icon({ name }: { name: "bag" | "search" | "arrow" | "close" | "plus" | "minus" | "user" | "sparkle" | "eye" | "eyeOff" }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths = {
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 6.1A10.5 10.5 0 0 1 12 6c6.4 0 10 6 10 6a15 15 0 0 1-3.1 3.5M6.2 6.3C3.5 8.1 2 12 2 12s3.6 6 10 6a10.6 10.6 0 0 0 4-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [accountForm, setAccountForm] = useState({ name: "", email: "", password: "" });
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<"shop" | "admin" | "orders">("shop");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paymongo" | "cash">("paymongo");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await api<Product[]>("/products"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async (activeToken: string) => {
    try {
      setOrders(await api<Order[]>("/orders", activeToken));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load orders.");
    }
  }, []);

  const loadCustomers = useCallback(async (activeToken: string) => {
    try {
      setCustomers(await api<CustomerAccount[]>("/customers", activeToken));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load customer accounts.");
    }
  }, []);

  const loadAdmins = useCallback(async (activeToken: string) => {
    try {
      setAdmins(await api<AdminAccount[]>("/admins", activeToken));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load administrator accounts.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadProducts);
    let active = true;
    void (async () => {
      await Promise.resolve();
      const savedToken = window.localStorage.getItem("master-shop-token");
      const savedUser = window.localStorage.getItem("master-shop-user");
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          if (active) {
            setToken(savedToken);
            setUser(parsedUser);
            setContactName(parsedUser.name);
            void loadOrders(savedToken);
          }
        } catch {
          window.localStorage.removeItem("master-shop-token");
          window.localStorage.removeItem("master-shop-user");
        }
      }
      const params = new URLSearchParams(window.location.search);
      if (active && params.get("payment") === "success") setNotice(`Payment received for order ${params.get("order") || ""}.`);
      if (active && params.get("payment") === "cancelled") setNotice(`Checkout cancelled for order ${params.get("order") || ""}.`);
    })();
    return () => { active = false; };
  }, [loadProducts, loadOrders]);

  const categories = useMemo(() => [...new Set(["All", "New in", "Clothing", ...products.map((product) => product.category)])], [products]);
  const shownProducts = useMemo(() => products.filter((product) => {
    const inCategory = category === "All"
      || (category === "New in" ? product.is_featured : category === "Clothing" ? product.category !== "Accessories" : product.category === category);
    const query = search.trim().toLowerCase();
    return inCategory && (!query || `${product.name} ${product.category} ${product.description || ""}`.toLowerCase().includes(query));
  }), [products, category, search]);
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + Number(line.product.price) * line.quantity, 0);

  function goToCollection(nextCategory: string) {
    setActiveView("shop");
    setCategory(nextCategory);
    window.requestAnimationFrame(() => {
      document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function showHeaderSearch() {
    setActiveView("shop");
    setHeaderSearchOpen(true);
    window.requestAnimationFrame(() => document.getElementById("header-search")?.focus());
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setBusy(true);
    try {
      const result = await api<{ token: string; user: User }>(
        authMode === "signup" ? "/register" : "/login",
        undefined,
        { method: "POST", body: JSON.stringify(authForm) },
      );
      window.localStorage.setItem("master-shop-token", result.token);
      window.localStorage.setItem("master-shop-user", JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setContactName(result.user.name);
      await loadOrders(result.token);
      setNotice(`Welcome${authMode === "signup" ? " to Master Shop" : " back"}, ${result.user.name.split(" ")[0]}.`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await api("/logout", token, { method: "POST" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sign out.");
      return;
    }
    window.localStorage.removeItem("master-shop-token");
    window.localStorage.removeItem("master-shop-user");
    setToken("");
    setUser(null);
    setCart([]);
  }

  function addToCart(product: Product) {
    if (product.stock < 1) return;
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) {
        return current.map((line) => line.product.id === product.id
          ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) }
          : line);
      }
      return [...current, { product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your bag.`);
  }

  function buyNow(product: Product) {
    if (product.stock < 1) return;
    setCart([{ product, quantity: 1 }]);
    setNotice("");
    setCartOpen(true);
  }

  function changeQuantity(productId: number, amount: number) {
    setCart((current) => current
      .map((line) => line.product.id === productId
        ? { ...line, quantity: Math.min(line.product.stock, line.quantity + amount) }
        : line)
      .filter((line) => line.quantity > 0));
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api<{ order: Order; checkout_url?: string }>("/orders", token, {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
          payment_method: paymentMethod,
          contact_name: contactName,
          phone_number: phoneNumber,
          shipping_address: address,
        }),
      });
      if (result.checkout_url) {
        window.location.assign(result.checkout_url);
        return;
      }
      setCart([]);
      setCartOpen(false);
      setNotice(`Order ${result.order.order_number} placed — pay on delivery. Thank you!`);
      await Promise.all([loadProducts(), loadOrders(token)]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to place your order.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(product?: Product) {
    setEditingId(product?.id ?? null);
    setDraft(product ? {
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: Number(product.price),
      image_url: product.image_url,
      stock: product.stock,
      is_featured: product.is_featured,
    } : emptyDraft);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const savedProduct = await api<Product>(`/products${editingId ? `/${editingId}` : ""}`, token, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(draft),
      });
      setProducts((current) => editingId
        ? current.map((product) => product.id === savedProduct.id ? savedProduct : product)
        : [savedProduct, ...current]);
      startEdit();
      setNotice(editingId ? "Product updated." : "Product added to your collection.");
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthenticated.") {
        window.localStorage.removeItem("master-shop-token");
        window.localStorage.removeItem("master-shop-user");
        setToken("");
        setUser(null);
        setActiveView("shop");
        setNotice("Your admin session expired. Sign in again; your product changes were not saved.");
        return;
      }
      setNotice(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    try {
      await api(`/products/${product.id}`, token, { method: "DELETE" });
      setNotice(`${product.name} deleted.`);
      await loadProducts();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete product.");
    }
  }

  async function updateOrder(orderId: number, status: string) {
    try {
      await api(`/orders/${orderId}/status`, token, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice("Order status updated.");
      await loadOrders(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update order.");
    }
  }

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const customer = await api<Pick<CustomerAccount, "name" | "email">>("/customers", token, {
        method: "POST",
        body: JSON.stringify(accountForm),
      });
      setAccountForm({ name: "", email: "", password: "" });
      setNotice(`Customer account created for ${customer.name}.`);
      await loadCustomers(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create customer account.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCustomer(customer: CustomerAccount) {
    if (!window.confirm(`Delete the customer account for ${customer.name} (${customer.email})? Existing orders will be kept.`)) return;
    try {
      await api(`/customers/${customer.id}`, token, { method: "DELETE" });
      setNotice(`Customer account for ${customer.name} deleted. Existing orders were preserved.`);
      await Promise.all([loadCustomers(token), loadOrders(token)]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete customer account.");
    }
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const admin = await api<Pick<AdminAccount, "name" | "email">>("/admins", token, {
        method: "POST",
        body: JSON.stringify(adminForm),
      });
      setAdminForm({ name: "", email: "", password: "" });
      setNotice(`Administrator account created for ${admin.name}.`);
      await loadAdmins(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create administrator account.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <main className="gate-page">
        <div className="gate-image" />
        <header className="gate-header"><Mark /><span className="gate-header-note">A little more you, every day.</span></header>
        <section className="gate-content">
          <div className="gate-copy">
            <p className="eyebrow light-eyebrow"><span /> THE EVERYDAY IS A NEW DAY</p>
            <h1>Good things<br />feel <em>like you.</em></h1>
            <p className="gate-description">Thoughtful pieces. Softer mornings.<br />A wardrobe that just gets you.</p>
            <span className="gate-caption">MADE FOR YOUR KIND OF EVERYDAY</span>
          </div>
          <form className="auth-card" onSubmit={submitAuth}>
            <div className="auth-card-kicker"><span>YOUR LITTLE CORNER OF THE INTERNET</span><span>01 — 02</span></div>
            <p className="eyebrow">WELCOME TO MASTER SHOP</p>
            <h2>{authMode === "login" ? "Good to have you." : "Come on in."}</h2>
            <p className="auth-subtitle">{authMode === "login" ? "Sign in for the good stuff." : "Create your account. Your next favorite awaits."}</p>
            {authMode === "signup" && (
              <label className="field-label">YOUR NAME
                <input autoComplete="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="What should we call you?" required />
              </label>
            )}
            <label className="field-label">EMAIL ADDRESS
              <input type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" required />
            </label>
            <label className="field-label">PASSWORD
              <span className="password-field">
                <input type={showPassword ? "text" : "password"} autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={8} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="At least 8 characters" required />
                <button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                  <span>{showPassword ? "HIDE" : "SHOW"}</span>
                </button>
              </span>
            </label>
            {authError && <p className="form-error" role="alert">{authError}</p>}
            <button className="button button-dark auth-submit" disabled={busy}>{busy ? "ONE MOMENT…" : authMode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE MY ACCOUNT"} <Icon name="arrow" /></button>
            <p className="auth-switch">{authMode === "login" ? "New around here?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}> {authMode === "login" ? "Create an account" : "Sign in"}</button></p>
            <div className="auth-foot"><span>SECURE SIGN IN</span><span>PHILIPPINES · ₱ PHP</span></div>
          </form>
        </section>
        <footer className="gate-footer"><span> MASTERSHOP STUDIO</span><span>GOOD CLOTHES, GOOD FEELINGS.</span><span>BOHOL, PHILIPPINES</span></footer>
      </main>
    );
  }

  return (
    <main className="shop-shell">
      <div className="announcement">A LITTLE SOMETHING FOR YOU — FREE SHIPPING ON ORDERS OVER ₱2,500 <span></span></div>
      <header className="shop-header">
        <Mark />
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeView === "shop" && category === "All" ? "active" : ""} onClick={() => goToCollection("All")}>SHOP ALL</button>
          <button className={activeView === "shop" && category === "New in" ? "active" : ""} onClick={() => goToCollection("New in")}>NEW IN</button>
          <button className={activeView === "shop" && category === "Clothing" ? "active" : ""} onClick={() => goToCollection("Clothing")}>CLOTHING</button>
          <button className={activeView === "shop" && category === "Accessories" ? "active" : ""} onClick={() => goToCollection("Accessories")}>ACCESSORIES</button>
          {user.role === "admin" && <button className={activeView === "admin" ? "active" : ""} onClick={() => { setActiveView("admin"); void Promise.all([loadCustomers(token), loadAdmins(token)]); }}>ADMIN</button>}
        </nav>
        <div className="header-actions">
          <button className="icon-action search-toggle" onClick={() => headerSearchOpen ? setHeaderSearchOpen(false) : showHeaderSearch()} aria-label={headerSearchOpen ? "Close search" : "Search"} aria-expanded={headerSearchOpen}><Icon name={headerSearchOpen ? "close" : "search"} /></button>
          <button className="icon-action account-action" onClick={() => setActiveView("orders")} aria-label="My orders"><Icon name="user" /></button>
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Shopping bag with ${cartCount} items`}><Icon name="bag" /><span>BAG ({cartCount})</span></button>
          <button className="signout-button" onClick={signOut}>SIGN OUT</button>
        </div>
        {headerSearchOpen && <form className="header-search" onSubmit={(event) => { event.preventDefault(); goToCollection("All"); }} role="search">
          <Icon name="search" />
          <input id="header-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setActiveView("shop"); }} placeholder="Search the collection…" aria-label="Search the collection" />
          {search && <button className="header-search-clear" type="button" onClick={() => setSearch("")}>CLEAR</button>}
        </form>}
      </header>

      {notice && <div className="notice-bar" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><Icon name="close" /></button></div>}

      {activeView === "shop" && (
        <>
          <section className="hero">
            <div className="hero-image" />
            <div className="hero-content">
              <p className="eyebrow light-eyebrow"><span /> THE NEW EVERYDAY</p>
              <h1>Wear what<br />feels <em>like you.</em></h1>
              <p>Considered pieces for wherever<br />the day decides to take you.</p>
              <button className="hero-link" onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}>MEET YOUR NEW FAVORITES <Icon name="arrow" /></button>
            </div>
            <span className="hero-side-note">A SOFTER WAY TO GET DRESSED · EST. 2020</span>
            <div className="hero-index"><span>01</span> / 03</div>
          </section>

          <section className="intro-strip">
            <span>GOOD CLOTHES. GOOD FEELINGS.</span>
            <p>Thoughtful little things, made for real life.</p>
            <span>MADE TO BE WORN, AND WORN AGAIN <span className="asterisk">✳</span></span>
          </section>

          <section className="collection-section" id="collection">
            <div className="section-heading">
              <div><p className="eyebrow"><span /> THE GOOD STUFF</p><h2>A few things we <em>love.</em></h2></div>
              <label className="search-box"><Icon name="search" /><input id="shop-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Looking for something?" /><span>↵</span></label>
            </div>
            <div className="collection-tools">
              <div className="category-list" aria-label="Filter by category">
                {categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item === "All" ? "ALL PIECES" : item.toUpperCase()}</button>)}
              </div>
              <span className="piece-count">{shownProducts.length} LITTLE GOOD THINGS</span>
            </div>
            {loading ? <div className="empty-state">Gathering the good stuff…</div> : shownProducts.length ? (
              <div className="product-grid">
                {shownProducts.map((product, index) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image-wrap">
                      <Image src={product.image_url} alt={product.name} className="product-image" fill unoptimized sizes="(max-width: 680px) 45vw, (max-width: 900px) 30vw, 22vw" />
                      {product.is_featured && <span className="product-tag">{index % 2 === 0 ? "A GOOD ONE" : "STAFF PICK"}</span>}
                      {product.stock < 1 && <span className="sold-out-tag">SOLD OUT</span>}
                      <div className="product-actions">
                        <button className="quick-add" disabled={!product.stock} onClick={() => addToCart(product)}><span>ADD TO BAG</span><Icon name="plus" /></button>
                        <button className="quick-buy" disabled={!product.stock} onClick={() => buyNow(product)}>BUY NOW <Icon name="arrow" /></button>
                      </div>
                    </div>
                    <div className="product-meta"><div><p className="product-category">{product.category}</p><h3>{product.name}</h3></div><span className="product-price">{money(product.price)}</span></div>
                    <p className="product-description">{product.description}</p>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state">Nothing here just yet. Try another search.</div>}
          </section>
          <section className="promise-strip"><Icon name="sparkle" /><p>Made to fit real life. Easy to wear, even easier to love.</p><span>THAT’S THE MASTER SHOP PROMISE.</span></section>
        </>
      )}

      {activeView === "admin" && user.role === "admin" && (
        <section className="admin-section">
          <div className="admin-title"><div><p className="eyebrow"><span /> THE BACK ROOM</p><h1>Your shop, <em>your call.</em></h1><p>Keep the collection fresh and the orders moving.</p></div><span className="admin-badge">ADMIN MODE</span></div>
          <div className="admin-layout">
            <form className="admin-form" onSubmit={saveProduct}>
              <p className="eyebrow">{editingId ? "MAKE IT JUST RIGHT" : "SOMETHING NEW"}</p>
              <h2>{editingId ? "Edit a piece" : "Add a piece"}</h2>
              <label className="field-label">PRODUCT NAME<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={255} /></label>
              <label className="field-label">DESCRIPTION<textarea value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} /></label>
              <div className="form-row">
                <label className="field-label">CATEGORY<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required maxLength={80} /></label>
                <label className="field-label">PRICE (₱)<input type="number" step="0.01" min="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} required /></label>
              </div>
              <div className="form-row">
                <label className="field-label">STOCK<input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} required /></label>
                <label className="field-label">IMAGE URL<input type="url" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} required /></label>
              </div>
              <label className="featured-checkbox"><input type="checkbox" checked={draft.is_featured} onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })} /> Highlight this piece in the collection</label>
              <div className="admin-form-actions"><button className="button button-dark" disabled={busy}>{editingId ? "SAVE CHANGES" : "ADD TO COLLECTION"} <Icon name="arrow" /></button>{editingId && <button type="button" className="text-button" onClick={() => startEdit()}>CANCEL</button>}</div>
            </form>
            <div className="admin-products"><div className="admin-list-heading"><h2>The collection</h2><span>{products.length} pieces</span></div>
              {products.map((product) => <div className="admin-product-row" key={product.id}><Image src={product.image_url} alt="" width={43} height={52} unoptimized /><div className="admin-product-info"><strong>{product.name}</strong><span>{product.category} · {money(product.price)} · {product.stock} in stock</span></div><button className="text-button" onClick={() => { startEdit(product); window.scrollTo({ top: 0, behavior: "smooth" }); }}>EDIT</button><button className="text-button delete-button" onClick={() => void deleteProduct(product)}>DELETE</button></div>)}
            </div>
          </div>
          <section className="admin-orders"><div className="admin-list-heading"><h2>Orders coming through</h2><span>{orders.length} orders</span></div>
            {!orders.length ? <p className="empty-state">No orders yet — they will show up here.</p> : orders.map((order) => <div className="admin-order-row" key={order.id}><div><strong>{order.order_number}</strong><span>{order.contact_name} · {order.phone_number}</span><span>{order.shipping_address}</span><span>{order.items.length} items · {money(order.total)} · {order.payment_method}</span></div><select value={order.status} onChange={(event) => void updateOrder(order.id, event.target.value)} aria-label={`Status for ${order.order_number}`}><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>)}
          </section>
          <section className="admin-customers">
            <div className="admin-list-heading"><div><p className="eyebrow"><span /> CUSTOMER ACCESS</p><h2>Customer accounts</h2></div><span>{customers.length} accounts</span></div>
            <p className="admin-customers-note">Create customer logins or remove customer access. Past orders are preserved.</p>
            <div className="customer-admin-layout">
              <form className="admin-form customer-create-form" onSubmit={createCustomer}>
                <p className="eyebrow">A NEW CUSTOMER</p>
                <h2>Create an account</h2>
                <label className="field-label">FULL NAME<input autoComplete="name" value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} required maxLength={255} /></label>
                <label className="field-label">EMAIL ADDRESS<input type="email" autoComplete="email" value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} required maxLength={255} /></label>
                <label className="field-label">TEMPORARY PASSWORD<input type="password" autoComplete="new-password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} required minLength={8} /></label>
                <button className="button button-dark" disabled={busy}>CREATE CUSTOMER ACCOUNT <Icon name="arrow" /></button>
              </form>
              <div className="customer-admin-list">
                {!customers.length ? <p className="empty-state">No customer accounts to show yet.</p> : customers.map((customer) => (
                  <div className="customer-admin-row" key={customer.id}>
                    <div className="customer-avatar" aria-hidden="true">{customer.name.trim().charAt(0).toUpperCase()}</div>
                    <div className="customer-admin-info"><strong>{customer.name}</strong><span>{customer.email}</span><span>{customer.orders_count} {customer.orders_count === 1 ? "order" : "orders"} · Joined {new Date(customer.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span></div>
                    <button className="text-button delete-button" onClick={() => void deleteCustomer(customer)}>DELETE</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="admin-customers admin-admins">
            <div className="admin-list-heading"><div><p className="eyebrow"><span /> TEAM ACCESS</p><h2>Administrator accounts</h2></div><span>{admins.length} admins</span></div>
            <p className="admin-customers-note">Add trusted teammates with full administrator access. Admin accounts cannot be deleted from this screen.</p>
            <div className="customer-admin-layout">
              <form className="admin-form customer-create-form" onSubmit={createAdmin}>
                <p className="eyebrow">A NEW TEAMMATE</p>
                <h2>Create an admin account</h2>
                <label className="field-label">FULL NAME<input autoComplete="name" value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} required maxLength={255} /></label>
                <label className="field-label">EMAIL ADDRESS<input type="email" autoComplete="email" value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} required maxLength={255} /></label>
                <label className="field-label">TEMPORARY PASSWORD<input type="password" autoComplete="new-password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} required minLength={8} /></label>
                <button className="button button-dark" disabled={busy}>CREATE ADMIN ACCOUNT <Icon name="arrow" /></button>
              </form>
              <div className="customer-admin-list">
                {!admins.length ? <p className="empty-state">No administrator accounts to show yet.</p> : admins.map((admin) => (
                  <div className="customer-admin-row" key={admin.id}>
                    <div className="customer-avatar" aria-hidden="true">{admin.name.trim().charAt(0).toUpperCase()}</div>
                    <div className="customer-admin-info"><strong>{admin.name}</strong><span>{admin.email}</span><span>Administrator · Added {new Date(admin.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span></div>
                    {admin.id === user.id && <span className="current-admin-badge">YOU</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      )}

      {activeView === "orders" && (
        <section className="orders-section"><div className="admin-title"><div><p className="eyebrow"><span /> THE GOOD THINGS, EN ROUTE</p><h1>Your <em>orders.</em></h1><p>Everything you have been looking forward to.</p></div><button className="text-button" onClick={() => setActiveView("shop")}>← BACK TO THE SHOP</button></div>
          {!orders.length ? <div className="empty-state order-empty">No orders just yet. The good stuff is right this way. <button className="text-button" onClick={() => setActiveView("shop")}>SHOP THE COLLECTION →</button></div> : <div className="customer-orders">{orders.map((order) => <article className="customer-order" key={order.id}><div className="customer-order-heading"><div><p className="eyebrow">ORDER {order.order_number}</p><span>{new Date(order.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span></div><span className={`status-pill status-${order.status}`}>{order.status}</span></div><div className="customer-order-items">{order.items.map((item) => <div key={item.id}>{item.product_name} <span>× {item.quantity}</span></div>)}</div><div className="customer-order-contact"><strong>{order.contact_name}</strong><span>{order.phone_number}</span><span>{order.shipping_address}</span></div><div className="customer-order-total"><span>{order.payment_method === "cash" ? "Cash on delivery" : "Paid online"} · {order.payment_status}</span><strong>{money(order.total)}</strong></div></article>)}</div>}
        </section>
      )}

      <footer className="shop-footer"><div className="footer-top"><Mark /><p>A little more you, every day.</p><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>BACK TO THE TOP ↑</button></div><div className="footer-bottom"><span> MASTER SHOP STUDIO</span><span>GOOD CLOTHES, GOOD FEELINGS.</span><span>MADE WITH CARE IN BOHOL</span></div></footer>

      {cartOpen && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <aside className="cart-drawer" aria-label="Shopping bag">
          <div className="drawer-heading"><div><p className="eyebrow"><span /> YOUR LITTLE LINEUP</p><h2>Your bag <span>({cartCount})</span></h2></div><button className="icon-action" onClick={() => setCartOpen(false)} aria-label="Close bag"><Icon name="close" /></button></div>
          {!cart.length ? <div className="cart-empty"><div className="empty-bag"><Icon name="bag" /></div><h3>Room for something lovely.</h3><p>Your bag is having a quiet moment.</p><button className="button button-dark" onClick={() => setCartOpen(false)}>FIND YOUR FAVORITE <Icon name="arrow" /></button></div> : <>
            <div className="cart-lines">{cart.map((line) => <div className="cart-line" key={line.product.id}><Image src={line.product.image_url} alt={line.product.name} width={84} height={103} unoptimized /><div className="cart-line-details"><p className="product-category">{line.product.category}</p><h3>{line.product.name}</h3><strong>{money(line.product.price)}</strong><div className="quantity-control"><button onClick={() => changeQuantity(line.product.id, -1)} aria-label="Decrease quantity"><Icon name="minus" /></button><span>{line.quantity}</span><button onClick={() => changeQuantity(line.product.id, 1)} aria-label="Increase quantity"><Icon name="plus" /></button></div></div></div>)}</div>
            <form className="checkout-form" onSubmit={checkout}>
              <p className="field-label checkout-section-label">YOUR PERSONAL INFORMATION</p>
              <label className="field-label">FULL NAME<input type="text" autoComplete="name" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Name for your delivery" required maxLength={255} /></label>
              <label className="field-label">PHONE NUMBER<input type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9().\-\s]{7,30}" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+63 9XX XXX XXXX" required maxLength={30} /></label>
              <label className="field-label">DELIVERY ADDRESS<textarea autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House number, street, barangay, city" required rows={2} maxLength={2000} /></label>
              <p className="field-label">HOW WOULD YOU LIKE TO PAY?</p>
              <div className="payment-choices">
                <button type="button" className={paymentMethod === "paymongo" ? "payment-choice chosen" : "payment-choice"} onClick={() => setPaymentMethod("paymongo")}><span className="choice-radio" /> Pay online <small>Card · GCash · Maya</small></button>
                <button type="button" className={paymentMethod === "cash" ? "payment-choice chosen" : "payment-choice"} onClick={() => setPaymentMethod("cash")}><span className="choice-radio" /> Cash on delivery</button>
              </div>
              <div className="subtotal-row"><span>SUBTOTAL</span><strong>{money(subtotal)}</strong></div>
              <button className="button button-dark checkout-button" disabled={busy}>{busy ? "GETTING IT READY…" : paymentMethod === "paymongo" ? "CONTINUE TO SECURE PAYMENT" : "PLACE MY ORDER"} <Icon name="arrow" /></button>
              {paymentMethod === "paymongo" && <p className="payment-note">You will finish payment on PayMongo’s secure checkout.</p>}
            </form>
          </>}
        </aside>
      </div>}
    </main>
  );
}
