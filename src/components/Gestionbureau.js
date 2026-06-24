import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Modal, Form, Row, Col, Card, Badge
} from 'react-bootstrap';
import { chargeBureauService, employeService } from '../services/api';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const ENTREPRISES = [
    { value: 'tous', label: 'Toutes les entreprises' },
    { value: 'ARS', label: 'ARS' },
    { value: 'ARN', label: 'ARN' },
];

const CATEGORIES_CHARGE = [
    { value: 'gazoil', label: 'Gazoil' },
    { value: 'salaire', label: 'Salaire' },
    { value: 'indemnite', label: 'Indemnité' },
    { value: 'dejeuner', label: 'Déjeuner / Café' },
    { value: 'reparation', label: 'Réparation / Entretien' },
    { value: 'loyer', label: 'Loyer' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'fourniture', label: 'Fournitures' },
    { value: 'frais_comptable', label: 'Frais Comptable' },
    { value: 'tva_mensuelle', label: 'TVA Mensuelle' },
    { value: 'impot', label: 'Impôt' },
    { value: 'assurance_voiture', label: 'Assurance Voiture' },
    { value: 'assurance_moto', label: 'Assurance Moto' },
    { value: 'vignette_voiture', label: 'Vignette Voiture' },
    { value: 'vignette_moto', label: 'Vignette Moto' },
    { value: 'autre', label: 'Autre' },
];

const MOIS_NOMS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const dateActuelle = new Date();
const ANNEE_ACTUELLE = dateActuelle.getFullYear();
const MOIS_ACTUEL = dateActuelle.getMonth() + 1;

const formatMontant = (montant) =>
    Number(montant || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' DH';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
};

const getBadgeCategorie = (cat) => {
    const found = CATEGORIES_CHARGE.find(c => c.value === cat);
    return found ? found.label : cat;
};

// Vérifie si la catégorie nécessite un véhicule
const needsVehicule = (categorie) => {
    const vehiculeCategories = ['gazoil', 'reparation', 'assurance_voiture', 'assurance_moto', 'vignette_voiture', 'vignette_moto'];
    return vehiculeCategories.includes(categorie);
};

// Vérifie si la catégorie nécessite un employé
const needsEmploye = (categorie) => {
    const employeCategories = ['salaire', 'indemnite'];
    return employeCategories.includes(categorie);
};

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────

