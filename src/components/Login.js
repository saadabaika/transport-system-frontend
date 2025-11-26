import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTestAccounts, setShowTestAccounts] = useState(false); // Nouvel état
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');


        const result = await login(credentials);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <Container fluid className="bg-light min-vh-100 d-flex align-items-center py-4">
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={10} md={6} lg={4} xl={3}>
                    <Card className="shadow border-0">
                        <Card.Body className="p-3 p-md-4">
                            <div className="text-center mb-4">
                                <div className="bg-dark text-white rounded p-3 d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{ width: '60px', height: '60px' }}>
                                    <span className="fs-4 fw-bold">FT</span>
                                </div>
                                <h4 className="fw-bold mb-2">FleetMaster Pro</h4>
                                <p className="text-muted mb-0">Connectez-vous à votre compte</p>
                            </div>

                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium">Nom d'utilisateur</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        placeholder="Votre nom d'utilisateur"
                                        required
                                        disabled={loading}
                                        size="lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-medium">Mot de passe</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        placeholder="Votre mot de passe"
                                        required
                                        disabled={loading}
                                        size="lg"
                                    />
                                </Form.Group>

                                <Button
                                    variant="dark"
                                    type="submit"
                                    className="w-100 py-2 fw-medium"
                                    disabled={loading}
                                    size="lg"
                                >
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Connexion...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Se connecter
                                        </>
                                    )}
                                </Button>
                            </Form>


                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;