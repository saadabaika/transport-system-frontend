import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Modal, Form, Row, Col, Card, Badge
} from 'react-bootstrap';
import { employeService } from '../services/api';

function Employes() {
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmploye, setEditingEmploye] = useState(null);

    const [formData, setFormData] = useState({
        type_employe: 'chauffeur',
        nom: '',
        prenom: '',
        telephone: '',
        salaire_base: '',
        statut: 'actif'
    });

    useEffect(() => {
        fetchEmployes();
    }, []);

    const fetchEmployes = async () => {
        try {
            const response = await employeService.getAll();
            setEmployes(response.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des employés');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (employe = null) => {
        if (employe) {
            setEditingEmploye(employe);
            setFormData({
                type_employe: employe.type_employe,
                nom: employe.nom,
                prenom: employe.prenom,
                telephone: employe.telephone || '',
                salaire_base: employe.salaire_base,
                statut: employe.statut
            });
        } else {
            setEditingEmploye(null);
            setFormData({
                type_employe: 'chauffeur',
                nom: '',
                prenom: '',
                telephone: '',
                salaire_base: '',
                statut: 'actif'
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmploye(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            // Formater le salaire avec 2 décimales
            const salaireValue = parseFloat(formData.salaire_base) || 0;
            const submissionData = {
                ...formData,
                salaire_base: salaireValue.toFixed(2) // Force 2 décimales
            };

            if (editingEmploye) {
                await employeService.update(editingEmploye.id, submissionData);
            } else {
                await employeService.create(submissionData);
            }

            fetchEmployes();
            handleCloseModal();
        } catch (error) {
            console.log('Error details:', error);

            if (error.response?.data) {
                const errors = error.response.data;
                // Afficher les erreurs spécifiques
                if (errors.salaire_base) {
                    setError(`Salaire: ${errors.salaire_base.join(', ')}`);
                } else if (errors.nom) {
                    setError(`Nom: ${errors.nom.join(', ')}`);
                } else if (errors.prenom) {
                    setError(`Prénom: ${errors.prenom.join(', ')}`);
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
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            try {
                await employeService.delete(id);
                fetchEmployes();
            } catch (error) {
                setError('Erreur lors de la suppression');
                console.error('Error:', error);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Pour le salaire, accepter seulement les nombres
        if (name === 'salaire_base') {
            // Enlever tout sauf les chiffres et le point
            const cleanedValue = value.replace(/[^\d.]/g, '');
            // Garder seulement un point décimal
            const parts = cleanedValue.split('.');
            const formattedValue = parts.length > 1
                ? parts[0] + '.' + parts[1].slice(0, 2)
                : parts[0];

            setFormData(prev => ({
                ...prev,
                [name]: formattedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const getTypeBadge = (type) => {
        const types = {
            'chauffeur': 'primary',
            'salarie': 'success',
            'gerant': 'warning'
        };
        return types[type] || 'secondary';
    };

    const getStatutBadge = (statut) => {
        return statut === 'actif' ? 'success' : 'danger';
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
                <h1>Gestion des Employés</h1>
                <Button variant="primary" onClick={() => handleShowModal()}>
                    + Ajouter Employé
                </Button>
            </div>

            {error && !showModal && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Statistiques rapides */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <Card.Title>👨‍✈️ Chauffeurs</Card.Title>
                            <h4>{employes.filter(e => e.type_employe === 'chauffeur').length}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <Card.Title>💼 Salariés</Card.Title>
                            <h4>{employes.filter(e => e.type_employe === 'salarie').length}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <Card.Title>👑 Gérants</Card.Title>
                            <h4>{employes.filter(e => e.type_employe === 'gerant').length}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <Card.Title>💰 Total des Salaires</Card.Title>
                            <h4>
                                {employes.length > 0
                                    ? employes.reduce((sum, e) => sum + parseFloat(e.salaire_base), 0).toLocaleString()
                                    : 0
                                } DH
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Nom & Prénom</th>
                                <th>Type</th>
                                <th>Téléphone</th>
                                <th>Salaire Base</th>
                                <th>Statut</th>
                                <th>Date Embauche</th>
                                <th width="150">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employes.map((employe) => (
                                <tr key={employe.id}>
                                    <td>
                                        <strong>{employe.prenom} {employe.nom}</strong>
                                    </td>
                                    <td>
                                        <Badge bg={getTypeBadge(employe.type_employe)}>
                                            {employe.type_employe}
                                        </Badge>
                                    </td>
                                    <td>{employe.telephone || '-'}</td>
                                    <td>
                                        <strong>{parseFloat(employe.salaire_base).toLocaleString()} DH</strong>
                                    </td>
                                    <td>
                                        <Badge bg={getStatutBadge(employe.statut)}>
                                            {employe.statut}
                                        </Badge>
                                    </td>
                                    <td>{employe.date_embauche}</td>
                                    <td>
                                        <div className="btn-group" role="group">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleShowModal(employe)}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(employe.id)}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {employes.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucun employé enregistré</h5>
                            <p>Cliquez sur "Ajouter Employé" pour commencer</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Ajout/Modification - Version Corrigée */}
            {showModal && (
                <Modal show={showModal} onHide={handleCloseModal} size="lg" enforceFocus={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editingEmploye ? 'Modifier l\'Employé' : 'Ajouter un Employé'}
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
                                        <Form.Label>Type d'Employé *</Form.Label>
                                        <Form.Select
                                            name="type_employe"
                                            value={formData.type_employe}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        >
                                            <option value="chauffeur">Chauffeur</option>
                                            <option value="salarie">Salarié</option>
                                            <option value="gerant">Gérant</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
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
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nom *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Alaoui"
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Prénom *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Ahmed"
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
                                            placeholder="Ex: 06 00 00 00 00"
                                            disabled={saving}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Salaire Base (DH) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="salaire_base"
                                            value={formData.salaire_base}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: 5000.00"
                                            min="0"
                                            step="0.01"
                                            disabled={saving}
                                        />
                                        <Form.Text className="text-muted">
                                            Utilisez le format: 4150.00
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
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
                                    editingEmploye ? 'Modifier' : 'Ajouter'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </Container>
    );
}

export default Employes;