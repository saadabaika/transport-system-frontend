import React, { useState, useEffect, useRef } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
    const { user, logout, isAdmin, loading, hasAccess, isFacturation } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobile(mobile);
            if (!mobile) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            document.body.style.paddingLeft = '0px';
        } else {
            document.body.style.paddingLeft = collapsed ? '0px' : '252px';
        }
        document.body.style.transition = 'padding-left 0.25s ease';
        return () => { document.body.style.paddingLeft = ''; };
    }, [collapsed, isMobile]);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    // Ajoute ce useEffect dans ton composant Navigation
    useEffect(() => {
        let startY = 0;
        // ← supprime "let isPulling = false;" c'est inutile

        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e) => {
            const endY = e.changedTouches[0].clientY;
            const diff = endY - startY;
            if (window.scrollY === 0 && diff > 80) {
                window.location.reload();
            }
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);
    // Close mobile on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navSections = [
        {
            label: null,
            items: [
                { to: '/', icon: <IconDashboard />, label: 'Dashboard', show: true },
            ]
        },
        {
            label: 'Gestion',
            items: [
                { to: '/camions', icon: <IconTruck />, label: 'Camions', show: hasAccess('camions', 'view') },
                { to: '/documents-camion', icon: <IconDoc />, label: 'Documents Camions', show: hasAccess('camions', 'view') }, { to: '/destinations', icon: <IconPin />, label: 'Destinations', show: hasAccess('destinations', 'view') },
                { to: '/employes', icon: <IconUsers />, label: 'Employés', show: hasAccess('employes', 'view') },
                { to: '/clients', icon: <IconBuilding />, label: 'Clients', show: hasAccess('clients', 'view') },
                { to: '/transporteurs-externes', icon: <IconTruckFront />, label: 'Transporteurs', show: hasAccess('transporteurs', 'view') },
            ]
        },
        {
            label: 'Opérations',
            items: [
                { to: '/trajets', icon: <IconMap />, label: 'Trajets', show: hasAccess('trajets', 'view') },
                { to: '/frais-chauffeurs', icon: <IconCash />, label: 'Frais Chauffeurs', show: hasAccess('frais', 'view') },
            ]
        },
        {
            label: 'Financier',
            items: [
                { to: '/facturation', icon: <IconReceipt />, label: 'Facturation', show: hasAccess('factures', 'view') },
                { to: '/situation-tva', icon: <IconCalc />, label: 'Situation TVA', show: hasAccess('tva', 'view') },
                { to: '/gestion-bureau', icon: <IconOffice />, label: 'Gestion Bureau', show: true },
            ]
        },
        {
            label: 'Administration',
            show: isAdmin,
            items: [
                { to: '/gestion-utilisateurs', icon: <IconShield />, label: 'Utilisateurs', show: isAdmin },
            ]
        },
    ];

    if (loading) return null;

    const isVisible = isMobile ? mobileOpen : !collapsed;

    return (
        <>
            {/* FAB hamburger (mobile + collapsed desktop) */}
            {(!isVisible) && (
                <button
                    className="nav-fab"
                    onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(false)}
                    aria-label="Ouvrir le menu"
                >
                    <IconMenu />
                </button>
            )}

            {/* Overlay mobile */}
            {isMobile && mobileOpen && (
                <div className="nav-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`nav-sidebar ${isVisible ? 'nav-sidebar--open' : 'nav-sidebar--closed'}`}>

                {/* Header */}
                <div className="nav-header">
                    <LinkContainer to="/">
                        <a className="nav-logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                            <div className="nav-logo-mark">FT</div>
                            <div className="nav-logo-text">
                                <span className="nav-logo-name" style={{ color: '#1e293b' }}>FleetMaster</span>
                                <span className="nav-logo-sub" style={{ color: '#94a3b8' }}>Pro Edition</span>
                            </div>
                        </a>
                    </LinkContainer>
                    <button
                        className="nav-close-btn"
                        onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(true)}
                        aria-label="Fermer"
                    >
                        <IconChevronLeft />
                    </button>
                </div>

                {/* Nav items */}
                <nav className="nav-body">
                    {navSections.map((section, si) => {
                        const visibleItems = section.items.filter(i => i.show);
                        if (visibleItems.length === 0) return null;
                        if (section.show === false) return null;
                        return (
                            <div key={si} className="nav-section">
                                {section.label && (
                                    <div className="nav-section-title">{section.label}</div>
                                )}
                                {visibleItems.map((item, ii) => (
                                    <LinkContainer key={ii} to={item.to}>
                                        <a className={`nav-link-item ${isActive(item.to) ? 'active' : ''}`}>
                                            <span className="nav-link-icon">{item.icon}</span>
                                            <span className="nav-link-label">{item.label}</span>
                                        </a>
                                    </LinkContainer>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="nav-footer">
                    {user && (
                        <LinkContainer to="/mon-compte">
                            <a className="nav-user">
                                <div className="nav-user-avatar">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="nav-user-info">
                                    <span className="nav-user-name">{user.username}</span>
                                    <span className="nav-user-role">
                                        {isAdmin ? 'Administrateur' : isFacturation ? 'Facturation' : 'Employé'}
                                    </span>
                                </div>
                            </a>
                        </LinkContainer>
                    )}
                    <button className="nav-logout" onClick={logout}>
                        <IconLogout />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            <style>{`
                /* ── Reset & Variables ───────────────────── */
                :root {
                    --nav-w: 252px;
                    --nav-bg: #ffffff;
                    --nav-border: #f0f0f0;
                    --nav-text: #64748b;
                    --nav-text-strong: #1e293b;
                    --nav-accent: #2563eb;
                    --nav-active-bg: #eff6ff;
                    --nav-hover-bg: #f8fafc;
                    --nav-section-color: #94a3b8;
                    --nav-radius: 8px;
                    --nav-transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                }

                body { padding-top: 0 !important; margin: 0; background: #f8fafc; }

                /* ── Sidebar shell ───────────────────────── */
                .nav-sidebar {
                    position: fixed;
                    top: 0; left: 0;
                    height: 100vh;
                    width: var(--nav-w);
                    background: var(--nav-bg);
                    border-right: 1px solid var(--nav-border);
                    display: flex;
                    flex-direction: column;
                    z-index: 1040;
                    transition: transform var(--nav-transition);
                    box-shadow: 1px 0 0 var(--nav-border);
                }

                .nav-sidebar--open  { transform: translateX(0); }
                .nav-sidebar--closed { transform: translateX(-100%); }

                /* ── FAB open button ─────────────────────── */
                .nav-fab {
                    position: fixed;
                    top: 16px; left: 16px;
                    z-index: 1050;
                    width: 40px; height: 40px;
                    background: #fff;
                    border: 1px solid var(--nav-border);
                    border-radius: var(--nav-radius);
                    color: var(--nav-text-strong);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 1px 6px rgba(0,0,0,.08);
                    transition: box-shadow .15s, background .15s;
                    padding: 0;
                }
                .nav-fab:hover { background: #f1f5f9; box-shadow: 0 2px 10px rgba(0,0,0,.12); }

                /* ── Overlay ─────────────────────────────── */
                .nav-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15,23,42,.35);
                    z-index: 1039;
                    backdrop-filter: blur(2px);
                    animation: fadeIn .2s ease;
                }
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

                /* ── Header ──────────────────────────────── */
                .nav-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 14px;
                    height: 60px;
                    border-bottom: 1px solid var(--nav-border);
                    flex-shrink: 0;
                }

                .nav-logo {
                    display: flex; align-items: center; gap: 10px;
                    flex: 1; overflow: hidden;
                    text-decoration: none !important;
                }

                .nav-logo-mark {
                    width: 34px; height: 34px;
                    background: var(--nav-accent);
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 800;
                    color: #fff;
                    flex-shrink: 0;
                    letter-spacing: .5px;
                }

                .nav-logo-text {
                    display: flex; flex-direction: column;
                    overflow: hidden;
                }
                .nav-logo-name {
                    font-size: 13.5px; font-weight: 700;
                    color: var(--nav-text-strong);
                    white-space: nowrap; line-height: 1.2;
                }
                .nav-logo-sub {
                    font-size: 10px; color: var(--nav-section-color);
                    white-space: nowrap;
                }

                .nav-close-btn {
                    width: 28px; height: 28px;
                    background: none;
                    border: 1px solid var(--nav-border);
                    border-radius: 6px;
                    color: var(--nav-text);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    padding: 0;
                    transition: background .15s, color .15s;
                }
                .nav-close-btn:hover { background: var(--nav-hover-bg); color: var(--nav-text-strong); }

                /* ── Nav body ────────────────────────────── */
                .nav-body {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 8px 0;
                    scrollbar-width: thin;
                    scrollbar-color: #e2e8f0 transparent;
                }
                .nav-body::-webkit-scrollbar { width: 3px; }
                .nav-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

                .nav-section { padding: 0 10px; margin-bottom: 4px; }

                .nav-section-title {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .08em;
                    color: var(--nav-section-color);
                    padding: 12px 8px 4px;
                }

                .nav-link-item {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 8px 10px;
                    border-radius: var(--nav-radius);
                    color: var(--nav-text);
                    text-decoration: none !important;
                    font-size: 13.5px;
                    font-weight: 500;
                    transition: background .15s, color .15s;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .nav-link-item:hover {
                    background: var(--nav-hover-bg);
                    color: var(--nav-text-strong);
                    text-decoration: none !important;
                }
                .nav-link-item.active {
                    background: var(--nav-active-bg);
                    color: var(--nav-accent);
                    font-weight: 600;
                }
                .nav-link-item.active .nav-link-icon svg { stroke: var(--nav-accent); }

                .nav-link-icon {
                    width: 18px; height: 18px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    color: var(--nav-text);
                }
                .nav-link-item.active .nav-link-icon { color: var(--nav-accent); }
                .nav-link-item:hover .nav-link-icon { color: var(--nav-text-strong); }

                .nav-link-label { flex: 1; }

                /* ── Footer ──────────────────────────────── */
                .nav-footer {
                    border-top: 1px solid var(--nav-border);
                    padding: 10px;
                    flex-shrink: 0;
                }

                .nav-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 10px;
                    border-radius: var(--nav-radius);
                    text-decoration: none !important;
                    cursor: pointer;
                    transition: background .15s;
                    margin-bottom: 4px;
                    overflow: hidden;
                }
                .nav-user:hover { background: var(--nav-hover-bg); }

                .nav-user-avatar {
                    width: 30px; height: 30px;
                    background: var(--nav-accent);
                    color: #fff;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 700;
                    flex-shrink: 0;
                }

                .nav-user-info { display: flex; flex-direction: column; overflow: hidden; }
                .nav-user-name {
                    font-size: 12.5px; font-weight: 600;
                    color: var(--nav-text-strong);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .nav-user-role { font-size: 10.5px; color: var(--nav-section-color); white-space: nowrap; }

                .nav-logout {
                    display: flex; align-items: center; gap: 9px;
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: var(--nav-radius);
                    border: none;
                    background: none;
                    color: #ef4444;
                    font-size: 13px; font-weight: 500;
                    cursor: pointer;
                    transition: background .15s;
                }
                .nav-logout:hover { background: #fef2f2; }

                /* ── Mobile ──────────────────────────────── */
                @media (max-width: 992px) {
                    .nav-sidebar { box-shadow: 4px 0 24px rgba(0,0,0,.1); }
                }
            `}</style>
        </>
    );
}

/* ── Inline SVG icons (Bootstrap Icons style, 16×16) ────── */
const IconDashboard = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconTruck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const IconPin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconUsers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconTruckFront = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" /><rect x="9" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" /></svg>;
const IconMap = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>;
const IconCash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>;
const IconReceipt = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 2 2 3-2 3 2 2-2 3 2V4a2 2 0 0 0-2-2z" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></svg>;
const IconCalc = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10" /><line x1="12" y1="10" x2="12" y2="10" /><line x1="16" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="8" y2="14" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="16" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="12" y2="18" /></svg>;
const IconOffice = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
const IconShield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconMenu = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconChevronLeft = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const IconLogout = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconDoc = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
export default Navigation;