import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <div style={styles.code}>404</div>
                <div style={styles.divider} />
                <h1 style={styles.title}>Page introuvable</h1>
                <p style={styles.subtitle}>
                    La page que vous cherchez n'existe pas .
                </p>
                <div style={styles.actions}>
                    <button style={styles.btnPrimary} onClick={() => navigate('/')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        Tableau de bord
                    </button>
                    <button style={styles.btnSecondary} onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Retour
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    },
    code: {
        fontSize: '80px',
        fontWeight: '800',
        color: '#2563eb',
        lineHeight: 1,
        letterSpacing: '-4px',
        marginBottom: '16px',
    },
    divider: {
        width: '48px',
        height: '3px',
        background: '#2563eb',
        borderRadius: '2px',
        margin: '0 auto 24px',
    },
    title: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '10px',
    },
    subtitle: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '32px',
        lineHeight: 1.6,
    },
    actions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    btnPrimary: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    btnSecondary: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        background: '#f1f5f9',
        color: '#475569',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
};

export default NotFound;