function GestionBureau() {
    const [employes, setEmployes] = useState([]);
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [stats, setStats] = useState(null);

    const [filters, setFilters] = useState({
        entreprise: 'tous',
        categorie: '',
        mois: MOIS_ACTUEL,
        annee: ANNEE_ACTUELLE,
        date_debut: '',
        date_fin: '',
    });

    const [formData, setFormData] = useState({
        entreprise: 'ARS',
        date: new Date().toISOString().split('T')[0],
        categorie: 'gazoil',
        description: '',
        vehicule: '',
        employe: '',
        montant: '',
    });

    // Chargement des employés
    useEffect(() => {
        employeService.getAll().then(res => setEmployes(res.data)).catch(() => { });
    }, []);

    const fetchCharges = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filters.entreprise !== 'tous') params.entreprise = filters.entreprise;
            if (filters.categorie) params.categorie = filters.categorie;
            if (filters.date_debut && filters.date_fin) {
                params.date_debut = filters.date_debut;
                params.date_fin = filters.date_fin;
            } else {
                if (filters.mois) params.mois = filters.mois;
                if (filters.annee) params.annee = filters.annee;
            }
            const [chargesRes, statsRes] = await Promise.all([
                chargeBureauService.getAll(params),
                chargeBureauService.getStatistiques(params),
            ]);
            setCharges(chargesRes.data);
            setStats(statsRes.data);
        } catch (err) {
            setError('Erreur lors du chargement des charges.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchCharges(); }, [fetchCharges]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.employe) delete payload.employe;
            if (!payload.vehicule) delete payload.vehicule;

            if (editItem) {
                await chargeBureauService.update(editItem.id, payload);
            } else {
                await chargeBureauService.create(payload);
            }
            setShowModal(false);
            resetForm();
            fetchCharges();
        } catch (err) {
            setError('Erreur lors de la sauvegarde.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette charge ?')) return;
        try {
            await chargeBureauService.delete(id);
            fetchCharges();
        } catch {
            setError('Erreur lors de la suppression.');
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setFormData({
            entreprise: item.entreprise,
            date: item.date,
            categorie: item.categorie,
            description: item.description || '',
            vehicule: item.vehicule || '',
            employe: item.employe || '',
            montant: item.montant,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditItem(null);
        setFormData({
            entreprise: 'ARS',
            date: new Date().toISOString().split('T')[0],
            categorie: 'gazoil',
            description: '',
            vehicule: '',
            employe: '',
            montant: '',
        });
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">🏢 Gestion Bureau - Charges</h4>
            </div>

            {/* Stats Cards */}
            {stats && (
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="text-center border-0 shadow-sm">
                            <Card.Body>
                                <div className="text-muted small mb-1">Total Charges</div>
                                <div className="fw-bold fs-4 text-danger">{formatMontant(stats.total_charges)}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center border-0 shadow-sm">
                            <Card.Body>
                                <div className="text-muted small mb-1">Nombre de charges</div>
                                <div className="fw-bold fs-4">{charges.length}</div>
                            </Card.Body>
                        </Card>
                    </Col>

                </Row>
            )}

            {/* Filtres */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-2 align-items-end">
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">Entreprise</Form.Label>
                            <Form.Select size="sm" value={filters.entreprise}
                                onChange={e => setFilters(p => ({ ...p, entreprise: e.target.value }))}>
                                {ENTREPRISES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">Catégorie</Form.Label>
                            <Form.Select size="sm" value={filters.categorie}
                                onChange={e => setFilters(p => ({ ...p, categorie: e.target.value }))}>
                                <option value="">Toutes</option>
                                {CATEGORIES_CHARGE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">Mois</Form.Label>
                            <Form.Select size="sm" value={filters.mois}
                                onChange={e => setFilters(p => ({ ...p, mois: e.target.value, date_debut: '', date_fin: '' }))}>
                                <option value="">Tous</option>
                                {MOIS_NOMS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">Année</Form.Label>
                            <Form.Select size="sm" value={filters.annee}
                                onChange={e => setFilters(p => ({ ...p, annee: e.target.value }))}>
                                {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">Du</Form.Label>
                            <Form.Control size="sm" type="date" value={filters.date_debut}
                                onChange={e => setFilters(p => ({ ...p, date_debut: e.target.value, mois: '', annee: '' }))} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">Au</Form.Label>
                            <Form.Control size="sm" type="date" value={filters.date_fin}
                                onChange={e => setFilters(p => ({ ...p, date_fin: e.target.value }))} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-semibold text-secondary">{charges.length} charge(s)</h6>
                <Button size="sm" variant="danger" onClick={() => { resetForm(); setShowModal(true); }}>
                    + Nouvelle Charge
                </Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {/* Tableau */}
            {loading ? (
                <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>
            ) : (
                <div className="table-responsive">
                    <Table hover size="sm" className="align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Date</th>
                                <th>Entreprise</th>
                                <th>Catégorie</th>
                                <th>Description</th>
                                <th>Véhicule</th>
                                <th>Employé</th>
                                <th className="text-end">Montant</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-muted py-4">Aucune charge trouvée</td></tr>
                            ) : charges.map(c => (
                                <tr key={c.id}>
                                    <td>{formatDate(c.date)}</td>
                                    <td><Badge bg="secondary">{ENTREPRISES.find(e => e.value === c.entreprise)?.label || c.entreprise}</Badge></td>
                                    <td><Badge bg="warning" text="dark">{getBadgeCategorie(c.categorie)}</Badge></td>
                                    <td>{c.description || '-'}</td>
                                    <td>{c.vehicule || '-'}</td>
                                    <td>{c.employe_details ? `${c.employe_details.prenom || ''} ${c.employe_details.nom || ''}`.trim() : '-'}</td>
                                    <td className="text-end fw-semibold text-danger">{formatMontant(c.montant)}</td>
                                    <td>
                                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleEdit(c)}>✏️</Button>
                                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c.id)}>🗑️</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {charges.length > 0 && (
                            <tfoot className="table-light fw-bold">
                                <tr>
                                    <td colSpan={6} className="text-end">Total :</td>
                                    <td className="text-end text-danger">{formatMontant(charges.reduce((s, c) => s + parseFloat(c.montant || 0), 0))}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                </div>
            )}

            {/* Modal Formulaire */}
            <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editItem ? 'Modifier la charge' : 'Nouvelle charge bureau'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Entreprise *</Form.Label>
                                <Form.Select
                                    value={formData.entreprise}
                                    onChange={e => setFormData(p => ({ ...p, entreprise: e.target.value }))}
                                    required
                                >
                                    {ENTREPRISES.filter(e => e.value !== 'tous').map(e =>
                                        <option key={e.value} value={e.value}>{e.label}</option>
                                    )}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Date *</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                    required
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Catégorie *</Form.Label>
                                <Form.Select
                                    value={formData.categorie}
                                    onChange={e => setFormData(p => ({ ...p, categorie: e.target.value }))}
                                    required
                                >
                                    {CATEGORIES_CHARGE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Montant (DH) *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.montant}
                                    onChange={e => setFormData(p => ({ ...p, montant: e.target.value }))}
                                    required
                                />
                            </Col>
                            {needsVehicule(formData.categorie) && (
                                <Col md={12}>
                                    <Form.Label className="fw-semibold">Véhicule</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ex: Voiture, Moto , Camion..."
                                        value={formData.vehicule}
                                        onChange={e => setFormData(p => ({ ...p, vehicule: e.target.value }))}
                                    />
                                </Col>
                            )}
                            {needsEmploye(formData.categorie) && (
                                <Col md={12}>
                                    <Form.Label className="fw-semibold">Employé</Form.Label>
                                    <Form.Select
                                        value={formData.employe}
                                        onChange={e => setFormData(p => ({ ...p, employe: e.target.value }))}
                                    >
                                        <option value="">-- Sélectionner un employé --</option>
                                        {employes.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.prenom} {emp.nom}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            )}
                            <Col md={12}>
                                <Form.Label className="fw-semibold">Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Détails supplémentaires (facultatif)..."
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                        <Button variant="danger" type="submit">{editItem ? 'Modifier' : 'Ajouter'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default GestionBureau;