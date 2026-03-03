import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Spinner, Alert, Badge, Table,
    Form, Button, ButtonGroup, Modal
} from 'react-bootstrap';
import {
    camionService, employeService, trajetService, clientService,
    chargeCamionService, factureService, transporteurExterneService
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Composant pour les bar charts simples
const BarChart = ({ data, title, color = '#007bff', height = 200 }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-muted py-4">
                <p>Aucune donnée disponible</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value));

    return (
        <Card className="h-100">
            <Card.Header className="py-2">
                <h6 className="mb-0" style={{ fontSize: '14px' }}>{title}</h6>
            </Card.Header>
            <Card.Body className="py-3">
                <div style={{ height: `${height}px`, position: 'relative' }}>
                    {data.map((item, index) => (
                        <div key={index} className="d-flex align-items-end mb-2">
                            <div className="me-2" style={{ width: '40%', fontSize: '11px' }}>
                                {item.label.length > 15 ? item.label.substring(0, 15) + '...' : item.label}
                            </div>
                            <div style={{ width: '60%', position: 'relative' }}>
                                <div
                                    style={{
                                        width: `${(item.value / maxValue) * 100}%`,
                                        height: '25px',
                                        backgroundColor: color,
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }}
                                    className="d-flex align-items-center justify-content-end px-1"
                                >
                                    <span style={{
                                        fontSize: '10px',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>
                                        {item.value.toLocaleString()} DH
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

// Composant pour le graphique en barres horizontales
// Composant pour le graphique en barres horizontales
// Composant pour le graphique en barres horizontales
const HorizontalBarChart = ({ data, title, color = '#28a745', height = 300 }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-muted py-4">
                <p>Aucune donnée disponible</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value));
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="h-100">
            <Card.Header className="py-2">
                <h6 className="mb-0" style={{ fontSize: '14px' }}>{title}</h6>
            </Card.Header>
            <Card.Body className="py-3">
                {/* ⭐ AJOUTER UN CONTENEUR AVEC SCROLL */}
                <div style={{
                    height: `${height}px`,
                    position: 'relative',
                    overflowY: 'auto', // ⭐ Scroll vertical
                    paddingRight: '8px' // Espace pour la scrollbar
                }}>
                    {data.map((item, index) => (
                        <div key={index} className="mb-2">
                            <div className="d-flex justify-content-between mb-1">
                                <small style={{ fontSize: '11px', width: '40%' }}>
                                    {item.label.length > 20 ? item.label.substring(0, 20) + '...' : item.label}
                                </small>
                                <small style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                    {item.value.toLocaleString()} DH
                                </small>
                            </div>
                            <div
                                style={{
                                    width: '100%',
                                    height: '18px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        width: `${(item.value / maxValue) * 100}%`,
                                        height: '100%',
                                        backgroundColor: color,
                                        borderRadius: '8px',
                                        transition: 'width 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        paddingRight: '6px'
                                    }}
                                >
                                    <small style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '9px'
                                    }}>
                                        {Math.round((item.value / totalValue) * 100)}%
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

// Composant Modal pour les détails du camion
const DetailsCamionModal = ({ show, onHide, camion, statistiquesCamion }) => {
    if (!camion || !statistiquesCamion) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>📊 Situation du Camion {camion.immatriculation}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-3">
                    <Col md={6}>
                        <Card>
                            <Card.Header className="py-2">
                                <h6 className="mb-0">🚛 Informations Camion</h6>
                            </Card.Header>
                            <Card.Body>
                                <p><strong>Immatriculation:</strong> {camion.immatriculation}</p>
                                <p><strong>Marque/Modèle:</strong> {camion.marque} {camion.modele}</p>
                                <p><strong>Date mise service:</strong> {camion.date_mise_service}</p>
                                <p><strong>Statut:</strong>
                                    <Badge bg={camion.statut === 'actif' ? 'success' : 'warning'} className="ms-2">
                                        {camion.statut}
                                    </Badge>
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <Card.Header className="py-2">
                                <h6 className="mb-0">📈 Performance</h6>
                            </Card.Header>
                            <Card.Body>
                                <p><strong>Trajets effectués:</strong> {statistiquesCamion.totalTrajets}</p>
                                <p><strong>Revenus générés:</strong> {statistiquesCamion.totalRevenus.toLocaleString()} DH</p>
                                <p><strong>Revenu moyen par trajet:</strong> {statistiquesCamion.revenuMoyen.toLocaleString()} DH</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="mb-3">
                    <Card.Header className="py-2">
                        <h6 className="mb-0">💸 Charges Mensuelles</h6>
                    </Card.Header>
                    <Card.Body>
                        <Table striped bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Type de charge</th>
                                    <th className="text-end">Montant (DH)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Gazoil</td>
                                    <td className="text-end">{statistiquesCamion.charges.gazoil.toLocaleString()} DH</td>
                                </tr>
                                <tr>
                                    <td>Entretien/Réparations</td>
                                    <td className="text-end">{statistiquesCamion.charges.entretien.toLocaleString()} DH</td>
                                </tr>
                                <tr>
                                    <td>Jawaz Autoroute</td>
                                    <td className="text-end">{statistiquesCamion.charges.jawaz.toLocaleString()} DH</td>
                                </tr>
                                <tr>
                                    <td>Autres charges</td>
                                    <td className="text-end">{statistiquesCamion.charges.autres.toLocaleString()} DH</td>
                                </tr>
                                <tr>
                                    <td>Frais de Déplacement</td>
                                    <td className="text-end">{statistiquesCamion.charges.deplacement?.toLocaleString() || '0'} DH</td>
                                </tr>
                                <tr>
                                    <td>Frais Supplémentaires</td>
                                    <td className="text-end">{statistiquesCamion.charges.frais_supplementaires?.toLocaleString() || '0'} DH</td>
                                </tr>
                                <tr className="table-warning">
                                    <td><strong>Total des charges</strong></td>
                                    <td className="text-end"><strong>{statistiquesCamion.totalCharges.toLocaleString()} DH</strong></td>
                                </tr>
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header className="py-2">
                        <h6 className="mb-0">💰 Bilan Financier</h6>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <div className="text-center p-3 border rounded bg-light">
                                    <h5 className="text-success">{statistiquesCamion.totalRevenus.toLocaleString()} DH</h5>
                                    <small>Revenus totaux</small>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="text-center p-3 border rounded bg-light">
                                    <h5 className="text-danger">{statistiquesCamion.totalCharges.toLocaleString()} DH</h5>
                                    <small>Charges totales</small>
                                </div>
                            </Col>
                        </Row>
                        <hr />
                        <div className="text-center">
                            <h4 className={statistiquesCamion.bilan >= 0 ? 'text-success' : 'text-danger'}>
                                Bénéfice: {statistiquesCamion.bilan.toLocaleString()} DH
                            </h4>
                            <Badge bg={statistiquesCamion.bilan >= 0 ? 'success' : 'danger'}>
                                {statistiquesCamion.bilan >= 0 ? '✅ Rentable' : '❌ Déficitaire'}
                            </Badge>
                        </div>
                    </Card.Body>
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

function Dashboard() {
    const { hasAccess, user } = useAuth();

    // ⭐ VARIABLES DE PERMISSIONS
    const canAccessCamions = hasAccess('camions', 'view');
    const canAccessEmployes = hasAccess('employes', 'view');
    const canAccessClients = hasAccess('clients', 'view');
    const canAccessTrajets = hasAccess('trajets', 'view');
    const canAccessFrais = hasAccess('frais', 'view');
    const canAccessTransporteurs = hasAccess('transporteurs', 'view');
    const canAccessFactures = hasAccess('factures', 'view');

    const isFacturation = user?.role === 'facturation';
    const isAdmin = user?.role === 'admin';
    const isEmploye = user?.role === 'employe';

    const [stats, setStats] = useState({
        camions: 0,
        employes: 0,
        trajets: 0,
        revenus: 0,
        facturesPayees: 0,
        facturesEnvoyees: 0,
        clientsActifs: 0
    });
    const [statistiquesDetaillees, setStatistiquesDetaillees] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtres, setFiltres] = useState({
        date_debut: '',
        date_fin: ''
    });
    const [showDetailsCamion, setShowDetailsCamion] = useState(false);
    const [camionSelectionne, setCamionSelectionne] = useState(null);
    const [statistiquesCamion, setStatistiquesCamion] = useState(null);
    // ⭐ AJOUTEZ CES ÉTATS POUR LES TRANSPORTEURS
    const [transporteurs, setTransporteurs] = useState([]);
    const [statistiquesTransporteurs, setStatistiquesTransporteurs] = useState([]);
    const [loadingTransporteurs, setLoadingTransporteurs] = useState(false);
    const [trajetsData, setTrajetsData] = useState([]);
    // ⭐ ÉTATS POUR LES FACTURES (AGENT FACTURATION)
    const [factures, setFactures] = useState([]);
    const [clients, setClients] = useState([]);
    const [facturesFiltrees, setFacturesFiltrees] = useState([]);
    const [filtresFactures, setFiltresFactures] = useState({
        client: '',
        statut: '',
        entreprise: '',
        date_debut_facture: '',
        date_fin_facture: ''
    });
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // Calculer les dates par défaut (mois en cours)
    useEffect(() => {
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);

        setFiltres({
            date_debut: debutMois.toLocaleDateString('en-CA'),
            date_fin: finMois.toLocaleDateString('en-CA')
        });

        // ⭐ Initialiser aussi les dates pour les factures
        setFiltresFactures(prev => ({
            ...prev,
            date_debut_facture: debutMois.toLocaleDateString('en-CA'),
            date_fin_facture: finMois.toLocaleDateString('en-CA')
        }));
    }, []);

    useEffect(() => {
        if (filtres.date_debut && filtres.date_fin) {
            fetchStats();
        }
    }, [filtres]);

    // ⭐ FONCTION ADAPTÉE POUR L'AGENT DE FACTURATION
    const fetchStats = async () => {
        try {
            setLoading(true);
            setLoadingTransporteurs(true);

            if (isFacturation) {
                // ⭐ POUR L'AGENT DE FACTURATION : Seulement les données nécessaires
                const [clientsRes, facturesRes, trajetsRes] = await Promise.all([
                    clientService.getAll(),
                    factureService.getAll(),
                    trajetService.getAll()
                ]);

                const clients = clientsRes.data || [];
                let factures = facturesRes.data || [];
                const trajets = filtrerTrajetsParDate(trajetsRes.data || []);

                // ⭐ FILTRER LES FACTURES PAR DATE
                factures = factures.filter(facture => {
                    const dateFacture = new Date(facture.date_facture);
                    const dateDebut = new Date(filtres.date_debut);
                    const dateFin = new Date(filtres.date_fin);

                    return dateFacture >= dateDebut && dateFacture <= dateFin;
                });

                // Calculs spécifiques pour la facturation
                const facturesPayees = factures.filter(f => f.statut === 'payee').length;
                const facturesEnvoyees = factures.filter(f => f.statut === 'envoyee').length;
                const revenusPeriode = factures
                    .filter(f => f.statut === 'payee')
                    .reduce((total, facture) => total + parseFloat(facture.total_ttc || 0), 0);

                // Clients avec factures
                const clientsAvecFactures = clients.filter(client =>
                    factures.some(f => f.client == client.id)
                );

                setStats({
                    camions: 0,
                    employes: 0,
                    trajets: trajets.length,
                    revenus: revenusPeriode,
                    facturesPayees,
                    facturesEnvoyees,
                    clientsActifs: clientsAvecFactures.length
                });

                setClients(clients);
                setFactures(factures);

                // ⭐ APPLIQUER LES FILTRES FACTURES APRÈS LE CHARGEMENT
                appliquerFiltresFactures(filtresFactures, factures);

                // Statistiques détaillées pour la facturation
                const statsDetaillees = await calculerStatistiquesFacturation(factures, clients, trajets);
                setStatistiquesDetaillees(statsDetaillees);

            } else {
                // ⭐ POUR ADMIN/EMPLOYÉ : Données complètes
                const [camionsRes, employesRes, trajetsRes, clientsRes, chargesRes, facturesRes, transporteursRes] = await Promise.all([
                    canAccessCamions ? camionService.getAll() : Promise.resolve({ data: [] }),
                    canAccessEmployes ? employeService.getAll() : Promise.resolve({ data: [] }),
                    trajetService.getAll(),
                    clientService.getAll(),
                    canAccessCamions ? chargeCamionService.getAll() : Promise.resolve({ data: [] }),
                    factureService.getAll(),
                    canAccessTransporteurs ? transporteurExterneService.getAll() : Promise.resolve({ data: [] })]);

                const trajets = filtrerTrajetsParDate(trajetsRes.data);
                const charges = filtrerChargesParDate(chargesRes.data);
                const camions = camionsRes.data;
                const clients = clientsRes.data;
                const employes = employesRes.data;
                const factures = facturesRes.data;
                const transporteurs = transporteursRes.data || [];

                const revenusPeriode = trajets.reduce((total, trajet) =>
                    total + parseFloat(trajet.prix_trajet || 0), 0
                );
                setTrajetsData(trajets);
                const statsDetaillees = await calculerStatistiquesDetaillees(trajets, camions, clients, employes, charges, factures);

                setStats({
                    camions: camions.length,
                    employes: employes.length,
                    trajets: trajets.length,
                    revenus: revenusPeriode,
                    facturesPayees: factures.filter(f => f.statut === 'payee').length,
                    facturesEnvoyees: factures.filter(f => f.statut === 'envoyee').length,
                    clientsActifs: clients.filter(c => trajets.some(t => t.client == c.id)).length
                });

                setStatistiquesDetaillees(statsDetaillees);
                // ⭐ CALCULER SEULEMENT LE SOLDE DE CHAQUE TRANSPORTEUR
                // Dans fetchStats, modifiez le calcul du solde réel :
                const transporteursAvecSolde = transporteurs.map(transporteur => {
                    const trajetsTransporteur = trajetsRes.data.filter(t => t.transporteur_externe === transporteur.id);

                    if (trajetsTransporteur.length === 0) return null;

                    // SOLDE RÉEL : Seulement les NON PAYÉS
                    const solde = trajetsTransporteur.reduce((total, trajet) => {
                        if (trajet.type_sous_traitance === 'je_donne' && trajet.statut_paiement_sous_traitance !== 'paye') {
                            return total - parseFloat(trajet.prix_sous_traitance || 0);
                        }
                        if (trajet.type_sous_traitance === 'je_recois' && trajet.statut_paiement_sous_traitance !== 'paye') {
                            return total + parseFloat(trajet.prix_trajet || 0);
                        }
                        return total;
                    }, 0);

                    return {
                        transporteur,
                        solde,
                        isSoldePositif: solde >= 0
                    };
                }).filter(Boolean);

                setStatistiquesTransporteurs(transporteursAvecSolde);
            }

        } catch (error) {
            console.error('Erreur chargement stats:', error);
            // ⭐ MESSAGE D'ERREUR ADAPTÉ
            if (isFacturation) {
                setError('Erreur lors du chargement des données de facturation');
            } else {
                setError('Impossible de charger les données. Vérifiez que le backend est démarré.');
            }
        } finally {
            setLoading(false);
        }
    };


    // ⭐ CALCULS SPÉCIFIQUES POUR LA FACTURATION
    const calculerStatistiquesFacturation = async (factures, clients, trajets) => {
        // Meilleurs clients par chiffre d'affaires
        const caParClient = {};
        factures.forEach(facture => {
            if (facture.statut === 'payee') {
                caParClient[facture.client] = (caParClient[facture.client] || 0) + parseFloat(facture.total_ttc || 0);
            }
        });

        const meilleursClients = Object.entries(caParClient)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([clientId, ca]) => ({
                client: clients.find(c => c.id == clientId),
                revenus: ca
            }));

        // Répartition des statuts de factures
        const repartitionFactures = {
            payee: factures.filter(f => f.statut === 'payee').length,
            envoyee: factures.filter(f => f.statut === 'envoyee').length,
            brouillon: factures.filter(f => f.statut === 'brouillon').length,
            annulee: factures.filter(f => f.statut === 'annulee').length
        };

        // Chiffre d'affaires mensuel
        const caMensuel = factures
            .filter(f => f.statut === 'payee')
            .reduce((sum, f) => sum + parseFloat(f.total_ttc || 0), 0);

        return {
            meilleursClients,
            repartitionFactures,
            totalCA: caMensuel,
            totalFactures: factures.length,
            facturesPayees: repartitionFactures.payee,
            facturesEnvoyees: repartitionFactures.envoyee,
            clientsAvecFactures: Object.keys(caParClient).length
        };
    };

    const calculerStatistiquesDetaillees = async (trajets, camions, clients, employes, charges, factures) => {
        // Camions avec statistiques détaillées
        const camionsAvecStats = camions.map(camion => {
            const trajetsCamion = trajets.filter(t => t.camion === camion.id);
            const chargesCamion = charges.filter(c => c.camion === camion.id && c.type_charge === 'mensuelle');

            const totalTrajets = trajetsCamion.length;
            const totalRevenus = trajetsCamion.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);
            // ⭐ CALCUL DES FRAIS DE DÉPLACEMENT PAR CAMION
            const fraisDeplacementCamion = trajetsCamion.reduce((sum, t) =>
                sum + parseFloat(t.frais_deplacement || 0), 0);

            // ⭐ CALCUL DES FRAIS SUPPLÉMENTAIRES PAR CAMION
            const fraisSupplementairesCamion = trajetsCamion.reduce((sum, t) =>
                sum + parseFloat(t.total_frais_supplementaires || 0), 0);

            // Calcul des charges par catégorie (uniquement mensuelles)
            const chargesParCategorie = {
                gazoil: chargesCamion.filter(c => c.categorie === 'gazoil')
                    .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0),
                entretien: chargesCamion.filter(c => ['reparation', 'entretien', 'vidange', 'pneumatiques'].includes(c.categorie))
                    .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0),
                jawaz: chargesCamion.filter(c => c.categorie === 'jawaz_autoroute')
                    .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0),
                autres: chargesCamion.filter(c => ['nettoyage', 'autre'].includes(c.categorie))
                    .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0),
                // ⭐ AJOUT DES NOUVELLES CATÉGORIES
                deplacement: trajetsCamion.reduce((sum, t) => sum + parseFloat(t.frais_deplacement || 0), 0),
                frais_supplementaires: trajetsCamion.reduce((sum, t) => sum + parseFloat(t.total_frais_supplementaires || 0), 0)
            };

            const totalCharges = Object.values(chargesParCategorie).reduce((sum, montant) => sum + montant, 0);
            const revenuMoyen = totalTrajets > 0 ? totalRevenus / totalTrajets : 0;
            const bilan = totalRevenus - totalCharges;

            return {
                camion,
                totalTrajets,
                totalRevenus,
                revenuMoyen,
                charges: chargesParCategorie,
                totalCharges,
                bilan,
                // ⭐ AJOUT DES TOTAUX SPÉCIFIQUES POUR AFFICHAGE
                fraisDeplacementCamion,
                fraisSupplementairesCamion
            };
        });
        // ⭐ AJOUT DES TOTAUX GLOBAUX POUR LES FRAIS
        const totalFraisDeplacementGlobal = trajets.reduce((sum, t) =>
            sum + parseFloat(t.frais_deplacement || 0), 0);

        const totalFraisSupplementairesGlobal = trajets.reduce((sum, t) =>
            sum + parseFloat(t.total_frais_supplementaires || 0), 0);
        const camionsPlusActifs = camionsAvecStats
            .sort((a, b) => b.totalTrajets - a.totalTrajets)
            .slice(0, 5);

        // Meilleurs clients par revenus (avec filtrage date)
        const revenusParClient = {};
        trajets.forEach(trajet => {
            if (trajet.client) {
                revenusParClient[trajet.client] = (revenusParClient[trajet.client] || 0) + parseFloat(trajet.prix_trajet || 0);
            }
        });

        const meilleursClients = Object.entries(revenusParClient)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([clientId, revenus]) => ({
                client: clients.find(c => c.id == clientId),
                revenus
            }));

        // Chauffeurs avec frais supplémentaires (avec filtrage date)
        const chauffeurs = employes.filter(emp => emp.type_employe === 'chauffeur');
        const fraisParChauffeur = {};

        trajets.forEach(trajet => {
            if (trajet.chauffeur && trajet.total_frais_supplementaires) {
                const frais = parseFloat(trajet.total_frais_supplementaires || 0);
                if (frais > 0) {
                    fraisParChauffeur[trajet.chauffeur] = (fraisParChauffeur[trajet.chauffeur] || 0) + frais;
                }
            }
        });

        const chauffeursAvecFrais = Object.entries(fraisParChauffeur)
            .sort(([, a], [, b]) => b - a)
            .map(([chauffeurId, frais]) => ({
                chauffeur: chauffeurs.find(c => c.id == chauffeurId),
                frais
            }));

        // Répartition des types de sous-traitance (avec filtrage date)
        const repartitionSousTraitance = {
            interne: trajets.filter(t => t.type_sous_traitance === 'interne').length,
            je_donne: trajets.filter(t => t.type_sous_traitance === 'je_donne').length,
            je_recois: trajets.filter(t => t.type_sous_traitance === 'je_recois').length
        };

        // Statistiques financières (avec filtrage date)
        const totalFraisSupplementaires = trajets.reduce((sum, t) => sum + parseFloat(t.total_frais_supplementaires || 0), 0);
        const totalFraisDeplacement = trajets.reduce((sum, t) => sum + parseFloat(t.frais_deplacement || 0), 0);
        const totalChargesMensuelles = charges.filter(c => c.type_charge === 'mensuelle')
            .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0);
        // ⭐ CALCUL DU TOTAL KILOMÉTRAGE
        const totalKilometrage = charges
            .filter(c => c.categorie === 'gazoil' && c.kilometrage)
            .reduce((sum, charge) => sum + (parseInt(charge.kilometrage) || 0), 0);
        // ⭐ AJOUT : Calcul des totaux réels pour le bilan général
        const totalRevenusReel = trajets.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);
        const totalChargesReel = charges.filter(c => c.type_charge === 'mensuelle')
            .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0);
        const totalGazoilReel = charges.filter(c => c.categorie === 'gazoil')
            .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0);

        // ⭐ AJOUT : Calcul du bénéfice/résultat net
        const resultatNet = totalRevenusReel - totalChargesReel;
        const margeBrute = totalRevenusReel > 0 ? ((resultatNet / totalRevenusReel) * 100) : 0;

        // ⭐ AJOUT : Calcul des totaux pour la ligne finale
        const totalTrajetsCamions = camionsAvecStats.reduce((sum, camion) => sum + camion.totalTrajets, 0);
        const totalRevenusCamions = camionsAvecStats.reduce((sum, camion) => sum + camion.totalRevenus, 0);
        const totalChargesCamions = camionsAvecStats.reduce((sum, camion) => sum + camion.totalCharges, 0);
        const totalBilanCamions = camionsAvecStats.reduce((sum, camion) => sum + camion.bilan, 0);

        // ⭐ AJOUT : Calcul de la performance globale
        const camionsRentables = camionsAvecStats.filter(c => c.bilan >= 0).length;
        const camionsDeficitaires = camionsAvecStats.filter(c => c.bilan < 0).length;
        const tauxRentabilite = camionsAvecStats.length > 0 ?
            (camionsRentables / camionsAvecStats.length) * 100 : 0;


        return {
            camionsAvecStats,
            camionsPlusActifs,
            meilleursClients,
            chauffeursAvecFrais,
            repartitionSousTraitance,
            totalFraisSupplementaires,
            totalFraisDeplacement,
            totalChargesMensuelles,
            totalKilometrage, // ⭐ NOUVEAU : Total kilométrage
            totalRevenus: trajets.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0),
            totalTrajets: trajets.length,
            trajetsInterne: trajets.filter(t => t.type_sous_traitance === 'interne').length,
            trajetsJeDonne: trajets.filter(t => t.type_sous_traitance === 'je_donne').length,
            trajetsJeRecois: trajets.filter(t => t.type_sous_traitance === 'je_recois').length,
            // ⭐ NOUVEAUX TOTAUX POUR LE BILAN GÉNÉRAL
            totalRevenusReel,
            totalChargesReel,
            totalGazoilReel,
            resultatNet,
            margeBrute,
            // ⭐ AJOUT DES NOUVEAUX TOTAUX
            totalFraisDeplacementGlobal,
            totalFraisSupplementairesGlobal,

            // ⭐ TOTAUX POUR LA LIGNE FINALE DES CAMIONS
            totalTrajetsCamions,
            totalRevenusCamions,
            totalChargesCamions,
            totalBilanCamions,

            // ⭐ INDICATEURS DE PERFORMANCE
            camionsRentables,
            camionsDeficitaires,
            tauxRentabilite,
        };
    };
    const genererPDFCamions = async () => {
        setGeneratingPDF(true);
    
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF('landscape');
    
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let yPosition = margin;
    
            // Couleurs
            const primaryColor = [13, 110, 253];
            const successColor = [40, 167, 69];
            const dangerColor = [220, 53, 69];
            const warningColor = [255, 193, 7];
            const grayColor = [108, 117, 125];
    
            // === EN-TÊTE ===
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 45, 'F');
    
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('RAPPORT DÉTAILLÉ DES CAMIONS', pageWidth / 2, 20, { align: 'center' });
    
            doc.setFontSize(11);
            doc.text(getPeriodeText(), pageWidth / 2, 30, { align: 'center' });
            doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 37, { align: 'center' });
    
            yPosition = 50;
    
            // === STATISTIQUES RAPIDES ===
            const statsBoxWidth = (pageWidth - 2 * margin) / 3;
            const statsBoxHeight = 20;
    
            const camionsAffiches = statistiquesDetaillees?.camionsAvecStats || [];
            const camionsRentables = camionsAffiches.filter(c => c.bilan >= 0).length;
            const camionsDeficitaires = camionsAffiches.filter(c => c.bilan < 0).length;
    
            const statsRapides = [
                { label: 'Total Camions', value: camionsAffiches.length, color: primaryColor },
                { label: 'Camions Rentables', value: camionsRentables, color: successColor },
                { label: 'Camions Déficitaires', value: camionsDeficitaires, color: dangerColor }
            ];
    
            statsRapides.forEach((stat, index) => {
                const xPos = margin + (index * statsBoxWidth);
    
                doc.setFillColor(248, 249, 250);
                doc.roundedRect(xPos, yPosition, statsBoxWidth, statsBoxHeight, 3, 3, 'F');
                doc.setDrawColor(stat.color[0], stat.color[1], stat.color[2]);
                doc.setLineWidth(0.5);
                doc.roundedRect(xPos, yPosition, statsBoxWidth, statsBoxHeight, 3, 3);
    
                doc.setFontSize(9);
                doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
                doc.setFont('helvetica', 'bold');
                doc.text(stat.label, xPos + 5, yPosition + 7);
    
                doc.setFontSize(11);
                doc.text(stat.value.toString(), xPos + 5, yPosition + 14);
            });
    
            yPosition += statsBoxHeight + 10;
    
            // === TABLEAU PRINCIPAL ===
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(' DÉTAIL PAR CAMION', margin, yPosition);
            yPosition += 8;
    
            // En-tête du tableau
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
    
            const headers = ['N°', 'Camion', 'Trajets', 'Revenus (DH)', 'Charges (DH)', 'Bénéfice (DH)', 'Marge'];
            const colWidths = [12, 35, 18, 28, 28, 28, 18];
    
            let xPos = margin + 2;
            headers.forEach((header, index) => {
                const align = header.includes('DH') ? 'right' : 'center';
                const width = colWidths[index];
    
                if (align === 'right') {
                    doc.text(header, xPos + width - 2, yPosition + 7, { align: 'right' });
                } else if (align === 'center') {
                    doc.text(header, xPos + width / 2, yPosition + 7, { align: 'center' });
                } else {
                    doc.text(header, xPos + 2, yPosition + 7);
                }
    
                xPos += width;
            });
    
            yPosition += 12;
    
            // Vérifier si on a des données
            if (!camionsAffiches || camionsAffiches.length === 0) {
                doc.setFontSize(12);
                doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
                doc.text('Aucun camion trouvé pour cette période', pageWidth / 2, yPosition + 20, { align: 'center' });
            } else {
                // Données des camions
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
    
                camionsAffiches.forEach((camionStats, index) => {
                    // Vérifier si besoin d'une nouvelle page (avec espace pour les détails)
                    if (yPosition > doc.internal.pageSize.height - 80) {
                        doc.addPage('landscape');
                        yPosition = margin;
    
                        // Réafficher l'en-tête du tableau
                        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                        doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
                        doc.setFontSize(9);
                        doc.setTextColor(255, 255, 255);
    
                        xPos = margin + 2;
                        headers.forEach((header, idx) => {
                            const align = header.includes('DH') ? 'right' : 'center';
                            const width = colWidths[idx];
    
                            if (align === 'right') {
                                doc.text(header, xPos + width - 2, yPosition + 7, { align: 'right' });
                            } else if (align === 'center') {
                                doc.text(header, xPos + width / 2, yPosition + 7, { align: 'center' });
                            } else {
                                doc.text(header, xPos + 2, yPosition + 7);
                            }
    
                            xPos += width;
                        });
    
                        yPosition += 12;
                        doc.setFontSize(8);
                        doc.setTextColor(0, 0, 0);
                    }
    
                    // Fond alterné
                    if (index % 2 === 0) {
                        doc.setFillColor(248, 249, 250);
                        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
                    }
    
                    // Afficher les données principales
                    xPos = margin + 2;
    
                    // N°
                    doc.text((index + 1).toString(), xPos + 6, yPosition + 6, { align: 'center' });
                    xPos += colWidths[0];
    
                    // Camion
                    const immat = camionStats.camion.immatriculation || 'N/A';
                    const marque = camionStats.camion.marque || '';
                    const modele = camionStats.camion.modele || '';
                    doc.text(immat, xPos + 2, yPosition + 6);
                    if (marque || modele) {
                        doc.setFontSize(7);
                        doc.text(`${marque} ${modele}`, xPos + 2, yPosition + 9);
                        doc.setFontSize(8);
                    }
                    xPos += colWidths[1];
    
                    // Trajets
                    doc.text(camionStats.totalTrajets.toString(), xPos + colWidths[2] / 2, yPosition + 6, { align: 'center' });
                    xPos += colWidths[2];
    
                    // Revenus
                    doc.text(camionStats.totalRevenus.toLocaleString() + ' DH', xPos + colWidths[3] - 2, yPosition + 6, { align: 'right' });
                    xPos += colWidths[3];
    
                    // Charges
                    doc.text(camionStats.totalCharges.toLocaleString() + ' DH', xPos + colWidths[4] - 2, yPosition + 6, { align: 'right' });
                    xPos += colWidths[4];
    
                    // Bénéfice
                    const beneficeText = camionStats.bilan.toLocaleString() + ' DH';
                    doc.setTextColor(camionStats.bilan >= 0 ? successColor[0] : dangerColor[0],
                        camionStats.bilan >= 0 ? successColor[1] : dangerColor[1],
                        camionStats.bilan >= 0 ? successColor[2] : dangerColor[2]);
                    doc.setFont('helvetica', 'bold');
                    doc.text(beneficeText, xPos + colWidths[5] - 2, yPosition + 6, { align: 'right' });
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    xPos += colWidths[5];
    
                    // Marge
                    const marge = camionStats.totalRevenus > 0 ? Math.round((camionStats.bilan / camionStats.totalRevenus) * 100) : 0;
                    doc.text(marge + '%', xPos + colWidths[6] / 2, yPosition + 6, { align: 'center' });
    
                    // Ligne séparatrice
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.1);
                    doc.line(margin, yPosition + 8, pageWidth - margin, yPosition + 8);
    
                    yPosition += 10;
    
                    // ⭐⭐ AJOUTER LA SECTION DÉTAILLÉE DES CHARGES ⭐⭐
                    if (camionStats.charges) {
                        yPosition += 2; // Espacement
                        
                        // Ligne de séparation fine
                        doc.setDrawColor(220, 220, 220);
                        doc.setLineWidth(0.2);
                        doc.line(margin + 10, yPosition, margin + 40, yPosition);
                        
                        // Titre détaillé
                        doc.setFontSize(7);
                        doc.setTextColor(100, 100, 100);
                        doc.setFont('helvetica', 'bold');
                        doc.text('Détail charges:', margin + 42, yPosition + 2);
                        
                        // Détail des charges sur 2 colonnes
                        const chargesDetails = [
                            { label: 'Gazoil', value: camionStats.charges.gazoil || 0 },
                            { label: 'Entretien/Réparations', value: camionStats.charges.entretien || 0 },
                            { label: 'Jawaz Autoroute', value: camionStats.charges.jawaz || 0 },
                            { label: 'Autres charges', value: camionStats.charges.autres || 0 },
                            { label: 'Frais de Déplacement', value: camionStats.charges.deplacement || 0 },
                            { label: 'Frais Supplémentaires', value: camionStats.charges.frais_supplementaires || 0 }
                        ];
                        
                        let detailY = yPosition;
                        let detailX = margin + 42;
                        
                        // Afficher les charges sur 2 colonnes
                        chargesDetails.forEach((charge, i) => {
                            const col = Math.floor(i / 3); // 3 lignes par colonne
                            const row = i % 3;
                            
                            const xPos = detailX + (col * 85);
                            const yPos = detailY + 5 + (row * 4);
                            
                            doc.setFontSize(6);
                            doc.setTextColor(80, 80, 80);
                            doc.setFont('helvetica', 'normal');
                            doc.text(charge.label, xPos, yPos);
                            
                            doc.setTextColor(0, 0, 0);
                            doc.setFont('helvetica', 'bold');
                            doc.text(charge.value.toLocaleString() + ' DH', xPos + 50, yPos, { align: 'right' });
                        });
                        
                        // Ligne du total des charges
                        const totalChargesX = detailX + 85;
                        detailY += 17;
                        
                        doc.setDrawColor(150, 150, 150);
                        doc.setLineWidth(0.1);
                        doc.line(totalChargesX, detailY, totalChargesX + 60, detailY);
                        
                        doc.setFontSize(7);
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'bold');
                        doc.text('Total des charges', totalChargesX, detailY + 3);
                        doc.text(camionStats.totalCharges.toLocaleString() + ' DH', totalChargesX + 60, detailY + 3, { align: 'right' });
                        
                        yPosition = detailY + 10;
                    } else {
                        yPosition += 10;
                    }
                });
    
                // === LIGNE DES TOTAUX ===
                if (yPosition > doc.internal.pageSize.height - 50) {
                    doc.addPage('landscape');
                    yPosition = margin;
                }
    
                yPosition += 5;
    
                // Calculer les totaux
                const totalTrajets = camionsAffiches.reduce((sum, camion) => sum + (camion.totalTrajets || 0), 0);
                const revenusTotaux = camionsAffiches.reduce((sum, camion) => sum + (camion.totalRevenus || 0), 0);
                const chargesTotales = camionsAffiches.reduce((sum, camion) => sum + (camion.totalCharges || 0), 0);
                const resultatNet = revenusTotaux - chargesTotales;
                const margeBrute = revenusTotaux > 0 ? ((resultatNet / revenusTotaux) * 100) : 0;
                const tauxRentabilite = camionsAffiches.length > 0 ? 
                    (camionsRentables / camionsAffiches.length) * 100 : 0;
    
                // Fond pour les totaux
                doc.setFillColor(255, 243, 205); // Jaune clair
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F');
                doc.setDrawColor(warningColor[0], warningColor[1], warningColor[2]);
                doc.setLineWidth(0.5);
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 12);
    
                xPos = margin + 2;
    
                // Libellé "TOTAUX"
                doc.setFontSize(10);
                doc.setTextColor(33, 37, 41);
                doc.setFont('helvetica', 'bold');
                doc.text('TOTAUX GÉNÉRAUX', xPos + 2, yPosition + 8);
                xPos += colWidths[0] + colWidths[1];
    
                // Trajets totaux
                doc.text(totalTrajets.toString(), xPos + colWidths[2] / 2, yPosition + 8, { align: 'center' });
                xPos += colWidths[2];
    
                // Revenus totaux
                doc.text(revenusTotaux.toLocaleString() + ' DH', xPos + colWidths[3] - 2, yPosition + 8, { align: 'right' });
                xPos += colWidths[3];
    
                // Charges totales
                doc.text(chargesTotales.toLocaleString() + ' DH', xPos + colWidths[4] - 2, yPosition + 8, { align: 'right' });
                xPos += colWidths[4];
    
                // Résultat net
                doc.setTextColor(resultatNet >= 0 ? successColor[0] : dangerColor[0],
                    resultatNet >= 0 ? successColor[1] : dangerColor[1],
                    resultatNet >= 0 ? successColor[2] : dangerColor[2]);
                doc.setFont('helvetica', 'bold');
                doc.text(resultatNet.toLocaleString() + ' DH', xPos + colWidths[5] - 2, yPosition + 8, { align: 'right' });
                xPos += colWidths[5];
    
                // Marge brute
                doc.setTextColor(0, 0, 0);
                doc.text(margeBrute.toFixed(1) + '%', xPos + colWidths[6] / 2, yPosition + 8, { align: 'center' });
                xPos += colWidths[6];
    
                // Statut global
                // Statut global
