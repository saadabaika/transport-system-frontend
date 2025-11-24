import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Button, Modal, Form,
    Alert, Badge, Spinner, InputGroup
} from 'react-bootstrap';
import { userService, myAccountService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GestionUtilisateurs = () => {
    const { user: currentUser, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // États pour les modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // États pour les formulaires
    const [newUser, setNewUser] = useState({
        username: '', email: '', first_name: '', last_name: '',
        role: 'employe', telephone: '', date_embauche: '',
        password: '', confirm_password: ''
    });
    const [editUser, setEditUser] = useState({});
    const [passwordData, setPasswordData] = useState({
        old_password: '', new_password: '', confirm_new_password: ''
    });
    const [adminPasswordData, setAdminPasswordData] = useState({
        new_password: '', confirm_new_password: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await userService.getAll();
            setUsers(response.data);
        } catch (error) {
            setError('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation côté client
        if (newUser.password !== newUser.confirm_password) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (newUser.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        try {
            // Préparer les données pour l'API
            const userData = {
                username: newUser.username,
                email: newUser.email || '',
                first_name: newUser.first_name || '',
                last_name: newUser.last_name || '',
                role: newUser.role,
                telephone: newUser.telephone || '',
                date_embauche: newUser.date_embauche || null,
                password: newUser.password,
                confirm_password: newUser.confirm_password
            };

            console.log('Données envoyées:', userData); // Pour debug

            const response = await userService.create(userData);
            setSuccess('Utilisateur créé avec succès');
            setShowCreateModal(false);
            setNewUser({
                username: '', email: '', first_name: '', last_name: '',
                role: 'employe', telephone: '', date_embauche: '',
                password: '', confirm_password: ''
            });
            loadUsers();
        } catch (error) {
            console.error('Erreur détaillée:', error.response);
            if (error.response?.data) {
                // Afficher les erreurs spécifiques du backend
                const errors = error.response.data;
                if (typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join(', ');
                    setError(errorMessages);
                } else {
                    setError(errors || 'Erreur lors de la création');
                }
            } else {
                setError('Erreur de connexion au serveur');
            }
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await userService.update(selectedUser.id, editUser);
            setSuccess('Utilisateur modifié avec succès');
            setShowEditModal(false);
            loadUsers();
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de la modification');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;
        }

        try {
            await userService.delete(userId);
            setSuccess('Utilisateur supprimé avec succès');
            loadUsers();
        } catch (error) {
            setError('Erreur lors de la suppression');
        }
    };

    const handleBlockUser = async (userId) => {
        try {
            await userService.blockUser(userId);
            setSuccess('Utilisateur bloqué avec succès');
            loadUsers();
        } catch (error) {
            setError('Erreur lors du blocage');
        }
    };

    const handleUnblockUser = async (userId) => {
        try {
            await userService.unblockUser(userId);
            setSuccess('Utilisateur débloqué avec succès');
            loadUsers();
        } catch (error) {
            setError('Erreur lors du déblocage');
        }
    };

    const handleForceLogout = async (userId) => {
        try {
            await userService.forceLogout(userId);
            setSuccess('Utilisateur déconnecté avec succès');
            loadUsers();
        } catch (error) {
            setError('Erreur lors de la déconnexion forcée');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await userService.changePassword(selectedUser.id, passwordData);
            setSuccess('Mot de passe changé avec succès');
            setShowPasswordModal(false);
            setPasswordData({ old_password: '', new_password: '', confirm_new_password: '' });
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
        }
    };

    const handleAdminChangePassword = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await userService.adminChangePassword(selectedUser.id, adminPasswordData);
            setSuccess('Mot de passe changé avec succès');
            setShowAdminPasswordModal(false);
            setAdminPasswordData({ new_password: '', confirm_new_password: '' });
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditUser({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            telephone: user.telephone,
            date_embauche: user.date_embauche,
            statut: user.statut
        });
        setShowEditModal(true);
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setShowPasswordModal(true);
    };

    const openAdminPasswordModal = (user) => {
        setSelectedUser(user);
        setShowAdminPasswordModal(true);
    };

    if (!isAdmin) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    <h4>Accès refusé</h4>
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4">
            <Row>
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Gestion des Utilisateurs</h4>
                            <Button
                                variant="success"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <i className="bi bi-person-plus me-2"></i>
                                Nouvel Utilisateur
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                            {loading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped hover>
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Utilisateur</th>
                                                <th>Email</th>
                                                <th>Rôle</th>
                                                <th>Statut</th>
                                                <th>Dernière connexion</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id}>
                                                    <td>
                                                        <div>
                                                            <strong>{user.username}</strong>
                                                            <br />
                                                            <small className="text-muted">
                                                                {user.first_name} {user.last_name}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                user.role === 'admin' ? 'danger' :
                                                                    user.role === 'facturation' ? 'info' : 'primary' // ⭐ MODIFICATION
                                                            }
                                                        >
                                                            {user.role === 'admin' ? 'Administrateur' :
                                                                user.role === 'facturation' ? 'Agent Facturation' : 'Employé'} {/* ⭐ MODIFICATION */}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={user.statut === 'actif' ? 'success' : 'secondary'}
                                                        >
                                                            {user.statut === 'actif' ? 'Actif' : 'Bloqué'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {user.last_login_display}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => openEditModal(user)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </Button>

                                                            {user.id !== currentUser.id && (
                                                                <>
                                                                    <Button
                                                                        variant="outline-warning"
                                                                        size="sm"
                                                                        onClick={() => openAdminPasswordModal(user)}
                                                                        title="Changer le mot de passe"
                                                                    >
                                                                        <i className="bi bi-key"></i>
                                                                    </Button>

                                                                    {user.statut === 'actif' ? (
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            onClick={() => handleBlockUser(user.id)}
                                                                            title="Bloquer l'utilisateur"
                                                                        >
                                                                            <i className="bi bi-lock"></i>
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            onClick={() => handleUnblockUser(user.id)}
                                                                            title="Débloquer l'utilisateur"
                                                                        >
                                                                            <i className="bi bi-unlock"></i>
                                                                        </Button>
                                                                    )}

                                                                    <Button
                                                                        variant="outline-info"
                                                                        size="sm"
                                                                        onClick={() => handleForceLogout(user.id)}
                                                                        title="Forcer la déconnexion"
                                                                    >
                                                                        <i className="bi bi-box-arrow-right"></i>
                                                                    </Button>

                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                        title="Supprimer l'utilisateur"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal de création d'utilisateur */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Nouvel Utilisateur</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateUser}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom d'utilisateur *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Prénom</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newUser.first_name}
                                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newUser.last_name}
                                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Rôle *</Form.Label>
                                    <Form.Select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        required
                                    >
                                        <option value="employe">Employé</option>
                                        <option value="facturation">Agent de Facturation</option> {/* ⭐ AJOUT */}
                                        <option value="admin">Administrateur</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Téléphone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newUser.telephone}
                                        onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date d'embauche</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={newUser.date_embauche}
                                        onChange={(e) => setNewUser({ ...newUser, date_embauche: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mot de passe *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirmer le mot de passe *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={newUser.confirm_password}
                                        onChange={(e) => setNewUser({ ...newUser, confirm_password: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit">
                            Créer l'utilisateur
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de modification d'utilisateur */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Modifier l'utilisateur</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateUser}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom d'utilisateur *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editUser.username || ''}
                                        onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={editUser.email || ''}
                                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Prénom</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editUser.first_name || ''}
                                        onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editUser.last_name || ''}
                                        onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Rôle *</Form.Label>
                                    <Form.Select
                                        value={editUser.role || 'employe'}
                                        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                        required
                                    >
                                        <option value="employe">Employé</option>
                                        <option value="facturation">Agent de Facturation</option> {/* ⭐ AJOUT */}
                                        <option value="admin">Administrateur</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Statut</Form.Label>
                                    <Form.Select
                                        value={editUser.statut || 'actif'}
                                        onChange={(e) => setEditUser({ ...editUser, statut: e.target.value })}
                                    >
                                        <option value="actif">Actif</option>
                                        <option value="bloque">Bloqué</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Téléphone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editUser.telephone || ''}
                                        onChange={(e) => setEditUser({ ...editUser, telephone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date d'embauche</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={editUser.date_embauche || ''}
                                        onChange={(e) => setEditUser({ ...editUser, date_embauche: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit">
                            Enregistrer
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal changement de mot de passe par admin */}
            <Modal show={showAdminPasswordModal} onHide={() => setShowAdminPasswordModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Changer le mot de passe</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAdminChangePassword}>
                    <Modal.Body>
                        <p>
                            Changer le mot de passe de <strong>{selectedUser?.username}</strong>
                        </p>
                        <Form.Group className="mb-3">
                            <Form.Label>Nouveau mot de passe *</Form.Label>
                            <Form.Control
                                type="password"
                                value={adminPasswordData.new_password}
                                onChange={(e) => setAdminPasswordData({ ...adminPasswordData, new_password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Confirmer le nouveau mot de passe *</Form.Label>
                            <Form.Control
                                type="password"
                                value={adminPasswordData.confirm_new_password}
                                onChange={(e) => setAdminPasswordData({ ...adminPasswordData, confirm_new_password: e.target.value })}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAdminPasswordModal(false)}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit">
                            Changer le mot de passe
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default GestionUtilisateurs;