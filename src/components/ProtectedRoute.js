// components/ProtectedRoute.js
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';

function ProtectedRoute({ children, requiredPermission }) {
    const { hasAccess, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
            </Container>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requiredPermission && !hasAccess(requiredPermission.module, requiredPermission.action)) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    <h4>⛔ Accès refusé</h4>
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </Alert>
            </Container>
        );
    }

    return children;
}

export default ProtectedRoute;