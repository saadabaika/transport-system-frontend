import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import { clientService, trajetService } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

const styles = `
    .btn-action {
        transition: all 0.2s ease;
        border: 1px solid #dee2e6;
    }
    .btn-action.details { color: #17a2b8; border-color: #17a2b8; }
    .btn-action.details:hover { background-color: #17a2b8; color: white; }
    .btn-action.menu { color: #6c757d; border-color: #6c757d; }
    .btn-action.menu:hover { background-color: #6c757d; color: white; }
    .action-icon { font-size: 0.9rem; }
    .action-menu-dropdown {
        position: absolute; top: 100%; right: 0; z-index: 1000;
        min-width: 150px; background-color: white;
        border: 1px solid #dee2e6; border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .menu-item {
        cursor: pointer; transition: background-color 0.2s;
        font-size: 14px; padding: 8px 12px;
        display: flex; align-items: center; gap: 8px;
    }
    .menu-item:hover { background-color: #f8f9fa; }
    .menu-item.modifier { color: #007bff; }
    .menu-item.supprimer { color: #dc3545; }
    .menu-item i { font-size: 1rem; }
    .menu-divider { margin: 4px 0; border-top: 1px solid #dee2e6; }

    /* ⭐ STYLES POUR LA SÉLECTION DES CONTENEURS */
    .conteneur-item {
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 8px 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
    }
    .conteneur-item:hover {
        border-color: #0d6efd;
        background-color: #f0f4ff;
    }
    .conteneur-item.selected {
        border-color: #0d6efd;
        background-color: #e7f0ff;
    }
    .conteneur-search-box {
        border-radius: 6px;
        border: 1px solid #dee2e6;
        padding: 6px 10px;
        width: 100%;
        font-size: 13px;
    }
    .conteneur-list {
        max-height: 180px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 6px;
        background: #fafafa;
    }
    .conteneur-list::-webkit-scrollbar { width: 5px; }
    .conteneur-list::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`;