const statutGlobal = resultatNet >= 0 ? 'RENTABLE' : 'DÉFICITAIRE';
doc.setFillColor(resultatNet >= 0 ? successColor[0] : dangerColor[0],
    resultatNet >= 0 ? successColor[1] : dangerColor[1],
    resultatNet >= 0 ? successColor[2] : dangerColor[2]);
    
// Positionner correctement le badge (dernière colonne)
const badgeWidth = 24;
const badgeX = xPos + (colWidths[6] - badgeWidth) / 2; // Centrer dans la dernière colonne
doc.roundedRect(badgeX, yPosition + 3, badgeWidth, 6, 2, 2, 'F');

doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
doc.text(statutGlobal, xPos + colWidths[6] / 2, yPosition + 8, { align: 'center' });

// Taux de rentabilité
doc.setFontSize(6);
doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
doc.text(`${tauxRentabilite.toFixed(0)}% des camions`, xPos + colWidths[6] / 2, yPosition + 12, { align: 'center' });
            }
    
            // === PIED DE PAGE ===
            const pageHeight = doc.internal.pageSize.height;
            const pageCount = doc.internal.getNumberOfPages();
    
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
    
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setLineWidth(0.8);
                doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    
                doc.setFontSize(7);
                doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
                doc.setFont('helvetica', 'bold');
    
                doc.text('SYSTÈME DE GESTION LOGISTIQUE - ARS Distribution & ARN Logistique', pageWidth / 2, pageHeight - 23, { align: 'center' });
                doc.text('Rapport généré automatiquement par le système de gestion', pageWidth / 2, pageHeight - 19, { align: 'center' });
    
                doc.text(`Page ${i}/${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
    
            // Sauvegarder le PDF
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().getTime();
            const fileName = `rapport_detaille_camions_${dateStr}_${timeStr}.pdf`;
            doc.save(fileName);
    
        } catch (error) {
            console.error('Erreur lors de la génération du PDF des camions:', error);
            setError('Erreur lors de la génération du rapport PDF');
        } finally {
            setGeneratingPDF(false);
        }
    };

    // ⭐ FONCTIONS DE FILTRAGE POUR LES FACTURES
    const handleFiltreFactureChange = (name, value) => {
        const nouveauxFiltres = {
            ...filtresFactures,
            [name]: value
        };
        setFiltresFactures(nouveauxFiltres);
        appliquerFiltresFactures(nouveauxFiltres);
    };

    const appliquerFiltresFactures = (filtres, facturesSource = factures) => {
        let facturesFiltrees = [...facturesSource];

        // Filtre par client
        if (filtres.client) {
            facturesFiltrees = facturesFiltrees.filter(f => f.client == filtres.client);
        }

        // Filtre par statut
        if (filtres.statut) {
            facturesFiltrees = facturesFiltrees.filter(f => f.statut === filtres.statut);
        }

        // Filtre par entreprise
        if (filtres.entreprise) {
            facturesFiltrees = facturesFiltrees.filter(f => f.entreprise === filtres.entreprise);
        }

        // ⭐ FILTRE PAR DATE FACTURE
        if (filtres.date_debut_facture && filtres.date_fin_facture) {
            facturesFiltrees = facturesFiltrees.filter(facture => {
                const dateFacture = new Date(facture.date_facture);
                const dateDebut = new Date(filtres.date_debut_facture);
                const dateFin = new Date(filtres.date_fin_facture);

                return dateFacture >= dateDebut && dateFacture <= dateFin;
            });
        }

        setFacturesFiltrees(facturesFiltrees);
    };

    const reinitialiserFiltresFactures = () => {
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);

        const nouveauxFiltres = {
            client: '',
            statut: '',
            entreprise: '',
            date_debut_facture: debutMois.toISOString().split('T')[0],
            date_fin_facture: finMois.toISOString().split('T')[0]
        };

        setFiltresFactures(nouveauxFiltres);
        appliquerFiltresFactures(nouveauxFiltres);
    };

    // ⭐ FONCTION POUR GÉNÉRER LE PDF
    // ⭐ FONCTION POUR GÉNÉRER LE PDF (VERSION CORRIGÉE)
    // ⭐ FONCTION POUR GÉNÉRER LE PDF (VERSION AUTOMATIQUE)
    // ⭐ FONCTION POUR GÉNÉRER LE PDF DU DASHBOARD
    // ⭐ FONCTION POUR GÉNÉRER LE PDF DU DASHBOARD (VERSION CORRIGÉE)
    // ⭐ FONCTION POUR GÉNÉRER LE PDF DU DASHBOARD (VERSION AMÉLIORÉE)
    // ⭐ FONCTION POUR GÉNÉRER LE PDF DU DASHBOARD (VERSION INTELLIGENTE)
    // ⭐ FONCTION POUR GÉNÉRER LE PDF DU DASHBOARD (VERSION CORRIGÉE)
    // ⭐ FONCTION POUR GÉNÉRER LE PDF DU DASHBOARD (VERSION COLONNES INTELLIGENTES)
    const genererPDFEtatFactures = async () => {
        setGeneratingPDF(true);

        try {
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF();

            // Configuration des couleurs
            const primaryColor = [41, 128, 185];
            const secondaryColor = [52, 73, 94];
            const accentColor = [46, 204, 113];

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;

            // ⭐ DÉTECTION INTELLIGENTE DES COLONNES NÉCESSAIRES
            let entrepriseDetectee = null;
            let clientDetecte = null;

            if (filtresFactures.entreprise) {
                entrepriseDetectee = filtresFactures.entreprise;
            } else if (facturesFiltrees.length > 0) {
                const entreprises = [...new Set(facturesFiltrees.map(f => f.entreprise))];
                if (entreprises.length === 1) {
                    entrepriseDetectee = entreprises[0];
                }
            }

            if (filtresFactures.client) {
                clientDetecte = clients.find(c => c.id == filtresFactures.client);
            } else if (facturesFiltrees.length > 0) {
                const clientsIds = [...new Set(facturesFiltrees.map(f => f.client))];
                if (clientsIds.length === 1) {
                    clientDetecte = clients.find(c => c.id == clientsIds[0]);
                }
            }

            // DÉTERMINER LES COLONNES À AFFICHER
            const afficherColonneEntreprise = !entrepriseDetectee;
            const afficherColonneClient = !clientDetecte;

            // EN-TÊTE
            doc.setFontSize(20);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAT DES FACTURES', pageWidth / 2, 20, { align: 'center' });

            let yPosition = 35;

            // INFORMATIONS DES FILTRES APPLIQUÉS
            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');

            // ⭐ AFFICHAGE INTELLIGENT DES INFORMATIONS
            let infoLines = [];

            if (clientDetecte) {
                infoLines.push(`Client: ${clientDetecte.nom}`);
            }

            if (entrepriseDetectee) {
                const entrepriseText = entrepriseDetectee === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique';
                infoLines.push(`Entreprise: ${entrepriseText}`);
            }

            if (filtresFactures.date_debut_facture && filtresFactures.date_fin_facture) {
                const dateDebut = new Date(filtresFactures.date_debut_facture).toLocaleDateString('fr-FR');
                const dateFin = new Date(filtresFactures.date_fin_facture).toLocaleDateString('fr-FR');
                infoLines.push(`Période: Du ${dateDebut} au ${dateFin}`);
            }

            if (filtresFactures.statut) {
                const statutText = {
                    'payee': 'Payées',
                    'envoyee': 'Envoyées',
                    'brouillon': 'Brouillons'
                }[filtresFactures.statut] || filtresFactures.statut;
                infoLines.push(`Statut: ${statutText}`);
            }

            // Afficher les informations
            infoLines.forEach((line, index) => {
                doc.text(line, margin, yPosition + (index * 5));
            });

            yPosition += (infoLines.length * 5) + 5;

            // RÉSUMÉ STATISTIQUE
            const totalFactures = facturesFiltrees.length;
            const totalMontant = facturesFiltrees.reduce((sum, facture) => sum + parseFloat(facture.total_ttc || 0), 0);
            const facturesPayees = facturesFiltrees.filter(f => f.statut === 'payee').length;

            doc.setFontSize(9);
            doc.text(`Nombre de factures: ${totalFactures}`, margin, yPosition);
            doc.text(`Factures payées: ${facturesPayees}`, pageWidth / 2, yPosition);
            doc.text(`Total: ${totalMontant.toFixed(2)} DH`, pageWidth - margin, yPosition, { align: 'right' });

            yPosition += 10;

            // LIGNE DE SÉPARATION
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 15;

            // ⭐ CONFIGURATION DYNAMIQUE DES COLONNES AVEC CENTRAGE
            let colWidths = [];
            let colonnes = [];

            // Largeurs fixes et optimisées
            colWidths.push(38); // N° Facture
            colonnes.push('N° Facture');

            colWidths.push(22); // Date
            colonnes.push('Date');

            // Client avec largeur adaptative
            if (afficherColonneClient) {
                colWidths.push(55);
                colonnes.push('Client');
            }

            // Entreprise avec largeur réduite
            if (afficherColonneEntreprise) {
                colWidths.push(35);
                colonnes.push('Entreprise');
            }

            // Montant et Statut
            colWidths.push(28);
            colonnes.push('Montant TTC');

            colWidths.push(27);
            colonnes.push('Statut');

            // ⭐ CALCUL DU CENTRAGE DU TABLEAU
            const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
            const tableMargin = (pageWidth - totalWidth) / 2;

            // Positions X centrées
            let positionsX = [tableMargin + 2];
            for (let i = 1; i < colWidths.length; i++) {
                positionsX.push(positionsX[i - 1] + colWidths[i - 1]);
            }

            // EN-TÊTE DU TABLEAU CENTRÉ
            doc.setFillColor(...primaryColor);
            doc.rect(tableMargin, yPosition, totalWidth, 10, 'F');

            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');

            // Afficher les en-têtes avec positions centrées
            colonnes.forEach((colonne, index) => {
                const xPos = positionsX[index];
                const width = colWidths[index];

                let align = 'left';
                if (colonne === 'Montant TTC') align = 'right';
                if (colonne === 'Statut') align = 'center';

                // Calculer la position X en fonction de l'alignement
                let textX = xPos + 2;
                if (align === 'right') textX = xPos + width - 2;
                if (align === 'center') textX = xPos + width / 2;

                doc.text(colonne, textX, yPosition + 7, { align });
            });

            yPosition += 12;

            // LIGNES DES FACTURES AVEC TABLEAU CENTRÉ
            doc.setFontSize(8);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'normal');

            facturesFiltrees.forEach((facture, index) => {
                const client = clients.find(c => c.id === facture.client);
                const entrepriseText = facture.entreprise === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique';

                // ⭐ PRÉPARATION DE TOUS LES TEXTES AVEC GESTION MULTI-LIGNES
                const cellules = {};

                // N° Facture
                cellules['N° Facture'] = {
                    text: [facture.numero_facture || 'N/A'],
                    align: 'left'
                };

                // Date
                cellules['Date'] = {
                    text: [facture.date_facture || 'N/A'],
                    align: 'left'
                };

                // Client (si affiché)
                if (afficherColonneClient) {
                    const nomClient = client?.nom || 'N/A';
                    const maxWidth = colWidths[colonnes.indexOf('Client')] - 4;
                    cellules['Client'] = {
                        text: doc.splitTextToSize(nomClient, maxWidth),
                        align: 'left'
                    };
                }

                // Entreprise (si affiché)
                if (afficherColonneEntreprise) {
                    const maxWidth = colWidths[colonnes.indexOf('Entreprise')] - 4;
                    cellules['Entreprise'] = {
                        text: doc.splitTextToSize(entrepriseText, maxWidth),
                        align: 'left'
                    };
                }

                // Montant TTC
                cellules['Montant TTC'] = {
                    text: [`${parseFloat(facture.total_ttc || 0).toFixed(2)} DH`],
                    align: 'right'
                };

                // Statut
                cellules['Statut'] = {
                    text: [facture.statut === 'payee' ? 'PAYÉE' :
                        facture.statut === 'envoyee' ? 'ENVOYÉE' : 'BROUILLON'],
                    align: 'center'
                };

                // ⭐ CALCUL DE LA HAUTEUR DE LIGNE
                let ligneHeight = 8;
                colonnes.forEach(colonne => {
                    if (cellules[colonne]) {
                        const nbLignes = cellules[colonne].text.length;
                        const hauteurCellule = Math.max(8, nbLignes * 3.5);
                        ligneHeight = Math.max(ligneHeight, hauteurCellule);
                    }
                });

                // Vérifier si on dépasse la page
                if (yPosition + ligneHeight > doc.internal.pageSize.height - 40) {
                    doc.addPage();
                    yPosition = 30;

                    // Réafficher l'en-tête du tableau centré
                    doc.setFillColor(...primaryColor);
                    doc.rect(tableMargin, yPosition, totalWidth, 10, 'F');
                    doc.setFontSize(9);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');

                    colonnes.forEach((colonne, idx) => {
                        const xPos = positionsX[idx];
                        const width = colWidths[idx];

                        let align = 'left';
                        if (colonne === 'Montant TTC') align = 'right';
                        if (colonne === 'Statut') align = 'center';

                        let textX = xPos + 2;
                        if (align === 'right') textX = xPos + width - 2;
                        if (align === 'center') textX = xPos + width / 2;

                        doc.text(colonne, textX, yPosition + 7, { align });
                    });

                    yPosition += 12;
                    doc.setFontSize(8);
                    doc.setTextColor(...secondaryColor);
                    doc.setFont('helvetica', 'normal');
                }

                // Fond alterné pour les lignes (centré)
                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(tableMargin, yPosition, totalWidth, ligneHeight, 'F');
                }

                // ⭐ AFFICHAGE DES CELLULES AVEC POSITIONNEMENT CENTRÉ
                colonnes.forEach((colonne, colIndex) => {
                    const xPos = positionsX[colIndex];
                    const width = colWidths[colIndex];
                    const cellule = cellules[colonne];

                    if (!cellule) return;

                    const { text, align } = cellule;

                    // Cas spécial pour le statut (avec couleur)
                    if (colonne === 'Statut') {
                        const statutColor = facture.statut === 'payee' ? accentColor :
                            facture.statut === 'envoyee' ? [255, 193, 7] : [108, 117, 125];

                        doc.setFillColor(...statutColor);
                        const statutWidth = 18;
                        const statutHeight = 5;
                        const statutX = xPos + (width - statutWidth) / 2;
                        const statutY = yPosition + (ligneHeight / 2) - (statutHeight / 2);

                        doc.roundedRect(statutX, statutY, statutWidth, statutHeight, 2, 2, 'F');

                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(7);
                        doc.text(text[0], xPos + width / 2, yPosition + (ligneHeight / 2) + 1, { align: 'center' });
                        doc.setTextColor(...secondaryColor);
                        doc.setFontSize(8);
                    }
                    // Cas normal pour les autres colonnes
                    else {
                        text.forEach((ligne, ligneIndex) => {
                            let textX = xPos + 2;
                            let textY = yPosition + 6 + (ligneIndex * 3.5);

                            if (align === 'right') {
                                textX = xPos + width - 2;
                                doc.text(ligne, textX, textY, { align: 'right' });
                            } else if (align === 'center') {
                                textX = xPos + width / 2;
                                doc.text(ligne, textX, textY, { align: 'center' });
                            } else {
                                doc.text(ligne, textX, textY);
                            }
                        });
                    }
                });

                // Ligne séparatrice (centrée)
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.1);
                doc.line(tableMargin, yPosition + ligneHeight, tableMargin + totalWidth, yPosition + ligneHeight);

                yPosition += ligneHeight + 2;
            });

            // Vérifier l'espace pour les totaux
            if (yPosition > doc.internal.pageSize.height - 50) {
                doc.addPage();
                yPosition = 30;
            }

            // ⭐ TOTAUX CENTRÉS
            yPosition += 10;

            // Cadre pour les totaux (centré)
            const totalBoxWidth = 80;
            const totalBoxX = (pageWidth - totalBoxWidth) / 2;

            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.8);
            doc.rect(totalBoxX, yPosition, totalBoxWidth, 25);

            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL FACTURES:', totalBoxX + 5, yPosition + 8);
            doc.setFontSize(12);
            doc.setTextColor(...accentColor);
            doc.text('TOTAL MONTANT:', totalBoxX + 5, yPosition + 18);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(10);
            doc.text(`${totalFactures}`, totalBoxX + totalBoxWidth - 5, yPosition + 8, { align: 'right' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${totalMontant.toFixed(2)} DH`, totalBoxX + totalBoxWidth - 5, yPosition + 18, { align: 'right' });

            // PIED DE PAGE
            const pageHeight = doc.internal.pageSize.height;
            const pageCount = doc.internal.getNumberOfPages();

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Ligne de séparation
                doc.setDrawColor(...primaryColor);
                doc.setLineWidth(0.8);
                doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

                doc.setFontSize(7);
                doc.setTextColor(...secondaryColor);
                doc.setFont('helvetica', 'bold');

                if (!entrepriseDetectee) {
                    doc.text('SYSTÈME DE GESTION LOGISTIQUE', pageWidth / 2, pageHeight - 23, { align: 'center' });
                    doc.text('ARS Distribution & ARN Logistique', pageWidth / 2, pageHeight - 19, { align: 'center' });
                } else if (entrepriseDetectee === 'ars_distribution') {
                    doc.text('ARS DISTRIBUTION - Bd Moulay Ismail Bloc 20 NO.57 Casablanca', pageWidth / 2, pageHeight - 23, { align: 'center' });
                    doc.text('Tél: +212 661-638266 | E-mail: ars.distribution1@gmail.com', pageWidth / 2, pageHeight - 19, { align: 'center' });
                } else {
                    doc.text('ARN LOGISTIC - 228, bd Mohamed V 7ème étage Bureau 200 Casablanca', pageWidth / 2, pageHeight - 23, { align: 'center' });
                    doc.text('Tél: +212 661-638266 | E-mail: adli.rachid@homail.fr', pageWidth / 2, pageHeight - 19, { align: 'center' });
                }

                // Numéro de page
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i}/${pageCount} - ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
            }

            // SAUVEGARDER
            const fileName = `etat_factures_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            setError('Erreur lors de la génération du PDF');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const filtrerTrajetsParDate = (trajets) => {
        return trajets.filter(trajet => {
            const dateTrajet = new Date(trajet.date);
            const dateDebut = new Date(filtres.date_debut);
            const dateFin = new Date(filtres.date_fin);

            return dateTrajet >= dateDebut && dateTrajet <= dateFin;
        });
    };

    const filtrerChargesParDate = (charges) => {
        return charges.filter(charge => {
            const dateCharge = new Date(charge.date_charge);
            const dateDebut = new Date(filtres.date_debut);
            const dateFin = new Date(filtres.date_fin);

            return dateCharge >= dateDebut && dateCharge <= dateFin;
        });
    };

    const handleFiltreChange = (e) => {
        const { name, value } = e.target;
        setFiltres(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const appliquerFiltres = (e) => {
        e.preventDefault();
        fetchStats();
    };

    const reinitialiserFiltres = () => {
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);

        setFiltres({
            date_debut: debutMois.toISOString().split('T')[0],
            date_fin: finMois.toISOString().split('T')[0]
        });
    };

    const handleShowDetailsCamion = (camionStats) => {
        setCamionSelectionne(camionStats.camion);
        setStatistiquesCamion(camionStats);
        setShowDetailsCamion(true);
    };

    const getPeriodeText = () => {
        if (filtres.date_debut && filtres.date_fin) {
            const debut = new Date(filtres.date_debut);
            const fin = new Date(filtres.date_fin);

            if (debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear()) {
                return `Mois: ${debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
            }

            return `Période: ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}`;
        }
        return 'Période: Toutes dates';
    };

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
                <p className="mt-2">Chargement des données...</p>
            </Container>
        );
    }

    // Préparer les données pour les graphiques
    const dataChauffeursFrais = statistiquesDetaillees?.chauffeursAvecFrais?.map(item => ({
        label: item.chauffeur ? `${item.chauffeur.prenom} ${item.chauffeur.nom}` : 'Chauffeur inconnu',
        value: item.frais
    })) || [];

    const dataMeilleursClients = statistiquesDetaillees?.meilleursClients?.map(item => ({
        label: item.client ? item.client.nom : 'Client inconnu',
        value: item.revenus
    })) || [];

    const dataRepartitionFactures = statistiquesDetaillees?.repartitionFactures ? [
        { label: 'Payées', value: statistiquesDetaillees.repartitionFactures.payee },
        { label: 'Envoyées', value: statistiquesDetaillees.repartitionFactures.envoyee },
        { label: 'Brouillons', value: statistiquesDetaillees.repartitionFactures.brouillon },
        { label: 'Annulées', value: statistiquesDetaillees.repartitionFactures.annulee }
    ] : [];

    return (
        <Container fluid className="px-2 px-md-4 py-3">
            {/* En-tête */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
                <div className="mb-2 mb-md-0">
                    <h1 className="h3 mb-1">
                        {isFacturation ? '🧾 Tableau de Bord Facturation' : '📊 Tableau de Bord'}
                    </h1>
                    <p className="text-muted mb-0 small">{getPeriodeText()}</p>
                </div>
                <Badge bg="primary" className="fs-6">
                    {new Date().toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </Badge>
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Filtres de période */}
            <Card className="mb-3">
                <Card.Header className="py-2">
                    <h6 className="mb-0">🔍 Filtres de Période</h6>
                </Card.Header>
                <Card.Body className="py-3">
                    <Form onSubmit={appliquerFiltres}>
                        <Row>
                            <Col xs={12} md={3} className="mb-2 mb-md-0">
                                <Form.Group>
                                    <Form.Label className="small">Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_debut"
                                        value={filtres.date_debut}
                                        onChange={handleFiltreChange}
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={3} className="mb-2 mb-md-0">
                                <Form.Group>
                                    <Form.Label className="small">Date de fin</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_fin"
                                        value={filtres.date_fin}
                                        onChange={handleFiltreChange}
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={6} className="d-flex flex-column flex-md-row align-items-end gap-2">
                                <div className="d-flex gap-2 w-100 w-md-auto">
                                    <Button type="submit" variant="primary" size="sm" className="flex-fill">
                                        🔄 Appliquer
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" onClick={reinitialiserFiltres} className="flex-fill">
                                        📅 Ce mois
                                    </Button>
                                </div>
                                <div className="ms-md-auto mt-2 mt-md-0">
                                    <Badge bg="info" className="fs-6">
                                        {isFacturation
                                            ? `${statistiquesDetaillees?.totalFactures || 0} factures`
                                            : `${statistiquesDetaillees?.totalTrajets || 0} trajets`
                                        }
                                    </Badge>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Cartes de statistiques principales - ADAPTÉES */}
            <Row className="g-2 mb-3">
                {!isFacturation && canAccessCamions && (
                    <Col xs={6} sm={4} md={2}>
                        <Card className="text-center border-primary shadow-sm h-100">
                            <Card.Body className="p-2">
                                <div className="text-primary mb-1" style={{ fontSize: '1.5rem' }}>🚛</div>
                                <Card.Title className="mb-1" style={{ fontSize: '12px' }}>Trajets</Card.Title>
                                <h6 className="text-primary mb-0">{stats.trajets}</h6>
                                <small className="text-muted" style={{ fontSize: '10px' }}>Période</small>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

             
                <Col xs={6} sm={4} md={2}>
                    <Card className="text-center border-info shadow-sm h-100">
                        <Card.Body className="p-2">
                            <div className="text-info mb-1" style={{ fontSize: '1.5rem' }}>
                                {isFacturation ? '🧾' : '🏁'}
                            </div>
                            <Card.Title className="mb-1" style={{ fontSize: '12px' }}>
                                {isFacturation ? 'Factures' : 'Frais Déplacement'}
                            </Card.Title>
                            <h6 className="text-info mb-0">
                                {isFacturation ?
                                    `${statistiquesDetaillees?.totalFactures || 0}` : `${statistiquesDetaillees?.totalFraisDeplacement?.toLocaleString() || 0} DH` // Avec "DH" pour autres
                                }
                            </h6>
                            {!isFacturation && (
                                <small className="text-muted" style={{ fontSize: '10px' }}>Chauffeurs</small>
                            )}
                        </Card.Body>
                    </Card>
                </Col>



                {/* ⭐ CARTES SPÉCIFIQUES FACTURATION */}
                {isFacturation && (
                    <>
                        <Col xs={6} sm={4} md={2}>
                            <Card className="text-center border-success shadow-sm h-100">
                                <Card.Body className="p-2">
                                    <div className="text-success mb-1" style={{ fontSize: '1.5rem' }}>✅</div>
                                    <Card.Title className="mb-1" style={{ fontSize: '12px' }}>Factures Payées</Card.Title>
                                    <h6 className="text-success mb-0">{stats.facturesPayees}</h6>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>Période</small>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xs={6} sm={4} md={2}>
                            <Card className="text-center border-primary shadow-sm h-100">
                                <Card.Body className="p-2">
                                    <div className="text-primary mb-1" style={{ fontSize: '1.5rem' }}>📤</div>
                                    <Card.Title className="mb-1" style={{ fontSize: '12px' }}>Factures Envoyées</Card.Title>
                                    <h6 className="text-primary mb-0">{stats.facturesEnvoyees}</h6>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>En attente</small>
                                </Card.Body>
                            </Card>
                        </Col>


                    </>
                )}

                {/* Cartes pour admin/employé */}
                {!isFacturation && (
                    <>
                        <Col xs={6} sm={4} md={2}>
                            <Card className="text-center border-danger shadow-sm h-100">
                                <Card.Body className="p-2">
                                    <div className="text-danger mb-1" style={{ fontSize: '1.5rem' }}>💸</div>
                                    <Card.Title className="mb-1" style={{ fontSize: '12px' }}>Frais Suppl.</Card.Title>
                                    <h6 className="text-danger mb-0">
                                        {statistiquesDetaillees?.totalFraisSupplementaires?.toLocaleString() || 0} DH
                                    </h6>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>Total</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} md={2}>
                            <Card className="text-center border-secondary shadow-sm h-100">
                                <Card.Body className="p-2">
                                    <div className="text-secondary mb-1" style={{ fontSize: '1.5rem' }}>⚡</div>
                                    <Card.Title className="mb-1" style={{ fontSize: '12px' }}>Charges Mens.</Card.Title>
                                    <h6 className="text-secondary mb-0">
                                        {(
                                            (statistiquesDetaillees?.totalChargesMensuelles || 0) -
                                            (statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) =>
                                                total + (camion.charges?.gazoil || 0), 0) || 0)
                                        ).toLocaleString()} DH
                                    </h6>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>Période</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} md={2}>
                            <Card className="text-center border-secondary shadow-sm h-100">
                                <Card.Body className="p-2">
                                    <div className="text-secondary mb-1" style={{ fontSize: '1.5rem' }}>⛽</div>
                                    <Card.Title className="mb-1" style={{ fontSize: '12px' }}>Gazoil</Card.Title>
                                    <h6 className="text-secondary mb-0">
                                        {/* ⭐ CALCULER LE TOTAL DU GAZOIL */}
                                        {statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) =>
                                            total + (camion.charges?.gazoil || 0), 0)?.toLocaleString() || 0} DH
                                    </h6>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>Période</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>

            {/* ⭐ SECTION FACTURES POUR AGENT FACTURATION */}
            {isFacturation && (
                <Row className="g-3 mb-3">
                    <Col xs={12}>
                        <Card>
                            <Card.Header className="py-2 d-flex justify-content-between align-items-center">
                                <h6 className="mb-0" style={{ fontSize: '14px' }}>📋 Aperçu des Factures</h6>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={genererPDFEtatFactures}
                                        disabled={generatingPDF || facturesFiltrees.length === 0}
                                    >
                                        {generatingPDF ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Génération...
                                            </>
                                        ) : (
                                            <>📄 Exporter</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => window.location.href = '/facturation'}
                                    >
                                        Voir toutes les factures
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="py-3">
                                {/* Filtres factures */}
                                <Row className="mb-3">
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small">Client</Form.Label>
                                            <Form.Select
                                                value={filtresFactures.client}
                                                onChange={(e) => handleFiltreFactureChange('client', e.target.value)}
                                                size="sm"
                                            >
                                                <option value="">Tous les clients</option>
                                                {clients.map(client => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.nom}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label className="small">Statut</Form.Label>
                                            <Form.Select
                                                value={filtresFactures.statut}
                                                onChange={(e) => handleFiltreFactureChange('statut', e.target.value)}
                                                size="sm"
                                            >
                                                <option value="">Tous les statuts</option>
                                                <option value="payee">Payée</option>
                                                <option value="envoyee">Envoyée</option>
                                                <option value="brouillon">Brouillon</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label className="small">Entreprise</Form.Label>
                                            <Form.Select
                                                value={filtresFactures.entreprise}
                                                onChange={(e) => handleFiltreFactureChange('entreprise', e.target.value)}
                                                size="sm"
                                            >
                                                <option value="">Toutes</option>
                                                <option value="ars_distribution">ARS Distribution</option>
                                                <option value="arn_logistique">ARN Logistique</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label className="small">Date début</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={filtresFactures.date_debut_facture}
                                                onChange={(e) => handleFiltreFactureChange('date_debut_facture', e.target.value)}
                                                size="sm"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label className="small">Date fin</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={filtresFactures.date_fin_facture}
                                                onChange={(e) => handleFiltreFactureChange('date_fin_facture', e.target.value)}
                                                size="sm"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={1} className="d-flex align-items-end">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={reinitialiserFiltresFactures}
                                            title="Réinitialiser les filtres"
                                        >
                                            🔄
                                        </Button>
                                    </Col>
                                </Row>

                                {/* Résumé des filtres */}
                                {(filtresFactures.client || filtresFactures.statut || filtresFactures.entreprise ||
                                    filtresFactures.date_debut_facture || filtresFactures.date_fin_facture) && (
                                        <Alert variant="info" className="py-2 mb-3">
                                            <small>
                                                <strong>Filtres appliqués:</strong>
                                                {filtresFactures.client && ` Client: ${clients.find(c => c.id == filtresFactures.client)?.nom}`}
                                                {filtresFactures.statut && ` Statut: ${filtresFactures.statut}`}
                                                {filtresFactures.entreprise && ` Entreprise: ${filtresFactures.entreprise === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique'}`}
                                                {filtresFactures.date_debut_facture && filtresFactures.date_fin_facture &&
                                                    ` Période: ${new Date(filtresFactures.date_debut_facture).toLocaleDateString('fr-FR')} au ${new Date(filtresFactures.date_fin_facture).toLocaleDateString('fr-FR')}`
                                                }
                                                {` (${facturesFiltrees.length} facture(s) trouvée(s))`}
                                            </small>
                                        </Alert>
                                    )}

                                {/* Tableau factures - VERSION RESPONSIVE */}
                                <div className="table-responsive" style={{
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '0.375rem'
                                }}>
                                    {/* Version desktop - inchangée */}
                                    <Table striped bordered hover size="sm" className="d-none d-md-table" style={{ marginBottom: 0 }}>
                                        <thead style={{
                                            position: 'sticky',
                                            top: 0,
                                            backgroundColor: 'white',
                                            zIndex: 1
                                        }}>
                                            <tr>
                                                <th>N° Facture</th>
                                                <th>Client</th>
                                                <th>Date</th>
                                                <th>Échéance</th>
                                                <th>Montant TTC</th>
                                                <th>Statut</th>
                                                <th>Entreprise</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {facturesFiltrees.map(facture => {
                                                const client = clients.find(c => c.id === facture.client);
                                                return (
                                                    <tr key={facture.id}>
                                                        <td><strong>{facture.numero_facture}</strong></td>
                                                        <td>{client?.nom || 'N/A'}</td>
                                                        <td>{facture.date_facture}</td>
                                                        <td>{facture.date_echeance}</td>
                                                        <td><strong>{parseFloat(facture.total_ttc || 0).toLocaleString()} DH</strong></td>
                                                        <td>
                                                            <Badge bg={
                                                                facture.statut === 'payee' ? 'success' :
                                                                    facture.statut === 'envoyee' ? 'warning' :
                                                                        facture.statut === 'brouillon' ? 'secondary' : 'danger'
                                                            }>
                                                                {facture.statut === 'payee' ? 'Payée' :
                                                                    facture.statut === 'envoyee' ? 'Envoyée' :
                                                                        facture.statut === 'brouillon' ? 'Brouillon' : 'Annulée'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge bg="info">
                                                                {facture.entreprise === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>

                                    {/* Version mobile - visible seulement sur mobile */}
                                    <div className="d-md-none">
                                        {facturesFiltrees.map((facture, index) => {
                                            const client = clients.find(c => c.id === facture.client);
                                            return (
                                                <Card key={facture.id} className="mb-2 border-0 shadow-sm">
                                                    <Card.Body className="p-3">
                                                        {/* En-tête avec numéro facture et statut */}
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h6 className="text-primary mb-1">#{facture.numero_facture}</h6>
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <small className="text-muted">{client?.nom || 'N/A'}</small>
                                                                </div>
                                                            </div>
                                                            <Badge bg={
                                                                facture.statut === 'payee' ? 'success' :
                                                                    facture.statut === 'envoyee' ? 'warning' :
                                                                        facture.statut === 'brouillon' ? 'secondary' : 'danger'
                                                            }>
                                                                {facture.statut === 'payee' ? 'Payée' :
                                                                    facture.statut === 'envoyee' ? 'Envoyée' :
                                                                        facture.statut === 'brouillon' ? 'Brouillon' : 'Annulée'}
                                                            </Badge>
                                                        </div>

                                                        {/* Dates */}
                                                        <Row className="g-2 mb-2">
                                                            <Col xs={6}>
                                                                <div className="text-center p-2 bg-light rounded">
                                                                    <small className="text-muted d-block">Date</small>
                                                                    <strong>{facture.date_facture}</strong>
                                                                </div>
                                                            </Col>
                                                            <Col xs={6}>
                                                                <div className="text-center p-2 bg-light rounded">
                                                                    <small className="text-muted d-block">Échéance</small>
                                                                    <strong>{facture.date_echeance}</strong>
                                                                </div>
                                                            </Col>
                                                        </Row>

                                                        {/* Montant */}
                                                        <div className="mb-2 p-2 bg-success bg-opacity-10 rounded">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small className="text-muted">Montant TTC</small>
                                                                <h6 className="text-success mb-0">
                                                                    {parseFloat(facture.total_ttc || 0).toLocaleString()} DH
                                                                </h6>
                                                            </div>
                                                        </div>

                                                        {/* Entreprise */}
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <Badge bg="info">
                                                                {facture.entreprise === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique'}
                                                            </Badge>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>

                                {facturesFiltrees.length === 0 && (
                                    <div className="text-center text-muted py-3">
                                        <p>Aucune facture trouvée avec les critères sélectionnés</p>
                                    </div>
                                )}

                                {facturesFiltrees.length > 0 && (
                                    <div className="mt-3 p-2 bg-light rounded">
                                        <Row>
                                            <Col md={6}>
                                                <small className="text-muted">
                                                    Affichage des {Math.min(10, facturesFiltrees.length)} premières factures sur {facturesFiltrees.length}
                                                </small>
                                            </Col>
                                            <Col md={6} className="text-end">
                                                <strong>
                                                    Total: {facturesFiltrees.reduce((sum, f) => sum + parseFloat(f.total_ttc || 0), 0).toLocaleString()} DH
                                                </strong>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Graphiques et statistiques détaillées */}
            {statistiquesDetaillees && (
                <>
                    <Row className="g-3 mb-3">
                        {!isFacturation && (
                            <Col xs={12} lg={6}>
                                <HorizontalBarChart
                                    data={dataMeilleursClients}
                                    title="⭐ Revenus par Client (DH)"
                                    color="#28a745"
                                    height={280}
                                />
                            </Col>
                        )}
                        {!isFacturation && (
                            <Col xs={12} lg={6}>
                                <HorizontalBarChart
                                    data={dataChauffeursFrais}
                                    title="💸 Frais Supplémentaires par Chauffeur (DH)"
                                    color="#dc3545"
                                    height={280}
                                />
                            </Col>
                        )}
                    </Row>

                    {/* Section adaptée selon le rôle */}
                    {!isFacturation && canAccessCamions && statistiquesDetaillees.camionsAvecStats && (
                        <Row className="g-3 mb-3">
                            <Col xs={12}>
                                <Card>
                                    <Card.Header className="py-2">
                                        <h6 className="mb-0" style={{ fontSize: '14px' }}>🚛 Situation des Camions</h6>
                                    </Card.Header>
                                    <Card.Body className="py-3">
                                        <div className="table-responsive">
                                            {/* Tableau situation camions - VERSION AMÉLIORÉE */}
                                            <Table striped bordered hover size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Camion</th>
                                                        <th className="text-center">Trajets</th>
                                                        <th className="text-end">Revenus</th>
                                                        <th className="text-end">Charges</th>
                                                        <th className="text-end">Bénéfice</th>
                                                        <th className="text-center">Marge</th>
                                                        <th className="text-center">Rentable</th>
                                                        <th className="text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {statistiquesDetaillees.camionsAvecStats.map((camionStats, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <strong>{camionStats.camion.immatriculation}</strong>
                                                                <br />
                                                                <small className="text-muted">
                                                                    {camionStats.camion.marque} {camionStats.camion.modele}
                                                                </small>
                                                            </td>
                                                            <td className="text-center">
                                                                <Badge bg="primary">{camionStats.totalTrajets}</Badge>
                                                                {camionStats.totalTrajets > 0 && (
                                                                    <small className="d-block text-muted" style={{ fontSize: '10px' }}>

                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <span className="text-success">
                                                                    {camionStats.totalRevenus.toLocaleString()} DH
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <span className="text-danger">
                                                                    {camionStats.totalCharges.toLocaleString()} DH
                                                                </span>

                                                            </td>
                                                            <td className="text-end">
                                                                <strong className={camionStats.bilan >= 0 ? 'text-success' : 'text-danger'}>
                                                                    {camionStats.bilan.toLocaleString()} DH
                                                                </strong>
                                                            </td>
                                                            <td className="text-center">
                                                                {camionStats.totalRevenus > 0 ? (
                                                                    <span className="badge bg-light text-dark border">
                                                                        {Math.round((camionStats.bilan / camionStats.totalRevenus) * 100)}%
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-secondary">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                <Badge bg={camionStats.bilan >= 0 ? 'success' : 'danger'}>
                                                                    {camionStats.bilan >= 0 ? '✅ Oui' : '❌ Non'}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-center">
                                                                <Button
                                                                    variant="outline-info"
                                                                    size="sm"
                                                                    onClick={() => handleShowDetailsCamion(camionStats)}
                                                                >
                                                                    📊 Détails
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {/* ⭐ LIGNE DES TOTAUX GÉNÉRAUX */}
                                                    {/* ⭐ LIGNE DES TOTAUX GÉNÉRAUX - COULEUR MODIFIÉE */}
                                                    {/* LIGNE DES TOTAUX GÉNÉRAUX - CALCUL SIMPLE */}
                                                    <tr className="table-warning" style={{ fontWeight: 'bold' }}>
                                                        <td>
                                                            <strong>📊 TOTAUX GÉNÉRAUX</strong>
                                                            <br />

                                                        </td>

                                                        {/* Trajets totaux */}
                                                        <td className="text-center align-middle">
                                                            <Badge bg="info">
                                                                {/* Calculer la somme des trajets des camions affichés */}
                                                                {statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.totalTrajets || 0), 0) || 0}
                                                            </Badge>
                                                        </td>

                                                        {/* Revenus totaux */}
                                                        <td className="text-end align-middle">
                                                            <span className="text-success">
                                                                {/* Calculer la somme des revenus des camions affichés */}
                                                                {statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.totalRevenus || 0), 0).toLocaleString() || '0'} DH
                                                            </span>
                                                        </td>

                                                        {/* Charges totales */}
                                                        <td className="text-end align-middle">
                                                            <span className="text-danger">
                                                                {/* Calculer la somme des charges des camions affichés */}
                                                                {statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.totalCharges || 0), 0).toLocaleString() || '0'} DH
                                                            </span>
                                                            <small className="d-block text-muted" style={{ fontSize: '10px' }}>
                                                                Gazoil: {statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.charges?.gazoil || 0), 0).toLocaleString() || '0'} DH
                                                            </small>
                                                        </td>

                                                        {/* Bénéfice total */}
                                                        <td className="text-end align-middle">
                                                            <strong className={
                                                                (statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.bilan || 0), 0) >= 0)
                                                                    ? 'text-success'
                                                                    : 'text-danger'
                                                            }>
                                                                {/* Calculer la somme des bénéfices des camions affichés */}
                                                                {statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.bilan || 0), 0).toLocaleString() || '0'} DH
                                                            </strong>
                                                        </td>

                                                        {/* Marge moyenne */}
                                                        <td className="text-center align-middle">
                                                            <span className="badge bg-light text-dark border">
                                                                {(() => {
                                                                    const totalRevenus = statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.totalRevenus || 0), 0) || 0;
                                                                    const totalBilan = statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.bilan || 0), 0) || 0;
                                                                    return totalRevenus > 0 ? `${((totalBilan / totalRevenus) * 100).toFixed(1)}%` : '0%';
                                                                })()}
                                                            </span>
                                                        </td>

                                                        {/* Statut global */}
                                                        <td className="text-center align-middle">
                                                            <Badge bg={
                                                                (statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.bilan || 0), 0) >= 0)
                                                                    ? 'success'
                                                                    : 'danger'
                                                            }>
                                                                {(statistiquesDetaillees?.camionsAvecStats?.reduce((total, camion) => total + (camion.bilan || 0), 0) >= 0) ? '✅ Oui' : '❌ Non'}
                                                            </Badge>
                                                            <small className="d-block text-muted" style={{ fontSize: '10px' }}>
                                                                {statistiquesDetaillees?.camionsAvecStats?.filter(c => c.bilan >= 0).length || 0} sur {statistiquesDetaillees?.camionsAvecStats?.length || 0}
                                                            </small>
                                                        </td>

                                                        <td className="text-center align-middle">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={genererPDFCamions}
                                                                disabled={generatingPDF || !statistiquesDetaillees?.camionsAvecStats?.length}
                                                                title="Exporter le rapport complet en PDF"
                                                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                                            >
                                                                {generatingPDF ? (
                                                                    <>
                                                                        <Spinner animation="border" size="sm" className="me-1" />
                                                                        Export...
                                                                    </>
                                                                ) : (
                                                                    <>📤 Export</>
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Statistiques financières adaptées */}

                </>
            )}
            {/* Section transporteurs - VERSION CORRIGÉE */}
            {/* Section transporteurs - AFFICHER SOLDE RÉEL */}
            {/* Section transporteurs - VERSION ULTRA-SIMPLE */}
            {!isFacturation && canAccessTransporteurs && statistiquesTransporteurs.length > 0 && (
                <Row className="g-3 mb-3">
                    <Col xs={12}>
                        <Card>
                            <Card.Header className="py-2 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0" style={{ fontSize: '14px' }}>💰 Solde avec Transporteurs</h6>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="info">
                                        {statistiquesTransporteurs.length} transporteur(s)
                                    </Badge>
                                    <Badge bg={
                                        statistiquesTransporteurs.reduce((sum, t) => sum + t.solde, 0) > 0
                                            ? 'success'
                                            : statistiquesTransporteurs.reduce((sum, t) => sum + t.solde, 0) < 0
                                                ? 'danger'
                                                : 'secondary'
                                    }>
                                        Total: {statistiquesTransporteurs.reduce((sum, t) => sum + t.solde, 0).toLocaleString()} DH
                                    </Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="py-3">
                                <div className="table-responsive">
                                    <Table bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th style={{ borderBottom: '2px solid #dee2e6' }}>Transporteur</th>
                                                <th className="text-end" style={{ borderBottom: '2px solid #dee2e6' }}>Solde</th>
                                                <th className="text-center" style={{ borderBottom: '2px solid #dee2e6' }}>Situation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistiquesTransporteurs.map((stats, index) => {
                                                const solde = stats.solde || 0;
                                                const isPositif = solde > 0;
                                                const isNegatif = solde < 0;
                                                const isZero = solde === 0;

                                                return (
                                                    <tr key={index} style={{
                                                        borderBottom: index === statistiquesTransporteurs.length - 1
                                                            ? '2px solid #dee2e6'  // Ligne plus épaisse pour le dernier
                                                            : '1px solid #dee2e6' // Ligne normale pour les autres
                                                    }}>
                                                        <td style={{
                                                            borderRight: '1px solid #dee2e6', // ⭐ Ligne verticale
                                                            padding: '10px 15px'
                                                        }}>
                                                            <div className="d-flex align-items-center">

                                                                <div>
                                                                    <strong>{stats.transporteur.nom}</strong>
                                                                    <br />

                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-end" style={{
                                                            borderRight: '1px solid #dee2e6', // ⭐ Ligne verticale
                                                            padding: '10px 15px'
                                                        }}>
                                                            <strong className={
                                                                isPositif ? 'text-success' :
                                                                    isNegatif ? 'text-danger' :
                                                                        'text-secondary'
                                                            }>
                                                                {isPositif ? '+' : ''}{solde.toLocaleString()} DH
                                                            </strong>
                                                            <br />
                                                            <small className="text-muted" style={{ fontSize: '10px' }}>
                                                                {stats.montantJeDonneNonPaye > 0 && (
                                                                    <span>À payer: {stats.montantJeDonneNonPaye.toLocaleString()} DH</span>
                                                                )}
                                                                {stats.montantJeRecoisNonPaye > 0 && (
                                                                    <span>À recevoir: {stats.montantJeRecoisNonPaye.toLocaleString()} DH</span>
                                                                )}
                                                            </small>
                                                        </td>
                                                        <td className="text-center" style={{ padding: '10px 15px' }}>
                                                            <Badge bg={
                                                                isPositif ? 'success' :
                                                                    isNegatif ? 'danger' :
                                                                        'secondary'
                                                            }>
                                                                {isPositif ? 'Nous reçoit' :
                                                                    isNegatif ? 'Nous doit' :
                                                                        'Équilibré'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
            {/* Accès rapide - ADAPTÉ AUX PERMISSIONS */}
            <Row className="g-2 mt-4">
                {canAccessCamions && (
                    <Col xs={4} sm={2}>
                        <Card className="text-center border-primary clickable-card shadow-sm h-100"
                            onClick={() => window.location.href = '/camions'}>
                            <Card.Body className="p-2 d-flex flex-column">
                                <div className="text-primary mb-1" style={{ fontSize: '1.5rem' }}>🚛</div>
                                <Card.Title className="mb-0" style={{ fontSize: '11px' }}>Camions</Card.Title>
                                <small className="text-muted" style={{ fontSize: '9px' }}>Gestion parc</small>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {canAccessEmployes && (
                    <Col xs={4} sm={2}>
                        <Card className="text-center border-success clickable-card shadow-sm h-100"
                            onClick={() => window.location.href = '/employes'}>
                            <Card.Body className="p-2 d-flex flex-column">
                                <div className="text-success mb-1" style={{ fontSize: '1.5rem' }}>👨‍💼</div>
                                <Card.Title className="mb-0" style={{ fontSize: '11px' }}>Employés</Card.Title>
                                <small className="text-muted" style={{ fontSize: '9px' }}>Gestion personnel</small>
                            </Card.Body>
                        </Card>
                    </Col>
                )}



                {canAccessTrajets && (
                    <Col xs={4} sm={2}>
                        <Card className="text-center border-warning clickable-card shadow-sm h-100"
                            onClick={() => window.location.href = '/trajets'}>
                            <Card.Body className="p-2 d-flex flex-column">
                                <div className="text-warning mb-1" style={{ fontSize: '1.5rem' }}>📦</div>
                                <Card.Title className="mb-0" style={{ fontSize: '11px' }}>Trajets</Card.Title>
                                <small className="text-muted" style={{ fontSize: '9px' }}>Livraisons</small>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {canAccessFrais && (
                    <Col xs={4} sm={2}>
                        <Card className="text-center border-danger clickable-card shadow-sm h-100"
                            onClick={() => window.location.href = '/frais-chauffeurs'}>
                            <Card.Body className="p-2 d-flex flex-column">
                                <div className="text-danger mb-1" style={{ fontSize: '1.5rem' }}>💸</div>
                                <Card.Title className="mb-0" style={{ fontSize: '11px' }}>Frais</Card.Title>
                                <small className="text-muted" style={{ fontSize: '9px' }}>Frais chauffeurs</small>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {canAccessTransporteurs && (
                    <Col xs={4} sm={2}>
                        <Card className="text-center border-secondary clickable-card shadow-sm h-100"
                            onClick={() => window.location.href = '/transporteurs-externes'}>
                            <Card.Body className="p-2 d-flex flex-column">
                                <div className="text-secondary mb-1" style={{ fontSize: '1.5rem' }}>🚚</div>
                                <Card.Title className="mb-0" style={{ fontSize: '11px' }}>Transporteurs</Card.Title>
                                <small className="text-muted" style={{ fontSize: '9px' }}>Externes</small>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {/* Accès facturation pour agent de facturation */}

            </Row>

            {/* Modal des détails du camion */}
            <DetailsCamionModal
                show={showDetailsCamion}
                onHide={() => setShowDetailsCamion(false)}
                camion={camionSelectionne}
                statistiquesCamion={statistiquesCamion}
            />

            <style>{`
                .clickable-card {
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .clickable-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                @media (max-width: 768px) {
                    .border-end-md {
                        border-right: none !important;
                        border-bottom: 1px solid #dee2e6;
                        padding-bottom: 1rem;
                        margin-bottom: 1rem;
                    }
                }
              
    /* Styles pour la version mobile uniquement */
    @media (max-width: 767.98px) {
        .table - responsive {
                    border: none;
                max-height: none;
        }

                .card .card-body {
                    padding: 1rem;
        }
    }

            `}</style>
        </Container >
    );
}

export default Dashboard;