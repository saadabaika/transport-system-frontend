import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Form, Button, Alert,
    Spinner, Modal
} from 'react-bootstrap';
import { myAccountService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MonCompte = () => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const validatePhone = (value) => {
        // Supprimer tous les caractères non numériques
        return value.replace(/[^\d]/g, '');
    };
    // États pour les formulaires
    const [profileData, setProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({
        old_password: '', new_password: '', confirm_new_password: ''
    });

    // Modal changement mot de passe
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await myAccountService.getProfile();
            setProfile(response.data);
            setProfileData({
                username: response.data.username || '',
                email: response.data.email || '',
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                telephone: response.data.telephone || '',
                date_embauche: response.data.date_embauche || ''
            });
        } catch (error) {
            console.error('Erreur chargement profil:', error);
            setError('Erreur lors du chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // ⭐ CORRECTION : Formater la date au format YYYY-MM-DD
            const dataToSend = {
                ...profileData,
                date_embauche: profileData.date_embauche ?
                    new Date(profileData.date_embauche).toISOString().split('T')[0] :
                    null
            };
            // ⭐ AJOUT : Vérifier ce qui est envoyé
            console.log('Données envoyées:', dataToSend);
            console.log('Type de date_embauche:', typeof dataToSend.date_embauche, 'Valeur:', dataToSend.date_embauche);

            const response = await myAccountService.updateProfile(dataToSend);
            setSuccess('Profil mis à jour avec succès');
            setProfile(response.data.user);
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            setError(error.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await myAccountService.changePassword(passwordData);
            setSuccess('Mot de passe changé avec succès');
            setShowPasswordModal(false);
            setPasswordData({ old_password: '', new_password: '', confirm_new_password: '' });

            // Déconnexion après changement de mot de passe
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            setError(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
        } finally {
            setSaving(false);
        }
    };

    const renderProfileTab = () => (
        <Form onSubmit={handleUpdateProfile}>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nom d'utilisateur</Form.Label>
                        <Form.Control
                            type="text"
                            value={profileData.username || ''}
                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                            required
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={profileData.email || ''}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
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
                            value={profileData.first_name || ''}
                            onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nom</Form.Label>
                        <Form.Control
                            type="text"
                            value={profileData.last_name || ''}
                            onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
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
                            value={profileData.telephone || ''}
                            onChange={(e) => {
                                const cleanedValue = validatePhone(e.target.value);
                                setProfileData({ ...profileData, telephone: cleanedValue });
                            }}
                            placeholder="Ex: 0612345678"
                            maxLength={10} // Limite à 10 chiffres pour un numéro marocain
                        />
                        <Form.Text className="text-muted">
                            Uniquement des chiffres (max 10 caractères)
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Rôle</Form.Label>
                        <Form.Control
                            type="text"
                            value={profile.role === 'admin' ? 'Administrateur' : 'Employé'}
                            disabled
                            className="bg-light"
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
                            value={profileData.date_embauche || ''}
                            onChange={(e) => setProfileData({ ...profileData, date_embauche: e.target.value })}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Dernière connexion</Form.Label>
                        <Form.Control
                            type="text"
                            value={profile.last_login_display || 'Jamais connecté'}
                            disabled
                            className="bg-light"
                        />
                    </Form.Group>
                </Col>
            </Row>

            <div className="d-flex justify-content-between">
                <Button
                    variant="warning"
                    onClick={() => setShowPasswordModal(true)}
                >
                    <i className="bi bi-key me-2"></i>
                    Changer le mot de passe
                </Button>

                <Button
                    variant="primary"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-lg me-2"></i>
                            Enregistrer les modifications
                        </>
                    )}
                </Button>
            </div>
        </Form>
    );

    const renderInfoTab = () => (
        <div className="p-3">
            <h6>Informations du compte</h6>
            <table className="table table-borderless">
                <tbody>
                    <tr>
                        <td width="40%"><strong>Nom d'utilisateur:</strong></td>
                        <td>{profile.username}</td>
                    </tr>
                    <tr>
                        <td><strong>Rôle:</strong></td>
                        <td>
                            <span className={`badge ${profile.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                                {profile.role === 'admin' ? 'Administrateur' : 'Employé'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Statut:</strong></td>
                        <td>
                            <span className={`badge ${profile.statut === 'actif' ? 'bg-success' : 'bg-secondary'}`}>
                                {profile.statut === 'actif' ? 'Actif' : 'Bloqué'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Dernière connexion:</strong></td>
                        <td>{profile.last_login_display || 'Jamais connecté'}</td>
                    </tr>
                    <tr>
                        <td><strong>Date de création:</strong></td>
                        <td>
                            {profile.date_joined ?
                                new Date(profile.date_joined).toLocaleDateString('fr-FR') :
                                'Non disponible'
                            }
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    if (loading) {
        return (
            <Container className="mt-4">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-dark text-white">
                            <h4 className="mb-0">Mon Compte</h4>
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                            {/* Navigation par onglets personnalisée */}
                            <div className="border-bottom mb-4">
                                <nav>
                                    <div className="nav nav-tabs border-0" role="tablist">
                                        <button
                                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('profile')}
                                            type="button"
                                            role="tab"
                                        >
                                            Profil
                                        </button>
                                        <button
                                            className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('info')}
                                            type="button"
                                            role="tab"
                                        >
                                            Informations
                                        </button>
                                    </div>
                                </nav>
                            </div>

                            {/* Contenu des onglets */}
                            <div className="tab-content">
                                <div className={`tab-pane fade ${activeTab === 'profile' ? 'show active' : ''}`}>
                                    {renderProfileTab()}
                                </div>
                                <div className={`tab-pane fade ${activeTab === 'info' ? 'show active' : ''}`}>
                                    {renderInfoTab()}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal changement de mot de passe */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Changer mon mot de passe</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleChangePassword}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Ancien mot de passe *</Form.Label>
                            <Form.Control
                                type="password"
                                value={passwordData.old_password}
                                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nouveau mot de passe *</Form.Label>
                            <Form.Control
                                type="password"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Confirmer le nouveau mot de passe *</Form.Label>
                            <Form.Control
                                type="password"
                                value={passwordData.confirm_new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Alert variant="info" className="mt-3">
                            <small>
                                <i className="bi bi-info-circle me-2"></i>
                                Vous serez déconnecté après le changement de mot de passe.
                            </small>
                        </Alert>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Changement...
                                </>
                            ) : (
                                'Changer le mot de passe'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default MonCompte;