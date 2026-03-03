import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Modal, Form, Row, Col, Card, Badge
} from 'react-bootstrap';
import { camionService, chargeCamionService } from '../services/api';


// Composant pour calculer la consommation
// Composant pour calculer la consommation - VERSION RESPONSIVE MOBILE
function CalculConsommation({ camions, onClose }) {
    const [chargesGazoil, setChargesGazoil] = useState([]);
    const [loading, setLoading] = useState(false);
    const [consommationParCamion, setConsommationParCamion] = useState({});
    const [camionSelectionne, setCamionSelectionne] = useState('tous'); // ⭐ NOUVEAU : pour filtrer par camion

    useEffect(() => {
        fetchChargesGazoil();
    }, []);

    const fetchChargesGazoil = async () => {
        setLoading(true);
        try {
            const response = await chargeCamionService.getAll();
            const toutesCharges = response.data;

            const chargesFiltrees = toutesCharges.filter(charge =>
                charge.categorie === 'gazoil' && charge.litres && charge.kilometrage
            );

            setChargesGazoil(chargesFiltrees);
            calculerConsommation(chargesFiltrees);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculerConsommation = (charges) => {
        const consommationParCamion = {};

        const chargesParCamion = {};
        charges.forEach(charge => {
            const camionId = charge.camion;
            if (!chargesParCamion[camionId]) {
                chargesParCamion[camionId] = [];
            }
            chargesParCamion[camionId].push(charge);
        });

        Object.keys(chargesParCamion).forEach(camionId => {
            const chargesCamion = chargesParCamion[camionId];
            chargesCamion.sort((a, b) => new Date(a.date_charge) - new Date(b.date_charge));

            const calculs = [];

            for (let i = 1; i < chargesCamion.length; i++) {
                const chargeActuelle = chargesCamion[i];
                const chargePrecedente = chargesCamion[i - 1];

                const kmActuel = parseFloat(chargeActuelle.kilometrage);
                const kmPrecedent = parseFloat(chargePrecedente.kilometrage);
                const litresUtilises = parseFloat(chargeActuelle.litres);
                const kmParcourus = kmActuel - kmPrecedent;

                const kmParJourRealistes = kmParcourus <= 2000;
                const consommationRealiste = (litresUtilises / kmParcourus) <= 1.0;

                if (kmActuel > kmPrecedent &&
                    litresUtilises > 0 &&
                    kmParcourus > 0 &&
                    kmParJourRealistes &&
                    consommationRealiste) {

                    const consommation = (litresUtilises / kmParcourus * 100).toFixed(2);

                    calculs.push({
                        dateDebut: chargePrecedente.date_charge,
                        dateFin: chargeActuelle.date_charge,
                        kmDebut: kmPrecedent,
                        kmFin: kmActuel,
                        kmParcourus: kmParcourus,
                        litresConsommes: litresUtilises,
                        consommation: consommation,
                        valide: true
                    });
                } else {
                    let erreur = '';
                    if (kmActuel <= kmPrecedent) erreur = 'Kilométrage décroissant';
                    else if (litresUtilises <= 0) erreur = 'Litres manquants';
                    else if (kmParcourus <= 0) erreur = 'Pas de km parcourus';
                    else if (!kmParJourRealistes) erreur = 'Kilométrage irréaliste';
                    else if (!consommationRealiste) erreur = 'Consommation irréaliste';
                    else erreur = 'Données incohérentes';

                    calculs.push({
                        dateDebut: chargePrecedente.date_charge,
                        dateFin: chargeActuelle.date_charge,
                        kmDebut: kmPrecedent,
                        kmFin: kmActuel,
                        kmParcourus: kmParcourus,
                        litresConsommes: litresUtilises,
                        consommation: 'N/A',
                        valide: false,
                        erreur: erreur
                    });
                }
            }

            const calculsValides = calculs.filter(c => c.valide);
            const consommationMoyenne = calculsValides.length > 0 ?
                (calculsValides.reduce((sum, c) => sum + parseFloat(c.consommation), 0) /
                    calculsValides.length).toFixed(2) : 'N/A';

            consommationParCamion[camionId] = {
                camion: chargesCamion[0]?.camion_details,
                charges: chargesCamion,
                calculs: calculs,
                consommationMoyenne: consommationMoyenne
            };
        });

        setConsommationParCamion(consommationParCamion);
    };

    const getCamionInfo = (camionId) => {
        return camions.find(c => c.id == camionId) || {};
    };

    // ⭐ FONCTION POUR FILTRER LES CAMIONS AFFICHÉS
    const camionsAffiches = Object.keys(consommationParCamion)
        .filter(camionId => camionSelectionne === 'tous' || camionId == camionSelectionne)
        .map(camionId => ({
            id: camionId,
            info: getCamionInfo(camionId),
            data: consommationParCamion[camionId]
        }));

    if (loading) {
        return (
            <Container fluid className="px-3 py-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="h5 mb-0">⛽ Calcul de Consommation</h4>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        <i className="bi bi-x-lg"></i> Fermer
                    </Button>
                </div>
                <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Calcul des consommations...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="px-3 py-3" style={{ minHeight: '70vh' }}>
            {/* ⭐ EN-TÊTE RESPONSIVE */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">


                <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                    {/* ⭐ FILTRE PAR CAMION POUR MOBILE */}
                    <div className="w-100 w-md-auto">
                        <Form.Select
                            value={camionSelectionne}
                            onChange={(e) => setCamionSelectionne(e.target.value)}
                            size="sm"
                            className="w-100"
                        >
                            <option value="tous">📋 Tous les camions</option>
                            {Object.keys(consommationParCamion).map(camionId => {
                                const camionInfo = getCamionInfo(camionId);
                                return (
                                    <option key={camionId} value={camionId}>
                                        🚛 {camionInfo.immatriculation}
                                    </option>
                                );
                            })}
                        </Form.Select>
                    </div>


                </div>
            </div>

            {Object.keys(consommationParCamion).length === 0 ? (
                <Alert variant="info" className="text-center py-4">
                    <i className="bi bi-info-circle fs-4 d-block mb-2"></i>
                    <h5>Aucune donnée de consommation</h5>
                    <p className="mb-0">Aucun plein de gazoil avec kilométrage trouvé.</p>
                </Alert>
            ) : (
                <div className="row g-3">
                    {camionsAffiches.map(({ id, info, data }) => (
                        <div key={id} className="col-12">
                            {/* ⭐ CARTE PRINCIPALE RESPONSIVE */}
                            <Card className="shadow-sm border-0 mb-3">
                                <Card.Header className="bg-light py-3">
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                                        <div>
                                            <h5 className="mb-1 d-flex align-items-center">
                                                <i className="bi bi-truck me-2"></i>
                                                {info.immatriculation}
                                                <small className="text-muted ms-2">
                                                    {info.marque} {info.modele}
                                                </small>
                                            </h5>
                                        </div>
                                        {data.consommationMoyenne !== 'N/A' && (
                                            <Badge bg="primary" className="fs-6 px-3 py-2">
                                                <i className="bi bi-speedometer2 me-1"></i>
                                                {data.consommationMoyenne} L/100km
                                            </Badge>
                                        )}
                                    </div>
                                </Card.Header>

                                <Card.Body className="p-0">
                                    {/* ⭐ SECTION PLEINS - VERSION MOBILE */}
                                    <div className="p-3 border-bottom">
                                        <h6 className="mb-3 d-flex align-items-center">
                                            <i className="bi bi-calendar-check me-2"></i>
                                            Historique des pleins ({data.charges.length})
                                        </h6>

                                        {/* VERSION DESKTOP (tableau) */}
                                        <div className="d-none d-md-block">
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                <Table striped bordered size="sm" className="mb-0">
                                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Montant</th>
                                                            <th>Kilométrage</th>
                                                            <th>Litres</th>
                                                            <th>Prix/L</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {[...data.charges].reverse().map((charge, index) => (
                                                            <tr key={charge.id}>
                                                                <td>{charge.date_charge}</td>
                                                                <td>{parseFloat(charge.montant).toFixed(2)} DH</td>
                                                                <td>{parseFloat(charge.kilometrage).toFixed(0)} km</td>
                                                                <td>{parseFloat(charge.litres).toFixed(0)} L</td>
                                                                <td>
                                                                    {charge.litres > 0 ?
                                                                        (parseFloat(charge.montant) / parseFloat(charge.litres)).toFixed(3) + ' DH' :
                                                                        '0.000 DH'
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>

                                        {/* ⭐ VERSION MOBILE (cartes) */}
                                        <div className="d-block d-md-none">
                                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {[...data.charges].reverse().map((charge, index) => (
                                                    <Card key={charge.id} className="mb-2 border shadow-sm">
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div>
                                                                    <h6 className="text-primary mb-1">{charge.date_charge}</h6>
                                                                    <div className="d-flex align-items-center">
                                                                        <Badge bg="info" className="me-2">
                                                                            {parseFloat(charge.montant).toFixed(2)} DH
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <Badge bg="secondary">
                                                                    {parseFloat(charge.kilometrage).toFixed(0)} km
                                                                </Badge>
                                                            </div>

                                                            <Row className="g-2 mb-2">
                                                                <Col xs={6}>
                                                                    <div className="text-center p-2 bg-light rounded">
                                                                        <small className="text-muted d-block">Litres</small>
                                                                        <strong>{parseFloat(charge.litres).toFixed(0)} L</strong>
                                                                    </div>
                                                                </Col>
                                                                <Col xs={6}>
                                                                    <div className="text-center p-2 bg-light rounded">
                                                                        <small className="text-muted d-block">Prix/Litre</small>
                                                                        <strong>
                                                                            {charge.litres > 0 ?
                                                                                (parseFloat(charge.montant) / parseFloat(charge.litres)).toFixed(3) + ' DH' :
                                                                                '0.000 DH'
                                                                            }
                                                                        </strong>
                                                                    </div>
                                                                </Col>
                                                            </Row>

                                                            {charge.description && (
                                                                <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                                                                    <small className="text-muted d-block">Description</small>
                                                                    <small>{charge.description}</small>
                                                                </div>
                                                            )}
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ⭐ SECTION CALCULS - VERSION MOBILE */}
                                    {data.calculs.length > 0 && (
                                        <div className="p-3">
                                            <h6 className="mb-3 d-flex align-items-center">
                                                <i className="bi bi-calculator me-2"></i>
                                                Calculs de consommation ({data.calculs.length})
                                            </h6>

                                            {/* VERSION DESKTOP */}
                                            <div className="d-none d-md-block">
                                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    <Table striped bordered size="sm" className="mb-0">
                                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                                            <tr>
                                                                <th>Période</th>
                                                                <th>Km parcourus</th>
                                                                <th>Litres</th>
                                                                <th>Consommation</th>
                                                                <th>Statut</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {[...data.calculs].reverse().map((calcul, index) => (
                                                                <tr key={index} className={calcul.valide ? '' : 'table-warning'}>
                                                                    <td>
                                                                        <small>{calcul.dateDebut} → {calcul.dateFin}</small>
                                                                    </td>
                                                                    <td>{calcul.kmParcourus.toFixed(0)} km</td>
                                                                    <td>{calcul.litresConsommes.toFixed(0)} L</td>
                                                                    <td>
                                                                        {calcul.valide ? (
                                                                            <Badge bg="success" className="w-100">
                                                                                {calcul.consommation} L/100km
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge bg="secondary" className="w-100">N/A</Badge>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {calcul.valide ? (
                                                                            <Badge bg="success">✓ Valide</Badge>
                                                                        ) : (
                                                                            <Badge bg="warning">⚠️ {calcul.erreur}</Badge>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </div>

                                            {/* ⭐ VERSION MOBILE (cartes) */}
                                            <div className="d-block d-md-none">
                                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    {[...data.calculs].reverse().map((calcul, index) => (
                                                        <Card key={index} className={`mb-2 border ${calcul.valide ? '' : 'border-warning'}`}>
                                                            <Card.Body className="p-3">
                                                                {/* En-tête avec dates */}
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div>
                                                                        <h6 className="text-primary mb-1">
                                                                            {calcul.dateDebut} → {calcul.dateFin}
                                                                        </h6>
                                                                        
                                                                    </div>
                                                                    {calcul.valide && (
                                                                        <Badge bg="success" className="fs-6">
                                                                            {calcul.consommation} L/100km
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {/* Kilométrage */}
                                                                <div className="mb-2 p-2 bg-light rounded">
                                                                    <Row className="g-2">
                                                                        <Col xs={4}>
                                                                            <div className="text-center">
                                                                                <small className="text-muted d-block">Km début</small>
                                                                                <strong>{calcul.kmDebut.toFixed(0)}</strong>
                                                                            </div>
                                                                        </Col>
                                                                        <Col xs={4}>
                                                                            <div className="text-center">
                                                                                <small className="text-muted d-block">Km fin</small>
                                                                                <strong>{calcul.kmFin.toFixed(0)}</strong>
                                                                            </div>
                                                                        </Col>
                                                                        <Col xs={4}>
                                                                            <div className="text-center">
                                                                                <small className="text-muted d-block">Parcourus</small>
                                                                                <strong className="text-primary">{calcul.kmParcourus.toFixed(0)} km</strong>
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                </div>

                                                                {/* Consommation */}
                                                                <div className="mb-2 p-2 bg-success bg-opacity-10 rounded">
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div>
                                                                            <small className="text-muted d-block">Litres consommés</small>
                                                                            <strong>{calcul.litresConsommes.toFixed(0)} L</strong>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <small className="text-muted d-block">Consommation</small>
                                                                            <strong className={calcul.valide ? "text-success" : "text-secondary"}>
                                                                                {calcul.valide ? `${calcul.consommation} L/100km` : 'N/A'}
                                                                            </strong>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message si pas assez de calculs */}
                                    {data.calculs.length === 0 && (
                                        <div className="p-3">
                                            <Alert variant="info" className="mb-0">
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-exclamation-triangle fs-4 me-3"></i>
                                                    <div>
                                                        <strong>Pas assez de données</strong>
                                                        <p className="mb-0 small">
                                                            Il faut au moins 2 pleins de gazoil avec des kilométrages cohérents pour calculer la consommation.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Alert>
                                        </div>
                                    )}
                                </Card.Body>

                                {/* ⭐ RÉSUMÉ EN BAS DE LA CARTE */}
                               
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* ⭐ STYLES RESPONSIVE */}
            <style>{`
                /* Styles pour mobile */
                @media (max-width: 768px) {
                    .modal-body {
                        padding: 1rem !important;
                    }
                    
                    .card {
                        border-radius: 10px !important;
                    }
                    
                    .badge {
                        font-size: 0.75rem !important;
                        padding: 0.35em 0.65em !important;
                    }
                    
                    h5, h6 {
                        font-size: 1rem !important;
                    }
                    
                    .table-responsive {
                        max-height: 250px !important;
                    }
                }
                
                /* Animation pour les cartes */
                .card {
                    transition: transform 0.2s;
                }
                
                .card:hover {
                    transform: translateY(-2px);
                }
                
                /* Scrollbar personnalisée */
                .custom-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #adb5bd #f8f9fa;
                }
                
                .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scroll::-webkit-scrollbar-track {
                    background: #f8f9fa;
                }
                
                .custom-scroll::-webkit-scrollbar-thumb {
                    background-color: #adb5bd;
                    border-radius: 20px;
                }
                
                /* Espacement sur mobile */
                @media (max-width: 576px) {
                    .modal-header, .modal-footer {
                        padding: 1rem !important;
                    }
                    
                    .btn {
                        padding: 0.375rem 0.75rem !important;
                        font-size: 0.875rem !important;
                    }
                    
                    .form-select {
                        font-size: 0.875rem !important;
                    }
                }
            `}</style>
        </Container>
    );
}
// Composant pour les statistiques dans la page principale
function StatistiquesCamions({ camions }) {
    const [statistiques, setStatistiques] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        camion_id: '',
        annee: new Date().getFullYear(),
        mois: '',
        type_charge: '',
        categories: []
    });

    const [showCategoriesModal, setShowCategoriesModal] = useState(false);

    const allCategories = [
        { value: 'gazoil', label: 'Gazoil' },
        { value: 'assurance', label: 'Assurance' },
        { value: 'vignette', label: 'Vignette' },
        { value: 'reparation', label: 'Réparation' },
        { value: 'entretien', label: 'Entretien' },
        { value: 'vidange', label: 'Vidange' },
        { value: 'nettoyage', label: 'Nettoyage' },
        { value: 'pneumatiques', label: 'Pneumatiques' },
        { value: 'jawaz_autoroute', label: 'Jawaz Autoroute' },
        { value: 'visite_technique', label: 'Visite Technique' },
        { value: 'tachygraphe', label: 'Tachygraphe' },
        { value: 'extincteurs', label: 'Extincteurs' },
        { value: 'autre', label: 'Autre' }
    ];

    const fetchStatistiques = async () => {
        setLoading(true);
        try {
            // Récupérer TOUTES les charges d'abord
            const response = await chargeCamionService.getAll();
            let toutesCharges = response.data || [];

            // ⭐ FILTRER PAR MOIS SÉLECTIONNÉ
            const anneeSelectionnee = filters.annee;
            const moisSelectionne = filters.mois || (new Date().getMonth() + 1);

            let chargesFiltrees = toutesCharges.filter(charge => {
                const dateCharge = new Date(charge.date_charge);
                const anneeFiltre = dateCharge.getFullYear() === anneeSelectionnee;

                if (moisSelectionne === "0") {
                    // Si "Tous les mois" est sélectionné, filtrer seulement par année
                    return anneeFiltre;
                } else {
                    // Sinon filtrer par année et mois
                    return anneeFiltre && (dateCharge.getMonth() + 1) === parseInt(moisSelectionne);
                }
            });

            // Appliquer les autres filtres
            if (filters.camion_id) {
                chargesFiltrees = chargesFiltrees.filter(charge => charge.camion == filters.camion_id);
            }

            if (filters.type_charge) {
                chargesFiltrees = chargesFiltrees.filter(charge => charge.type_charge === filters.type_charge);
            }

            if (filters.categories.length > 0) {
                chargesFiltrees = chargesFiltrees.filter(charge =>
                    filters.categories.includes(charge.categorie)
                );
            }

            console.log(`✅ ${chargesFiltrees.length} charges trouvées pour ${getMoisNom(moisSelectionne)} ${anneeSelectionnee}`);

            // Calculer les statistiques
            const stats = {
                stats_globales: {
                    total_montant: chargesFiltrees.reduce((sum, charge) => sum + parseFloat(charge.montant || 0), 0),
                    nombre_charges: chargesFiltrees.length,
                    moyenne_montant: chargesFiltrees.length > 0 ?
                        chargesFiltrees.reduce((sum, charge) => sum + parseFloat(charge.montant || 0), 0) / chargesFiltrees.length : 0
                },
                dernieres_charges: chargesFiltrees,

                // Calculer stats par type
                stats_par_type: Object.entries(
                    chargesFiltrees.reduce((acc, charge) => {
                        const type = charge.type_charge || 'non_specifie';
                        if (!acc[type]) acc[type] = { total: 0, count: 0 };
                        acc[type].total += parseFloat(charge.montant || 0);
                        acc[type].count += 1;
                        return acc;
                    }, {})
                ).map(([type, stats]) => ({
                    type_charge: type,
                    total: stats.total,
                    count: stats.count
                })),

                // Calculer stats par catégorie
                stats_par_categorie: Object.entries(
                    chargesFiltrees.reduce((acc, charge) => {
                        const categorie = charge.categorie || 'autre';
                        if (!acc[categorie]) acc[categorie] = { total: 0, count: 0 };
                        acc[categorie].total += parseFloat(charge.montant || 0);
                        acc[categorie].count += 1;
                        return acc;
                    }, {})
                ).map(([categorie, stats]) => ({
                    categorie: categorie,
                    total: stats.total,
                    count: stats.count
                }))
            };

            setStatistiques(stats);

        } catch (error) {
            console.error('💥 Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (camions.length > 0) {
            fetchStatistiques();
        }
    }, [camions]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleCategoryToggle = (categoryValue) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryValue)
                ? prev.categories.filter(cat => cat !== categoryValue)
                : [...prev.categories, categoryValue]
        }));
    };

    const handleSelectAllCategories = () => {
        setFilters(prev => ({
            ...prev,
            categories: allCategories.map(cat => cat.value)
        }));
    };

    const handleClearAllCategories = () => {
        setFilters(prev => ({
            ...prev,
            categories: []
        }));
    };

    const handleSubmitFilters = (e) => {
        e.preventDefault();
        fetchStatistiques();
    };

    // AJOUTEZ CES IMPORTS EN HAUT DU FICHIER


    // PUIS REMPLACEZ LA FONCTION handleGeneratePDF PAR CELLE-CI :

    const handleGeneratePDF = async () => {
        try {
            // Déterminer le mois à filtrer
            const anneeSelectionnee = filters.annee;
            const moisSelectionne = filters.mois || (new Date().getMonth() + 1);

            // ⭐ ÉTAPE 1 : Récupérer les statistiques
            const params = {
                annee: anneeSelectionnee,
                camion_id: filters.camion_id || '',
                mois: moisSelectionne,
                type_charge: filters.type_charge || ''
            };

            if (filters.categories.length === 1) {
                params.categorie = filters.categories[0];
            }
            else if (filters.categories.length > 1) {
                params.categorie = filters.categories[0];
            }

            console.log('📊 PDF - Paramètres envoyés:', params);

            const response = await chargeCamionService.getStatistiquesGlobales(params);
            let data = response.data;

            // ⭐ ÉTAPE 2 : Récupérer TOUTES les charges séparément
            console.log(`ℹ️ Statistiques: ${data.stats_globales?.nombre_charges || 0} charges totales`);
            console.log(`ℹ️ Dernières charges: ${data.dernieres_charges?.length || 0} charges dans la réponse`);

            // Si on a moins de charges que le total indiqué
            if (data.dernieres_charges?.length < (data.stats_globales?.nombre_charges || 0)) {
                console.log('⚠️ Récupération incomplète, on récupère toutes les charges...');

                // Récupérer toutes les charges
                const toutesChargesResponse = await chargeCamionService.getAll();
                let toutesCharges = toutesChargesResponse.data || [];

                // Filtrer par mois
                const debutMois = new Date(anneeSelectionnee, moisSelectionne - 1, 1);
                const finMois = new Date(anneeSelectionnee, moisSelectionne, 0);

                let chargesFiltrees = toutesCharges.filter(charge => {
                    const dateCharge = new Date(charge.date_charge);
                    return dateCharge >= debutMois && dateCharge <= finMois;
                });

                // Appliquer les autres filtres
                if (filters.camion_id) {
                    chargesFiltrees = chargesFiltrees.filter(charge => charge.camion == filters.camion_id);
                }

                if (filters.type_charge) {
                    chargesFiltrees = chargesFiltrees.filter(charge => charge.type_charge === filters.type_charge);
                }

                if (filters.categories.length > 0) {
                    chargesFiltrees = chargesFiltrees.filter(charge =>
                        filters.categories.includes(charge.categorie)
                    );
                }

                // Trier par date (plus récent en premier)
                chargesFiltrees.sort((a, b) => new Date(b.date_charge) - new Date(a.date_charge));

                // Remplacer les données
                data.dernieres_charges = chargesFiltrees;

                console.log(`✅ ${chargesFiltrees.length} charges récupérées après filtrage`);
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPosition = 20;

            // === EN-TÊTE SIMPLE ===
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('RAPPORT DES CHARGES', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 8;

            // Filtres appliqués
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const camionText = filters.camion_id ?
                `Camion: ${camions.find(c => c.id == filters.camion_id)?.immatriculation}` :
                'Tous les camions';

            const periodeText = `Période: ${getMoisNom(moisSelectionne)} ${anneeSelectionnee}`;

            const categoriesText = `Catégories: ${filters.categories.length > 0 ?
                filters.categories.map(cat => getCategorieLabel(cat)).join(', ') :
                'Toutes'}`;

            doc.text(camionText, margin, yPosition);
            yPosition += 5;
            doc.text(periodeText, margin, yPosition);
            yPosition += 5;
            doc.text(categoriesText, margin, yPosition);
            yPosition += 15;

            // === STATISTIQUES SIMPLES ===
            if (data.stats_globales) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('RÉSUMÉ:', margin, yPosition);
                yPosition += 7;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                const totalCharges = data.stats_globales.total_montant?.toFixed(2) || '0.00';
                const nombreCharges = data.dernieres_charges?.length || data.stats_globales.nombre_charges || 0;

                doc.text(`Total: ${totalCharges} DH`, margin, yPosition);
                yPosition += 5;
                doc.text(`Nombre de charges: ${nombreCharges}`, margin, yPosition);
                yPosition += 10;
            }

            // === DÉTAIL DES CHARGES - TOUTES LES CHARGES ===
            if (data.dernieres_charges && data.dernieres_charges.length > 0) {
                // Vérifier si on a besoin d'une nouvelle page
                if (yPosition > pageHeight - 100) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                // ⭐ CORRECTION : Afficher le vrai nombre
                doc.text(`DÉTAIL DES CHARGES (${data.dernieres_charges.length} charges)`, margin, yPosition);
                yPosition += 10;

                // En-tête du tableau
                doc.setFillColor(60, 60, 60);
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');

                const colDate = margin + 3;
                const colCamion = colDate + 20;
                const colCategorie = colCamion + 20;
                const colDescription = colCategorie + 20;
                const colMontant = colDescription + 66;
                const colDetails = colMontant + 25;

                doc.text('Date', colDate, yPosition + 6);
                doc.text('Camion', colCamion, yPosition + 6);
                doc.text('Catégorie', colCategorie, yPosition + 6);
                doc.text('Description', colDescription, yPosition + 6);
                doc.text('Montant', colMontant, yPosition + 6);
                doc.text('Détails', colDetails, yPosition + 6);

                yPosition += 12;
                doc.setTextColor(0, 0, 0);

                // ⭐ AFFICHER TOUTES LES CHARGES
                data.dernieres_charges.forEach((charge, index) => {
                    // Vérifier si on a besoin d'une nouvelle page
                    if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;

                        // Redessiner l'en-tête sur la nouvelle page
                        doc.setFillColor(60, 60, 60);
                        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'bold');

                        doc.text('Date', colDate, yPosition + 6);
                        doc.text('Camion', colCamion, yPosition + 6);
                        doc.text('Catégorie', colCategorie, yPosition + 6);
                        doc.text('Description', colDescription, yPosition + 6);
                        doc.text('Montant', colMontant, yPosition + 6);
                        doc.text('Détails', colDetails, yPosition + 6);

                        yPosition += 12;
                        doc.setTextColor(0, 0, 0);
                    }

                    // Fond alterné pour les lignes
                    if (index % 2 === 0) {
                        doc.setFillColor(240, 240, 240);
                        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
                    }

                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');

                    // Date
                    doc.text(charge.date_charge, colDate, yPosition + 6);

                    // Camion
                    doc.text(charge.camion_details?.immatriculation || '-', colCamion, yPosition + 6);

                    // Catégorie
                    doc.text(getCategorieLabel(charge.categorie), colCategorie, yPosition + 6);

                    // Description (tronquée)
                    const description = charge.description || '-';
                    const shortDesc = description.length > 30 ? description.substring(0, 30) + '...' : description;
                    doc.text(shortDesc, colDescription, yPosition + 6);

                    // Montant
                    doc.text(`${parseFloat(charge.montant || 0).toFixed(2)} DH`, colMontant, yPosition + 6);

                    // Détails spécifiques
                    let detailsText = '';
                    if (charge.categorie === 'gazoil') {
                        detailsText = `${charge.litres || '0'}L / ${charge.kilometrage || '0'}km`;
                    } else if (charge.type_charge === 'annuelle') {
                        detailsText = `${charge.date_debut || ''} ${charge.date_fin || ''}`;
                    } else {
                        detailsText = '-';
                    }

                    // Ajuster la taille du texte des détails si nécessaire
                    doc.setFontSize(7);
                    if (detailsText.length > 20) {
                        detailsText = detailsText.substring(0, 20) + '...';
                    }
                    doc.text(detailsText, colDetails, yPosition + 6);
                    doc.setFontSize(8);

                    yPosition += 10;
                });

                yPosition += 10;
            } else {
                // Message si aucune charge
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(150, 150, 150);
                doc.text('Aucune charge trouvée avec les filtres sélectionnés', margin, yPosition);
                yPosition += 15;
            }

            // ... reste du code inchangé (répartition par catégorie et type) ...

            // === RÉPARTITION PAR CATÉGORIE ===
            if (data.stats_par_categorie && data.stats_par_categorie.length > 1) {
                if (yPosition > pageHeight - 100) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('RÉPARTITION PAR CATÉGORIE', margin, yPosition);
                yPosition += 10;

                // En-tête
                doc.setFillColor(80, 80, 80);
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');

                const colCat = margin + 5;
                const colMont = pageWidth - margin - 40;
                const colNb = pageWidth - margin - 15;

                doc.text('Catégorie', colCat, yPosition + 6);
                doc.text('Montant', colMont, yPosition + 6);
                doc.text('Nombre', colNb, yPosition + 6);

                yPosition += 12;
                doc.setTextColor(0, 0, 0);

                // Données
                data.stats_par_categorie.forEach((stat, index) => {
                    if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;

                        doc.setFillColor(80, 80, 80);
                        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'bold');

                        doc.text('Catégorie', colCat, yPosition + 6);
                        doc.text('Montant', colMont, yPosition + 6);
                        doc.text('Nombre', colNb, yPosition + 6);

                        yPosition += 12;
                        doc.setTextColor(0, 0, 0);
                    }

                    if (index % 2 === 0) {
                        doc.setFillColor(240, 240, 240);
                        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');
                    }

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');

                    doc.text(getCategorieLabel(stat.categorie), colCat, yPosition + 6);
                    doc.text(`${parseFloat(stat.total || 0).toFixed(2)} DH`, colMont, yPosition + 6);
                    doc.text(`${stat.count || 0}`, colNb, yPosition + 6);

                    yPosition += 10;
                });

                yPosition += 10;
            }

            // === PIED DE PAGE ===
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);

                doc.text(
                    `Page ${i}/${pageCount} - ${new Date().toLocaleDateString('fr-FR')}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }

            // Nom du fichier
            const fileName = `charges_${getMoisNom(moisSelectionne).toLowerCase()}_${anneeSelectionnee}.pdf`;

            doc.save(fileName);

            console.log(`✅ PDF généré avec ${data.dernieres_charges?.length || 0} charges`);

        } catch (error) {
            console.error('❌ Erreur lors de la génération du PDF:', error);
            alert('Erreur lors de la génération du PDF: ' + (error.message || 'Vérifiez les données'));
        }
    };

    // Ajouter cette fonction utilitaire si elle n'existe pas déjà
    const getStatutLabel = (statut) => {
        const labels = {
            'active': 'Active',
            'expiree': 'Expirée',
            'renouvellee': 'Renouvelée'
        };
        return labels[statut] || statut;
    };

    const getCategorieLabel = (categorie) => {
        const labels = {
            'assurance': 'Assurance', 'vignette': 'Vignette',
            'visite_technique': 'Visite Technique', 'tachygraphe': 'Tachygraphe',
            'extincteurs': 'Extincteurs', 'gazoil': 'Gazoil', 'reparation': 'Réparation',
            'jawaz_autoroute': 'Jawaz Autoroute', 'entretien': 'Entretien', 'vidange': 'Vidange',
            'nettoyage': 'Nettoyage', 'pneumatiques': 'Pneumatiques', 'autre': 'Autre'
        };
        return labels[categorie] || categorie;
    };

    const getTypeLabel = (type) => {
        return type === 'mensuelle' ? 'Mensuelle' :
            type === 'annuelle' ? 'Annuelle' : 'Occasionnelle';
    };

    const getMoisNom = (mois) => {
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return moisNoms[mois - 1] || '';
    };
    // ⭐ AJOUTEZ CETTE FONCTION
    const getPeriodeMoisEnCours = () => {
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);

        return {
            debut: debutMois.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
            fin: finMois.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            moisAnnee: `${getMoisNom(maintenant.getMonth() + 1)} ${maintenant.getFullYear()}`
        };
    };

    return (
        <Card className="mt-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>📊 Tableau de Bord des Charges</h5>
                <Button variant="success" size="sm" onClick={handleGeneratePDF}>
                    📄 Générer PDF
                </Button>
            </Card.Header>
            <Card.Body>
                {/* Filtres */}
                <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                    <Form onSubmit={handleSubmitFilters}>
                        <Row>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Camion</Form.Label>
                                    <Form.Select
                                        value={filters.camion_id}
                                        onChange={(e) => handleFilterChange('camion_id', e.target.value)}
                                        size="sm"
                                    >
                                        <option value="">Tous les camions</option>
                                        {camions.map(camion => (
                                            <option key={camion.id} value={camion.id}>
                                                {camion.immatriculation}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Année</Form.Label>
                                    <Form.Select
                                        value={filters.annee}
                                        onChange={(e) => handleFilterChange('annee', parseInt(e.target.value))}
                                        size="sm"
                                    >
                                        {[2023, 2024, 2025, 2026].map(annee => (
                                            <option key={annee} value={annee}>{annee}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Mois</Form.Label>
                                    <Form.Select
                                        value={filters.mois}
                                        onChange={(e) => handleFilterChange('mois', e.target.value)}
                                        size="sm"
                                    >
                                        <option value="">Mois actuel</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(mois => (
                                            <option key={mois} value={mois}>
                                                {getMoisNom(mois)}
                                            </option>
                                        ))}
                                        <option value="0">Tous les mois</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Type</Form.Label>
                                    <Form.Select
                                        value={filters.type_charge}
                                        onChange={(e) => handleFilterChange('type_charge', e.target.value)}
                                        size="sm"
                                    >
                                        <option value="">Tous types</option>
                                        <option value="mensuelle">Mensuelle</option>
                                        <option value="annuelle">Annuelle</option>
                                        <option value="occasionnelle">Occasionnelle</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Catégories</Form.Label>
                                    <div>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="w-100"
                                            onClick={() => setShowCategoriesModal(true)}
                                        >
                                            {filters.categories.length > 0
                                                ? `${filters.categories.length} catégorie(s)`
                                                : 'Toutes catégories'
                                            }
                                        </Button>
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button type="submit" variant="primary" size="sm" className="w-100">
                                    🔍 Appliquer
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </div>

                {/* Modal de sélection des catégories */}
                <Modal show={showCategoriesModal} onHide={() => setShowCategoriesModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Sélection des Catégories</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="d-flex justify-content-between mb-3">
                            <Button variant="outline-primary" size="sm" onClick={handleSelectAllCategories}>
                                Tout sélectionner
                            </Button>
                            <Button variant="outline-secondary" size="sm" onClick={handleClearAllCategories}>
                                Tout désélectionner
                            </Button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <Row>
                                {allCategories.map(category => (
                                    <Col md={6} key={category.value}>
                                        <Form.Check
                                            type="checkbox"
                                            label={category.label}
                                            checked={filters.categories.includes(category.value)}
                                            onChange={() => handleCategoryToggle(category.value)}
                                            className="mb-2"
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => setShowCategoriesModal(false)}>
                            Valider
                        </Button>
                    </Modal.Footer>
                </Modal>

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" size="sm" />
                        <span className="ms-2">Chargement des statistiques...</span>
                    </div>
                ) : statistiques ? (
                    <>
                        {/* Cartes de statistiques globales */}
                        <Row className="mb-4">
                            <Col md={3}>
                                <Card className="text-center border-primary">
                                    <Card.Body>
                                        <Card.Title>Total Charges</Card.Title>
                                        <h3 className="text-primary">{statistiques.stats_globales?.total_montant?.toFixed(2) || '0.00'} DH</h3>
                                        <small>{statistiques.stats_globales?.nombre_charges || 0} charges</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-success">
                                    <Card.Body>
                                        <Card.Title>Moyenne par Charge</Card.Title>
                                        <h3 className="text-success">{statistiques.stats_globales?.moyenne_montant?.toFixed(2) || '0.00'} DH</h3>
                                        <small>Moyenne générale</small>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={3}>
                                <Card className="text-center border-warning">
                                    <Card.Body>
                                        <Card.Title>Filtres Actifs</Card.Title>
                                        <div>
                                            {filters.camion_id && (
                                                <Badge bg="primary" className="me-1 mb-1">
                                                    Camion: {camions.find(c => c.id == filters.camion_id)?.immatriculation}
                                                </Badge>
                                            )}
                                            <Badge bg="secondary" className="me-1 mb-1">
                                                {filters.annee}
                                            </Badge>
                                            {filters.mois && (
                                                <Badge bg="info" className="me-1 mb-1">
                                                    {getMoisNom(parseInt(filters.mois))}
                                                </Badge>
                                            )}
                                            {filters.type_charge && (
                                                <Badge bg="warning" className="me-1 mb-1">
                                                    {getTypeLabel(filters.type_charge)}
                                                </Badge>
                                            )}
                                            {filters.categories.length > 0 && (
                                                <Badge bg="success" className="me-1 mb-1">
                                                    {filters.categories.length} catégorie(s)
                                                </Badge>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Dernières charges */}
                        {/* Dernières charges - MODIFIÉ POUR AFFICHER TOUTES LES CHARGES DU MOIS */}
                        <Row>
                            <Col md={12}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">
                                            📋 {filters.mois ? `Charges du mois de ${getMoisNom(parseInt(filters.mois))}` : 'Charges du mois en cours'}
                                            <Badge bg="info" className="ms-2">
                                                {statistiques.dernieres_charges?.length || 0} charges
                                            </Badge>
                                        </h6>
                                        {statistiques.dernieres_charges && statistiques.dernieres_charges.length > 0 && (
                                            <small className="text-muted">
                                                Total: {statistiques.dernieres_charges
                                                    .reduce((sum, charge) => sum + parseFloat(charge.montant || 0), 0)
                                                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                            </small>
                                        )}
                                    </Card.Header>
                                    <Card.Body>
                                        {statistiques.dernieres_charges && statistiques.dernieres_charges.length > 0 ? (
                                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                <Table striped bordered hover size="sm">
                                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                                        <tr>
                                                            <th>Date</th>
                                                            {/* <th>Type</th>*/}
                                                            <th>Catégorie</th>
                                                            <th>Description</th>
                                                            <th className="text-end">Montant</th>
                                                            <th>Camion</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {statistiques.dernieres_charges
                                                            .sort((a, b) => new Date(b.date_charge) - new Date(a.date_charge)) // Tri décroissant par date
                                                            .map((charge) => (
                                                                <tr key={charge.id}>
                                                                    <td>
                                                                        <strong>{charge.date_charge}</strong>
                                                                    </td>
                                                                    {/* <td>
                                                                        <Badge bg={
                                                                            charge.type_charge === 'mensuelle' ? 'primary' :
                                                                                charge.type_charge === 'annuelle' ? 'warning' : 'info'
                                                                        }>
                                                                            {getTypeLabel(charge.type_charge)}
                                                                    </Badge>
                                                                    </td>*/}
                                                                    <td>{getCategorieLabel(charge.categorie)}</td>
                                                                    <td>
                                                                        {charge.description || '-'}
                                                                        {charge.categorie === 'gazoil' && (
                                                                            <div className="text-muted small">
                                                                                ⛽ {charge.litres}L • {charge.kilometrage}km
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <strong className="text-primary">
                                                                            {parseFloat(charge.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </strong>
                                                                    </td>
                                                                    <td>
                                                                        <small>{charge.camion_details?.immatriculation || 'N/A'}</small>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted py-4">
                                                <h5>📭 Aucune charge trouvée</h5>
                                                <p>Aucune charge enregistrée {filters.mois ? `pour le mois de ${getMoisNom(parseInt(filters.mois))}` : 'ce mois-ci'}</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Statistiques détaillées */}
                        <Row className="mt-3">
                            <Col md={6}>
                                <Card>
                                    <Card.Header>
                                        <h6>📊 Répartition par Type</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <Table striped bordered size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Type</th>
                                                        <th>Montant</th>
                                                        <th>Nombre</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {statistiques.stats_par_type?.map((stat) => (
                                                        <tr key={stat.type_charge}>
                                                            <td>
                                                                <Badge bg={
                                                                    stat.type_charge === 'mensuelle' ? 'primary' :
                                                                        stat.type_charge === 'annuelle' ? 'warning' : 'info'
                                                                }>
                                                                    {getTypeLabel(stat.type_charge)}
                                                                </Badge>
                                                            </td>
                                                            <td>{parseFloat(stat.total || 0).toFixed(2)} DH</td>
                                                            <td>{stat.count || 0}</td>
                                                        </tr>
                                                    )) || (
                                                            <tr>
                                                                <td colSpan="3" className="text-center text-muted">
                                                                    Aucune donnée
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card>
                                    <Card.Header>
                                        <h6>📈 Répartition par Catégorie</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <Table striped bordered size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Catégorie</th>
                                                        <th>Montant</th>
                                                        <th>Nombre</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {statistiques.stats_par_categorie?.map((stat) => (
                                                        <tr key={stat.categorie}>
                                                            <td>{getCategorieLabel(stat.categorie)}</td>
                                                            <td>{parseFloat(stat.total || 0).toFixed(2)} DH</td>
                                                            <td>{stat.count || 0}</td>
                                                        </tr>
                                                    )) || (
                                                            <tr>
                                                                <td colSpan="3" className="text-center text-muted">
                                                                    Aucune donnée
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                ) : (
                    <div className="text-center text-muted">
                        <p>Aucune donnée statistique disponible</p>
                        <p>Sélectionnez des filtres et cliquez sur "Appliquer"</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

// Composant pour gérer les charges d'un camion
function ChargesCamion({ camionId, camionImmatriculation, onClose }) {
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingCharge, setEditingCharge] = useState(null);
    const [selectedCharge, setSelectedCharge] = useState(null);

    const [formData, setFormData] = useState({
        type_charge: 'mensuelle',
        categorie: 'gazoil',
        description: '',
        montant: '',
        litres: '',
        kilometrage: '',
        date_debut: '',
        date_fin: '',
        date_charge: new Date().toISOString().split('T')[0],
        statut: 'active'
    });

    useEffect(() => {
        if (camionId) {
            fetchCharges();
        }
    }, [camionId]);

    const fetchCharges = async () => {
        try {
            const response = await chargeCamionService.getByCamion(camionId);
            setCharges(response.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des charges');
            console.error('Error fetching charges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (charge = null) => {
        if (charge) {
            setEditingCharge(charge);
            setFormData({
                type_charge: charge.type_charge,
                categorie: charge.categorie,
                description: charge.description,
                montant: charge.montant,
                litres: charge.litres || '',
                kilometrage: charge.kilometrage || '',
                date_debut: charge.date_debut || '',
                date_fin: charge.date_fin || '',
                date_charge: charge.date_charge,
                statut: charge.statut || 'active'
            });
        } else {
            setEditingCharge(null);
            setFormData({
                type_charge: 'mensuelle',
                categorie: 'gazoil',
                description: '',
                montant: '',
                litres: '',
                kilometrage: '',
                date_debut: '',
                date_fin: '',
                date_charge: new Date().toISOString().split('T')[0],
                statut: 'active'
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleShowDetail = (charge) => {
        setSelectedCharge(charge);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCharge(null);
        setError('');
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedCharge(null);
    };

    const getCategoriesByType = (type) => {
        const categoriesMensuelles = [
            { value: 'gazoil', label: 'Gazoil' },
            { value: 'jawaz_autoroute', label: 'Jawaz Autoroute' },
            { value: 'reparation', label: 'Réparation' },
            { value: 'entretien', label: 'Entretien' },
            { value: 'vidange', label: 'Vidange' },
            { value: 'nettoyage', label: 'Nettoyage' },
            { value: 'pneumatiques', label: 'Pneumatiques' },
            { value: 'autre', label: 'Autre' }
        ];

        const categoriesAnnuelles = [
            { value: 'assurance', label: 'Assurance' },
            { value: 'vignette', label: 'Vignette' },
            { value: 'visite_technique', label: 'Visite Technique' },
            { value: 'tachygraphe', label: 'Tachygraphe' },
            { value: 'extincteurs', label: 'Extincteurs' },
            { value: 'autre', label: 'Autre' }
        ];

        const categoriesOccasionnelles = [
            { value: 'reparation', label: 'Réparation' },
            { value: 'entretien', label: 'Entretien' },
            { value: 'vidange', label: 'Vidange' },
            { value: 'pneumatiques', label: 'Pneumatiques' },
            { value: 'autre', label: 'Autre' }
        ];

        if (type === 'mensuelle') return categoriesMensuelles;
        if (type === 'annuelle') return categoriesAnnuelles;
        if (type === 'occasionnelle') return categoriesOccasionnelles;
        return [];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            // Préparer les données de base
            const submissionData = {
                camion: camionId,
                type_charge: formData.type_charge,
                categorie: formData.categorie,
                description: formData.description,
                montant: parseFloat(formData.montant),
                date_charge: formData.date_charge
            };

            // Ajouter les champs conditionnels pour le gazoil
            if (formData.categorie === 'gazoil') {
                submissionData.litres = parseFloat(formData.litres);
                submissionData.kilometrage = parseInt(formData.kilometrage);
            }

            // Gérer les champs selon le type de charge
            if (formData.type_charge === 'annuelle') {
                submissionData.date_debut = formData.date_debut;
                submissionData.date_fin = formData.date_fin;
                submissionData.statut = formData.statut;
            } else {
                // Pour les charges mensuelles, ne pas envoyer ces champs ou les mettre à null
                submissionData.date_debut = null;
                submissionData.date_fin = null;
                submissionData.statut = '';
            }

            console.log('Données envoyées au backend:', submissionData);

            if (editingCharge) {
                await chargeCamionService.update(editingCharge.id, submissionData);
            } else {
                await chargeCamionService.create(submissionData);
            }

            await fetchCharges();
            handleCloseModal();
        } catch (error) {
            console.log('Erreur complète:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                console.log('Erreurs de validation détaillées:', errors);

                // Formater les messages d'erreur
                let errorMessage = 'Erreur de validation: ';
                if (typeof errors === 'object') {
                    for (const [key, value] of Object.entries(errors)) {
                        if (Array.isArray(value)) {
                            errorMessage += `${key}: ${value.join(', ')}. `;
                        } else {
                            errorMessage += `${key}: ${value}. `;
                        }
                    }
                } else {
                    errorMessage = 'Erreur de validation des données';
                }
                setError(errorMessage);
            } else if (error.message) {
                setError('Erreur: ' + error.message);
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'type_charge') {
            // Réinitialiser la catégorie quand le type change
            const nouvellesCategories = getCategoriesByType(value);
            const nouvelleCategorie = nouvellesCategories.length > 0 ? nouvellesCategories[0].value : '';

            setFormData(prev => ({
                ...prev,
                [name]: value,
                categorie: nouvelleCategorie,
                // Réinitialiser les champs spécifiques
                date_debut: value === 'mensuelle' ? '' : prev.date_debut,
                date_fin: value === 'mensuelle' ? '' : prev.date_fin,
                statut: value === 'mensuelle' ? '' : 'active',
                litres: '',
                kilometrage: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) {
            try {
                await chargeCamionService.delete(id);
                await fetchCharges();
            } catch (error) {
                setError('Erreur lors de la suppression: ' + error.message);
            }
        }
    };

    const getCategorieLabel = (categorie) => {
        const labels = {
            'assurance': 'Assurance', 'vignette': 'Vignette',
            'visite_technique': 'Visite Technique', 'tachygraphe': 'Tachygraphe',
            'extincteurs': 'Extincteurs', 'gazoil': 'Gazoil', 'reparation': 'Réparation',
            'jawaz_autoroute': 'Jawaz Autoroute', 'entretien': 'Entretien', 'vidange': 'Vidange',
            'nettoyage': 'Nettoyage', 'pneumatiques': 'Pneumatiques', 'autre': 'Autre'
        };
        return labels[categorie] || categorie;
    };

    const getTypeLabel = (type) => {
        return type === 'mensuelle' ? 'Mensuelle' :
            type === 'annuelle' ? 'Annuelle' : 'Occasionnelle';
    };

    const getStatutLabel = (statut) => {
        const labels = {
            'active': 'Active', 'expiree': 'Expirée', 'renouvellee': 'Renouvelée'
        };
        return labels[statut] || statut;
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

    // Calcul des totaux
    const chargesMensuelles = charges.filter(charge => charge.type_charge === 'mensuelle');
    const chargesAnnuelles = charges.filter(charge => charge.type_charge === 'annuelle');
    const totalMensuel = chargesMensuelles.reduce((sum, charge) => sum + parseFloat(charge.montant), 0);
    const totalAnnuel = chargesAnnuelles.reduce((sum, charge) => sum + parseFloat(charge.montant), 0);

    return (
        <Container fluid className="px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Gestion des Charges - {camionImmatriculation}</h4>
                <div>
                    <Button variant="secondary" onClick={onClose} className="me-2">
                        ← Retour
                    </Button>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        + Ajouter Charge
                    </Button>
                </div>
            </div>

            {error && !showModal && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Résumé */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="text-center border-primary">
                        <Card.Body>
                            <Card.Title>Charges Mensuelles</Card.Title>
                            <h4 className="text-primary">{totalMensuel.toFixed(2)} DH</h4>
                            <small>{chargesMensuelles.length} charges</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="text-center border-warning">
                        <Card.Body>
                            <Card.Title>Charges Annuelles</Card.Title>
                            <h4 className="text-warning">{totalAnnuel.toFixed(2)} DH</h4>
                            <small>{chargesAnnuelles.length} charges</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Tableau des charges */}
            <Card>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Type</th>
                                <th>Catégorie</th>
                                <th>Description</th>
                                <th>Montant</th>
                                <th>Date</th>
                                <th width="150">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.map((charge) => (
                                <tr key={charge.id} style={{ cursor: 'pointer' }} onClick={() => handleShowDetail(charge)}>
                                    <td>
                                        <Badge bg={
                                            charge.type_charge === 'mensuelle' ? 'primary' :
                                                charge.type_charge === 'annuelle' ? 'warning' : 'info'
                                        }>
                                            {getTypeLabel(charge.type_charge)}
                                        </Badge>
                                    </td>
                                    <td>{getCategorieLabel(charge.categorie)}</td>
                                    <td>{charge.description}</td>
                                    <td>
                                        <strong>{charge.montant} DH</strong>
                                    </td>
                                    <td>{charge.date_charge}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="btn-group" role="group">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleShowModal(charge)}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(charge.id)}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {charges.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucune charge enregistrée</h5>
                            <p>Cliquez sur "Ajouter Charge" pour commencer</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Ajout/Modification */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingCharge ? 'Modifier la Charge' : 'Ajouter une Charge'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && (
                            <Alert variant="danger" className="mb-3">
                                {error}
                            </Alert>
                        )}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Type de charge *</Form.Label>
                                    <Form.Select
                                        name="type_charge"
                                        value={formData.type_charge}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    >
                                        <option value="mensuelle">Charge Mensuelle</option>
                                        <option value="annuelle">Charge Annuelle</option>
                                        <option value="occasionnelle">Charge Occasionnelle</option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        {formData.type_charge === 'mensuelle' && "Gazoil, Jawaz, Réparations, Entretien..."}
                                        {formData.type_charge === 'annuelle' && "Assurance, Vignette, Visite Technique..."}
                                        {formData.type_charge === 'occasionnelle' && "Réparations exceptionnelles, Entretien..."}
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Catégorie *</Form.Label>
                                    <Form.Select
                                        name="categorie"
                                        value={formData.categorie}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    >
                                        {getCategoriesByType(formData.type_charge).map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Description de la charge..."
                                disabled={saving}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={formData.categorie === 'gazoil' ? 6 : 12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Montant (DH) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="montant"
                                        value={formData.montant}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                        disabled={saving}
                                    />
                                </Form.Group>
                            </Col>

                            {formData.categorie === 'gazoil' && (
                                <>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Litres *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="litres"
                                                value={formData.litres}
                                                onChange={handleChange}
                                                required
                                                placeholder="0.00"
                                                disabled={saving}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Kilométrage *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="kilometrage"
                                                value={formData.kilometrage}
                                                onChange={handleChange}
                                                required
                                                placeholder="0"
                                                disabled={saving}
                                            />
                                        </Form.Group>
                                    </Col>
                                </>
                            )}
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de la charge *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_charge"
                                        value={formData.date_charge}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Champs spécifiques pour les charges annuelles */}
                        {formData.type_charge === 'annuelle' && (
                            <>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date de début *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_debut"
                                                value={formData.date_debut}
                                                onChange={handleChange}
                                                required
                                                disabled={saving}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date de fin *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_fin"
                                                value={formData.date_fin}
                                                onChange={handleChange}
                                                required
                                                disabled={saving}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Statut</Form.Label>
                                    <Form.Select
                                        name="statut"
                                        value={formData.statut}
                                        onChange={handleChange}
                                        disabled={saving}
                                    >
                                        <option value="active">Active</option>
                                        <option value="expiree">Expirée</option>
                                        <option value="renouvellee">Renouvelée</option>
                                    </Form.Select>
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Enregistrement...
                                </>
                            ) : (
                                editingCharge ? 'Modifier' : 'Ajouter'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Détail de la charge */}
            <Modal show={showDetailModal} onHide={handleCloseDetailModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Détail de la Charge</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCharge && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Type:</strong>
                                    <div>
                                        <Badge bg={
                                            selectedCharge.type_charge === 'mensuelle' ? 'primary' :
                                                selectedCharge.type_charge === 'annuelle' ? 'warning' : 'info'
                                        }>
                                            {getTypeLabel(selectedCharge.type_charge)}
                                        </Badge>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <strong>Catégorie:</strong>
                                    <div>{getCategorieLabel(selectedCharge.categorie)}</div>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={12}>
                                    <strong>Description:</strong>
                                    <div>{selectedCharge.description || 'Aucune description'}</div>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Montant:</strong>
                                    <div className="h5 text-primary">{selectedCharge.montant} DH</div>
                                </Col>
                                <Col md={6}>
                                    <strong>Date:</strong>
                                    <div>{selectedCharge.date_charge}</div>
                                </Col>
                            </Row>
                            {selectedCharge.categorie === 'gazoil' && (
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <strong>Litres:</strong>
                                        <div>{selectedCharge.litres} L</div>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Kilométrage:</strong>
                                        <div>{selectedCharge.kilometrage} km</div>
                                    </Col>
                                </Row>
                            )}
                            {selectedCharge.type_charge === 'annuelle' && (
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <strong>Date début:</strong>
                                        <div>{selectedCharge.date_debut}</div>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Date fin:</strong>
                                        <div>{selectedCharge.date_fin}</div>
                                    </Col>
                                </Row>
                            )}
                            {selectedCharge.type_charge === 'annuelle' && (
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <strong>Statut:</strong>
                                        <div>
                                            <Badge bg={
                                                selectedCharge.statut === 'active' ? 'success' :
                                                    selectedCharge.statut === 'expiree' ? 'danger' : 'info'
                                            }>
                                                {getStatutLabel(selectedCharge.statut)}
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Créé le:</strong>
                                    <div>{new Date(selectedCharge.created_at).toLocaleDateString()}</div>
                                </Col>
                                <Col md={6}>
                                    <strong>Modifié le:</strong>
                                    <div>{new Date(selectedCharge.updated_at).toLocaleDateString()}</div>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDetailModal}>
                        Fermer
                    </Button>
                    <Button variant="primary" onClick={() => {
                        handleCloseDetailModal();
                        handleShowModal(selectedCharge);
                    }}>
                        Modifier
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

// Composant principal Camions
function Camions() {
    const [camions, setCamions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCamion, setEditingCamion] = useState(null);
    const [selectedCamion, setSelectedCamion] = useState(null);
    const [showChargesModal, setShowChargesModal] = useState(false);
    const [showConsommationModal, setShowConsommationModal] = useState(false); // ⭐ NOUVEL ÉTAT
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    // ⭐ AJOUTEZ CE useEffect POUR FERMER LE MENU (METTEZ-LE ICI)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionsMenu && !event.target.closest('.position-relative')) {
                setShowActionsMenu(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showActionsMenu]);

    const [formData, setFormData] = useState({
        immatriculation: '',
        marque: '',
        modele: '',
        date_mise_service: '',
        statut: 'actif'
    });


    useEffect(() => {
        fetchCamions();
    }, []);

    const fetchCamions = async () => {
        try {
            const response = await camionService.getAll();
            setCamions(response.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des camions');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (camion = null) => {
        if (camion) {
            setEditingCamion(camion);
            setFormData({
                immatriculation: camion.immatriculation,
                marque: camion.marque,
                modele: camion.modele,
                date_mise_service: camion.date_mise_service,
                statut: camion.statut
            });
        } else {
            setEditingCamion(null);
            setFormData({
                immatriculation: '',
                marque: '',
                modele: '',
                date_mise_service: '',
                statut: 'actif'
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCamion(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const submissionData = {
                ...formData
            };

            if (editingCamion) {
                await camionService.update(editingCamion.id, submissionData);
            } else {
                await camionService.create(submissionData);
            }

            fetchCamions();
            handleCloseModal();
        } catch (error) {
            console.log('Error details:', error.response);

            if (error.response?.data) {
                const errors = error.response.data;
                if (errors.immatriculation) {
                    setError(`Immatriculation: ${errors.immatriculation.join(', ')}`);
                } else if (errors.non_field_errors) {
                    setError(errors.non_field_errors.join(', '));
                } else {
                    setError('Erreur de validation des données');
                }
            } else {
                setError('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce camion ?')) {
            try {
                await camionService.delete(id);
                fetchCamions();
            } catch (error) {
                setError('Erreur lors de la suppression');
                console.error('Error:', error);
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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

    return (
        <Container fluid className="px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestion des Camions</h1>
                <div>
                    {/* ⭐ AJOUT DU BOUTON CALCUL CONSOMMATION */}
                    <Button
                        variant="warning"
                        onClick={() => setShowConsommationModal(true)}
                        className="me-2"
                    >
                        ⛽ Calcul Consommation
                    </Button>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        + Ajouter Camion
                    </Button>
                </div>
            </div>

            {error && !showModal && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Statistiques en haut de page */}


            {/* Liste des camions avec barre de défilement */}
            <Card className="mt-4">
                <Card.Header>
                    <h5>🚛 Liste des Camions</h5>
                </Card.Header>
                <Card.Body>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <Table striped bordered hover responsive>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                <tr>
                                    <th>Immatriculation</th>
                                    <th>Marque</th>
                                    <th>Modèle</th>
                                    <th>Date Mise Service</th>
                                    <th>Statut</th>
                                    <th width="200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {camions.map((camion) => (
                                    <tr key={camion.id}>
                                        <td>
                                            <strong>{camion.immatriculation}</strong>
                                        </td>
                                        <td>{camion.marque}</td>
                                        <td>{camion.modele}</td>
                                        <td>{camion.date_mise_service}</td>
                                        <td>
                                            <Badge
                                                bg={camion.statut === 'actif' ? 'success' : 'warning'}
                                            >
                                                {camion.statut}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 align-items-center">
                                                {/* Bouton Charges - style simple */}
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCamion(camion);
                                                        setShowChargesModal(true);
                                                    }}
                                                    title="Gérer les charges"
                                                    className="btn-action charges d-flex align-items-center gap-1"
                                                >
                                                    <i className="bi bi-cash action-icon"></i>
                                                    <span className="d-none d-md-inline">Charges</span>
                                                </Button>

                                                {/* Menu déroulant */}
                                                <div className="position-relative">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowActionsMenu(showActionsMenu === camion.id ? null : camion.id);
                                                        }}
                                                        title="Plus d'actions"
                                                        className="btn-action menu"
                                                    >
                                                        <i className="bi bi-three-dots-vertical action-icon"></i>
                                                    </Button>

                                                    {/* Menu déroulant */}
                                                    {showActionsMenu === camion.id && (
                                                        <div
                                                            className="position-absolute action-menu-dropdown"
                                                            style={{
                                                                top: '100%',
                                                                right: '0',
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Option Modifier */}
                                                            <button
                                                                className="menu-item modifier"
                                                                onClick={() => {
                                                                    handleShowModal(camion);
                                                                    setShowActionsMenu(null);
                                                                }}
                                                            >
                                                                <i className="bi bi-pencil action-icon"></i>
                                                                Modifier
                                                            </button>

                                                            {/* Séparateur */}
                                                            <hr className="menu-divider" />

                                                            {/* Option Supprimer */}
                                                            <button
                                                                className="menu-item supprimer"
                                                                onClick={() => {
                                                                    if (window.confirm(`Supprimer le camion ${camion.immatriculation} ?`)) {
                                                                        handleDelete(camion.id);
                                                                        setShowActionsMenu(null);
                                                                    }
                                                                }}
                                                            >
                                                                <i className="bi bi-trash action-icon"></i>
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {camions.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucun camion enregistré</h5>
                            <p>Cliquez sur "Ajouter Camion" pour commencer</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
            {/* Statistiques en haut de page */}
            <StatistiquesCamions camions={camions} />

            {/* Modal Ajout/Modification Camion */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingCamion ? 'Modifier le Camion' : 'Ajouter un Camion'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && (
                            <Alert variant="danger" className="mb-3">
                                {error}
                            </Alert>
                        )}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Immatriculation *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="immatriculation"
                                        value={formData.immatriculation}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ex: AA-123-45"
                                        disabled={saving}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Marque *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="marque"
                                        value={formData.marque}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ex: Mercedes"
                                        disabled={saving}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Modèle *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="modele"
                                        value={formData.modele}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ex: Actros"
                                        disabled={saving}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date Mise en Service *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_mise_service"
                                        value={formData.date_mise_service}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Statut</Form.Label>
                            <Form.Select
                                name="statut"
                                value={formData.statut}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="actif">Actif</option>
                                <option value="inactif">Inactif</option>
                                <option value="maintenance">En Maintenance</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Enregistrement...
                                </>
                            ) : (
                                editingCamion ? 'Modifier' : 'Ajouter'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            {/* ⭐ MODAL CALCUL CONSOMMATION */}
            <Modal show={showConsommationModal} onHide={() => setShowConsommationModal(false)} size="xl" fullscreen="lg-down">
                <Modal.Header closeButton>
                    <Modal.Title>⛽ Calcul de Consommation par Camion</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '80vh' }}>
                    <CalculConsommation
                        camions={camions}
                        onClose={() => setShowConsommationModal(false)}
                    />
                </Modal.Body>
            </Modal>

            {/* Modal Gestion des Charges */}
            <Modal show={showChargesModal} onHide={() => setShowChargesModal(false)} size="xl" fullscreen="lg-down">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Gestion des charges - {selectedCamion?.immatriculation}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '80vh' }}>
                    {selectedCamion && (
                        <ChargesCamion
                            camionId={selectedCamion.id}
                            camionImmatriculation={selectedCamion.immatriculation}
                            onClose={() => setShowChargesModal(false)}
                        />
                    )}
                </Modal.Body>
            </Modal>
            <style>{`
        /* === STYLE SIMPLE ET CLAIR POUR LES BOUTONS === */

        /* Style principal pour tous les boutons */
        .btn-action {
            border: 1px solid #dee2e6 !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            padding: 6px 12px !important;
            transition: all 0.2s ease !important;
            background-color: white !important;
            color: #495057 !important;
            font-weight: 500 !important;
        }
        
        /* Bouton Charges (principal) */
        .btn-action.charges {
            border-color: #0d6efd !important;
            color: #0d6efd !important;
            background-color: rgba(13, 110, 253, 0.05) !important;
        }
        
        .btn-action.charges:hover {
            background-color: #0d6efd !important;
            color: white !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
        }
        
        /* Bouton menu (trois points) - RENDU PLUS PETIT */
        .btn-action.menu {
            border-color: #adb5bd !important;
            color: #6c757d !important;
            background-color: white !important;
            width: 30px !important;
            height: 30px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
        }
        
        .btn-action.menu:hover {
            border-color: #6c757d !important;
            background-color: #f8f9fa !important;
            color: #495057 !important;
        }
        
        /* Menu déroulant - RENDU PLUS COMPACT ET CORRIGÉ POUR ÉVITER L'ESPACE */
        .action-menu-dropdown {
            background: white !important;
            border: 1px solid #dee2e6 !important;
            border-radius: 4px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            min-width: 120px !important;
            max-width: 130px !important;
            padding: 6px !important;
            z-index: 1050 !important;
            /* ⭐ IMPORTANT: Pas de margin-top ici, géré dans le JSX */
        }
        
        /* ⭐ CORRECTION: Menu qui s'ouvre vers le bas (par défaut) */
        .action-menu-dropdown[data-position="bottom"] {
            top: 100% !important;
            bottom: auto !important;
            margin-top: 4px !important;
            margin-bottom: 0 !important;
        }
        
        /* ⭐ CORRECTION: Menu qui s'ouvre vers le haut (pour les derniers éléments) */
        .action-menu-dropdown[data-position="top"] {
            top: auto !important;
            bottom: 100% !important;
            margin-top: 0 !important;
            margin-bottom: 4px !important;
        }
        
        /* Boutons dans le menu déroulant - PLUS COMPACTS */
        .menu-item {
            border: none !important;
            background: transparent !important;
            color: #495057 !important;
            text-align: left !important;
            padding: 6px 8px !important;
            font-size: 12px !important;
            border-radius: 3px !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            transition: all 0.15s ease !important;
            line-height: 1.2 !important;
            cursor: pointer !important;
        }
        
        .menu-item:hover {
            background-color: #f8f9fa !important;
            color: #212529 !important;
        }
        
        .menu-item.modifier:hover {
            background-color: rgba(13, 110, 253, 0.08) !important;
            color: #0d6efd !important;
        }
        
        .menu-item.supprimer:hover {
            background-color: rgba(220, 53, 69, 0.08) !important;
            color: #dc3545 !important;
        }
        
        /* Séparateur - PLUS FIN */
        .menu-divider {
            height: 0.5px !important;
            background-color: #e9ecef !important;
            margin: 4px 0 !important;
            border: none !important;
            opacity: 0.7 !important;
        }
        
        /* Icônes - PLUS PETITES */
        .action-icon {
            font-size: 12px !important;
            width: 14px !important;
            text-align: center !important;
        }
        
        /* Animation d'ouverture du menu - PLUS RAPIDE */
        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* ⭐ ANIMATIONS CORRECTES SELON LA POSITION */
        .action-menu-dropdown[data-position="bottom"] {
            animation: fadeInDown 0.15s ease-out !important;
        }
        
        .action-menu-dropdown[data-position="top"] {
            animation: fadeInUp 0.15s ease-out !important;
        }
        
        /* Ajustements responsive - OPTIMISÉ */
        @media (max-width: 768px) {
            .btn-action {
                padding: 4px 8px !important;
                font-size: 11px !important;
            }
            
            .btn-action .d-none {
                display: none !important;
            }
            
            .btn-action.menu {
                width: 28px !important;
                height: 28px !important;
            }
            
            .action-menu-dropdown {
                min-width: 110px !important;
                padding: 4px !important;
            }
            
            .menu-item {
                padding: 5px 6px !important;
                font-size: 11px !important;
                gap: 5px !important;
            }
        }
        
        /* Style pour les boutons principaux de la page */
        .btn-primary {
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
            font-weight: 500 !important;
        }
        
        .btn-warning {
            background-color: #ffc107 !important;
            border-color: #ffc107 !important;
            color: #212529 !important;
            font-weight: 500 !important;
        }
        
        .btn-warning:hover {
            background-color: #ffca2c !important;
            border-color: #ffca2c !important;
        }
        
        /* ⭐ IMPORTANT: Conteneur du tableau pour éviter le débordement */
        .table-responsive {
            position: relative;
            max-height: 400px !important;
            overflow-y: auto !important;
        }
        
        /* ⭐ CORRECTION: S'assurer que le menu ne crée pas d'espace */
        .position-relative {
            position: relative !important;
        }
        
        /* ⭐ Gestion des derniers éléments du tableau */
        tbody tr {
            position: relative;
        }
        
        /* ⭐ FORCER le menu à s'ouvrir vers le haut pour les 2 derniers éléments */
        tbody tr:nth-last-child(-n+2) .action-menu-dropdown {
            bottom: 100% !important;
            top: auto !important;
            margin-top: 0 !important;
            margin-bottom: 4px !important;
        }
        
        /* ⭐ Alternative: Détection dynamique via JS */
        .action-menu-dropdown.force-top {
            bottom: 100% !important;
            top: auto !important;
            margin-top: 0 !important;
            margin-bottom: 4px !important;
            animation: fadeInUp 0.15s ease-out !important;
        }
        
        .action-menu-dropdown.force-bottom {
            top: 100% !important;
            bottom: auto !important;
            margin-top: 4px !important;
            margin-bottom: 0 !important;
            animation: fadeInDown 0.15s ease-out !important;
        }
        `}</style>
        </Container>
    );
}

export default Camions;