import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import { clientService, factureService } from '../services/api';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext'; // ⭐ IMPORT AJOUTÉ

function Facturation() {
    const { hasAccess, isFacturation, isAdmin } = useAuth(); // ⭐ HOOK AJOUTÉ
    const [clients, setClients] = useState([]);
    const [factures, setFactures] = useState([]);
    const [facturesFiltrees, setFacturesFiltrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingFacture, setEditingFacture] = useState(null);
    const [selectedFacture, setSelectedFacture] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // URLs des logos - À ADAPTER SELON VOS FICHIERS
    const logos = {
        ars_distribution: '/images/logos/ars_distribution.png',
        arn_logistique: '/images/logos/arn_logistique.png'
    };

    // États pour les filtres
    const [filtres, setFiltres] = useState({
        client: '',
        entreprise: '',
        statut: '',
        dateDebut: '',
        dateFin: ''
    });

    const [formData, setFormData] = useState({
        entreprise: 'ars_distribution',
        client: '',
        date_facture: new Date().toISOString().split('T')[0],
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions_paiement: 'Paiement à 30 jours',
        notes: '',
        statut: 'brouillon',
        lignes: []
    });

    const [nouvelleLigne, setNouvelleLigne] = useState({
        description: '',
        quantite: 1,
        prix_unitaire: '',
        tva: 20.00
    });

    // ⭐ VARIABLES DE PERMISSIONS AJOUTÉES
    const canCreateFacture = hasAccess('factures', 'create');
    const canEditFacture = hasAccess('factures', 'edit');
    const canDeleteFacture = hasAccess('factures', 'delete');
    const canViewDetails = hasAccess('factures', 'view');

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        appliquerFiltres();
    }, [factures, filtres]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [clientsRes, facturesRes] = await Promise.all([
                clientService.getAll(),
                factureService.getAll()
            ]);

            setClients(clientsRes.data || []);
            setFactures(facturesRes.data || []);
            setError('');
        } catch (error) {
            console.error('Erreur chargement données:', error);
            setError('Erreur lors du chargement des données: ' + (error.message || 'Erreur serveur'));
        } finally {
            setLoading(false);
        }
    };

    const appliquerFiltres = () => {
        let facturesFiltrees = [...factures];

        // Filtre par client
        if (filtres.client) {
            facturesFiltrees = facturesFiltrees.filter(facture =>
                facture.client == filtres.client
            );
        }

        // Filtre par entreprise
        if (filtres.entreprise) {
            facturesFiltrees = facturesFiltrees.filter(facture =>
                facture.entreprise === filtres.entreprise
            );
        }

        // Filtre par statut
        if (filtres.statut) {
            facturesFiltrees = facturesFiltrees.filter(facture =>
                facture.statut === filtres.statut
            );
        }

        // Filtre par date début
        if (filtres.dateDebut) {
            facturesFiltrees = facturesFiltrees.filter(facture =>
                new Date(facture.date_facture) >= new Date(filtres.dateDebut)
            );
        }

        // Filtre par date fin
        if (filtres.dateFin) {
            facturesFiltrees = facturesFiltrees.filter(facture =>
                new Date(facture.date_facture) <= new Date(filtres.dateFin)
            );
        }

        setFacturesFiltrees(facturesFiltrees);
    };

    const handleFiltreChange = (name, value) => {
        setFiltres(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const reinitialiserFiltres = () => {
        setFiltres({
            client: '',
            entreprise: '',
            statut: '',
            dateDebut: '',
            dateFin: ''
        });
    };

    const handleShowForm = (facture = null) => {
        // ⭐ VÉRIFICATION DE PERMISSION AJOUTÉE
        if (facture && !canEditFacture) {
            setError('Vous n\'avez pas la permission de modifier les factures');
            return;
        }
        if (!facture && !canCreateFacture) {
            setError('Vous n\'avez pas la permission de créer des factures');
            return;
        }

        if (facture) {
            setEditingFacture(facture);
            setFormData({
                entreprise: facture.entreprise || 'ars_distribution',
                client: facture.client || '',
                date_facture: facture.date_facture || new Date().toISOString().split('T')[0],
                date_echeance: facture.date_echeance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                conditions_paiement: facture.conditions_paiement || 'Paiement à 30 jours',
                notes: facture.notes || '',
                statut: facture.statut || 'brouillon',
                lignes: facture.lignes_details || facture.lignes || []
            });
        } else {
            setEditingFacture(null);
            setFormData({
                entreprise: 'ars_distribution',
                client: '',
                date_facture: new Date().toISOString().split('T')[0],
                date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                conditions_paiement: 'Paiement à 30 jours',
                notes: '',
                statut: 'brouillon',
                lignes: []
            });
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingFacture(null);
    };

    const handleShowDetails = (facture) => {
        // ⭐ VÉRIFICATION DE PERMISSION AJOUTÉE
        if (!canViewDetails) {
            setError('Vous n\'avez pas la permission de voir les détails des factures');
            return;
        }
        setSelectedFacture(facture);
        setShowDetails(true);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setSelectedFacture(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            if (!formData.client) {
                throw new Error('Veuillez sélectionner un client');
            }
            if (formData.lignes.length === 0) {
                throw new Error('Veuillez ajouter au moins une ligne de facture');
            }

            // ⭐ VALIDATION FINALE DES MONTANTS
            const MONTANT_MAX = 999999999.99;
            let totalTTC = 0;

            for (const ligne of formData.lignes) {
                const montantTTC = parseFloat(ligne.montant_ttc) || 0;
                totalTTC += montantTTC;

                if (montantTTC > MONTANT_MAX) {
                    throw new Error(`La ligne "${ligne.description}" dépasse le montant maximum autorisé`);
                }
            }

            if (totalTTC > MONTANT_MAX * 10) { // Limite totale plus large
                throw new Error(`Le total de la facture (${totalTTC.toLocaleString()} DH) est trop élevé`);
            }

            const submissionData = {
                entreprise: formData.entreprise,
                client: formData.client,
                date_facture: formData.date_facture,
                date_echeance: formData.date_echeance,
                conditions_paiement: formData.conditions_paiement,
                notes: formData.notes,
                statut: formData.statut,
                lignes_data: formData.lignes.map((ligne) => ({
                    description: ligne.description,
                    quantite: parseInt(ligne.quantite),
                    prix_unitaire: parseFloat(ligne.prix_unitaire),
                    tva: parseFloat(ligne.tva)
                }))
            };

            if (editingFacture) {
                await factureService.update(editingFacture.id, submissionData);
            } else {
                await factureService.create(submissionData);
            }

            fetchAllData();
            handleCloseForm();
        } catch (error) {
            console.error('Erreur détaillée:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation: ';

                if (typeof errors === 'object') {
                    Object.keys(errors).forEach(key => {
                        if (Array.isArray(errors[key])) {
                            errorMessage += `${key}: ${errors[key].join(', ')}; `;
                        } else {
                            errorMessage += `${key}: ${errors[key]}; `;
                        }
                    });
                } else {
                    errorMessage = errors || 'Erreur inconnue';
                }

                setError(errorMessage);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setSaving(false);
        }
    };
    const handleAjouterLigne = () => {
        if (nouvelleLigne.description && nouvelleLigne.prix_unitaire) {
            const prixUnitaire = parseFloat(nouvelleLigne.prix_unitaire);
            const quantite = parseInt(nouvelleLigne.quantite);
            const tva = parseFloat(nouvelleLigne.tva);

            // ⭐ LIMITES DE SÉCURITÉ
            const PRIX_MAX = 999999999.99;    // 999 millions
            const QUANTITE_MAX = 99999;       // 99,999 unités
            const MONTANT_MAX = 999999999.99; // 999 millions

            // Validation du prix unitaire
            if (prixUnitaire > PRIX_MAX) {
                setError(`Le prix unitaire ne peut pas dépasser ${PRIX_MAX.toLocaleString()} DH`);
                return;
            }

            // Validation de la quantité
            if (quantite > QUANTITE_MAX) {
                setError(`La quantité ne peut pas dépasser ${QUANTITE_MAX.toLocaleString()}`);
                return;
            }

            // Calcul des montants
            const montantHT = quantite * prixUnitaire;
            const montantTVA = montantHT * (tva / 100);
            const montantTTC = montantHT + montantTVA;

            // Validation des montants calculés
            if (montantHT > MONTANT_MAX) {
                setError(`Le montant HT (${montantHT.toLocaleString()} DH) dépasse la limite de ${MONTANT_MAX.toLocaleString()} DH`);
                return;
            }

            if (montantTTC > MONTANT_MAX) {
                setError(`Le montant TTC (${montantTTC.toLocaleString()} DH) dépasse la limite de ${MONTANT_MAX.toLocaleString()} DH`);
                return;
            }

            const ligne = {
                ...nouvelleLigne,
                montant_ht: montantHT,
                montant_tva: montantTVA,
                montant_ttc: montantTTC
            };

            setFormData(prev => ({
                ...prev,
                lignes: [...prev.lignes, ligne]
            }));

            setNouvelleLigne({
                description: '',
                quantite: 1,
                prix_unitaire: '',
                tva: 20.00
            });

            setError(''); // Clear any previous errors
        }
    };

    const handleSupprimerLigne = (index) => {
        setFormData(prev => ({
            ...prev,
            lignes: prev.lignes.filter((_, i) => i !== index)
        }));
    };

    const calculerTotaux = (lignes = formData.lignes) => {
        let totalHT = 0;
        let totalTVA = 0;
        let totalTTC = 0;

        lignes.forEach(ligne => {
            totalHT += parseFloat(ligne.montant_ht) || 0;
            totalTVA += parseFloat(ligne.montant_tva) || 0;
            totalTTC += parseFloat(ligne.montant_ttc) || 0;
        });

        return {
            totalHT: Number(totalHT.toFixed(2)),
            montantTVA: Number(totalTVA.toFixed(2)),
            totalTTC: Number(totalTTC.toFixed(2))
        };
    };

    const nombreEnLettres = (nombre) => {
        const num = parseFloat(nombre) || 0;
        const partieEntiere = Math.floor(num);
        const centimes = Math.round((num - partieEntiere) * 100);

        const convertirNombre = (num) => {
            if (num === 0) return 'zéro';

            const unite = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
            const dizaine = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
            const exceptions = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];

            let resultat = '';

            // Millions
            if (num >= 1000000) {
                const millions = Math.floor(num / 1000000);
                if (millions === 1) {
                    resultat += 'un million ';
                } else {
                    resultat += convertirNombre(millions) + ' millions ';
                }
                num %= 1000000;
            }

            // Milliers
            if (num >= 1000) {
                const milliers = Math.floor(num / 1000);
                if (milliers === 1) {
                    resultat += 'mille ';
                } else {
                    resultat += convertirNombre(milliers) + ' mille ';
                }
                num %= 1000;
            }

            // Centaines
            if (num >= 100) {
                const cents = Math.floor(num / 100);
                if (cents === 1) {
                    resultat += 'cent ';
                } else {
                    resultat += unite[cents] + ' cent ';
                }
                num %= 100;
            }

            // Dizaines et unités
            if (num > 0) {
                if (num < 10) {
                    resultat += unite[num];
                } else if (num < 17) {
                    resultat += exceptions[num - 10];
                } else if (num < 20) {
                    resultat += 'dix-' + unite[num - 10];
                } else {
                    const diz = Math.floor(num / 10);
                    const unit = num % 10;

                    if (diz === 7 || diz === 9) {
                        const base = diz === 7 ? 60 : 80;
                        const reste = num - base;
                        if (reste === 0) {
                            resultat += dizaine[diz];
                        } else if (reste < 7) {
                            resultat += dizaine[diz - 1] + '-' + unite[reste];
                        } else {
                            resultat += dizaine[diz - 1] + '-' + exceptions[reste - 10];
                        }
                    } else {
                        resultat += dizaine[diz];
                        if (unit > 0) {
                            resultat += (diz === 8 ? '-' : (diz === 0 ? '' : '-')) + unite[unit];
                        }
                        if (diz === 8 && unit === 0) {
                            resultat += 's';
                        }
                    }
                }
            }

            return resultat.trim();
        };

        let resultat = convertirNombre(partieEntiere) + ' dirhams';

        if (centimes > 0) {
            resultat += ' et ' + convertirNombre(centimes) + ' centimes';
        }

        return resultat;
    };

    const genererPDF = async (facture) => {
        // ⭐ VÉRIFICATION DE PERMISSION AJOUTÉE
        if (!canViewDetails) {
            setError('Vous n\'avez pas la permission de générer des PDF');
            return;
        }

        const doc = new jsPDF();
        // Calcul des totaux
        const lignesFacture = facture.lignes_details || facture.lignes || [];

        let totalHT = 0;
        lignesFacture.forEach(ligne => {
            const montant = parseFloat(ligne.montant_ht) || 0;
            totalHT += montant;
        });

        const totalTVA = parseFloat(facture.montant_tva) || lignesFacture.reduce((sum, ligne) => {
            const montantHT = parseFloat(ligne.montant_ht) || (parseInt(ligne.quantite) * parseFloat(ligne.prix_unitaire));
            const tva = parseFloat(ligne.tva) || 0;
            return sum + (montantHT * (tva / 100));
        }, 0);

        const totalTTC = parseFloat(facture.total_ttc) || (totalHT + totalTVA);

        // Configuration des couleurs modernes
        const primaryColor = [41, 128, 185];
        const secondaryColor = [52, 73, 94];
        const accentColor = [46, 204, 113];

        // SECTION LOGO SEULEMENT - SUPPRESSION DU TEXTE
        try {
            const logoUrl = logos[facture.entreprise];

            // Créer une image pour le logo
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = logoUrl;
            });

            // Ajouter le logo agrandi (50x50 pixels)
            const logoWidth = 50;
            const logoHeight = 50;
            doc.addImage(img, 'PNG', 20, 20, logoWidth, logoHeight);

        } catch (error) {
            console.warn('Logo non chargé:', error);
            // Fallback minimaliste sans texte
        }

        // ESPACE AJOUTÉ ICI - TITRE FACTURE PLUS BAS
        doc.setFontSize(28);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('FACTURE', 105, 50, { align: 'center' });

        // Informations facture - Position ajustée avec ESPACE AJOUTÉ
        doc.setFontSize(11);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS FACTURE', 20, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(`N°: ${facture.numero_facture}`, 20, 88);
        doc.text(`Date: ${new Date(facture.date_facture).toLocaleDateString('fr-FR')}`, 20, 93);

        // Informations client - Position ajustée avec ESPACE AJOUTÉ
        const client = clients.find(c => c.id == facture.client);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS CLIENT', 120, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(client?.nom || '', 120, 88);
        doc.text(`ICE: ${client?.ice || ''}`, 120, 93);

        // TABLEAU - Position ajustée avec ESPACE AJOUTÉ
        let yPosition = 100;

        // En-tête du tableau
        doc.setFillColor(...primaryColor);
        doc.rect(15, yPosition, 180, 10, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');

        doc.text('Description', 18, yPosition + 7);
        doc.text('Qté', 80, yPosition + 7, { align: 'center' });
        doc.text('Prix U.', 95, yPosition + 7, { align: 'right' });
        doc.text('TVA %', 115, yPosition + 7, { align: 'center' });
        doc.text('Montant HT', 140, yPosition + 7, { align: 'right' });
        doc.text('Montant TTC', 165, yPosition + 7, { align: 'right' });

        yPosition += 12;

        // Lignes détaillées
        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'normal');

        lignesFacture.forEach((ligne, index) => {
            // ⭐ CORRECTION : Vérifier si on dépasse la zone du pied de page
            const description = ligne.description || '';
            const quantite = parseInt(ligne.quantite) || 0;
            const prixUnitaire = parseFloat(ligne.prix_unitaire) || 0;
            const tva = parseFloat(ligne.tva) || 0;
            const montantHT = parseFloat(ligne.montant_ht) || (quantite * prixUnitaire);
            const montantTTC = parseFloat(ligne.montant_ttc) || (montantHT * (1 + tva / 100));

            // Gestion du texte long pour la description
            const lines = doc.splitTextToSize(description, 55);
            const lineHeight = Math.max(8, lines.length * 3.5);

            // ⭐ CORRECTION : Vérifier si la ligne dépasse la zone de contenu (avant le pied de page)
            if (yPosition + lineHeight > 230) { // 230 au lieu de 250 pour laisser de la place pour les totaux
                doc.addPage();
                yPosition = 30;

                // Réafficher l'en-tête du tableau sur la nouvelle page
                doc.setFillColor(...primaryColor);
                doc.rect(15, yPosition, 180, 10, 'F');
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Description', 18, yPosition + 7);
                doc.text('Qté', 80, yPosition + 7, { align: 'center' });
                doc.text('Prix U.', 95, yPosition + 7, { align: 'right' });
                doc.text('TVA %', 115, yPosition + 7, { align: 'center' });
                doc.text('Montant HT', 140, yPosition + 7, { align: 'right' });
                doc.text('Montant TTC', 165, yPosition + 7, { align: 'right' });
                yPosition += 12;

                doc.setFontSize(8);
                doc.setTextColor(...secondaryColor);
                doc.setFont('helvetica', 'normal');
            }

            // Fond alterné pour les lignes
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(15, yPosition, 180, lineHeight, 'F');
            }

            // Description
            lines.forEach((line, lineIndex) => {
                doc.text(line, 18, yPosition + 5 + (lineIndex * 3.5));
            });

            // Autres colonnes
            doc.text(quantite.toString(), 80, yPosition + 5, { align: 'center' });
            doc.text(prixUnitaire.toFixed(2), 95, yPosition + 5, { align: 'right' });
            doc.text(tva.toFixed(2) + '%', 115, yPosition + 5, { align: 'center' });
            doc.text(montantHT.toFixed(2), 140, yPosition + 5, { align: 'right' });
            doc.text(montantTTC.toFixed(2), 165, yPosition + 5, { align: 'right' });

            // Ligne séparatrice fine
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(15, yPosition + lineHeight, 195, yPosition + lineHeight);

            yPosition += lineHeight;
        });

        // ⭐ CORRECTION : Vérifier si on a assez d'espace pour les totaux
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 30;
        }

        // TOTAUX
        yPosition += 15;

        // Cadre pour les totaux
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.rect(120, yPosition, 75, 40);

        doc.setFontSize(10);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL HT:', 125, yPosition + 8);
        doc.text('TOTAL TVA:', 125, yPosition + 16);
        doc.setFontSize(12);
        doc.setTextColor(...accentColor);
        doc.text('TOTAL TTC:', 125, yPosition + 28);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(10);
        doc.text(`${totalHT.toFixed(2)} DH`, 170, yPosition + 8, { align: 'right' });
        doc.text(`${totalTVA.toFixed(2)} DH`, 170, yPosition + 16, { align: 'right' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalTTC.toFixed(2)} DH`, 180, yPosition + 28, { align: 'right' });

        // MONTANT EN LETTRES - ⭐ CORRECTION : Vérifier l'espace
        yPosition += 45;

        if (yPosition > 230) {
            doc.addPage();
            yPosition = 30;
        }

        doc.setFontSize(9);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'normal');
        const montantEnLettres = nombreEnLettres(totalTTC);
        const lignesMontant = doc.splitTextToSize(`Arrêtée la présente facture à la somme de ${montantEnLettres}`, 110);
        lignesMontant.forEach((line, index) => {
            doc.text(line, 20, yPosition + (index * 4));
        });

        // SIGNATURE - ⭐ CORRECTION : Vérifier l'espace
        yPosition += (lignesMontant.length * 4) + 10;

        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        doc.text('Signature et cachet', 140, yPosition);
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(0.3);
        doc.line(140, yPosition + 2, 180, yPosition + 2);

        // CONDITIONS - ⭐ CORRECTION : Vérifier l'espace
        yPosition += 15;

        if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
        }

        if (facture.notes) {
            const notesLines = doc.splitTextToSize(`Notes: ${facture.notes}`, 170);
            notesLines.forEach((line, index) => {
                doc.text(line, 20, yPosition + (index * 4));
            });
        }

        // PIED DE PAGE AMÉLIORÉ
        const pageHeight = doc.internal.pageSize.height;
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Ligne de séparation au-dessus du pied de page
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.8);
            doc.line(15, pageHeight - 30, 195, pageHeight - 30);

            doc.setFontSize(7);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');

            if (facture.entreprise === 'ars_distribution') {
                doc.text('ARS DISTRIBUTION - Bd Moulay Ismail Bloc 20 NO.57 Casablanca', 105, pageHeight - 23, { align: 'center' });
                doc.text('Tél: +212 661-638266 | E-mail: ars.distribution1@gmail.com', 105, pageHeight - 19, { align: 'center' });
                doc.text('R.C : 518669 - Patente : 31302654 - I.F : 50575265 - C.N.S.S : 4355737 - ICE : 002910748000077', 105, pageHeight - 15, { align: 'center' });
            } else {
                doc.text('ARN LOGISTIQUE - 228, bd Mohamed V 7ème étage Bureau 200 Casablanca', 105, pageHeight - 23, { align: 'center' });
                doc.text('Tél: +212 661-638266 | E-mail: adli.rachid@homail.fr', 105, pageHeight - 19, { align: 'center' });
                doc.text('R.C 253799 - Patente 32190745 - I.F : 40467063 - C.N.S.S. 9029390 - ICE 000062536000007', 105, pageHeight - 15, { align: 'center' });
            }

            // Numéro de page
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i}/${pageCount}`, 105, pageHeight - 8, { align: 'center' });
        }

        doc.save(`facture-${facture.numero_facture}.pdf`);
    };

    const handleDelete = async (id) => {
        // ⭐ VÉRIFICATION DE PERMISSION AJOUTÉE
        if (!canDeleteFacture) {
            setError('Vous n\'avez pas la permission de supprimer des factures');
            return;
        }

        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            try {
                await factureService.delete(id);
                fetchAllData();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getStatutBadge = (statut) => {
        const statuts = {
            'brouillon': 'secondary',
            'envoyee': 'warning',
            'payee': 'success',
            'annulee': 'danger'
        };
        return statuts[statut] || 'secondary';
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

    const { totalHT, montantTVA, totalTTC } = calculerTotaux();

    return (
        <Container fluid className="px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>🧾 Gestion des Factures</h1>
                {/* ⭐ BOUTON CONDITIONNEL AJOUTÉ */}
                {canCreateFacture && (
                    <Button variant="primary" onClick={() => handleShowForm()}>
                        + Nouvelle Facture
                    </Button>
                )}
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* Section des filtres */}
            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">🔍 Filtres de recherche</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Client</Form.Label>
                                <Form.Select
                                    value={filtres.client}
                                    onChange={(e) => handleFiltreChange('client', e.target.value)}
                                >
                                    <option value="">Tous les clients</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.nom}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Entreprise</Form.Label>
                                <Form.Select
                                    value={filtres.entreprise}
                                    onChange={(e) => handleFiltreChange('entreprise', e.target.value)}
                                >
                                    <option value="">Toutes</option>
                                    <option value="ars_distribution">ARS Distribution</option>
                                    <option value="arn_logistique">ARN Logistique</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Statut</Form.Label>
                                <Form.Select
                                    value={filtres.statut}
                                    onChange={(e) => handleFiltreChange('statut', e.target.value)}
                                >
                                    <option value="">Tous</option>
                                    <option value="brouillon">Brouillon</option>
                                    <option value="envoyee">Envoyée</option>
                                    <option value="payee">Payée</option>
                                    <option value="annulee">Annulée</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date début</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filtres.dateDebut}
                                    onChange={(e) => handleFiltreChange('dateDebut', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date fin</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filtres.dateFin}
                                    onChange={(e) => handleFiltreChange('dateFin', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={1} className="d-flex align-items-end">
                            <Button
                                variant="outline-secondary"
                                onClick={reinitialiserFiltres}
                                title="Réinitialiser les filtres"
                            >
                                🔄
                            </Button>
                        </Col>
                    </Row>
                    <div className="text-muted small">
                        {facturesFiltrees.length} facture(s) trouvée(s) sur {factures.length} au total
                    </div>
                </Card.Body>
            </Card>

            {/* Modal de détails de la facture */}
            <Modal show={showDetails} onHide={handleCloseDetails} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Détails de la Facture {selectedFacture?.numero_facture}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedFacture && (
                        <Row>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6 className="mb-0">Informations Facture</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <p><strong>N° Facture:</strong> {selectedFacture.numero_facture}</p>
                                        <p><strong>Entreprise:</strong> {selectedFacture.entreprise === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique'}</p>
                                        <p><strong>Date:</strong> {selectedFacture.date_facture}</p>
                                        <p><strong>Échéance:</strong> {selectedFacture.date_echeance}</p>
                                        <p><strong>Statut:</strong>
                                            <Badge bg={getStatutBadge(selectedFacture.statut)} className="ms-2">
                                                {selectedFacture.statut === 'brouillon' ? 'Brouillon' :
                                                    selectedFacture.statut === 'envoyee' ? 'Envoyée' :
                                                        selectedFacture.statut === 'payee' ? 'Payée' : 'Annulée'}
                                            </Badge>
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6 className="mb-0">Informations Client</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <p><strong>Client:</strong> {clients.find(c => c.id === selectedFacture.client)?.nom || 'N/A'}</p>
                                        <p><strong>ICE:</strong> {clients.find(c => c.id === selectedFacture.client)?.ice || 'N/A'}</p>
                                        <p><strong>Adresse:</strong> {clients.find(c => c.id === selectedFacture.client)?.adresse || 'N/A'}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={12}>
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Lignes de Facture</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table striped bordered size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Quantité</th>
                                                    <th>Prix U. (DH)</th>
                                                    <th>TVA %</th>
                                                    <th>Montant HT (DH)</th>
                                                    <th>Montant TVA (DH)</th>
                                                    <th>Montant TTC (DH)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedFacture.lignes_details || selectedFacture.lignes || []).map((ligne, index) => (
                                                    <tr key={index}>
                                                        <td>{ligne.description}</td>
                                                        <td className="text-center">{ligne.quantite}</td>
                                                        <td className="text-end">{(parseFloat(ligne.prix_unitaire) || 0).toFixed(2)}</td>
                                                        <td className="text-center">{(parseFloat(ligne.tva) || 0).toFixed(2)}%</td>
                                                        <td className="text-end">{(parseFloat(ligne.montant_ht) || 0).toFixed(2)}</td>
                                                        <td className="text-end">{(parseFloat(ligne.montant_tva) || 0).toFixed(2)}</td>
                                                        <td className="text-end">{(parseFloat(ligne.montant_ttc) || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <div className="text-end">
                                            <h6>Total HT: {(parseFloat(selectedFacture.total_ht) || 0).toFixed(2)} DH</h6>
                                            <h6>Total TVA: {(parseFloat(selectedFacture.montant_tva) || 0).toFixed(2)} DH</h6>
                                            <h5>Total TTC: {(parseFloat(selectedFacture.total_ttc) || 0).toFixed(2)} DH</h5>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDetails}>
                        Fermer
                    </Button>
                    <Button variant="success" onClick={() => genererPDF(selectedFacture)}>
                        📄 Générer PDF
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Formulaire de facturation */}
            {showForm && (
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{editingFacture ? 'Modifier la Facture' : 'Nouvelle Facture'}</h5>
                        <Button variant="outline-secondary" size="sm" onClick={handleCloseForm}>✕</Button>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Entreprise *</Form.Label>
                                        <Form.Select
                                            name="entreprise"
                                            value={formData.entreprise}
                                            onChange={(e) => setFormData(prev => ({ ...prev, entreprise: e.target.value }))}
                                            required
                                        >
                                            <option value="ars_distribution">ARS Distribution</option>
                                            <option value="arn_logistique">ARN Logistique</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Client *</Form.Label>
                                        <Form.Select
                                            name="client"
                                            value={formData.client}
                                            onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                                            required
                                        >
                                            <option value="">Sélectionner un client</option>
                                            {clients.map(client => (
                                                <option key={client.id} value={client.id}>
                                                    {client.nom} ({client.ice})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Statut *</Form.Label>
                                        <Form.Select
                                            name="statut"
                                            value={formData.statut}
                                            onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                                            required
                                        >
                                            <option value="brouillon">Brouillon</option>
                                            <option value="envoyee">Envoyée</option>
                                            <option value="payee">Payée</option>
                                            <option value="annulee">Annulée</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date Facture *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date_facture"
                                            value={formData.date_facture}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date_facture: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date Échéance *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date_echeance"
                                            value={formData.date_echeance}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Conditions de Paiement</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="conditions_paiement"
                                            value={formData.conditions_paiement}
                                            onChange={(e) => setFormData(prev => ({ ...prev, conditions_paiement: e.target.value }))}
                                            placeholder="Ex: Paiement à 30 jours"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Ajout de lignes */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h6 className="mb-0">📦 Ajouter une Ligne</h6>
                                </Card.Header>
                                <Card.Body>
                                    {/* Dans le formulaire d'ajout de ligne - Lignes ~530-580 */}
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Description *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Description de la prestation"
                                                    value={nouvelleLigne.description}
                                                    onChange={(e) => setNouvelleLigne(prev => ({ ...prev, description: e.target.value }))}
                                                    maxLength={255} // ⭐ LIMITE DE CARACTÈRES
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Quantité</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    max="99999" // ⭐ LIMITE QUANTITÉ
                                                    step="1"
                                                    value={nouvelleLigne.quantite}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 1;
                                                        if (value <= 99999) {
                                                            setNouvelleLigne(prev => ({ ...prev, quantite: value }));
                                                        }
                                                    }}
                                                    title="Quantité maximum: 99,999"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Prix Unitaire (DH)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    max="999999999.99" // ⭐ LIMITE PRIX
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={nouvelleLigne.prix_unitaire}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || 0;
                                                        if (value <= 999999999.99) {
                                                            setNouvelleLigne(prev => ({ ...prev, prix_unitaire: e.target.value }));
                                                        }
                                                    }}
                                                    title="Prix maximum: 999,999,999.99 DH"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>TVA %</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    max="100" // ⭐ LIMITE TVA
                                                    step="0.1"
                                                    value={nouvelleLigne.tva}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || 0;
                                                        if (value <= 100) {
                                                            setNouvelleLigne(prev => ({ ...prev, tva: value }));
                                                        }
                                                    }}
                                                    title="TVA maximum: 100%"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2} className="d-flex align-items-end">
                                            <Button
                                                variant="outline-primary"
                                                onClick={handleAjouterLigne}
                                                disabled={!nouvelleLigne.description || !nouvelleLigne.prix_unitaire}
                                            >
                                                +
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Lignes ajoutées */}
                            {formData.lignes.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6 className="mb-0">📋 Lignes de Facture</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table striped bordered size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th width="80">Quantité</th>
                                                    <th width="100">Prix U. (DH)</th>
                                                    <th width="80">TVA %</th>
                                                    <th width="100">Montant HT (DH)</th>
                                                    <th width="100">Montant TVA (DH)</th>
                                                    <th width="100">Montant TTC (DH)</th>
                                                    <th width="80">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.lignes.map((ligne, index) => (
                                                    <tr key={index}>
                                                        <td>{ligne.description}</td>
                                                        <td className="text-center">{ligne.quantite}</td>
                                                        <td className="text-end">{parseFloat(ligne.prix_unitaire || 0).toFixed(2)}</td>
                                                        <td className="text-center">{parseFloat(ligne.tva || 0).toFixed(2)}%</td>
                                                        <td className="text-end">{parseFloat(ligne.montant_ht || 0).toFixed(2)}</td>
                                                        <td className="text-end">{parseFloat(ligne.montant_tva || 0).toFixed(2)}</td>
                                                        <td className="text-end">{parseFloat(ligne.montant_ttc || 0).toFixed(2)}</td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleSupprimerLigne(index)}
                                                            >
                                                                🗑️
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>


                                        {/* Totaux */}
                                        <Row className="mt-3">
                                            <Col md={{ span: 6, offset: 6 }}>
                                                <Table bordered size="sm">
                                                    <tbody>
                                                        <tr>
                                                            <td><strong>Total HT:</strong></td>
                                                            <td className="text-end"><strong>{totalHT.toFixed(2)} DH</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Total TVA:</strong></td>
                                                            <td className="text-end"><strong>{montantTVA.toFixed(2)} DH</strong></td>
                                                        </tr>
                                                        <tr className="table-success">
                                                            <td><strong>Total TTC:</strong></td>
                                                            <td className="text-end"><strong>{totalTTC.toFixed(2)} DH</strong></td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                                <div className="text-muted small">
                                                    <em>{nombreEnLettres(totalTTC)}</em>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label>Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Notes supplémentaires..."
                                />
                            </Form.Group>

                            <div className="d-flex gap-2">
                                <Button variant="primary" type="submit" disabled={saving || formData.lignes.length === 0}>
                                    {saving ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        editingFacture ? 'Modifier' : 'Créer'
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

            {/* Liste des factures */}
            {/* Liste des factures */}
            <Card>
                <Card.Body>
                    {/* Version desktop - inchangée */}
                    <Table striped bordered hover responsive className="d-none d-md-table">
                        <thead className="table-dark">
                            <tr>
                                <th>N° Facture</th>
                                <th>Entreprise</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Échéance</th>
                                <th>Total TTC</th>
                                <th>Statut</th>
                                <th width="240">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturesFiltrees.map(facture => {
                                const client = clients.find(c => c.id === facture.client);
                                return (
                                    <tr key={facture.id}>
                                        <td><strong>{facture.numero_facture}</strong></td>
                                        <td>
                                            <Badge bg={facture.entreprise === 'ars_distribution' ? 'primary' : 'info'}>
                                                {facture.entreprise === 'ars_distribution' ? 'ARS Dist' : 'ARN Log'}
                                            </Badge>
                                        </td>
                                        <td>{client?.nom || 'N/A'}</td>
                                        <td>{facture.date_facture}</td>
                                        <td>{facture.date_echeance}</td>
                                        <td><strong>{parseFloat(facture.total_ttc || 0).toLocaleString()} DH</strong></td>
                                        <td>
                                            <Badge bg={getStatutBadge(facture.statut)}>
                                                {facture.statut === 'brouillon' ? 'Brouillon' :
                                                    facture.statut === 'envoyee' ? 'Envoyée' :
                                                        facture.statut === 'payee' ? 'Payée' : 'Annulée'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                {canViewDetails && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleShowDetails(facture)}
                                                    >
                                                        👁️ Détails
                                                    </Button>
                                                )}
                                                {canViewDetails && (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => genererPDF(facture)}
                                                    >
                                                        📄 PDF
                                                    </Button>
                                                )}
                                                {canEditFacture && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleShowForm(facture)}
                                                    >
                                                        ✏️
                                                    </Button>
                                                )}
                                                {canDeleteFacture && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(facture.id)}
                                                        disabled={facture.statut === 'payee'}
                                                    >
                                                        🗑️
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {/* Version mobile - visible seulement sur mobile */}
                    <div className="d-md-none">
                        {facturesFiltrees.map((facture, index) => {
                            const client = clients.find(c => c.id === facture.client);
                            return (
                                <Card key={facture.id} className="mb-3 border-0 shadow-sm">
                                    <Card.Body className="p-3">
                                        {/* En-tête avec numéro facture et statut */}
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h6 className="text-primary mb-1">#{facture.numero_facture}</h6>
                                                <div className="d-flex align-items-center mb-1">
                                                    <small className="text-muted">{client?.nom || 'N/A'}</small>
                                                </div>
                                            </div>
                                            <Badge bg={getStatutBadge(facture.statut)}>
                                                {facture.statut === 'brouillon' ? 'Brouillon' :
                                                    facture.statut === 'envoyee' ? 'Envoyée' :
                                                        facture.statut === 'payee' ? 'Payée' : 'Annulée'}
                                            </Badge>
                                        </div>

                                        {/* Informations principales */}
                                        <Row className="g-2 mb-2">
                                            <Col xs={6}>
                                                <div className="text-center p-2 bg-light rounded">
                                                    <small className="text-muted d-block">Entreprise</small>
                                                    <Badge bg={facture.entreprise === 'ars_distribution' ? 'primary' : 'info'}>
                                                        {facture.entreprise === 'ars_distribution' ? 'ARS Dist' : 'ARN Log'}
                                                    </Badge>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="text-center p-2 bg-light rounded">
                                                    <small className="text-muted d-block">Date</small>
                                                    <strong>{facture.date_facture}</strong>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Échéance et Montant */}
                                        <Row className="g-2 mb-2">
                                            <Col xs={6}>
                                                <div className="text-center p-2 bg-light rounded">
                                                    <small className="text-muted d-block">Échéance</small>
                                                    <strong>{facture.date_echeance}</strong>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="text-center p-2 bg-success bg-opacity-10 rounded">
                                                    <small className="text-muted d-block">Total TTC</small>
                                                    <h6 className="text-success mb-0">
                                                        {parseFloat(facture.total_ttc || 0).toLocaleString()} DH
                                                    </h6>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Actions */}
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="btn-group">
                                                {canViewDetails && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleShowDetails(facture)}
                                                    >
                                                        👁️
                                                    </Button>
                                                )}
                                                {canViewDetails && (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => genererPDF(facture)}
                                                    >
                                                        📄
                                                    </Button>
                                                )}
                                                {canEditFacture && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleShowForm(facture)}
                                                    >
                                                        ✏️
                                                    </Button>
                                                )}
                                                {canDeleteFacture && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(facture.id)}
                                                        disabled={facture.statut === 'payee'}
                                                    >
                                                        🗑️
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </div>

                    {facturesFiltrees.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucune facture trouvée</h5>
                            <p>Aucune facture ne correspond aux critères de recherche</p>
                            <Button variant="outline-primary" onClick={reinitialiserFiltres}>
                                Réinitialiser les filtres
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Facturation;