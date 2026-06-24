import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Modal, Form, Row, Col, Card, Badge
} from 'react-bootstrap';
import { documentCamionService, camionService } from '../services/api';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const TYPES_DOCUMENT = [
    { value: 'vignette', label: 'Vignette' },
    { value: 'assurance', label: 'Assurance' },
    { value: 'visite_tracteur', label: 'Visite Technique Tracteur' },
    { value: 'visite_remorque', label: 'Visite Technique Remorque' },
    { value: 'tachygraphe', label: 'Tachygraphe' },
    { value: 'autorisation_tracteur', label: 'Autorisation Transport Tracteur' },
    { value: 'autorisation_remorque', label: 'Autorisation Transport Remorque' },
    { value: 'extincteur', label: 'Extincteur' },
    { value: 'Carte_tracteur', label: 'Carte Grise Tracteur' },
    { value: 'Carte_remorque', label: 'Carte Grise Remorque' },
    { value: 'vidange', label: 'Vidange' },
    { value: 'autre', label: 'Autre' },
];

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR');
};

const getStatutBadge = (doc) => {
    const s = doc.statut_alerte;
    if (s === 'expire') return <Badge bg="dark">⚫ Expiré</Badge>;
    if (s === 'urgent') return <Badge bg="danger">🔴 Urgent</Badge>;
    if (s === 'bientot') return <Badge bg="warning" text="dark">🟡 Bientôt</Badge>;
    return <Badge bg="success">✅ OK</Badge>;
};

const getRowClass = (doc) => {
    const s = doc.statut_alerte;
    if (s === 'expire') return 'table-dark';
    if (s === 'urgent') return 'table-danger';
    if (s === 'bientot') return 'table-warning';
    return '';
};

const getInfoRestant = (doc) => {
    if (doc.type_document === 'vidange') {
        if (doc.km_restants !== null) {
            return doc.km_restants <= 0
                ? '⚫ Dépassé'
                : `${doc.km_restants.toLocaleString()} km restants`;
        }
        return '-';
    }
    if (doc.jours_restants !== null) {
        if (doc.jours_restants < 0)
            return `⚫ Expiré depuis ${Math.abs(doc.jours_restants)}j`;
        return `${doc.jours_restants} jour(s) restants`;
    }
    return '-';
};

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────

