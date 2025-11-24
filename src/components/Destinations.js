import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Modal, Badge
} from 'react-bootstrap';
import { destinationService } from '../services/api';

function Destinations() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDestination, setEditingDestination] = useState(null);

    const [formData, setFormData] = useState({
        ville: '',
        frais_deplacement: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const response = await destinationService.getAll();
            setDestinations(response.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des destinations');
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les destinations selon la recherche
    const destinationsFiltrees = destinations.filter(destination =>
        destination.ville.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleShowForm = (destination = null) => {
        if (destination) {
            setEditingDestination(destination);
            setFormData({
                ville: destination.ville,
                frais_deplacement: destination.frais_deplacement
            });
        } else {
            setEditingDestination(null);
            setFormData({
                ville: '',
                frais_deplacement: ''
            });
        }
        setError('');
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingDestination(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const submissionData = {
                ville: formData.ville.trim(),
                frais_deplacement: parseFloat(formData.frais_deplacement) || 0
            };

            if (editingDestination) {
                await destinationService.update(editingDestination.id, submissionData);
            } else {
                await destinationService.create(submissionData);
            }

            fetchDestinations();
            handleCloseForm();
        } catch (error) {
            console.log('Error details:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation: ';
                Object.keys(errors).forEach(key => {
                    errorMessage += `${key}: ${errors[key].join(', ')}; `;
                });
                setError(errorMessage);
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette destination ?')) {
            try {
                await destinationService.delete(id);
                fetchDestinations();
            } catch (error) {
                setError('Erreur lors de la suppression. Cette destination est peut-être utilisée dans des trajets.');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Statistiques
    const stats = {
        totalDestinations: destinations.length,
        fraisMoyen: destinations.length > 0
            ? destinations.reduce((sum, d) => sum + parseFloat(d.frais_deplacement), 0) / destinations.length
            : 0
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
                <h1>🏙️ Gestion des Destinations</h1>
                <Button variant="primary" onClick={() => handleShowForm()} disabled={showForm}>
                    + Nouvelle Destination
                </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* Cartes de statistiques */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center border-primary">
                        <Card.Body>
                            <Card.Title>📊 Total Destinations</Card.Title>
                            <h4>{stats.totalDestinations}</h4>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="text-center border-info">
                        <Card.Body>
                            <Card.Title>🔍 Recherche</Card.Title>
                            <Form.Control
                                type="text"
                                placeholder="Rechercher une ville..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Formulaire d'ajout/modification */}
            {showForm && (
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{editingDestination ? 'Modifier la Destination' : 'Nouvelle Destination'}</h5>
                        <Button variant="outline-secondary" size="sm" onClick={handleCloseForm}>✕</Button>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ville *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="ville"
                                            value={formData.ville}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            placeholder="Ex: Casablanca, Tanger, Marrakech..."
                                        />
                                        <Form.Text className="text-muted">
                                            Nom de la ville de destination
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Frais de Déplacement (DH) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="frais_deplacement"
                                            value={formData.frais_deplacement}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            disabled={saving}
                                            placeholder="Ex: 150.00"
                                        />
                                        <Form.Text className="text-muted">
                                            Frais standard pour cette destination
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex gap-2 mt-3">
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        editingDestination ? 'Modifier' : 'Créer'
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

            {/* Tableau des destinations */}
            <Card>
                <Card.Header>
                    <h5 className="mb-0">
                        Liste des Destinations ({destinationsFiltrees.length})
                        {searchTerm && (
                            <Badge bg="info" className="ms-2">
                                Filtre: "{searchTerm}"
                            </Badge>
                        )}
                    </h5>
                </Card.Header>
                <Card.Body>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <Table striped bordered hover responsive>
                            <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th width="50">#</th>
                                    <th width="300">Ville</th>
                                    <th width="200">Frais de Déplacement</th>
                                    <th width="150">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {destinationsFiltrees.map((destination, index) => (
                                    <tr key={destination.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>{destination.ville}</strong>
                                        </td>
                                        <td>
                                            <Badge bg="success" className="fs-6">
                                                {parseFloat(destination.frais_deplacement).toLocaleString()} DH
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleShowForm(destination)}
                                                    disabled={showForm}
                                                    title="Modifier"
                                                >
                                                    ✏️
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(destination.id)}
                                                    disabled={showForm}
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {destinationsFiltrees.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>
                                {searchTerm ? 'Aucune destination trouvée' : 'Aucune destination enregistrée'}
                            </h5>
                            <p>
                                {searchTerm
                                    ? 'Modifiez vos critères de recherche'
                                    : 'Commencez par ajouter votre première destination'
                                }
                            </p>
                            {!searchTerm && (
                                <Button variant="primary" onClick={() => handleShowForm()}>
                                    + Ajouter une destination
                                </Button>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal de confirmation de suppression */}
            <Modal show={false} onHide={() => { }}>
                {/* Vous pouvez ajouter un modal de confirmation si nécessaire */}
            </Modal>
        </Container>
    );
}

export default Destinations;