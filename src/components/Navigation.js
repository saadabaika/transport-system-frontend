import React, { useState } from 'react';
import { Navbar, Nav, Container, Offcanvas, Badge, Button, Dropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';

function Navigation() {
    const [show, setShow] = useState(false);
    const { user, logout, isAdmin, loading, hasAccess, isFacturation } = useAuth();

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleLogout = () => {
        logout();
        handleClose();
    };

    // Afficher un spinner pendant le chargement
    if (loading) {
        return (
            <Navbar bg="white" variant="light" fixed="top" className="border-bottom shadow-sm" style={{ zIndex: 1030 }}>
                <Container fluid>
                    <Navbar.Brand className="d-flex align-items-center fw-bold text-dark">
                        <div className="bg-dark text-white rounded p-2 me-2 d-flex align-items-center justify-content-center"
                            style={{ width: '42px', height: '42px' }}>
                            <span className="fs-6">FT</span>
                        </div>
                        <div>
                            <div className="fs-6">FleetMaster</div>
                            <div className="fs-8 text-muted fw-normal">Chargement...</div>
                        </div>
                    </Navbar.Brand>
                </Container>
            </Navbar>
        );
    }

    return (
        <>
            <Navbar bg="white" variant="light" expand="lg" fixed="top" className="border-bottom shadow-sm" style={{ zIndex: 1030 }}>
                <Container fluid>
                    {/* Logo et marque */}
                    <Navbar.Brand
                        href="/"
                        className="d-flex align-items-center fw-bold text-dark me-4"
                    >
                        <div className="bg-dark text-white rounded p-2 me-2 d-flex align-items-center justify-content-center"
                            style={{ width: '42px', height: '42px' }}>
                            <span className="fs-6">FT</span>
                        </div>
                        <div className="d-none d-sm-block">
                            <div className="fs-6">FleetMaster</div>
                            <div className="fs-8 text-muted fw-normal">Pro Edition</div>
                        </div>
                    </Navbar.Brand>

                    {/* Bouton menu mobile */}
                    {/* Bouton menu mobile - TOUJOURS VISIBLE */}
                    <Navbar.Toggle
                        aria-controls="offcanvasNavbar"
                        onClick={handleShow}
                        className="border-1 me-2 d-lg-none"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </Navbar.Toggle>

                    {/* Navigation desktop */}
                    <Navbar.Collapse id="basic-navbar-nav" className="d-none d-lg-block">
                        <Nav className="me-auto">
                            {/* Dashboard - accessible à tous */}
                            <LinkContainer to="/">
                                <Nav.Link className="mx-1 fw-medium text-dark">
                                    <i className="bi bi-speedometer2 me-1"></i>
                                    Dashboard
                                </Nav.Link>
                            </LinkContainer>

                            {/* Dropdown Gestion - avec vérifications de permissions */}
                            {(hasAccess('camions', 'view') || hasAccess('employes', 'view') || hasAccess('clients', 'view') || hasAccess('transporteurs', 'view') || hasAccess('destinations', 'view')) && (
                                <Dropdown as={Nav.Item} className="mx-1">
                                    <Dropdown.Toggle as={Nav.Link} className="fw-medium text-dark">
                                        <i className="bi-gear me-1"></i>
                                        Gestion
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="border-0 shadow-lg">
                                        {hasAccess('camions', 'view') && (
                                            <LinkContainer to="/camions">
                                                <Dropdown.Item>
                                                    <i className="bi bi-truck me-2 text-primary"></i>
                                                    Camions
                                                </Dropdown.Item>
                                            </LinkContainer>
                                        )}
                                        {hasAccess('destinations', 'view') && (
                                            <LinkContainer to="/destinations">
                                                <Dropdown.Item>
                                                    <i className="bi bi-geo-alt me-2 text-success"></i>
                                                    Destinations
                                                </Dropdown.Item>
                                            </LinkContainer>
                                        )}
                                        {hasAccess('employes', 'view') && (
                                            <LinkContainer to="/employes">
                                                <Dropdown.Item>
                                                    <i className="bi bi-people me-2 text-warning"></i>
                                                    Employés
                                                </Dropdown.Item>
                                            </LinkContainer>
                                        )}
                                        {hasAccess('clients', 'view') && (
                                            <LinkContainer to="/clients">
                                                <Dropdown.Item>
                                                    <i className="bi-person-lines-fill me-2 text-info"></i>
                                                    Clients
                                                </Dropdown.Item>
                                            </LinkContainer>
                                        )}
                                        {hasAccess('transporteurs', 'view') && (
                                            <LinkContainer to="/transporteurs-externes">
                                                <Dropdown.Item>
                                                    <i className="bi bi-truck-front me-2 text-secondary"></i>
                                                    Transporteurs
                                                </Dropdown.Item>
                                            </LinkContainer>
                                        )}
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}

                            {/* Boutons séparés avec vérifications de permissions */}
                            {hasAccess('trajets', 'view') && (
                                <LinkContainer to="/trajets">
                                    <Nav.Link className="mx-1 fw-medium text-primary">
                                        <i className="bi bi-geo-alt me-1"></i>
                                        Trajets
                                    </Nav.Link>
                                </LinkContainer>
                            )}

                            {hasAccess('frais', 'view') && (
                                <LinkContainer to="/frais-chauffeurs">
                                    <Nav.Link className="mx-1 fw-medium text-success">
                                        <i className="bi bi-cash-coin me-1"></i>
                                        Frais Chauffeurs
                                    </Nav.Link>
                                </LinkContainer>
                            )}

                            {hasAccess('factures', 'view') && (
                                <LinkContainer to="/facturation">
                                    <Nav.Link className="mx-1 fw-medium text-warning">
                                        <i className="bi bi-receipt me-1"></i>
                                        Facturation
                                    </Nav.Link>
                                </LinkContainer>
                            )}

                            {hasAccess('tva', 'view') && (
                                <LinkContainer to="/situation-tva">
                                    <Nav.Link className="mx-1 fw-medium text-info">
                                        <i className="bi bi-calculator me-1"></i>
                                        Situation TVA
                                    </Nav.Link>
                                </LinkContainer>
                            )}

                        </Nav>

                        {/* Section utilisateur */}
                        {/* Section utilisateur desktop - CACHÉE sur mobile */}
                        {/* Section utilisateur desktop - UNIQUEMENT visible sur desktop */}
                        <Nav className="ms-auto d-none d-lg-flex align-items-center">
                            {user ? (
                                <Dropdown align="end">
                                    <Dropdown.Toggle
                                        variant="outline-dark"
                                        className="d-flex align-items-center border-0 bg-transparent p-2"

                                    >
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                                                style={{ width: '32px', height: '32px', fontSize: '14px' }}
                                            >
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-start me-2">
                                                <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                                                    {user.username}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                                                    {isAdmin ? 'Administrateur' : isFacturation ? 'Agent Facturation' : 'Employé'}
                                                </div>
                                            </div>
                                            <i className="" style={{ fontSize: '0.75rem' }}></i>
                                        </div>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="border-0 shadow-lg">
                                        <Dropdown.Header>
                                            <div className="fw-bold">{user.username}</div>
                                            <small className="text-muted">{user.email || 'Aucun email'}</small>
                                        </Dropdown.Header>

                                        <LinkContainer to="/mon-compte">
                                            <Dropdown.Item>
                                                <i className="bi bi-person me-2"></i>
                                                Mon Compte
                                            </Dropdown.Item>
                                        </LinkContainer>

                                        {isAdmin && (
                                            <LinkContainer to="/gestion-utilisateurs">
                                                <Dropdown.Item>
                                                    <i className="bi bi-people me-2"></i>
                                                    Gestion Utilisateurs
                                                </Dropdown.Item>
                                            </LinkContainer>
                                        )}

                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right me-2"></i>
                                            Déconnexion
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            ) : (
                                <LinkContainer to="/login">
                                    <Nav.Link className="fw-medium">
                                        <i className="bi bi-box-arrow-in-right me-1"></i>
                                        Connexion
                                    </Nav.Link>
                                </LinkContainer>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Menu mobile avec Offcanvas */}
            <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '320px', zIndex: 1040 }}>
                <Offcanvas.Header closeButton className="border-bottom bg-dark text-white">
                    <Offcanvas.Title className="d-flex align-items-center w-100">
                        <div className="bg-white text-dark rounded p-2 me-2 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}>
                            <span className="fs-6 fw-bold">FT</span>
                        </div>
                        <div className="flex-grow-1">
                            <div className="fs-6 fw-bold text-white">FleetMaster Pro</div>
                            <div className="fs-8 text-light">
                                {user ? `Connecté en tant que ${user.username}` : 'Non connecté'}
                            </div>
                        </div>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <Nav className="flex-column">
                        {/* Section principale */}
                        <div className="p-3 bg-light border-bottom">
                            <small className="text-muted text-uppercase fw-bold">Navigation Principale</small>
                        </div>

                        <LinkContainer to="/" onClick={handleClose}>
                            <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                <span className="me-3 fs-5">📊</span>
                                <div>
                                    <div className="fw-semibold">Dashboard</div>
                                    <small className="text-muted">Vue d'ensemble</small>
                                </div>
                            </Nav.Link>
                        </LinkContainer>

                        {/* Section Gestion - avec vérifications */}
                        {(hasAccess('camions', 'view') || hasAccess('employes', 'view') || hasAccess('clients', 'view') || hasAccess('transporteurs', 'view') || hasAccess('destinations', 'view')) && (
                            <div className="p-3 bg-light border-bottom">
                                <small className="text-muted text-uppercase fw-bold">Gestion</small>
                            </div>
                        )}

                        {hasAccess('camions', 'view') && (
                            <LinkContainer to="/camions" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">🚛</span>
                                    <div>
                                        <div className="fw-semibold">Camions</div>
                                        <small className="text-muted">Gestion du parc</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {hasAccess('destinations', 'view') && (
                            <LinkContainer to="/destinations" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">🏙️</span>
                                    <div>
                                        <div className="fw-semibold">Destinations</div>
                                        <small className="text-muted">Villes & frais</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {hasAccess('employes', 'view') && (
                            <LinkContainer to="/employes" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">👨‍💼</span>
                                    <div>
                                        <div className="fw-semibold">Employés</div>
                                        <small className="text-muted">Équipe & chauffeurs</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {hasAccess('clients', 'view') && (
                            <LinkContainer to="/clients" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">🏢</span>
                                    <div>
                                        <div className="fw-semibold">Clients</div>
                                        <small className="text-muted">Partenaires commerciaux</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {hasAccess('transporteurs', 'view') && (
                            <LinkContainer to="/transporteurs-externes" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">🚚</span>
                                    <div>
                                        <div className="fw-semibold">Transporteurs</div>
                                        <small className="text-muted">Sous-traitants externes</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {/* Section Opérations */}
                        {(hasAccess('trajets', 'view') || hasAccess('frais', 'view')) && (
                            <div className="p-3 bg-light border-bottom">
                                <small className="text-muted text-uppercase fw-bold">Opérations</small>
                            </div>
                        )}

                        {hasAccess('trajets', 'view') && (
                            <LinkContainer to="/trajets" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">📦</span>
                                    <div>
                                        <div className="fw-semibold">Trajets</div>
                                        <small className="text-muted">Livraisons & missions</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {hasAccess('frais', 'view') && (
                            <LinkContainer to="/frais-chauffeurs" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">💰</span>
                                    <div>
                                        <div className="fw-semibold">Frais Chauffeurs</div>
                                        <small className="text-muted">Dépenses & remboursements</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {/* Section Financière */}
                        {(hasAccess('factures', 'view') || hasAccess('tva', 'view')) && (
                            <div className="p-3 bg-light border-bottom">
                                <small className="text-muted text-uppercase fw-bold">Financier</small>
                            </div>
                        )}

                        {hasAccess('factures', 'view') && (
                            <LinkContainer to="/facturation" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center bg-warning bg-opacity-10">
                                    <span className="me-3 fs-5">🧾</span>
                                    <div>
                                        <div className="fw-semibold text-warning">Facturation</div>
                                        <small className="text-warning">Factures & revenus</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {hasAccess('tva', 'view') && (
                            <LinkContainer to="/situation-tva" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center">
                                    <span className="me-3 fs-5">🧾</span>
                                    <div>
                                        <div className="fw-semibold">Situation TVA</div>
                                        <small className="text-muted">Calculs et déclarations</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {/* Section administration */}
                        {isAdmin && (
                            <>
                                <div className="p-3 bg-light border-bottom mt-2">
                                    <small className="text-muted text-uppercase fw-bold">Administration</small>
                                </div>

                                <LinkContainer to="/gestion-utilisateurs" onClick={handleClose}>
                                    <Nav.Link className="py-3 border-bottom d-flex align-items-center text-warning">
                                        <span className="me-3 fs-5">👥</span>
                                        <div>
                                            <div className="fw-semibold">Gestion Utilisateurs</div>
                                            <small className="text-muted">Administration des comptes</small>
                                        </div>
                                    </Nav.Link>
                                </LinkContainer>

                                <LinkContainer to="/mon-compte" onClick={handleClose}>
                                    <Nav.Link className="py-3 border-bottom d-flex align-items-center text-info">
                                        <span className="me-3 fs-5">👤</span>
                                        <div>
                                            <div className="fw-semibold">Mon Compte</div>
                                            <small className="text-muted">Paramètres personnels</small>
                                        </div>
                                    </Nav.Link>
                                </LinkContainer>
                            </>
                        )}

                        {/* Section utilisateur mobile */}
                        <div className="p-3 bg-light border-bottom mt-2">
                            <small className="text-muted text-uppercase fw-bold">Compte</small>
                        </div>

                        {user ? (
                            <>
                                <div className="px-3 py-2 border-bottom">
                                    <div className="d-flex align-items-center">
                                        <span className="me-3 fs-5">👤</span>
                                        <div>
                                            <div className="fw-semibold">{user.username}</div>
                                            <small className="text-muted">
                                                {isAdmin ? 'Administrateur' : isFacturation ? 'Agent Facturation' : 'Employé'}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <LinkContainer to="/mon-compte" onClick={handleClose}>
                                    <Nav.Link className="py-3 border-bottom d-flex align-items-center text-info">
                                        <span className="me-3 fs-5">⚙️</span>
                                        <div>
                                            <div className="fw-semibold">Mon Compte</div>
                                            <small className="text-muted">Paramètres personnels</small>
                                        </div>
                                    </Nav.Link>
                                </LinkContainer>

                                <Button
                                    variant="outline-danger"
                                    className="m-3 d-flex align-items-center justify-content-center"
                                    onClick={handleLogout}
                                >
                                    <span className="me-2">🚪</span>
                                    Déconnexion
                                </Button>
                            </>
                        ) : (
                            <LinkContainer to="/login" onClick={handleClose}>
                                <Nav.Link className="py-3 border-bottom d-flex align-items-center text-primary">
                                    <span className="me-3 fs-5">🔐</span>
                                    <div>
                                        <div className="fw-semibold">Connexion</div>
                                        <small className="text-muted">Accéder à votre compte</small>
                                    </div>
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {/* Pied de page mobile */}
                        <div className="p-3 mt-auto border-top bg-light">
                            <div className="text-center">
                                <small className="text-muted d-block">
                                    FleetMaster Professional
                                </small>
                                <Badge bg="dark" className="mt-1">v2.0</Badge>
                            </div>
                        </div>
                    </Nav>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Styles CSS */}
            <style>{`
                /* Styles pour la navbar fixe */
                .navbar {
                    min-height: 70px;
                    transition: all 0.3s ease;
                }

                .nav-link {
                    transition: all 0.2s ease;
                    border-radius: 6px;
                    margin: 1px 4px;
                    padding: 8px 12px !important;
                    position: relative;
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                .nav-link:hover {
                    background-color: #f8f9fa;
                    color: #000 !important;
                }
                
                .nav-link.active {
                    background-color: #000;
                    color: white !important;
                    font-weight: 600;
                }

                /* Styles pour les dropdowns */
                .dropdown-toggle {
                    cursor: pointer;
                    border: none !important;
                    box-shadow: none !important;
                }

                .dropdown-toggle:hover {
                    background-color: #f8f9fa !important;
                }

                .dropdown-menu {
                    border-radius: 12px;
                    margin-top: 8px !important;
                }

                .dropdown-item {
                    padding: 10px 16px;
                    border-radius: 6px;
                    margin: 2px 8px;
                    width: auto;
                }

                .dropdown-item:hover {
                    background-color: #0080ff;
                }

                .dropdown-header {
                    border-radius: 12px 12px 0 0;
                }

                /* Avatar utilisateur */
                .dropdown-toggle .bg-primary {
                    transition: all 0.3s ease;
                }

                .dropdown-toggle:hover .bg-primary {
                    background-color: #0056b3 !important;
                }

                /* Responsive adjustments */
                @media (max-width: 576px) {
                    .navbar-brand {
                        font-size: 0.9rem;
                    }
                    
                    .offcanvas {
                        width: 280px !important;
                    }
                }

                @media (max-width: 768px) {
                    .navbar-nav .nav-link {
                        font-size: 0.9rem;
                        padding: 6px 10px !important;
                    }
                }

                @media (max-width: 992px) {
                    .dropdown-menu {
                        position: fixed !important;
                        top: 70px !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        width: 90vw !important;
                        max-width: 300px !important;
                    }
                }

                /* Ajustement pour le contenu sous la navbar fixe */
                body {
                    padding-top: 70px;
                }

                /* Zoom compatibility */
                .navbar-nav {
                    flex-wrap: nowrap;
                }

                .dropdown-menu {
                    min-width: 200px;
                }

                /* Ensure dropdowns stay visible on zoom */
                @media (min-width: 992px) {
                    .dropdown:hover .dropdown-menu {
                        display: block;
                    }
                }
            `}</style>
        </>
    );
}

export default Navigation;