function DocumentsCamion() {
    const [documents, setDocuments] = useState([]);
    const [camions, setCamions] = useState([]);
    const [alertes, setAlertes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const [filters, setFilters] = useState({
        camion_id: '',
        type_document: '',
    });

    const [formData, setFormData] = useState({
        camion: '',
        type_document: 'vignette',
        description: '',
        date_debut: '',
        date_fin: '',
        km_actuel: '',
        km_prochain: '',
    });

    const isVidange = formData.type_document === 'vidange';
    const isAutre = formData.type_document === 'autre';

    useEffect(() => {
        camionService.getAll().then(res => setCamions(res.data)).catch(() => { });
    }, []);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filters.camion_id) params.camion_id = filters.camion_id;
            if (filters.type_document) params.type_document = filters.type_document;

            const [docsRes, alertesRes] = await Promise.all([
                documentCamionService.getAll(params),
                documentCamionService.getAlertes(filters.camion_id ? { camion_id: filters.camion_id } : {}),
            ]);
            setDocuments(docsRes.data);
            setAlertes(alertesRes.data);
        } catch {
            setError('Erreur lors du chargement des documents.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (isVidange) {
                delete payload.date_debut;
                delete payload.date_fin;
                payload.km_actuel = parseInt(payload.km_actuel);
                payload.km_prochain = parseInt(payload.km_prochain);
            } else {
                delete payload.km_actuel;
                delete payload.km_prochain;
                if (!payload.date_debut) delete payload.date_debut;
                if (!payload.date_fin) delete payload.date_fin;
            }
            if (!payload.description) delete payload.description;

            if (editItem) {
                await documentCamionService.update(editItem.id, payload);
            } else {
                await documentCamionService.create(payload);
            }
            setShowModal(false);
            resetForm();
            fetchDocuments();
        } catch (err) {
            const msg = err.response?.data;
            if (msg) {
                const msgs = Object.values(msg).flat().join(' | ');
                setError(msgs);
            } else {
                setError('Erreur lors de la sauvegarde.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce document ?')) return;
        try {
            await documentCamionService.delete(id);
            fetchDocuments();
        } catch {
            setError('Erreur lors de la suppression.');
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setFormData({
            camion: item.camion,
            type_document: item.type_document,
            description: item.description || '',
            date_debut: item.date_debut || '',
            date_fin: item.date_fin || '',
            km_actuel: item.km_actuel || '',
            km_prochain: item.km_prochain || '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditItem(null);
        setFormData({
            camion: '',
            type_document: 'vignette',
            description: '',
            date_debut: '',
            date_fin: '',
            km_actuel: '',
            km_prochain: '',
        });
        setError('');
    };

    const getCamionLabel = (id) => {
        const c = camions.find(x => x.id === id || x.id === parseInt(id));
        return c ? (c.immatriculation || c.numero || `Camion #${c.id}`) : `#${id}`;
    };

    return (
        <Container fluid className="py-4">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">📄 Documents Camions</h4>
                <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    + Nouveau Document
                </Button>
            </div>

            {/* Alertes globales */}
            {alertes && alertes.total_alertes > 0 && (
                <Card className="mb-4 border-0 shadow-sm border-start border-danger border-4">
                    <Card.Body>
                        <h6 className="fw-bold mb-3">
                            🚨 {alertes.total_alertes} document(s) nécessitent votre attention
                        </h6>
                        <Row className="g-3">
                            {alertes.expire?.length > 0 && (
                                <Col md={4}>
                                    <div className="p-2 rounded bg-dark text-white">
                                        <div className="fw-semibold mb-1">⚫ Expirés ({alertes.expire.length})</div>
                                        {alertes.expire.map(d => (
                                            <div key={d.id} className="small">
                                                {getCamionLabel(d.camion)} — {d.type_document_display}
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            )}
                            {alertes.urgent?.length > 0 && (
                                <Col md={4}>
                                    <div className="p-2 rounded bg-danger text-white">
                                        <div className="fw-semibold mb-1">🔴 Urgents ({alertes.urgent.length})</div>
                                        {alertes.urgent.map(d => (
                                            <div key={d.id} className="small">
                                                {getCamionLabel(d.camion)} — {d.type_document_display}
                                                {d.jours_restants !== null && ` (${d.jours_restants}j)`}
                                                {d.km_restants !== null && ` (${d.km_restants} km)`}
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            )}
                            {alertes.bientot?.length > 0 && (
                                <Col md={4}>
                                    <div className="p-2 rounded bg-warning">
                                        <div className="fw-semibold mb-1">🟡 Bientôt ({alertes.bientot.length})</div>
                                        {alertes.bientot.map(d => (
                                            <div key={d.id} className="small">
                                                {getCamionLabel(d.camion)} — {d.type_document_display}
                                                {d.jours_restants !== null && ` (${d.jours_restants}j)`}
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Stats */}
            <Row className="mb-4 g-3">
                <Col md={3}>
                    <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small">Total documents</div>
                            <div className="fw-bold fs-5">{documents.length}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small">⚫ Expirés</div>
                            <div className="fw-bold fs-5 text-dark">
                                {alertes?.expire?.length || 0}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small">🔴 Urgents</div>
                            <div className="fw-bold fs-5 text-danger">
                                {alertes?.urgent?.length || 0}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small">🟡 Bientôt</div>
                            <div className="fw-bold fs-5 text-warning">
                                {alertes?.bientot?.length || 0}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filtres */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-2 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold">Camion</Form.Label>
                            <Form.Select size="sm" value={filters.camion_id}
                                onChange={e => setFilters(p => ({ ...p, camion_id: e.target.value }))}>
                                <option value="">Tous les camions</option>
                                {camions.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.immatriculation || c.numero || `Camion #${c.id}`}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-semibold">Type document</Form.Label>
                            <Form.Select size="sm" value={filters.type_document}
                                onChange={e => setFilters(p => ({ ...p, type_document: e.target.value }))}>
                                <option value="">Tous les types</option>
                                {TYPES_DOCUMENT.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Button size="sm" variant="outline-secondary"
                                onClick={() => setFilters({ camion_id: '', type_document: '' })}>
                                Réinitialiser
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {/* Tableau */}
            {loading ? (
                <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <div className="table-responsive">
                        <Table hover size="sm" className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Camion</th>
                                    <th>Document</th>
                                    <th>Description</th>
                                    <th>Date début</th>
                                    <th>Date fin / KM</th>
                                    <th>Restant</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted py-4">
                                            Aucun document trouvé
                                        </td>
                                    </tr>
                                ) : documents.map(doc => (
                                    <tr key={doc.id} className={getRowClass(doc)}>
                                        <td className="fw-semibold">
                                            {doc.camion_details?.immatriculation ||
                                                doc.camion_details?.numero ||
                                                `#${doc.camion}`}
                                        </td>
                                        <td>
                                            <Badge bg="primary">
                                                {doc.type_document_display}
                                            </Badge>
                                        </td>
                                        <td>{doc.description || '-'}</td>
                                        <td>{formatDate(doc.date_debut)}</td>
                                        <td>
                                            {doc.type_document === 'vidange'
                                                ? `${doc.km_actuel?.toLocaleString()} → ${doc.km_prochain?.toLocaleString()} km`
                                                : formatDate(doc.date_fin)}
                                        </td>
                                        <td className="fw-semibold">{getInfoRestant(doc)}</td>
                                        <td>{getStatutBadge(doc)}</td>
                                        <td>
                                            <Button size="sm" variant="outline-primary"
                                                className="me-1" onClick={() => handleEdit(doc)}>✏️</Button>
                                            <Button size="sm" variant="outline-danger"
                                                onClick={() => handleDelete(doc.id)}>🗑️</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Modal Formulaire */}
            <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editItem ? 'Modifier le document' : 'Nouveau document'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Camion *</Form.Label>
                                <Form.Select value={formData.camion}
                                    onChange={e => setFormData(p => ({ ...p, camion: e.target.value }))}
                                    required>
                                    <option value="">-- Sélectionner --</option>
                                    {camions.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.immatriculation || c.numero || `Camion #${c.id}`}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Type document *</Form.Label>
                                <Form.Select value={formData.type_document}
                                    onChange={e => setFormData(p => ({
                                        ...p,
                                        type_document: e.target.value,
                                        date_debut: '',
                                        date_fin: '',
                                        km_actuel: '',
                                        km_prochain: '',
                                    }))}>
                                    {TYPES_DOCUMENT.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </Form.Select>
                            </Col>

                            {/* Description — toujours visible pour "autre", optionnel sinon */}
                            {(isAutre || formData.type_document) && (
                                <Col md={12}>
                                    <Form.Label className="fw-semibold">
                                        Description {isAutre ? '*' : '(optionnel)'}
                                    </Form.Label>
                                    <Form.Control type="text"
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Ex: Carte grise, Permis..."
                                        required={isAutre} />
                                </Col>
                            )}

                            {/* Champs Vidange */}
                            {isVidange && (
                                <>
                                    <Col md={6}>
                                        <Form.Label className="fw-semibold">KM Actuel *</Form.Label>
                                        <Form.Control type="number" min="0"
                                            value={formData.km_actuel}
                                            onChange={e => setFormData(p => ({ ...p, km_actuel: e.target.value }))}
                                            placeholder="Ex: 150000"
                                            required />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="fw-semibold">KM Prochain *</Form.Label>
                                        <Form.Control type="number" min="0"
                                            value={formData.km_prochain}
                                            onChange={e => setFormData(p => ({ ...p, km_prochain: e.target.value }))}
                                            placeholder="Ex: 155000"
                                            required />
                                        <Form.Text className="text-muted">
                                            Alerte à 1000 km restants
                                        </Form.Text>
                                    </Col>
                                </>
                            )}

                            {/* Champs Date */}
                            {!isVidange && (
                                <>
                                    <Col md={6}>
                                        <Form.Label className="fw-semibold">
                                            Date début {isAutre ? '(optionnel)' : ''}
                                        </Form.Label>
                                        <Form.Control type="date"
                                            value={formData.date_debut}
                                            onChange={e => setFormData(p => ({ ...p, date_debut: e.target.value }))}
                                            required={!isAutre} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="fw-semibold">
                                            Date fin {isAutre ? '(optionnel)' : '*'}
                                        </Form.Label>
                                        <Form.Control type="date"
                                            value={formData.date_fin}
                                            onChange={e => setFormData(p => ({ ...p, date_fin: e.target.value }))}
                                            required={!isAutre} />
                                        {!isAutre && (
                                            <Form.Text className="text-muted">
                                                🟡 Alerte 30j | 🔴 Urgent 7j
                                            </Form.Text>
                                        )}
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary"
                            onClick={() => { setShowModal(false); resetForm(); }}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit">
                            {editItem ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default DocumentsCamion;