import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import { transporteurExterneService, trajetService } from '../services/api';
import { jsPDF } from 'jspdf';

function TransporteursExternes() {
    const [transporteurs, setTransporteurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [editingTransporteur, setEditingTransporteur] = useState(null);
    const [transporteurSelectionne, setTransporteurSelectionne] = useState(null);
    const [trajetsTransporteur, setTrajetsTransporteur] = useState([]);
    const [loadingTrajets, setLoadingTrajets] = useState(false);
    const [showEditStatutModal, setShowEditStatutModal] = useState(false);
    const [trajetAEditer, setTrajetAEditer] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        ice: '',
        telephone: '',
        email: '',
        adresse: '',
        statut: 'actif'
    });

    const [filtresTrajets, setFiltresTrajets] = useState({
        date_debut: '',
        date_fin: '',
        statut_paiement: ''
    });

    useEffect(() => {
        fetchTransporteurs();
    }, []);

    const fetchTransporteurs = async () => {
        try {
            const response = await transporteurExterneService.getAll();
            setTransporteurs(response.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des transporteurs');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrajetsTransporteur = async (transporteurId, dateDebut = '', dateFin = '', statutPaiement = '') => {
        setLoadingTrajets(true);
        try {
            const response = await trajetService.getAll();
            let trajetsFiltres = response.data.filter(trajet =>
                trajet.transporteur_externe === transporteurId
            );

            // Appliquer les filtres de date
            if (dateDebut) {
                trajetsFiltres = trajetsFiltres.filter(trajet => trajet.date >= dateDebut);
            }
            if (dateFin) {
                trajetsFiltres = trajetsFiltres.filter(trajet => trajet.date <= dateFin);
            }

            // Appliquer le filtre de statut de paiement
            if (statutPaiement) {
                trajetsFiltres = trajetsFiltres.filter(trajet =>
                    trajet.statut_paiement_sous_traitance === statutPaiement
                );
            }

            // TRI PAR DATE DÉCROISSANTE
            trajetsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTrajetsTransporteur(trajetsFiltres);
        } catch (error) {
            console.error('Error fetching trajets:', error);
            setTrajetsTransporteur([]);
        } finally {
            setLoadingTrajets(false);
        }
    };

    const handleShowDetails = async (transporteur) => {
        setTransporteurSelectionne(transporteur);
        setShowDetails(true);
        await fetchTrajetsTransporteur(transporteur.id);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setTransporteurSelectionne(null);
        setTrajetsTransporteur([]);
        setFiltresTrajets({ date_debut: '', date_fin: '', statut_paiement: '' });
    };

    const handleFiltreTrajetsChange = (e) => {
        const { name, value } = e.target;
        setFiltresTrajets(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const appliquerFiltresTrajets = async () => {
        if (transporteurSelectionne) {
            await fetchTrajetsTransporteur(
                transporteurSelectionne.id,
                filtresTrajets.date_debut,
                filtresTrajets.date_fin,
                filtresTrajets.statut_paiement
            );
        }
    };

    const reinitialiserFiltresTrajets = async () => {
        setFiltresTrajets({ date_debut: '', date_fin: '', statut_paiement: '' });
        if (transporteurSelectionne) {
            await fetchTrajetsTransporteur(transporteurSelectionne.id);
        }
    };

    const handleEditStatutClick = (trajet) => {
        setTrajetAEditer(trajet);
        setShowEditStatutModal(true);
    };

    const handleUpdateStatutPaiement = async (nouveauStatut) => {
        if (!trajetAEditer) return;

        setSaving(true);
        try {
            // ⭐ CORRECTION : Envoyer TOUTES les données du trajet, pas seulement le statut
            const donneesMiseAJour = {
                ...trajetAEditer,
                statut_paiement_sous_traitance: nouveauStatut
            };

            await trajetService.update(trajetAEditer.id, donneesMiseAJour);

            // Recharger les trajets
            if (transporteurSelectionne) {
                await fetchTrajetsTransporteur(
                    transporteurSelectionne.id,
                    filtresTrajets.date_debut,
                    filtresTrajets.date_fin,
                    filtresTrajets.statut_paiement
                );
            }

            setShowEditStatutModal(false);
            setTrajetAEditer(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation: ';
                Object.keys(errors).forEach(key => {
                    errorMessage += `${key}: ${errors[key].join(', ')}; `;
                });
                setError(errorMessage);
            } else {
                setError('Erreur lors de la mise à jour du statut');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBulkUpdateStatutPaiement = async (nouveauStatut) => {
        if (!transporteurSelectionne || trajetsTransporteur.length === 0) return;

        const confirmation = window.confirm(
            `Êtes-vous sûr de vouloir marquer TOUS les trajets de ${transporteurSelectionne.nom} comme "${getStatutText(nouveauStatut)}" ?\n\nCette action est irréversible.`
        );

        if (!confirmation) return;

        setSaving(true);
        try {
            // Mettre à jour tous les trajets du transporteur
            const updatePromises = trajetsTransporteur.map(trajet =>
                trajetService.update(trajet.id, {
                    ...trajet,
                    statut_paiement_sous_traitance: nouveauStatut
                })
            );

            await Promise.all(updatePromises);

            // Recharger les trajets
            await fetchTrajetsTransporteur(
                transporteurSelectionne.id,
                filtresTrajets.date_debut,
                filtresTrajets.date_fin,
                filtresTrajets.statut_paiement
            );
        } catch (error) {
            console.error('Erreur lors de la mise à jour en masse:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation: ';
                Object.keys(errors).forEach(key => {
                    errorMessage += `${key}: ${errors[key].join(', ')}; `;
                });
                setError(errorMessage);
            } else {
                setError('Erreur lors de la mise à jour en masse des statuts');
            }
        } finally {
            setSaving(false);
        }
    };

    // ⭐ AJOUT DES FONCTIONS MANQUANTES

    const handleShowForm = (transporteur = null) => {
        if (transporteur) {
            setEditingTransporteur(transporteur);
            setFormData({
                nom: transporteur.nom,
                ice: transporteur.ice,
                telephone: transporteur.telephone || '',
                email: transporteur.email || '',
                adresse: transporteur.adresse || '',
                statut: transporteur.statut
            });
        } else {
            setEditingTransporteur(null);
            setFormData({
                nom: '',
                ice: '',
                telephone: '',
                email: '',
                adresse: '',
                statut: 'actif'
            });
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTransporteur(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const submissionData = {
                nom: formData.nom,
                ice: formData.ice,
                telephone: formData.telephone || '',
                email: formData.email || '',
                adresse: formData.adresse || '',
                statut: formData.statut
            };

            if (editingTransporteur) {
                await transporteurExterneService.update(editingTransporteur.id, submissionData);
            } else {
                await transporteurExterneService.create(submissionData);
            }

            fetchTransporteurs();
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
                setError('Erreur lors de l\'enregistrement');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce transporteur ?')) {
            try {
                await transporteurExterneService.delete(id);
                fetchTransporteurs();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getStatutText = (statut) => {
        switch (statut) {
            case 'paye': return 'Payé';
            case 'non_paye': return 'Non Payé';
            case 'partiel': return 'Partiel';
            default: return statut;
        }
    };

    const getStatutBadge = (statut) => {
        switch (statut) {
            case 'paye': return 'success';
            case 'non_paye': return 'danger';
            case 'partiel': return 'warning';
            default: return 'secondary';
        }
    };

    const getSousTraitanceBadge = (type) => {
        const types = {
            'je_donne': { bg: 'warning', text: 'Je donne' },
            'je_recois': { bg: 'info', text: 'Je reçois' }
        };
        return types[type] || { bg: 'secondary', text: type };
    };

    const genererPDF = () => {
        if (!transporteurSelectionne || trajetsTransporteur.length === 0) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = margin;

        // Couleurs
        const primaryColor = [41, 128, 185];
        const successColor = [39, 174, 96];
        const dangerColor = [231, 76, 60];
        const warningColor = [243, 156, 18];
        const grayColor = [149, 165, 166];

        // Fonction pour formater les nombres
        const formatMontant = (nombre) => {
            const valeur = parseFloat(nombre || 0);
            const parties = valeur.toFixed(2).split('.');
            let partieEntiere = parties[0];
            const partieDecimale = parties[1];
            partieEntiere = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return `${partieEntiere},${partieDecimale}`;
        };

        // En-tête
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(`SITUATION FINANCIÈRE`, pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.text(`Transporteur: ${transporteurSelectionne.nom}`, pageWidth / 2, 25, { align: 'center' });

        const periode = filtresTrajets.date_debut || filtresTrajets.date_fin
            ? `Période: ${filtresTrajets.date_debut || 'Début'} - ${filtresTrajets.date_fin || 'Fin'}`
            : 'Période: Tous les trajets';
        doc.setFontSize(10);
        doc.text(periode, pageWidth / 2, 32, { align: 'center' });

        yPosition = 50;

        // ✅ CORRECTION ICI : Séparer l'affichage et le calcul
        // Pour l'affichage dans les tableaux : TOUS les trajets
        const trajetsJeDonnePourAffichage = trajetsTransporteur.filter(t => t.type_sous_traitance === 'je_donne');
        const trajetsJeRecoisPourAffichage = trajetsTransporteur.filter(t => t.type_sous_traitance === 'je_recois');

        // ✅ CORRECTION ICI : Pour le calcul : SEULEMENT les non payés
        const trajetsJeDonnePourCalcul = trajetsTransporteur.filter(t =>
            t.type_sous_traitance === 'je_donne' && t.statut_paiement_sous_traitance !== 'paye'
        );

        const trajetsJeRecoisPourCalcul = trajetsTransporteur.filter(t =>
            t.type_sous_traitance === 'je_recois' && t.statut_paiement_sous_traitance !== 'paye'
        );

        // Calculer les totaux SEULEMENT pour les trajets non payés
        const totalJeDonne = trajetsJeDonnePourCalcul.reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0);
        const totalJeRecois = trajetsJeRecoisPourCalcul.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0);
        const soldeNet = totalJeRecois - totalJeDonne;

        yPosition += 25;

        // Tableau des trajets "Je donne" - Afficher TOUS
        if (trajetsJeDonnePourAffichage.length > 0) {
            const hauteurTableauJeDonne = 12 + (trajetsJeDonnePourAffichage.length * 10) + 20;
            if (yPosition + hauteurTableauJeDonne > 260) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('TRAJETS "JE DONNE"', margin, yPosition);
            yPosition += 12;

            doc.setFillColor(...dangerColor);
            doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');

            const colWidthsJeDonne = [22, 35, 40, 28, 25, 20];
            let xPosition = margin + 3;
            doc.text('Date', xPosition, yPosition + 7);
            xPosition += colWidthsJeDonne[0];
            doc.text('Client', xPosition, yPosition + 7);
            xPosition += colWidthsJeDonne[1];
            doc.text('Destination', xPosition, yPosition + 7);
            xPosition += colWidthsJeDonne[2];
            doc.text('N° Cont.', xPosition, yPosition + 7);
            xPosition += colWidthsJeDonne[3];
            doc.text('Montant', xPosition, yPosition + 7);
            xPosition += colWidthsJeDonne[4];
            doc.text('Statut', xPosition, yPosition + 7);

            yPosition += 12;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');

            // ✅ Afficher TOUS les trajets
            trajetsJeDonnePourAffichage.forEach((trajet, index) => {
                if (yPosition > 260) {
                    doc.addPage();
                    yPosition = margin;
                    doc.setFillColor(...dangerColor);
                    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    let xPosHeader = margin + 3;
                    doc.text('Date', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeDonne[0];
                    doc.text('Client', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeDonne[1];
                    doc.text('Destination', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeDonne[2];
                    doc.text('N° Cont.', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeDonne[3];
                    doc.text('Montant', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeDonne[4];
                    doc.text('Statut', xPosHeader, yPosition + 7);
                    yPosition += 12;
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                }

                if (index % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
                }

                doc.setFontSize(8);
                let xPos = margin + 3;
                doc.text(trajet.date || 'N/A', xPos, yPosition + 6);
                xPos += colWidthsJeDonne[0];
                const clientNom = trajet.client_details?.nom || 'N/A';
                const clientCourt = clientNom.length > 15 ? clientNom.substring(0, 15) + '...' : clientNom;
                doc.text(clientCourt, xPos, yPosition + 6);
                xPos += colWidthsJeDonne[1];
                const destination = trajet.destination_details?.ville || 'N/A';
                const destinationCourte = destination.length > 15 ? destination.substring(0, 15) + '...' : destination;
                doc.text(destinationCourte, xPos, yPosition + 6);
                xPos += colWidthsJeDonne[2];
                doc.text(trajet.numeros_conteneurs || trajet.n_conteneurs?.toString() || 'N/A', xPos, yPosition + 6);
                xPos += colWidthsJeDonne[3];
                doc.setFont(undefined, 'bold');
                doc.text(`${formatMontant(trajet.prix_sous_traitance || 0)} DH`, xPos, yPosition + 6);
                doc.setFont(undefined, 'normal');
                xPos += colWidthsJeDonne[4];
                const statutPaiement = trajet.statut_paiement_sous_traitance || 'non_paye';
                let statutColor = dangerColor;
                let statutText = 'Non Payé';
                if (statutPaiement === 'paye') {
                    statutColor = successColor;
                    statutText = 'Payé';
                } else if (statutPaiement === 'partiel') {
                    statutColor = warningColor;
                    statutText = 'Partiel';
                }
                doc.setTextColor(...statutColor);
                doc.setFont(undefined, 'bold');
                doc.text(statutText, xPos, yPosition + 6);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPosition + 8, pageWidth - margin, yPosition + 8);
                yPosition += 10;
            });
            yPosition += 20;
        }

        // Tableau des trajets "Je reçois" - Afficher TOUS
        if (trajetsJeRecoisPourAffichage.length > 0) {
            const hauteurTableauJeRecois = 12 + (trajetsJeRecoisPourAffichage.length * 10) + 20;
            if (yPosition + hauteurTableauJeRecois > 260) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('TRAJETS "JE REÇOIS"', margin, yPosition);
            yPosition += 12;

            doc.setFillColor(...successColor);
            doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');

            const colWidthsJeRecois = [22, 30, 35, 25, 30, 20];
            let xPosition = margin + 3;
            doc.text('Date', xPosition, yPosition + 7);
            xPosition += colWidthsJeRecois[0];
            doc.text('Client', xPosition, yPosition + 7);
            xPosition += colWidthsJeRecois[1];
            doc.text('Destination', xPosition, yPosition + 7);
            xPosition += colWidthsJeRecois[2];
            doc.text('N° Cont.', xPosition, yPosition + 7);
            xPosition += colWidthsJeRecois[3];
            doc.text('Montant', xPosition, yPosition + 7);
            xPosition += colWidthsJeRecois[4];
            doc.text('Statut', xPosition, yPosition + 7);

            yPosition += 12;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');

            // ✅ Afficher TOUS les trajets
            trajetsJeRecoisPourAffichage.forEach((trajet, index) => {
                if (yPosition > 260) {
                    doc.addPage();
                    yPosition = margin;
                    doc.setFillColor(...successColor);
                    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    let xPosHeader = margin + 3;
                    doc.text('Date', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeRecois[0];
                    doc.text('Client', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeRecois[1];
                    doc.text('Destination', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeRecois[2];
                    doc.text('N° Cont.', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeRecois[3];
                    doc.text('Montant', xPosHeader, yPosition + 7);
                    xPosHeader += colWidthsJeRecois[4];
                    doc.text('Statut', xPosHeader, yPosition + 7);
                    yPosition += 12;
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                }

                if (index % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
                }

                doc.setFontSize(8);
                let xPos = margin + 3;
                doc.text(trajet.date || 'N/A', xPos, yPosition + 6);
                xPos += colWidthsJeRecois[0];
                const clientNom = trajet.client_details?.nom || 'N/A';
                const clientCourt = clientNom.length > 12 ? clientNom.substring(0, 12) + '...' : clientNom;
                doc.text(clientCourt, xPos, yPosition + 6);
                xPos += colWidthsJeRecois[1];
                const destination = trajet.destination_details?.ville || 'N/A';
                const destinationCourte = destination.length > 12 ? destination.substring(0, 12) + '...' : destination;
                doc.text(destinationCourte, xPos, yPosition + 6);
                xPos += colWidthsJeRecois[2];
                doc.text(trajet.numeros_conteneurs || trajet.n_conteneurs?.toString() || 'N/A', xPos, yPosition + 6);
                xPos += colWidthsJeRecois[3];
                doc.setFont(undefined, 'bold');
                doc.text(`${formatMontant(trajet.prix_trajet || 0)} DH`, xPos, yPosition + 6);
                doc.setFont(undefined, 'normal');
                xPos += colWidthsJeRecois[4];
                const statutPaiement = trajet.statut_paiement_sous_traitance || 'non_paye';
                let statutColor = dangerColor;
                let statutText = 'Non Payé';
                if (statutPaiement === 'paye') {
                    statutColor = successColor;
                    statutText = 'Payé';
                } else if (statutPaiement === 'partiel') {
                    statutColor = warningColor;
                    statutText = 'Partiel';
                }
                doc.setTextColor(...statutColor);
                doc.setFont(undefined, 'bold');
                doc.text(statutText, xPos, yPosition + 6);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPosition + 8, pageWidth - margin, yPosition + 8);
                yPosition += 10;
            });
            yPosition += 20;
        }

        if (yPosition > 200) {
            doc.addPage();
            yPosition = margin;
        }

        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 80, 3, 3, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('RÉSUMÉ FINANCIER', margin + 10, yPosition + 15);

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Total trajets "Je donne": ${trajetsJeDonnePourAffichage.length} trajet${trajetsJeDonnePourAffichage.length > 1 ? 's' : ''}`, margin + 15, yPosition + 28);
        doc.text(`Total trajets "Je reçois": ${trajetsJeRecoisPourAffichage.length} trajet${trajetsJeRecoisPourAffichage.length > 1 ? 's' : ''}`, margin + 15, yPosition + 38);

        doc.setFont(undefined, 'bold');
        // ✅ CORRECTION : Utiliser les totaux CALCULÉS (non payés seulement)
        doc.text(`Total à payer : ${formatMontant(totalJeDonne)} DH`, pageWidth - margin - 10, yPosition + 28, { align: 'right' });
        doc.text(`Total à recevoir : ${formatMontant(totalJeRecois)} DH`, pageWidth - margin - 10, yPosition + 38, { align: 'right' });


        yPosition += 65;

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setFont("helvetica", "bold");

        // ✅ CORRECTION : Afficher le solde basé sur les non payés
        if (soldeNet >= 0) {
            doc.setTextColor(...successColor);
            doc.text(`SOLDE À RECEVOIR: ${formatMontant(soldeNet)} DH`, pageWidth / 2, yPosition, { align: 'center' });
        } else {
            doc.setTextColor(...dangerColor);
            doc.text(`SOLDE À PAYER: ${formatMontant(Math.abs(soldeNet))} DH`, pageWidth / 2, yPosition, { align: 'center' });
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(...grayColor);
            doc.line(margin, 280, pageWidth - margin, 280);
            doc.setFontSize(8);
            doc.setTextColor(...grayColor);
            doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
            doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 290, { align: 'center' });
        }

        const dateGeneration = new Date().toISOString().split('T')[0];
        const nomFichier = `situation-${transporteurSelectionne.nom.replace(/\s+/g, '-')}-${dateGeneration}.pdf`;
        doc.save(nomFichier);
    };

    // Calcul des statistiques
    const statsTrajets = {
        totalJeDonne: trajetsTransporteur.filter(t => t.type_sous_traitance === 'je_donne').length,
        totalJeRecois: trajetsTransporteur.filter(t => t.type_sous_traitance === 'je_recois').length,
        montantJeDonne: trajetsTransporteur
            .filter(t => t.type_sous_traitance === 'je_donne')
            .reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0),
        montantJeRecois: trajetsTransporteur
            .filter(t => t.type_sous_traitance === 'je_recois')
            .reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0)
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
                <h1>🚚 Transporteurs Externes</h1>
                <Button variant="primary" onClick={() => handleShowForm()}>
                    + Nouveau Transporteur
                </Button>
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Formulaire de création/édition */}
            {showForm && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            {editingTransporteur ? 'Modifier le Transporteur' : 'Nouveau Transporteur'}
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nom du Transporteur *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Transport Alaoui"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>ICE *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="ice"
                                            value={formData.ice}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: 123456789"
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
                                            placeholder="Ex: 0522 00 00 00"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Ex: contact@transport.com"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Adresse</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    placeholder="Adresse complète du transporteur..."
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Statut</Form.Label>
                                <Form.Select
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleChange}
                                >
                                    <option value="actif">Actif</option>
                                    <option value="inactif">Inactif</option>
                                </Form.Select>
                            </Form.Group>

                            <div className="d-flex gap-2">
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        editingTransporteur ? 'Modifier' : 'Créer'
                                    )}
                                </Button>
                                <Button variant="secondary" onClick={handleCloseForm}>
                                    Annuler
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {/* Tableau principal */}
            <Card>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Nom</th>
                                <th>ICE</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Statut</th>
                                <th width="250">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transporteurs.map(transporteur => (
                                <tr key={transporteur.id}>
                                    <td>
                                        <strong>{transporteur.nom}</strong>
                                        {transporteur.adresse && (
                                            <div>
                                                <small className="text-muted">{transporteur.adresse}</small>
                                            </div>
                                        )}
                                    </td>
                                    <td>{transporteur.ice}</td>
                                    <td>{transporteur.telephone || '-'}</td>
                                    <td>{transporteur.email || '-'}</td>
                                    <td>
                                        <Badge bg={transporteur.statut === 'actif' ? 'success' : 'secondary'}>
                                            {transporteur.statut === 'actif' ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="btn-group">
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => handleShowDetails(transporteur)}
                                            >
                                                📊 Situation
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleShowForm(transporteur)}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(transporteur.id)}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {transporteurs.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucun transporteur enregistré</h5>
                            <p>Cliquez sur "Nouveau Transporteur" pour commencer</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Détails du Transporteur */}
            {showDetails && transporteurSelectionne && (
                <Modal show={showDetails} onHide={handleCloseDetails} size="xl" enforceFocus={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>📊 Situation avec {transporteurSelectionne.nom}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Filtres */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">🔍 Filtres</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date Début</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_debut"
                                                value={filtresTrajets.date_debut}
                                                onChange={handleFiltreTrajetsChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date Fin</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_fin"
                                                value={filtresTrajets.date_fin}
                                                onChange={handleFiltreTrajetsChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Statut Paiement</Form.Label>
                                            <Form.Select
                                                name="statut_paiement"
                                                value={filtresTrajets.statut_paiement}
                                                onChange={handleFiltreTrajetsChange}
                                            >
                                                <option value="">Tous les statuts</option>
                                                <option value="paye">Payé</option>
                                                <option value="non_paye">Non Payé</option>
                                                <option value="partiel">Partiel</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} className="d-flex align-items-end">
                                        <Button
                                            variant="primary"
                                            onClick={appliquerFiltresTrajets}
                                            className="me-2"
                                        >
                                            Appliquer
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={reinitialiserFiltresTrajets}
                                        >
                                            Réinitialiser
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Boutons de mise à jour en masse */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">⚡ Mise à jour en masse</h6>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="warning" className="mb-3">
                                    <strong>Attention!</strong> Ces actions modifient le statut de paiement de <strong>TOUS</strong> les trajets de ce transporteur.
                                </Alert>
                                <div className="d-grid gap-2">
                                    <Button
                                        variant="outline-success"
                                        onClick={() => handleBulkUpdateStatutPaiement('paye')}
                                        disabled={trajetsTransporteur.length === 0 || saving}
                                    >
                                        ✅ Tout marquer comme Payé
                                    </Button>
                                    <Button
                                        variant="outline-warning"
                                        onClick={() => handleBulkUpdateStatutPaiement('partiel')}
                                        disabled={trajetsTransporteur.length === 0 || saving}
                                    >
                                        ⚠️ Tout marquer comme Partiel
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => handleBulkUpdateStatutPaiement('non_paye')}
                                        disabled={trajetsTransporteur.length === 0 || saving}
                                    >
                                        ❌ Tout marquer comme Non Payé
                                    </Button>
                                </div>
                                {saving && (
                                    <div className="text-center mt-3">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Mise à jour en cours...
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Statistiques */}
                        {/* Statistiques */}
                        <Row className="mb-4">
                            <Col md={3}>
                                <Card className="text-center border-warning">
                                    <Card.Body>
                                        <Card.Title>📤 Je donne</Card.Title>
                                        <h4>{trajetsTransporteur.filter(t => t.type_sous_traitance === 'je_donne').length}</h4>
                                        <div className="mt-2">
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Payés:</span>
                                                <span className="small">
                                                    {trajetsTransporteur
                                                        .filter(t => t.type_sous_traitance === 'je_donne' && t.statut_paiement_sous_traitance === 'paye')
                                                        .length}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Non payés:</span>
                                                <span className="text-danger small">
                                                    {trajetsTransporteur
                                                        .filter(t => t.type_sous_traitance === 'je_donne' && t.statut_paiement_sous_traitance !== 'paye')
                                                        .length}
                                                </span>
                                            </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">Total:</span>
                                            <span className="small">
                                                {trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_donne')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0)
                                                    .toLocaleString()} DH
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mt-1">
                                            <span className="text-danger small">À payer:</span>
                                            <span className="text-danger small fw-bold">
                                                {trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_donne' && t.statut_paiement_sous_traitance !== 'paye')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0)
                                                    .toLocaleString()} DH
                                            </span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-info">
                                    <Card.Body>
                                        <Card.Title>📥 Je reçois</Card.Title>
                                        <h4>{trajetsTransporteur.filter(t => t.type_sous_traitance === 'je_recois').length}</h4>
                                        <div className="mt-2">
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Payés:</span>
                                                <span className="small">
                                                    {trajetsTransporteur
                                                        .filter(t => t.type_sous_traitance === 'je_recois' && t.statut_paiement_sous_traitance === 'paye')
                                                        .length}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Non payés:</span>
                                                <span className="text-success small">
                                                    {trajetsTransporteur
                                                        .filter(t => t.type_sous_traitance === 'je_recois' && t.statut_paiement_sous_traitance !== 'paye')
                                                        .length}
                                                </span>
                                            </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">Total:</span>
                                            <span className="small">
                                                {trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_recois')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0)
                                                    .toLocaleString()} DH
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mt-1">
                                            <span className="text-success small">À recevoir:</span>
                                            <span className="text-success small fw-bold">
                                                {trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_recois' && t.statut_paiement_sous_traitance !== 'paye')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0)
                                                    .toLocaleString()} DH
                                            </span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-success">
                                    <Card.Body>
                                        <Card.Title>💰 Solde réel</Card.Title>
                                        <h4>
                                            {(
                                                trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_recois' && t.statut_paiement_sous_traitance !== 'paye')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0)
                                                -
                                                trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_donne' && t.statut_paiement_sous_traitance !== 'paye')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0)
                                            ).toLocaleString()} DH
                                        </h4>
                                        <p className="mb-0">
                                            {trajetsTransporteur
                                                .filter(t => t.type_sous_traitance === 'je_recois' && t.statut_paiement_sous_traitance !== 'paye')
                                                .reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0)
                                                >
                                                trajetsTransporteur
                                                    .filter(t => t.type_sous_traitance === 'je_donne' && t.statut_paiement_sous_traitance !== 'paye')
                                                    .reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0)
                                                ? 'À recevoir' : 'À payer'}
                                        </p>
                                        <p className="mb-0 text-muted small">

                                        </p>
                                        <hr className="my-2" />
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">Solde total:</span>
                                            <span className="small">
                                                {(
                                                    trajetsTransporteur
                                                        .filter(t => t.type_sous_traitance === 'je_recois')
                                                        .reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0)
                                                    -
                                                    trajetsTransporteur
                                                        .filter(t => t.type_sous_traitance === 'je_donne')
                                                        .reduce((sum, t) => sum + parseFloat(t.prix_sous_traitance || 0), 0)
                                                ).toLocaleString()} DH
                                            </span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-primary">
                                    <Card.Body>
                                        <Card.Title>📋 Total</Card.Title>
                                        <h4>{trajetsTransporteur.length}</h4>
                                        <div className="mt-2">
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Payés:</span>
                                                <span className="text-success small">
                                                    {trajetsTransporteur.filter(t => t.statut_paiement_sous_traitance === 'paye').length}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Non payés:</span>
                                                <span className="text-warning small">
                                                    {trajetsTransporteur.filter(t => t.statut_paiement_sous_traitance === 'non_paye').length}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Partiels:</span>
                                                <span className="text-info small">
                                                    {trajetsTransporteur.filter(t => t.statut_paiement_sous_traitance === 'partiel').length}
                                                </span>
                                            </div>
                                        </div>
                                        <hr className="my-2" />
                                        <p className="mb-0 text-muted small">Trajets</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Tableau des trajets */}
                        {loadingTrajets ? (
                            <div className="text-center">
                                <Spinner animation="border" />
                                <p>Chargement des trajets...</p>
                            </div>
                        ) : (
                            <>
                                <Card>
                                    <Card.Body className="p-0">
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table striped bordered hover responsive className="mb-0">
                                                <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Type</th>
                                                        <th>Client</th>
                                                        <th>Destination</th>
                                                        <th>Numéro Conteneur</th>
                                                        <th>Prix</th>
                                                        <th>Statut Paiement</th>
                                                        <th width="120">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trajetsTransporteur.map(trajet => {
                                                        const sousTraitance = getSousTraitanceBadge(trajet.type_sous_traitance);
                                                        return (
                                                            <tr key={trajet.id}>
                                                                <td>{trajet.date}</td>
                                                                <td>
                                                                    <Badge bg={sousTraitance.bg}>
                                                                        {sousTraitance.text}
                                                                    </Badge>
                                                                </td>
                                                                <td>{trajet.client_details?.nom || 'N/A'}</td>
                                                                <td>{trajet.destination_details?.ville || 'N/A'}</td>
                                                                <td>
                                                                    {trajet.numeros_conteneurs ? (
                                                                        <Badge bg="info" className="text-wrap">
                                                                            {trajet.numeros_conteneurs}
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted">-</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {trajet.type_sous_traitance === 'je_donne' ? (
                                                                        <strong className="text-danger">
                                                                            {parseFloat(trajet.prix_sous_traitance || 0).toLocaleString()} DH
                                                                        </strong>
                                                                    ) : (
                                                                        <strong className="text-success">
                                                                            {parseFloat(trajet.prix_trajet || 0).toLocaleString()} DH
                                                                        </strong>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <Badge bg={getStatutBadge(trajet.statut_paiement_sous_traitance)}>
                                                                        {getStatutText(trajet.statut_paiement_sous_traitance)}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        onClick={() => handleEditStatutClick(trajet)}
                                                                        title="Modifier le statut"
                                                                    >
                                                                        📝 Modifier
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>

                                        {trajetsTransporteur.length === 0 && (
                                            <div className="text-center text-muted py-4">
                                                <h5>Aucun trajet trouvé</h5>
                                                <p>Aucun trajet enregistré avec ce transporteur pour la période sélectionnée</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="success" onClick={genererPDF} disabled={trajetsTransporteur.length === 0}>
                            📄 Générer PDF
                        </Button>
                        <Button variant="secondary" onClick={handleCloseDetails}>
                            Fermer
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}

            {/* Modal d'édition du statut */}
            {showEditStatutModal && trajetAEditer && (
                <Modal show={showEditStatutModal} onHide={() => setShowEditStatutModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>📝 Modifier Statut Paiement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p><strong>Trajet du:</strong> {trajetAEditer.date}</p>
                        <p><strong>Type:</strong> {trajetAEditer.type_sous_traitance === 'je_donne' ? 'Je donne' : 'Je reçois'}</p>
                        <p><strong>Client:</strong> {trajetAEditer.client_details?.nom || 'N/A'}</p>
                        <p><strong>Destination:</strong> {trajetAEditer.destination_details?.ville || 'N/A'}</p>
                        <p><strong>N° Conteneur:</strong> {trajetAEditer.numeros_conteneurs || '-'}</p>
                        <p><strong>Montant:</strong>
                            {trajetAEditer.type_sous_traitance === 'je_donne'
                                ? `${parseFloat(trajetAEditer.prix_sous_traitance || 0).toLocaleString()} DH`
                                : `${parseFloat(trajetAEditer.prix_trajet || 0).toLocaleString()} DH`
                            }
                        </p>

                        <hr />

                        <Form.Group>
                            <Form.Label><strong>Nouveau statut de paiement:</strong></Form.Label>
                            <div className="d-grid gap-2">
                                <Button
                                    variant={trajetAEditer.statut_paiement_sous_traitance === 'paye' ? 'success' : 'outline-success'}
                                    onClick={() => handleUpdateStatutPaiement('paye')}
                                    disabled={saving}
                                >
                                    ✅ Marquer comme Payé
                                </Button>
                                <Button
                                    variant={trajetAEditer.statut_paiement_sous_traitance === 'partiel' ? 'warning' : 'outline-warning'}
                                    onClick={() => handleUpdateStatutPaiement('partiel')}
                                    disabled={saving}
                                >
                                    ⚠️ Marquer comme Partiel
                                </Button>
                                <Button
                                    variant={trajetAEditer.statut_paiement_sous_traitance === 'non_paye' ? 'danger' : 'outline-danger'}
                                    onClick={() => handleUpdateStatutPaiement('non_paye')}
                                    disabled={saving}
                                >
                                    ❌ Marquer comme Non Payé
                                </Button>
                            </div>
                        </Form.Group>

                        {saving && (
                            <div className="text-center mt-3">
                                <Spinner animation="border" size="sm" className="me-2" />
                                Mise à jour en cours...
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditStatutModal(false)}>
                            Annuler
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
}

export default TransporteursExternes;