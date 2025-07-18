import {Participant} from "../../../pages/admin/Plan/annual/evaluation/detail";

export interface BatchProgress {
    current: number;
    total: number;
    percentage: number;
    currentParticipant?: string;
}

export class QuestionnaireGenerator {
    private doc: any;
    private pageWidth = 210;
    private pageHeight = 297;
    private margin = 16;
    private qrCodeCache: Map<string, string> = new Map();
    private calendarIconCache: string | null = null; // Cache pour l'icône calendrier
    private baseFont = 11; // Taille de base (variable S)
    private lineHeight = 1.2; // Hauteur de ligne de base (variable H)

    constructor(jsPDF: any) {
        this.doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        this.doc.setFont('helvetica');
    }

    async generateBatch(
        participants: any[],
        evaluationData: any,
        options: {
            trainingTheme: string;
            groupName: string;
            getBaseUrl: () => string;
            onProgress?: (progress: BatchProgress) => void;
        }
    ): Promise<Blob> {
        let participantsProcessed = 0;
        const validParticipants = [];

        // Import QRCode une seule fois
        const QRCode = await import('qrcode');

        // Pré-charger l'icône calendrier
        await this.preloadCalendarIcon();

        // Filtrer les participants avec tokens valides et pré-générer les QR codes
        for (const participant of participants) {
            const qrToken = evaluationData.qrTokens.find((token: any) =>
                token.participantId === participant.id
            );
            if (qrToken) {
                await this.preGenerateQRCode(qrToken.token, options.getBaseUrl, QRCode);
                validParticipants.push({participant, qrToken});
            }
        }

        if (validParticipants.length === 0) {
            throw new Error('Aucun token QR valide trouvé pour les participants sélectionnés');
        }

        // Générer une page par participant
        for (let i = 0; i < validParticipants.length; i++) {
            const {participant, qrToken} = validParticipants[i];

            if (options.onProgress) {
                options.onProgress({
                    current: i + 1,
                    total: validParticipants.length,
                    percentage: ((i + 1) / validParticipants.length) * 100,
                    currentParticipant: participant.name
                });
            }

            try {
                await this.generateF4FormPage(participant, qrToken, evaluationData, options, i);
                participantsProcessed++;
            } catch (error) {
                console.error(`Erreur pour le participant ${participant.name}:`, error);
            }
        }

        this.qrCodeCache.clear();
        this.calendarIconCache = null;
        return this.doc.output('blob');
    }

