import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import { clientService, trajetService } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext'; // ⭐ AJOUT

const styles = `
    .btn-action {
        transition: all 0.2s ease;
        border: 1px solid #dee2e6;
    }

    .btn-action.details {
        color: #17a2b8;
        border-color: #17a2b8;
    }

    .btn-action.details:hover {
        background-color: #17a2b8;
        color: white;
    }

    .btn-action.menu {
        color: #6c757d;
        border-color: #6c757d;
    }

    .btn-action.menu:hover {
        background-color: #6c757d;
        color: white;
    }

    .action-icon {
        font-size: 0.9rem;
    }

    .action-menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 1000;
        min-width: 150px;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .menu-item {
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 14px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .menu-item:hover {
        background-color: #f8f9fa;
    }

    .menu-item.modifier {
        color: #007bff;
    }

    .menu-item.supprimer {
        color: #dc3545;
    }

    .menu-item i {
        font-size: 1rem;
    }

    .menu-divider {
        margin: 4px 0;
        border-top: 1px solid #dee2e6;
    }
`;
function Clients() {
    const { hasAccess, isFacturation } = useAuth(); // ⭐ AJOUT

    // ⭐ VARIABLES DE PERMISSIONS AJOUTÉES
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
    const [menuPositions, setMenuPositions] = useState({}); // ⭐ AJOUTER CETTE LIGNE
    // Fonction de tri optimisée pour le français
    // ⭐ FONCTION POUR GÉRER L'OUVERTURE DU MENU AVEC DÉTECTION DE POSITION
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

        setMenuPositions(prev => ({
            ...prev,
            [clientId]: position
        }));

        setShowActionsMenu(clientId);
    };
    const trierClientsFrancais = (clients) => {
        return clients.slice().sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr', {
                sensitivity: 'base',
                ignorePunctuation: true,
                numeric: true
            })
        );
    };
    // Ajoutez cette fonction après vos autres fonctions
    // Fonction pour filtrer et trier les clients
    const getClientsFiltres = () => {
        let clientsFiltres = [...clients];

        // Appliquer la recherche si un terme est saisi
        if (searchTerm.trim()) {
            const terme = searchTerm.toLowerCase();
            clientsFiltres = clientsFiltres.filter(client =>
                client.nom.toLowerCase().includes(terme) ||
                (client.ice && client.ice.toLowerCase().includes(terme)) ||
                (client.email && client.email.toLowerCase().includes(terme)) ||
                (client.telephone && client.telephone.includes(terme))
            );
        }

        // Trier par ordre alphabétique
        return clientsFiltres.sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
        );
    };

    // États pour les filtres des trajets
    const [filtresTrajets, setFiltresTrajets] = useState({
        date_debut: '',
        date_fin: ''
    });

    const [formData, setFormData] = useState({
        nom: '',
        ice: '',
        adresse: '',
        telephone: '',
        email: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionsMenu) {
                // Vérifier si le clic est à l'intérieur du menu ou du bouton
                const isInside = event.target.closest('.action-menu-dropdown') || 
                               event.target.closest('.btn-action.menu');
                
                if (!isInside) {
                    setShowActionsMenu(null);
                }
            }
        };
    
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showActionsMenu]);

    useEffect(() => {
        if (clientSelectionne) {
            appliquerFiltresTrajets();
        }
    }, [trajets, filtresTrajets, clientSelectionne]);

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

    const appliquerFiltresTrajets = () => {
        if (!clientSelectionne) return;

        let trajetsFiltres = trajets.filter(trajet => trajet.client == clientSelectionne.id);

        // Filtre par date début
        if (filtresTrajets.date_debut) {
            trajetsFiltres = trajetsFiltres.filter(trajet => trajet.date >= filtresTrajets.date_debut);
        }

        // Filtre par date fin
        if (filtresTrajets.date_fin) {
            trajetsFiltres = trajetsFiltres.filter(trajet => trajet.date <= filtresTrajets.date_fin);
        }

        setTrajetsFiltres(trajetsFiltres);
    };

    const handleFiltreTrajetChange = (e) => {
        const { name, value } = e.target;
        setFiltresTrajets(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const reinitialiserFiltresTrajets = () => {
        setFiltresTrajets({
            date_debut: '',
            date_fin: ''
        });
    };

    const handleShowDetails = (client) => {
        // ⭐ AJOUTER CETTE VÉRIFICATION
        if (!canViewClientDetails) {
            setError('Vous n\'avez pas la permission de voir les détails des clients');
            return;
        }
        setClientSelectionne(client);
        setShowDetails(true);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setClientSelectionne(null);
        setFiltresTrajets({ date_debut: '', date_fin: '' });
    };

    const handleShowForm = (client = null) => {
        // ⭐ AJOUTER CES VÉRIFICATIONS
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
                nom: client.nom,
                ice: client.ice,
                adresse: client.adresse || '',
                telephone: client.telephone || '',
                email: client.email || ''
            });
        } else {
            setEditingClient(null);
            setFormData({
                nom: '',
                ice: '',
                adresse: '',
                telephone: '',
                email: ''
            });
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
            console.log('Error details:', error);

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
        // ⭐ AJOUTER CETTE VÉRIFICATION
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
                console.error('Error:', error);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Génération PDF pour les trajets d'un client
    // Génération PDF pour les trajets d'un client
    // Génération PDF pour les trajets d'un client
    // Génération PDF pour les trajets d'un client - VERSION OPTIMISÉE
    // Génération PDF PROFESSIONNEL pour client
    const genererPDF = () => {
        if (!clientSelectionne) return;

        const doc = new jsPDF();

        // EN-TÊTE PROFESSIONNEL
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102); // Bleu professionnel
        doc.text('RAPPORT DE TRANSPORT', 105, 20, { align: 'center' });

        // Informations client
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Client: ${clientSelectionne.nom}`, 20, 35);
        doc.text(`ICE: ${clientSelectionne.ice}`, 20, 42);

        // Période si filtres appliqués
        if (filtresTrajets.date_debut || filtresTrajets.date_fin) {
            let periode = 'Période: ';
            if (filtresTrajets.date_debut) periode += `Du ${filtresTrajets.date_debut} `;
            if (filtresTrajets.date_fin) periode += `Au ${filtresTrajets.date_fin}`;
            doc.text(periode, 20, 49);
        }

        doc.text(`Date d'émission: ${new Date().toLocaleDateString()}`, 20, 56);

        // PRÉPARER LES DONNÉES DU TABLEAU CLIENT
        const tableColumn = [
            "Date",
            "Destination",
            "Camion",
            "N° Conteneurs",
            "Prix (DH)"
        ];

        const tableRows = [];

        trajetsFiltres.forEach(trajet => {
            const trajetData = [
                trajet.date,
                trajet.destination_details?.ville || 'N/A',
                trajet.camion_details?.immatriculation || 'N/A',
                trajet.numeros_conteneurs || `${trajet.n_conteneurs} conteneur(s)`,
                parseFloat(trajet.prix_trajet).toLocaleString()
            ];
            tableRows.push(trajetData);
        });

        // TABLEAU PRINCIPAL
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 4,
                minCellHeight: 10
            },
            headStyles: {
                fillColor: [0, 51, 102], // Bleu professionnel
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Date
                1: { cellWidth: 40 }, // Destination
                2: { cellWidth: 30 }, // Camion
                3: { cellWidth: 45 }, // N° Conteneurs
                4: { cellWidth: 30 }  // Prix
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 65 }
        });

        // CALCUL DES TOTAUX
        const totalTrajets = trajetsFiltres.length;
        const totalRevenus = trajetsFiltres.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);

        // SECTION TOTAUX - DESIGN PROFESSIONNEL
        const totalsY = doc.lastAutoTable.finalY + 15;

        // Cadre des totaux
        doc.setDrawColor(0, 51, 102);
        doc.setFillColor(240, 245, 255);
        doc.rect(120, totalsY, 75, 30, 'FD');

        // Bordures
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);

        // Titre section totaux
        doc.setFontSize(11);
        doc.setTextColor(0, 51, 102);
        doc.text('TOTAL', 125, totalsY + 8);

        // Ligne séparatrice
        doc.line(125, totalsY + 10, 185, totalsY + 10);

        // Détails des totaux
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Nombre de trajets: ${totalTrajets}`, 125, totalsY + 18);

        // Total en gras
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 0);
        doc.setFont(undefined, 'bold');
        doc.text(`Montant total: ${totalRevenus.toLocaleString()} DH`, 125, totalsY + 28);
        doc.setFont(undefined, 'normal');

        // PIED DE PAGE PROFESSIONNEL
        const footerY = totalsY + 45;

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(' Pour toute question, contactez notre service ', 105, footerY, { align: 'center' });

        // Signature
        doc.text('Signature et cachet', 105, footerY + 10, { align: 'center' });
        doc.line(80, footerY + 12, 130, footerY + 12);

        // Numéro de page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        }

        // SAUVEGARDER LE PDF
        const nomFichier = `transport_${clientSelectionne.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nomFichier);
    };

    // Statistiques pour un client
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

    // Statistiques pour les trajets filtrés
    const getStatsTrajetsFiltres = () => {
        const totalTrajets = trajetsFiltres.length;
        const totalRevenus = trajetsFiltres.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);
        const trajetsFactures = trajetsFiltres.filter(t => t.type_trajet === 'facture').length;
        const trajetsNonFactures = trajetsFiltres.filter(t => t.type_trajet === 'non_facture').length;

        return {
            totalTrajets,
            totalRevenus,
            trajetsFactures,
            trajetsNonFactures
        };
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

    return (
        <Container fluid className="px-4 py-4">
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
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setSearchTerm('')}
                                        className="border-start-0"
                                    >
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
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setSearchTerm('')}
                                        className="text-decoration-none"
                                    >
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
                        <h5 className="mb-0">
                            {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
                        </h5>
                        <Button variant="outline-secondary" size="sm" onClick={handleCloseForm}>
                            ✕
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nom du Client *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Société ABC"
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>ICE *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="ice"
                                            value={formData.ice}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: 123456789"
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Téléphone</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={handleChange}
                                            placeholder="Ex: 0522 00 00 00"
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Ex: contact@entreprise.com"
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Adresse</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    placeholder="Adresse complète du client..."
                                    disabled={saving}
                                />
                            </Form.Group>

                            <div className="d-flex gap-2">
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        editingClient ? 'Modifier' : 'Créer'
                                    )}
                                </Button>
                                <Button variant="secondary" onClick={handleCloseForm} disabled={saving}>
                                    Annuler
                                </Button>
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
                                                <div>
                                                    <small className="text-muted">{client.email}</small>
                                                </div>
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
                                            <td>
                                                <strong>{stats.totalRevenus.toLocaleString()} DH</strong>
                                            </td>
                                        )}
                                        <td>{stats.dernierTrajet}</td>
                                        <td>
                                            <div className="d-flex gap-2 align-items-center">
                                                {/* Bouton Voir détails */}
                                                {canViewClientDetails && canViewClientStats && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleShowDetails(client)}
                                                        title="Voir les détails"
                                                        className="btn-action details d-flex align-items-center gap-1"
                                                    >
                                                        <i className="bi bi-eye action-icon"></i>
                                                        <span className="d-none d-md-inline">Détails</span>
                                                    </Button>
                                                )}

                                                {/* Menu déroulant pour Modifier/Supprimer */}
                                                {(canEditClient || canDeleteClient) && (
                                                    <div className="position-relative">
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            onClick={(e) => handleMenuOpen(client.id, e)}
                                                            title="Plus d'actions"
                                                            className="btn-action menu"
                                                        >
                                                            <i className="bi bi-three-dots-vertical action-icon"></i>
                                                        </Button>

                                                        {/* Menu déroulant */}
                                                        {showActionsMenu === client.id && (
                                                            <div
                                                                className="position-absolute action-menu-dropdown"
                                                                style={{
                                                                    top: '100%',
                                                                    right: '0',
                                                                    zIndex: 1000,
                                                                    minWidth: '150px',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #dee2e6',
                                                                    borderRadius: '4px',
                                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {/* Option Modifier */}
                                                                {canEditClient && (
                                                                    <>
                                                                        <button
                                                                            className="menu-item modifier w-100 text-start px-3 py-2 border-0 bg-transparent"
                                                                            style={{
                                                                                cursor: 'pointer',
                                                                                transition: 'background-color 0.2s'
                                                                            }}
                                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                                            onClick={(e) => {  // ⭐ AJOUTER e
                                                                                e.stopPropagation(); // ⭐ AJOUTER CETTE LIGNE
                                                                                handleShowForm(client);
                                                                                setShowActionsMenu(null);
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-pencil me-2"></i>
                                                                            Modifier
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* Séparateur si les deux options sont disponibles */}
                                                                {canEditClient && canDeleteClient && (
                                                                    <hr className="my-1" />
                                                                )}

                                                                {/* Option Supprimer */}
                                                                {canDeleteClient && (
                                                                    <button
                                                                        className="menu-item supprimer w-100 text-start px-3 py-2 border-0 bg-transparent"
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            transition: 'background-color 0.2s',
                                                                            color: '#dc3545'
                                                                        }}
                                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                                        onClick={(e) => {  // ⭐ AJOUTER e
                                                                            e.stopPropagation(); // ⭐ AJOUTER CETTE LIGNE
                                                                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ?`)) {
                                                                                handleDelete(client.id);
                                                                                setShowActionsMenu(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-trash me-2"></i>
                                                                        Supprimer
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

            {/* Modal Détails du Client avec trajets */}
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
                                    <Card.Header>
                                        <h6 className="mb-0">🏢 Informations Client</h6>
                                    </Card.Header>
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
                                    <Card.Header>
                                        <h6 className="mb-0">📊 Statistiques Globales</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <p><strong>Total des trajets:</strong> {statsTrajetsFiltres.totalTrajets}</p>
                                        <p><strong>Revenus totaux:</strong> {statsTrajetsFiltres.totalRevenus.toLocaleString()} DH</p>
                                        <p><strong>Trajets facturés:</strong> {statsTrajetsFiltres.trajetsFactures}</p>
                                        <p><strong>Trajets non facturés:</strong> {statsTrajetsFiltres.trajetsNonFactures}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Filtres pour les trajets */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h6 className="mb-0">🔍 Filtres des Trajets</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date Début</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_debut"
                                                value={filtresTrajets.date_debut}
                                                onChange={handleFiltreTrajetChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date Fin</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_fin"
                                                value={filtresTrajets.date_fin}
                                                onChange={handleFiltreTrajetChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="d-flex align-items-end gap-2">
                                        <Button variant="outline-secondary" onClick={reinitialiserFiltresTrajets}>
                                            🔄 Réinitialiser
                                        </Button>
                                        <Button variant="success" onClick={genererPDF}>
                                            📄 Générer PDF
                                        </Button>
                                    </Col>
                                </Row>
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
                                                    <Badge bg="info">{trajet.n_conteneurs}</Badge>
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
                        <Button variant="secondary" onClick={handleCloseDetails}>
                            Fermer
                        </Button>

                        {/* ⭐ AJOUTER LA VÉRIFICATION DE PERMISSION */}
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