function Clients() {
    const { hasAccess, isFacturation } = useAuth();

    const canCreateClient = hasAccess('clients', 'create');
    const canEditClient = hasAccess('clients', 'edit');
    const canDeleteClient = hasAccess('clients', 'delete');
    const canViewClientDetails = hasAccess('clients', 'view');
    const canViewClientStats = !isFacturation;

    const [clients, setClients] = useState([]);
    const [trajets, setTrajets] = useState([]);
    const [trajetsFiltres, setTrajetsFiltres] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [clientSelectionne, setClientSelectionne] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [menuPositions, setMenuPositions] = useState({});

    // ⭐ NOUVEAUX ÉTATS POUR LES CONTENEURS
    const [searchConteneur, setSearchConteneur] = useState('');
    const [selectedConteneurs, setSelectedConteneurs] = useState([]);
    const [showConteneurDropdown, setShowConteneurDropdown] = useState(false);

    const handleMenuOpen = (clientId, event) => {
        event.stopPropagation();
        if (showActionsMenu === clientId) {
            setShowActionsMenu(null);
            return;
        }
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const estimatedMenuHeight = 120;
        const position = spaceBelow < estimatedMenuHeight ? 'top' : 'bottom';
        setMenuPositions(prev => ({ ...prev, [clientId]: position }));
        setShowActionsMenu(clientId);
    };

    const trierClientsFrancais = (clients) => {
        return clients.slice().sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr', {
                sensitivity: 'base', ignorePunctuation: true, numeric: true
            })
        );
    };

    const getClientsFiltres = () => {
        let clientsFiltres = [...clients];
        if (searchTerm.trim()) {
            const terme = searchTerm.toLowerCase();
            clientsFiltres = clientsFiltres.filter(client =>
                client.nom.toLowerCase().includes(terme) ||
                (client.ice && client.ice.toLowerCase().includes(terme)) ||
                (client.email && client.email.toLowerCase().includes(terme)) ||
                (client.telephone && client.telephone.includes(terme))
            );
        }
        return clientsFiltres.sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
        );
    };

    const [filtresTrajets, setFiltresTrajets] = useState({
        date_debut: '',
        date_fin: ''
    });

    const [formData, setFormData] = useState({
        nom: '', ice: '', adresse: '', telephone: '', email: ''
    });

    useEffect(() => { fetchAllData(); }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionsMenu) {
                const isInside = event.target.closest('.action-menu-dropdown') ||
                    event.target.closest('.btn-action.menu');
                if (!isInside) setShowActionsMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showActionsMenu]);

    useEffect(() => {
        if (clientSelectionne) appliquerFiltresTrajets();
    }, [trajets, filtresTrajets, clientSelectionne, selectedConteneurs]);

    const fetchAllData = async () => {
        try {
            const [clientsRes, trajetsRes] = await Promise.all([
                clientService.getAll(),
                trajetService.getAll()
            ]);
            setClients(clientsRes.data);
            setTrajets(trajetsRes.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des données');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ⭐ EXTRAIRE TOUS LES NUMÉROS DE CONTENEURS DU CLIENT SÉLECTIONNÉ
    const getConteneursClient = () => {
        if (!clientSelectionne) return [];
        const trajetsClient = trajets.filter(t => t.client == clientSelectionne.id);
        const conteneurs = new Set();
        trajetsClient.forEach(trajet => {
            if (trajet.numeros_conteneurs) {
                // Séparer par virgule, point-virgule ou espace
                const nums = trajet.numeros_conteneurs
                    .split(/[,;\s]+/)
                    .map(n => n.trim())
                    .filter(n => n.length > 0);
                nums.forEach(n => conteneurs.add(n));
            }
        });
        return Array.from(conteneurs).sort();
    };

    // ⭐ CONTENEURS FILTRÉS PAR LA RECHERCHE
    const getConteneursFiltres = () => {
        const tous = getConteneursClient();
        if (!searchConteneur.trim()) return tous;
        return tous.filter(c =>
            c.toLowerCase().includes(searchConteneur.toLowerCase())
        );
    };

    // ⭐ TOGGLE SÉLECTION D'UN CONTENEUR
    const toggleConteneur = (num) => {
        setSelectedConteneurs(prev =>
            prev.includes(num)
                ? prev.filter(c => c !== num)
                : [...prev, num]
        );
    };

    // ⭐ TOUT SÉLECTIONNER / TOUT DÉSÉLECTIONNER
    const toggleTousConteneurs = () => {
        const filtres = getConteneursFiltres();
        const tousSelectionnes = filtres.every(c => selectedConteneurs.includes(c));
        if (tousSelectionnes) {
            setSelectedConteneurs(prev => prev.filter(c => !filtres.includes(c)));
        } else {
            setSelectedConteneurs(prev => [...new Set([...prev, ...filtres])]);
        }
    };

    const appliquerFiltresTrajets = () => {
        if (!clientSelectionne) return;

        let filtres = trajets.filter(trajet => trajet.client == clientSelectionne.id);

        if (filtresTrajets.date_debut) {
            filtres = filtres.filter(trajet => trajet.date >= filtresTrajets.date_debut);
        }
        if (filtresTrajets.date_fin) {
            filtres = filtres.filter(trajet => trajet.date <= filtresTrajets.date_fin);
        }

        // ⭐ FILTRE PAR CONTENEURS SÉLECTIONNÉS
        if (selectedConteneurs.length > 0) {
            filtres = filtres.filter(trajet => {
                if (!trajet.numeros_conteneurs) return false;
                const nums = trajet.numeros_conteneurs
                    .split(/[,;\s]+/)
                    .map(n => n.trim())
                    .filter(n => n.length > 0);
                return nums.some(n => selectedConteneurs.includes(n));
            });
        }

        setTrajetsFiltres(filtres);
    };

    const handleFiltreTrajetChange = (e) => {
        const { name, value } = e.target;
        setFiltresTrajets(prev => ({ ...prev, [name]: value }));
    };

    const reinitialiserFiltresTrajets = () => {
        setFiltresTrajets({ date_debut: '', date_fin: '' });
        setSelectedConteneurs([]);
        setSearchConteneur('');
    };

    const handleShowDetails = (client) => {
        if (!canViewClientDetails) {
            setError('Vous n\'avez pas la permission de voir les détails des clients');
            return;
        }
        setClientSelectionne(client);
        setSelectedConteneurs([]);
        setSearchConteneur('');
        setShowDetails(true);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setClientSelectionne(null);
        setFiltresTrajets({ date_debut: '', date_fin: '' });
        setSelectedConteneurs([]);
        setSearchConteneur('');
    };

    const handleShowForm = (client = null) => {
        if (client && !canEditClient) {
            setError('Vous n\'avez pas la permission de modifier les clients');
            return;
        }
        if (!client && !canCreateClient) {
            setError('Vous n\'avez pas la permission de créer des clients');
            return;
        }
        if (client) {
            setEditingClient(client);
            setFormData({
                nom: client.nom, ice: client.ice,
                adresse: client.adresse || '',
                telephone: client.telephone || '',
                email: client.email || ''
            });
        } else {
            setEditingClient(null);
            setFormData({ nom: '', ice: '', adresse: '', telephone: '', email: '' });
        }
        setError('');
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingClient(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            if (editingClient) {
                await clientService.update(editingClient.id, formData);
            } else {
                await clientService.create(formData);
            }
            fetchAllData();
            handleCloseForm();
        } catch (error) {
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation des données: ';
                Object.keys(errors).forEach(key => {
                    errorMessage += `${key}: ${errors[key].join(', ')}; `;
                });
                setError(errorMessage);
            } else {
                setError('Erreur de connexion au serveur.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!canDeleteClient) {
            setError('Vous n\'avez pas la permission de supprimer des clients');
            return;
        }
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
            try {
                await clientService.delete(id);
                fetchAllData();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const genererPDF = () => {
        if (!clientSelectionne) return;

        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text('RAPPORT DE TRANSPORT', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Client: ${clientSelectionne.nom}`, 20, 35);
        doc.text(`ICE: ${clientSelectionne.ice}`, 20, 42);

        if (filtresTrajets.date_debut || filtresTrajets.date_fin) {
            let periode = 'Période: ';
            if (filtresTrajets.date_debut) periode += `Du ${filtresTrajets.date_debut} `;
            if (filtresTrajets.date_fin) periode += `Au ${filtresTrajets.date_fin}`;
            doc.text(periode, 20, 49);
        }

        // ⭐ AFFICHER LES CONTENEURS SÉLECTIONNÉS DANS LE PDF
        if (selectedConteneurs.length > 0) {
            doc.text(`Conteneurs: ${selectedConteneurs.join(', ')}`, 20, 56);
        }

        const tableColumn = ["Date", "Destination", "Camion", "N° Conteneurs"];
        const tableRows = trajetsFiltres.map(trajet => ([
            trajet.date,
            trajet.destination_details?.ville || 'N/A',
            trajet.camion_details?.immatriculation || 'N/A',
            trajet.numeros_conteneurs || `${trajet.n_conteneurs} conteneur(s)`
        ]));

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: selectedConteneurs.length > 0 ? 65 : 58,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, minCellHeight: 10 },
            headStyles: {
                fillColor: [0, 51, 102], textColor: 255,
                fontStyle: 'bold', fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 25 }, 1: { cellWidth: 40 },
                2: { cellWidth: 30 }, 3: { cellWidth: 75 }
            },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        const totalTrajets = trajetsFiltres.length;
        const totalsY = doc.lastAutoTable.finalY + 15;

        doc.setDrawColor(0, 51, 102);
        doc.setFillColor(240, 245, 255);
        doc.rect(120, totalsY, 75, 25, 'FD');

        doc.setFontSize(11);
        doc.setTextColor(0, 51, 102);
        doc.text('TOTAL', 125, totalsY + 8);
        doc.line(125, totalsY + 10, 185, totalsY + 10);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Nombre de trajets: ${totalTrajets}`, 125, totalsY + 18);

        const footerY = totalsY + 40;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Pour toute question, contactez notre service', 105, footerY, { align: 'center' });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} sur ${pageCount}`,
                doc.internal.pageSize.width - 25,
                doc.internal.pageSize.height - 10
            );
        }

        const nomFichier = `transport_${clientSelectionne.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nomFichier);
    };

    const getStatsClient = (clientId) => {
        const trajetsClient = trajets.filter(t => t.client == clientId);
        const totalTrajets = trajetsClient.length;
        const totalRevenus = trajetsClient.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);
        const dernierTrajet = trajetsClient.length > 0
            ? new Date(Math.max(...trajetsClient.map(t => new Date(t.date))))
            : null;
        return {
            totalTrajets,
            totalRevenus,
            dernierTrajet: dernierTrajet ? dernierTrajet.toLocaleDateString() : 'Aucun'
        };
    };

    const getStatsTrajetsFiltres = () => {
        const totalTrajets = trajetsFiltres.length;
        const totalRevenus = trajetsFiltres.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);
        const trajetsFactures = trajetsFiltres.filter(t => t.type_trajet === 'facture').length;
        const trajetsNonFactures = trajetsFiltres.filter(t => t.type_trajet === 'non_facture').length;
        return { totalTrajets, totalRevenus, trajetsFactures, trajetsNonFactures };
    };

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
            </Container>
        );
    }

    const statsTrajetsFiltres = getStatsTrajetsFiltres();
    const conteneursFiltres = getConteneursFiltres();
    const tousSelectionnes = conteneursFiltres.length > 0 &&
        conteneursFiltres.every(c => selectedConteneurs.includes(c));

    return (
        <Container fluid className="px-4 py-4">
            <style>{styles}</style>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestion des Clients</h1>
                {canCreateClient && (
                    <Button variant="primary" onClick={() => handleShowForm()} disabled={showForm}>
                        + Nouveau Client
                    </Button>
                )}
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Barre de recherche */}
            <Card className="mb-4 shadow-sm">
                <Card.Body className="py-3">
                    <Row className="align-items-center">
                        <Col md={8} lg={9}>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher un client par nom, ICE, email ou téléphone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-start-0"
                                />
                                {searchTerm && (
                                    <Button variant="outline-secondary" onClick={() => setSearchTerm('')}
                                        className="border-start-0">
                                        <i className="bi bi-x"></i>
                                    </Button>
                                )}
                            </div>
                        </Col>
                        <Col md={4} lg={3} className="mt-3 mt-md-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <Badge bg="light" text="dark" className="px-3 py-2">
                                    {getClientsFiltres().length} client(s)
                                </Badge>
                                {searchTerm && (
                                    <Button variant="link" size="sm" onClick={() => setSearchTerm('')}
                                        className="text-decoration-none">
                                        Effacer
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Formulaire inline */}
            {showForm && (
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{editingClient ? 'Modifier le Client' : 'Nouveau Client'}</h5>
                        <Button variant="outline-secondary" size="sm" onClick={handleCloseForm}>✕</Button>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nom du Client *</Form.Label>
                                        <Form.Control type="text" name="nom" value={formData.nom}
                                            onChange={handleChange} required
                                            placeholder="Ex: Société ABC" disabled={saving} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>ICE *</Form.Label>
                                        <Form.Control type="text" name="ice" value={formData.ice}
                                            onChange={handleChange} required
                                            placeholder="Ex: 123456789" disabled={saving} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Téléphone</Form.Label>
                                        <Form.Control type="text" name="telephone" value={formData.telephone}
                                            onChange={handleChange} placeholder="Ex: 0522 00 00 00" disabled={saving} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control type="email" name="email" value={formData.email}
                                            onChange={handleChange} placeholder="Ex: contact@entreprise.com" disabled={saving} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Adresse</Form.Label>
                                <Form.Control as="textarea" rows={3} name="adresse" value={formData.adresse}
                                    onChange={handleChange} placeholder="Adresse complète du client..." disabled={saving} />
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? (
                                        <><Spinner animation="border" size="sm" className="me-2" />Enregistrement...</>
                                    ) : (editingClient ? 'Modifier' : 'Créer')}
                                </Button>
                                <Button variant="secondary" onClick={handleCloseForm} disabled={saving}>Annuler</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {/* Tableau des clients */}
            <Card>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Nom</th>
                                <th>ICE</th>
                                <th>Téléphone</th>
                                <th>Total Trajets</th>
                                {canViewClientStats && <th>Revenus Totaux</th>}
                                <th>Dernier Trajet</th>
                                <th width="200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getClientsFiltres().map((client) => {
                                const stats = getStatsClient(client.id);
                                return (
                                    <tr key={client.id}>
                                        <td>
                                            <strong>{client.nom}</strong>
                                            {client.email && (
                                                <div><small className="text-muted">{client.email}</small></div>
                                            )}
                                        </td>
                                        <td>{client.ice}</td>
                                        <td>{client.telephone || '-'}</td>
                                        <td className="text-center">
                                            <Badge bg={stats.totalTrajets > 0 ? "primary" : "secondary"}>
                                                {stats.totalTrajets}
                                            </Badge>
                                        </td>
                                        {canViewClientStats && (
                                            <td><strong>{stats.totalRevenus.toLocaleString()} DH</strong></td>
                                        )}
                                        <td>{stats.dernierTrajet}</td>
                                        <td>
                                            <div className="d-flex gap-2 align-items-center">
                                                {canViewClientDetails && canViewClientStats && (
                                                    <Button variant="outline-info" size="sm"
                                                        onClick={() => handleShowDetails(client)}
                                                        title="Voir les détails"
                                                        className="btn-action details d-flex align-items-center gap-1">
                                                        <i className="bi bi-eye action-icon"></i>
                                                        <span className="d-none d-md-inline">Détails</span>
                                                    </Button>
                                                )}
                                                {(canEditClient || canDeleteClient) && (
                                                    <div className="position-relative">
                                                        <Button variant="outline-secondary" size="sm"
                                                            onClick={(e) => handleMenuOpen(client.id, e)}
                                                            title="Plus d'actions" className="btn-action menu">
                                                            <i className="bi bi-three-dots-vertical action-icon"></i>
                                                        </Button>
                                                        {showActionsMenu === client.id && (
                                                            <div className="position-absolute action-menu-dropdown"
                                                                style={{ top: '100%', right: '0', zIndex: 1000, minWidth: '150px', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                                                                onClick={(e) => e.stopPropagation()}>
                                                                {canEditClient && (
                                                                    <button
                                                                        className="menu-item modifier w-100 text-start px-3 py-2 border-0 bg-transparent"
                                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleShowForm(client);
                                                                            setShowActionsMenu(null);
                                                                        }}>
                                                                        <i className="bi bi-pencil me-2"></i>Modifier
                                                                    </button>
                                                                )}
                                                                {canEditClient && canDeleteClient && <hr className="my-1" />}
                                                                {canDeleteClient && (
                                                                    <button
                                                                        className="menu-item supprimer w-100 text-start px-3 py-2 border-0 bg-transparent"
                                                                        style={{ cursor: 'pointer', color: '#dc3545' }}
                                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ?`)) {
                                                                                handleDelete(client.id);
                                                                                setShowActionsMenu(null);
                                                                            }
                                                                        }}>
                                                                        <i className="bi bi-trash me-2"></i>Supprimer
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    {clients.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucun client enregistré</h5>
                            <p>Cliquez sur "Nouveau Client" pour commencer</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Détails du Client */}
            {showDetails && clientSelectionne && (
                <Modal show={showDetails} onHide={handleCloseDetails} size="xl" enforceFocus={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>📋 Détails du Client - {clientSelectionne.nom}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Informations du client */}
                        <Row className="mb-4">
                            <Col md={6}>
                                <Card>
                                    <Card.Header><h6 className="mb-0">🏢 Informations Client</h6></Card.Header>
                                    <Card.Body>
                                        <p><strong>Nom:</strong> {clientSelectionne.nom}</p>
                                        <p><strong>ICE:</strong> {clientSelectionne.ice}</p>
                                        <p><strong>Téléphone:</strong> {clientSelectionne.telephone || 'Non renseigné'}</p>
                                        <p><strong>Email:</strong> {clientSelectionne.email || 'Non renseigné'}</p>
                                        {clientSelectionne.adresse && (
                                            <p><strong>Adresse:</strong> {clientSelectionne.adresse}</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card>
                                    <Card.Header><h6 className="mb-0">📊 Statistiques Globales</h6></Card.Header>
                                    <Card.Body>
                                        <p><strong>Total des trajets:</strong> {statsTrajetsFiltres.totalTrajets}</p>
                                        <p><strong>Revenus totaux:</strong> {statsTrajetsFiltres.totalRevenus.toLocaleString()} DH</p>
                                        <p><strong>Trajets facturés:</strong> {statsTrajetsFiltres.trajetsFactures}</p>
                                        <p><strong>Trajets non facturés:</strong> {statsTrajetsFiltres.trajetsNonFactures}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* ⭐ SECTION FILTRES AVEC CONTENEURS */}
                        <Card className="mb-3">
                            <Card.Header><h6 className="mb-0">🔍 Filtres des Trajets</h6></Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {/* Filtre date début */}
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Date Début</Form.Label>
                                            <Form.Control type="date" name="date_debut"
                                                value={filtresTrajets.date_debut}
                                                onChange={handleFiltreTrajetChange} />
                                        </Form.Group>
                                    </Col>

                                    {/* Filtre date fin */}
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Date Fin</Form.Label>
                                            <Form.Control type="date" name="date_fin"
                                                value={filtresTrajets.date_fin}
                                                onChange={handleFiltreTrajetChange} />
                                        </Form.Group>
                                    </Col>

                                    {/* ⭐ FILTRE NUMÉROS CONTENEURS */}
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="d-flex justify-content-between align-items-center">
                                                <span>N° Conteneurs</span>
                                                {selectedConteneurs.length > 0 && (
                                                    <Badge bg="primary" pill className="ms-2">
                                                        {selectedConteneurs.length} sélectionné(s)
                                                    </Badge>
                                                )}
                                            </Form.Label>

                                            {/* Champ de recherche conteneur */}
                                            <input
                                                type="text"
                                                className="conteneur-search-box mb-2"
                                                placeholder="🔍 Rechercher un conteneur..."
                                                value={searchConteneur}
                                                onChange={(e) => setSearchConteneur(e.target.value)}
                                                onFocus={() => setShowConteneurDropdown(true)}
                                            />

                                            {/* Liste des conteneurs */}
                                            {getConteneursClient().length > 0 ? (
                                                <div className="conteneur-list">
                                                    {/* Bouton tout sélectionner */}
                                                    <div
                                                        className={`conteneur-item d-flex align-items-center gap-2 mb-1 ${tousSelectionnes ? 'selected' : ''}`}
                                                        onClick={toggleTousConteneurs}
                                                        style={{ background: tousSelectionnes ? '#e7f0ff' : '#f0f0f0' }}
                                                    >
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={tousSelectionnes}
                                                            onChange={toggleTousConteneurs}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                                            {tousSelectionnes ? '✅ Tout désélectionner' : 'Tout sélectionner'}
                                                        </span>
                                                        <Badge bg="secondary" pill className="ms-auto" style={{ fontSize: '10px' }}>
                                                            {conteneursFiltres.length}
                                                        </Badge>
                                                    </div>

                                                    {/* Items conteneurs */}
                                                    {conteneursFiltres.length > 0 ? conteneursFiltres.map((num) => (
                                                        <div
                                                            key={num}
                                                            className={`conteneur-item d-flex align-items-center gap-2 mb-1 ${selectedConteneurs.includes(num) ? 'selected' : ''}`}
                                                            onClick={() => toggleConteneur(num)}
                                                        >
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={selectedConteneurs.includes(num)}
                                                                onChange={() => toggleConteneur(num)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{num}</span>
                                                        </div>
                                                    )) : (
                                                        <div className="text-center text-muted py-2" style={{ fontSize: '12px' }}>
                                                            Aucun conteneur trouvé
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                                    Aucun numéro de conteneur disponible
                                                </div>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Boutons action */}
                                    <Col md={2} className="d-flex flex-column justify-content-end gap-2">
                                        <Button variant="outline-secondary" onClick={reinitialiserFiltresTrajets}>
                                            🔄 Réinitialiser
                                        </Button>
                                        <Button variant="success" onClick={genererPDF}>
                                            📄 PDF
                                            {selectedConteneurs.length > 0 && (
                                                <Badge bg="light" text="dark" className="ms-1" style={{ fontSize: '10px' }}>
                                                    {selectedConteneurs.length}
                                                </Badge>
                                            )}
                                        </Button>
                                    </Col>
                                </Row>

                                {/* ⭐ TAGS DES CONTENEURS SÉLECTIONNÉS */}
                                {selectedConteneurs.length > 0 && (
                                    <div className="mt-3 d-flex flex-wrap gap-1 align-items-center">
                                        <small className="text-muted me-1">Filtrés :</small>
                                        {selectedConteneurs.map(num => (
                                            <Badge
                                                key={num}
                                                bg="primary"
                                                className="d-flex align-items-center gap-1"
                                                style={{ cursor: 'pointer', fontSize: '11px' }}
                                                onClick={() => toggleConteneur(num)}
                                                title="Cliquer pour retirer"
                                            >
                                                {num}
                                                <span style={{ marginLeft: '4px', opacity: 0.8 }}>×</span>
                                            </Badge>
                                        ))}
                                        <Button variant="link" size="sm" className="text-danger p-0 ms-1"
                                            style={{ fontSize: '11px' }}
                                            onClick={() => setSelectedConteneurs([])}>
                                            Effacer tout
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Tableau des trajets du client */}
                        <Card>
                            <Card.Header>
                                <h6 className="mb-0">📦 Historique des Trajets ({trajetsFiltres.length})</h6>
                            </Card.Header>
                            <Card.Body>
                                <Table striped bordered hover responsive size="sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Destination</th>
                                            <th>Service</th>
                                            <th>Camion</th>
                                            <th>Conteneurs</th>
                                            <th>Prix (DH)</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trajetsFiltres.map((trajet) => (
                                            <tr key={trajet.id}>
                                                <td>{trajet.date}</td>
                                                <td>{trajet.destination_details?.ville || 'N/A'}</td>
                                                <td>
                                                    <Badge bg={trajet.type_service === 'ars_distribution' ? 'info' : 'primary'}>
                                                        {trajet.type_service === 'ars_distribution' ? 'ARS Dist' : 'ARN Log'}
                                                    </Badge>
                                                </td>
                                                <td>{trajet.camion_details?.immatriculation || 'N/A'}</td>
                                                <td className="text-center">
                                                    {/* ⭐ AFFICHER LES NUMÉROS AVEC HIGHLIGHT SI SÉLECTIONNÉS */}
                                                    {trajet.numeros_conteneurs ? (
                                                        <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                            {trajet.numeros_conteneurs.split(/[,;\s]+/).filter(n => n.trim()).map((num, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    bg={selectedConteneurs.includes(num.trim()) ? 'primary' : 'light'}
                                                                    text={selectedConteneurs.includes(num.trim()) ? 'white' : 'dark'}
                                                                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                                                                >
                                                                    {num.trim()}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Badge bg="info">{trajet.n_conteneurs}</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>{parseFloat(trajet.prix_trajet).toLocaleString()} DH</strong>
                                                </td>
                                                <td>
                                                    <Badge bg={trajet.type_trajet === 'facture' ? 'success' : 'warning'}>
                                                        {trajet.type_trajet === 'facture' ? 'Facturé' : 'Non Facturé'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {trajetsFiltres.length === 0 && (
                                    <div className="text-center text-muted py-3">
                                        <p>Aucun trajet trouvé pour ce client</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseDetails}>Fermer</Button>
                        {canEditClient && (
                            <Button variant="primary" onClick={() => {
                                handleCloseDetails();
                                handleShowForm(clientSelectionne);
                            }}>
                                ✏️ Modifier Client
                            </Button>
                        )}
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
}

export default Clients;