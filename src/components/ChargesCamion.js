import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Modal, Form, Row, Col, Card, Badge
} from 'react-bootstrap';
import { camionService, chargeCamionService } from '../services/api';

// Composant pour les statistiques globales des camions
function StatistiquesCamions() {
    const [statistiques, setStatistiques] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1, // ⭐ MOIS ACTUEL
        type_charge: '',
        categorie: ''
    });

    const fetchStatistiques = async () => {
        setLoading(true);
        try {
            const response = await chargeCamionService.getStatistiquesCamions(
                filters.annee,
                filters.mois,
                filters.type_charge,
                filters.categorie
            );
            setStatistiques(response.data);
        } catch (error) {
            console.error('Erreur statistiques camions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistiques();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmitFilters = (e) => {
        e.preventDefault();
        fetchStatistiques();
    };

    // ⭐ FONCTION POUR AVOIR LE NOM DU MOIS

    const getMoisNom = (mois) => {
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return moisNoms[mois - 1] || '';
    };

    return (
        <Card className="mt-4">
            <Card.Header>
                <h5>📊 Statistiques Globales des Camions</h5>
            </Card.Header>
            <Card.Body>
                {/* Filtres - MAINTENANT AUTOMATIQUES */}
                <Form onSubmit={handleSubmitFilters}>
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Année</Form.Label>
                                <Form.Select
                                    value={filters.annee}
                                    onChange={(e) => handleFilterChange('annee', parseInt(e.target.value))}
                                >
                                    {[2023, 2024, 2025, 2026].map(annee => (
                                        <option key={annee} value={annee}>{annee}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Mois</Form.Label>
                                <Form.Select
                                    value={filters.mois}
                                    onChange={(e) => handleFilterChange('mois', parseInt(e.target.value))}
                                >
                                    <option value="">Tous les mois</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(mois => (
                                        <option key={mois} value={mois}>
                                            {getMoisNom(mois)}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Type de charge</Form.Label>
                                <Form.Select
                                    value={filters.type_charge}
                                    onChange={(e) => handleFilterChange('type_charge', e.target.value)}
                                >
                                    <option value="">Tous types</option>
                                    <option value="mensuelle">Mensuelle</option>
                                    <option value="annuelle">Annuelle</option>
                                    <option value="occasionnelle">Occasionnelle</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Catégorie</Form.Label>
                                <Form.Select
                                    value={filters.categorie}
                                    onChange={(e) => handleFilterChange('categorie', e.target.value)}
                                >
                                    <option value="">Toutes catégories</option>
                                    <option value="gazoil">Gazoil</option>
                                    <option value="assurance">Assurance</option>
                                    <option value="vignette">Vignette</option>
                                    <option value="reparation">Réparation</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12} className="d-flex justify-content-between align-items-center">
                            {/* ⭐ BOUTON OPTIONNEL - Peut être supprimé */}
                            <Button type="submit" variant="primary">
                                🔍 Actualiser
                            </Button>
                            <Badge bg="info">
                                Période: {getMoisNom(filters.mois)} {filters.annee}
                            </Badge>
                        </Col>
                    </Row>
                </Form>

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                        <p>Chargement des statistiques...</p>
                    </div>
                ) : statistiques ? (
                    <>
                        {/* Statistiques globales */}
                        <Row className="mb-4">
                            <Col md={3}>
                                <Card className="text-center bg-primary text-white">
                                    <Card.Body>
                                        <Card.Title>Total Global</Card.Title>
                                        <h4>{statistiques.stats_globales.total_global.toFixed(2)} DH</h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center bg-success text-white">
                                    <Card.Body>
                                        <Card.Title>Nombre de Charges</Card.Title>
                                        <h4>{statistiques.stats_globales.nombre_charges_global}</h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center bg-info text-white">
                                    <Card.Body>
                                        <Card.Title>Moyenne par Camion</Card.Title>
                                        <h4>{statistiques.stats_globales.moyenne_par_camion.toFixed(2)} DH</h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center bg-warning text-white">
                                    <Card.Body>
                                        <Card.Title>Nombre de Camions</Card.Title>
                                        <h4>{statistiques.stats_globales.nombre_camions}</h4>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Détail par camion */}
                        <h6>Détail par Camion</h6>
                        <Table striped bordered hover responsive>
                            <thead className="table-dark">
                                <tr>
                                    <th>Camion</th>
                                    <th>Total Charges</th>
                                    <th>Nombre Charges</th>
                                    <th>Détail par Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statistiques.statistiques_camions.map((stat) => (
                                    <tr key={stat.camion_id}>
                                        <td>
                                            <strong>{stat.camion_immatriculation}</strong>
                                        </td>
                                        <td>
                                            <Badge bg="primary">
                                                {stat.total_montant.toFixed(2)} DH
                                            </Badge>
                                        </td>
                                        <td>{stat.nombre_charges}</td>
                                        <td>
                                            {stat.detail_type.map(detail => (
                                                <Badge
                                                    key={detail.type_charge}
                                                    bg={detail.type_charge === 'mensuelle' ? 'success' : 'warning'}
                                                    className="me-1"
                                                >
                                                    {detail.type_charge}: {detail.montant.toFixed(2)} DH
                                                </Badge>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                ) : (
                    <div className="text-center text-muted">
                        <p>Aucune donnée statistique disponible</p>
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
    const [editingCharge, setEditingCharge] = useState(null);

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

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCharge(null);
        setError('');
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
        <Container className="mt-4">
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
                                <th width="120">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.map((charge) => (
                                <tr key={charge.id}>
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
                                    <td>
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
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestion des Camions</h1>
                <Button variant="primary" onClick={() => handleShowModal()}>
                    + Ajouter Camion
                </Button>
            </div>

            {error && !showModal && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Statistiques Globales */}
            <StatistiquesCamions />

            {/* Liste des camions */}
            <Card className="mt-4">
                <Card.Header>
                    <h5>Liste des Camions</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
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
                                        <div className="btn-group" role="group">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleShowModal(camion)}
                                                title="Modifier le camion"
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedCamion(camion);
                                                    setShowChargesModal(true);
                                                }}
                                                title="Gérer les charges"
                                            >
                                                💰 Charges
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(camion.id)}
                                                title="Supprimer le camion"
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {camions.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucun camion enregistré</h5>
                            <p>Cliquez sur "Ajouter Camion" pour commencer</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

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
        </Container>
    );
}

export default Camions;