    private async preloadCalendarIcon(): Promise<void> {
        try {
            // Fonction pour convertir une image en base64
            const loadImageAsBase64 = (src: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Définir la taille du canvas
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;

                        // Dessiner l'image sur le canvas
                        ctx!.drawImage(img, 0, 0);

                        // Convertir en base64
                        const dataURL = canvas.toDataURL('image/png');
                        resolve(dataURL);
                    };

                    img.onerror = () => {
                        reject(new Error('Impossible de charger l\'image'));
                    };

                    // Corriger le chemin de l'image
                    img.src = '/images/f4-calendar-icon.png'; // Supprimer '/public'
                });
            };

            // Charger l'icône
            this.calendarIconCache = await loadImageAsBase64('/images/f4-calendar-icon.png');
            console.log('Icône calendrier chargée avec succès');

        } catch (error) {
            console.warn('Erreur lors du chargement de l\'icône calendrier:', error);
            this.calendarIconCache = null;
        }
    }

    private async preGenerateQRCode(token: string, getBaseUrl: () => string, QRCode: any): Promise<void> {
        try {
            const qrUrl = `${getBaseUrl()}/public/f4-evaluation/scan/${token}`;
            const qrCodeDataUrl = await QRCode.default.toDataURL(qrUrl, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                margin: 1,
                color: {dark: '#000000', light: '#FFFFFF'},
                width: 120
            });
            this.qrCodeCache.set(token, qrCodeDataUrl);
        } catch (error) {
            console.error('Erreur pré-génération QR code:', error);
        }
    }

    private async generateF4FormPage(
        participant: Participant,
        qrToken: any,
        evaluationData: any,
        options: any,
        pageIndex: number
    ): Promise<void> {
        if (pageIndex > 0) {
            this.doc.addPage();
        }

        let currentY = this.margin;

        // Section 1: En-tête principal
        currentY = this.generateMainHeader(currentY);

        // Section 2: Titre et paragraphe d'introduction
        currentY = this.generateIntroSection(currentY);

        // Section 3: Bloc d'informations générales
        currentY = this.generateInfoBlock(participant, evaluationData, options, currentY);

        // Section 4: Zone d'évaluation avec en-têtes et questions
        currentY = this.generateEvaluationZone(currentY);

        // Section 5: Zone de signature
        currentY = this.generateSignatureZone(currentY);

        // Section 6: Pied de page
        this.generateFooterSection();

        // Ajouter le QR code en haut à droite
        this.addQRCodeToForm(qrToken.token);
    }

    private generateMainHeader(startY: number): number {
        let currentY = startY;

        // Ligne 1: "Contrats Spéciaux de Formation" (aligné à gauche, gras, 1.4*S)
        // Laisser de l'espace pour le QR code à droite
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(this.baseFont * 1.2);
        this.doc.text('Contrats Spéciaux de Formation', this.margin, currentY);
        currentY += 8; // Espacement réduit

        // Ligne 2: "Formulaire F4" (centré, gras, 2.2*S)
        // Calculer la position centrale en tenant compte de l'espace du QR code
        this.doc.setFontSize(this.baseFont * 2.2);
        const f4Text = 'Formulaire F4';
        const availableWidth = this.pageWidth - 2 * this.margin - 25; // 25mm pour QR + marge
        const f4Width = this.doc.getTextWidth(f4Text);
        const centeredX = this.margin + (availableWidth - f4Width) / 2;
        this.doc.text(f4Text, centeredX, currentY);
        currentY += 6; // Espacement réduit

        // Séparateur épais
        this.doc.setLineWidth(5 * 0.35); // 4pt converti en mm
        this.doc.line(this.margin, currentY, this.pageWidth - this.margin, currentY);
        currentY += 6; // Espacement réduit après le séparateur

        return currentY;
    }

    private generateIntroSection(startY: number): number {
        let currentY = startY;

        // Titre centré et gras
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(this.baseFont * 1.5);
        const titleText = "Fiche d'évaluation de l'Action de Formation";
        const titleWidth = this.doc.getTextWidth(titleText);
        this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, currentY);
        currentY += 12;

        // MODIFICATION : Mettre tout le texte en gras et réduire la taille
        this.doc.setFont('helvetica', 'bold'); // Tout en gras
        this.doc.setFontSize(this.baseFont * 0.85); // Taille réduite (85% de la taille de base)

        // Premier paragraphe - maintenant en gras
        const firstParagraph = "Cette fiche est remise par le formateur au bénéficiaire au terme de la dernière journée de formation. Ce dernier est prié de la remettre, dûment renseignée et signée, au formateur.";
        const firstLines = this.doc.splitTextToSize(firstParagraph, this.pageWidth - 2 * this.margin);

        for (const line of firstLines) {
            this.doc.text(line, this.margin, currentY);
            currentY += 3.5;
        }

        currentY += 1;

        // Deuxième paragraphe - "NB:" souligné et en gras, reste en gras
        const nbText = "NB:";
        const secondParagraph = " Les informations recueillies à travers cette fiche seront utilisées pour des fins statistiques uniquement et nullement pour porter un jugement quel qu'il soit sur la performance des parties prenantes.";

        // Afficher "NB:" en gras et souligné
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(nbText, this.margin, currentY);

        // Calculer la largeur de "NB:" pour le soulignement
        const nbWidth = this.doc.getTextWidth(nbText);

        // Ajouter le soulignement pour "NB:"
        this.doc.setLineWidth(0.3); // Épaisseur du trait de soulignement
        this.doc.line(this.margin, currentY + 0.5, this.margin + nbWidth, currentY + 0.5);

        // Diviser le reste du texte en lignes
        const restLines = this.doc.splitTextToSize(secondParagraph, this.pageWidth - 2 * this.margin - nbWidth);

        // Afficher la première ligne à côté de "NB:"
        this.doc.text(restLines[0], this.margin + nbWidth, currentY);
        currentY += 3.5;

        // Afficher les lignes suivantes alignées normalement
        for (let i = 1; i < restLines.length; i++) {
            this.doc.text(restLines[i], this.margin, currentY);
            currentY += 3.5;
        }

        // Remettre l'épaisseur de ligne par défaut
        this.doc.setLineWidth(0.5);

        return currentY + 5;
    }

    private generateInfoBlock(participant: Participant, evaluationData: any, options: any, startY: number): number {
        let currentY = startY;
        const blockHeight = 37; // Hauteur réduite
        const cellHeight = blockHeight / 3;
        const halfWidth = (this.pageWidth - 2 * this.margin) / 2;

        // Dimensions des champs de saisie - largeur s'étend sur toute la partie
        const fieldHeight = 6; // Hauteur des rectangles de saisie
        const leftFieldWidth = halfWidth - 4; // Largeur partie gauche (-4mm pour marges)
        const rightFieldWidth = halfWidth - 4; // Largeur partie droite (-4mm pour marges)

        // Contour principal avec épaisseur normale
        this.doc.setLineWidth(0.5 * 0.35);
        this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, blockHeight);

        this.doc.setFontSize(10); // Taille de police réduite
        this.doc.setFont('helvetica', 'normal');

        // Définir l'épaisseur pour les champs de saisie
        this.doc.setLineWidth(0.6); // Épaisseur plus importante pour les champs

        // Rangée 1 - Labels et champs
        this.doc.text("Thème de l'Action de Formation:", this.margin + 2, currentY + 4);
        this.doc.rect(this.margin + 2, currentY + 6, leftFieldWidth, fieldHeight);
        this.doc.text(evaluationData.theme || '', this.margin + 4, currentY + 9);

        this.doc.text("Dates de la formation:", this.margin + halfWidth + 2, currentY + 4);
        this.doc.rect(this.margin + halfWidth + 2, currentY + 6, rightFieldWidth, fieldHeight);

        // Rangée 2 - Labels et champs avec données
        this.doc.text("Nom du bénéficiaire:", this.margin + 2, currentY + cellHeight + 4);
        this.doc.rect(this.margin + 2, currentY + cellHeight + 6, leftFieldWidth, fieldHeight);
        this.doc.text(participant.lastName || '', this.margin + 4, currentY + 1 + cellHeight + 9);

        this.doc.text("Prénom du bénéficiaire:", this.margin + halfWidth + 2, currentY + cellHeight + 4);
        this.doc.rect(this.margin + halfWidth + 2, currentY + cellHeight + 6, rightFieldWidth, fieldHeight);
        this.doc.text(participant.firstName || '', this.margin + halfWidth + 4, currentY + 1 + cellHeight + 9);

        // Rangée 3 - Labels et champs
        this.doc.text("N° CIN:", this.margin + 2, currentY + 2 * cellHeight + 4);
        this.doc.rect(this.margin + 2, currentY + 2 * cellHeight + 6, leftFieldWidth, fieldHeight);
        this.doc.text(participant.cin || '', this.margin + 4, currentY + 2 * cellHeight + 10);

        this.doc.text("N° CNSS:", this.margin + halfWidth + 2, currentY + 2 * cellHeight + 4);
        this.doc.rect(this.margin + halfWidth + 2, currentY + 2 * cellHeight + 6, rightFieldWidth, fieldHeight);
        this.doc.text(participant.cnss || '', this.margin + halfWidth + 4, currentY + 2 * cellHeight + 10);


        // Remettre l'épaisseur par défaut pour les éléments suivants
        this.doc.setLineWidth(0.5 * 0.35);

        return currentY + blockHeight + 3; // Espacement réduit
    }

    private generateEvaluationZone(startY: number): number {
        let currentY = startY;

        // Bloc 1: Conditions de réalisation
        currentY = this.generateQuestionBlock(currentY, "Conditions de réalisation", [
            "L'information concernant la formation a été complète",
            "La durée et le rythme de la formation étaient conformes à ce qui a été annoncé",
            "Les documents annoncés ont été remis aux participants.",
            "Les documents remis constituent une aide à l'assimilation des contenus",
            "Les contenus de la formation étaient adaptés à mon niveau initial",
            "Les conditions matérielles (locaux, restauration, facilité d'accès, etc.) étaient satisfaisantes."
        ]);
        currentY += 3;

        // Bloc 2: Compétences techniques et pédagogiques
        currentY = this.generateQuestionBlock(currentY, "Compétences techniques et pédagogiques", [
            "Le formateur dispose des compétences techniques nécessaires",
            "Le formateur dispose des compétences pédagogiques",
            "Le formateur a su créer ou entretenir une ambiance agréable dans le groupe en formation",
            "Les moyens pédagogiques étaient adaptés au contenu de la formation"
        ]);
        currentY += 3;

        // Bloc 3: Atteinte des objectifs
        currentY = this.generateQuestionBlock(currentY, "Atteinte des objectifs", [
            "Les objectifs de la formation correspondent à mes besoins professionnels",
            "Les objectifs recherchés à travers cette formation ont été atteint",
            "D'une manière générale, cette formation me permettra d'améliorer mes compétences professionnelles"
        ]);

        return currentY;
    }

    private generateOptionsHeader(startY: number): number {
        const headerHeight = 7; // Hauteur réduite
        const col1Width = 0.65 * (this.pageWidth - 2 * this.margin);
        const optionWidth = 0.0875 * (this.pageWidth - 2 * this.margin);

        // Contour de l'en-tête
        this.doc.setLineWidth(0.5 * 0.35);
        this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, headerHeight);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9.5); // Taille réduite

        // Colonnes d'options
        let xPos = this.margin + col1Width;
        const options = ["Pas du tout", "Peu", "Moyen", "Tout à fait"];

        for (const option of options) {
            const textWidth = this.doc.getTextWidth(option);
            this.doc.text(option, xPos + (optionWidth - textWidth) / 2, startY + 4.5); // Position ajustée
            xPos += optionWidth;
        }

        return startY + headerHeight;
    }

    private generateQuestionBlock(startY: number, title: string, questions: string[]): number {
        const col1Width = 0.65 * (this.pageWidth - 2 * this.margin);
        const optionWidth = 0.0875 * (this.pageWidth - 2 * this.margin);
        const headerHeight = 7;
        const minQuestionHeight = 8; // Hauteur minimale par question
        const textMargin = 2; // Marge pour le texte dans les cellules

        // Calculer la hauteur nécessaire pour chaque question
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8.5);

        const questionHeights: number[] = [];
        for (const question of questions) {
            const questionLines = this.doc.splitTextToSize(question, col1Width - 4);
            const textHeight = questionLines.length * 3; // 3mm par ligne de texte
            const requiredHeight = Math.max(minQuestionHeight, textHeight + textMargin * 2);
            questionHeights.push(requiredHeight);
        }

        const totalHeight = headerHeight + questionHeights.reduce((sum, height) => sum + height, 0);

        // Contour principal du bloc
        this.doc.setLineWidth(0.5 * 0.35);
        this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, totalHeight);

        // Ligne sous l'en-tête (titre + options)
        this.doc.line(this.margin, startY + headerHeight, this.pageWidth - this.margin, startY + headerHeight);

        // LIGNE 1: Titre du bloc + En-tête des options (sur la même ligne)
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9.5);

        // Titre du bloc à gauche
        this.doc.text(title, this.margin + 2, startY + 4.5);

        // En-tête des options à droite (sur la même ligne)
        this.doc.setFontSize(8.5);
        let xPos = this.margin + col1Width;
        const options = ["Pas du tout", "Peu", "Moyen", "Tout à fait"];

        for (const option of options) {
            const textWidth = this.doc.getTextWidth(option);
            this.doc.text(option, xPos + (optionWidth - textWidth) / 2, startY + 4.5);
            xPos += optionWidth;
        }

        // LIGNES SUIVANTES: Questions avec cases à cocher
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8.5);

        let currentQuestionY = startY + headerHeight;

        for (let i = 0; i < questions.length; i++) {
            const questionHeight = questionHeights[i];
            const nextQuestionY = currentQuestionY + questionHeight;

            // Ligne horizontale entre questions (sauf pour la dernière)
            if (i < questions.length - 1) {
                this.doc.line(this.margin, nextQuestionY, this.pageWidth - this.margin, nextQuestionY);
            }

            // Texte de la question - positionné en haut de la cellule avec marge
            const questionLines = this.doc.splitTextToSize(questions[i], col1Width - 4);
            let textY = currentQuestionY + textMargin + 3; // Commencer en haut avec une petite marge

            for (const line of questionLines) {
                this.doc.text(line, this.margin + 2, textY);
                textY += 3; // Espacement entre les lignes
            }

            // Cases à cocher - centrées verticalement dans la cellule
            const checkboxCenterY = currentQuestionY + (questionHeight / 2);
            let checkboxX = this.margin + col1Width;

            for (let j = 0; j < 4; j++) {
                const checkboxXCenter = checkboxX + (optionWidth - 3) / 2;
                this.doc.circle(checkboxXCenter + 1.5, checkboxCenterY, 1.1);
                checkboxX += optionWidth;
            }

            currentQuestionY = nextQuestionY;
        }

        return startY + totalHeight;
    }

    private generateSignatureZone(startY: number): number {
        let currentY = startY + 5;
        const blockHeight = 25;
        const leftWidth = 0.45 * (this.pageWidth - 2 * this.margin);
        const rightWidth = 0.55 * (this.pageWidth - 2 * this.margin);

        // Contour principal
        this.doc.setLineWidth(0.5 * 0.35);
        this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, blockHeight);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(this.baseFont);

        // Partie gauche - Labels sur la première ligne
        const firstLineY = currentY + 4;
        const secondLineY = currentY + 10;

        // LIGNE 1: Labels "Fait à:" (gauche) et "Le:" (droite)
        this.doc.setLineWidth(0.6);
        this.doc.text("Fait à:", this.margin + 2, firstLineY);
        this.doc.text("Le:", this.margin + leftWidth * 0.55, firstLineY);

        // LIGNE 2: Champs de saisie rectangulaires
        const fieldWidth = leftWidth * 0.4; // Largeur identique pour les deux champs
        const fieldHeight = 6; // Hauteur des champs rectangulaires

        // Champ "Fait à" - Rectangle
        this.doc.rect(this.margin + 2, secondLineY - 4, fieldWidth, fieldHeight);

        // Champ "Le" - Rectangle avec icône calendrier
        const leFieldStart = this.margin + leftWidth * 0.55;
        this.doc.rect(leFieldStart, secondLineY - 4, fieldWidth, fieldHeight);

        // Ajouter l'icône calendrier (image ou fallback)
        if (this.calendarIconCache) {
            try {
                // Utiliser l'icône chargée depuis /images/f4-calendar-icon.png
                const iconSize = fieldHeight; // Même taille que la hauteur du rectangle
                const iconX = leFieldStart + fieldWidth + 1; // Petite marge après le rectangle
                const iconY = secondLineY - 4; // Même position Y que le rectangle
                this.doc.addImage(this.calendarIconCache, 'PNG', iconX, iconY, iconSize, iconSize);
            } catch (error) {
                console.warn('Erreur lors de l\'ajout de l\'icône:', error);
                // Fallback vers le texte
                this.doc.setFontSize(8);
                this.doc.text("CAL", leFieldStart + fieldWidth + 1, secondLineY - 1);
            }
        } else {
            // Fallback: utiliser un texte simple
            this.doc.setFontSize(8);
            this.doc.text("CAL", leFieldStart + fieldWidth + 1, secondLineY - 1);
        }

        // Partie droite
        this.doc.setLineWidth(0.5 * 0.35);
        this.doc.text("Signature du bénéficiaire:", this.margin + leftWidth + 5, currentY + 4);
        this.doc.rect(this.margin + leftWidth + 5, currentY + 6, rightWidth - 10, 18);

        return currentY + blockHeight + 5;
    }

    private generateFooterSection(): void {
        const footerY = this.pageHeight - 15;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(this.baseFont * 0.9);

        // Texte avant le lien
        const prefixText = "Ce formulaire est disponible sur le Portail des CSF à l'adresse: ";
        const linkText = "http://csf.ofppt.org.ma";

        // Afficher le texte normal en noir
        this.doc.setTextColor(0, 0, 0); // Noir
        this.doc.text(prefixText, this.margin, footerY);

        // Calculer la position du lien après le texte
        const prefixWidth = this.doc.getTextWidth(prefixText);
        const linkX = this.margin + prefixWidth;

        // Afficher le lien en bleu
        this.doc.setTextColor(0, 0, 255); // Bleu
        this.doc.text(linkText, linkX, footerY);

        // Ajouter le soulignement du lien
        const linkWidth = this.doc.getTextWidth(linkText);
        this.doc.setDrawColor(0, 0, 255); // Couleur du trait en bleu
        this.doc.setLineWidth(0.2); // Épaisseur fine pour le soulignement
        this.doc.line(linkX, footerY + 0.5, linkX + linkWidth, footerY + 0.5);

        // Remettre les couleurs par défaut
        this.doc.setTextColor(0, 0, 0); // Noir pour le texte
        this.doc.setDrawColor(0, 0, 0); // Noir pour les traits
        this.doc.setLineWidth(0.5); // Épaisseur normale
    }

    private addQRCodeToForm(token: string): void {
        const qrCodeDataUrl = this.qrCodeCache.get(token);
        if (qrCodeDataUrl) {
            const qrSize = 20; // Taille adaptée aux deux lignes
            // Position dans le coin droit, tout en haut de la page
            const qrX = this.pageWidth - this.margin - qrSize;
            const qrY = 5; // Position plus haute, au tout début de la page

            this.doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            // Texte sous le QR code
            this.doc.setFontSize(6);
            this.doc.setFont('helvetica', 'normal');
            const qrText = 'Scanner';
            const qrTextWidth = this.doc.getTextWidth(qrText);
            this.doc.text(qrText, qrX + (qrSize - qrTextWidth) / 2, qrY + qrSize + 2);
        }
    }
}