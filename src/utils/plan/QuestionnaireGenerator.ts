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
    private margin = 15;
    private qrCodeCache: Map<string, string> = new Map();
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
        return this.doc.output('blob');
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
        participant: any,
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
        currentY = this.generateInfoBlock(participant, options, currentY);

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
        this.doc.setFontSize(this.baseFont * 1.4);
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
        currentY += 8; // Espacement réduit

        // Séparateur épais
        this.doc.setLineWidth(4 * 0.35); // 4pt converti en mm
        this.doc.line(this.margin, currentY, this.pageWidth - this.margin, currentY);
        currentY += 8; // Espacement réduit après le séparateur

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
        currentY += 6; // Espacement réduit

        // Premier paragraphe
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(this.baseFont);

        const firstParagraph = "Cette fiche est remise par le formateur au bénéficiaire au terme de la dernière journée de formation. Ce dernier est prié de la remettre, dûment renseignée et signée, au formateur.";
        const firstLines = this.doc.splitTextToSize(firstParagraph, this.pageWidth - 2 * this.margin);

        for (const line of firstLines) {
            this.doc.text(line, this.margin, currentY);
            currentY += 4; // Espacement encore plus compact
        }

        currentY += 1.5; // Petit espacement entre paragraphes

        // Deuxième paragraphe avec "NB:" en gras
        const secondParagraph = "Les informations recueillies à travers cette fiche seront utilisées pour des fins statistiques uniquement et nullement pour porter un jugement quel qu'il soit sur la performance des parties prenantes.";

        // Afficher "NB:" en gras
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('NB:', this.margin, currentY);
        const nbWidth = this.doc.getTextWidth('NB: ');

        // Afficher le reste en normal
        this.doc.setFont('helvetica', 'normal');
        const secondLines = this.doc.splitTextToSize(secondParagraph, this.pageWidth - 2 * this.margin - nbWidth);

        // Première ligne à côté de "NB:"
        this.doc.text(secondLines[0], this.margin + nbWidth, currentY);
        currentY += 4;

        // Lignes suivantes alignées normalement
        for (let i = 1; i < secondLines.length; i++) {
            this.doc.text(secondLines[i], this.margin, currentY);
            currentY += 4;
        }

        return currentY + 6; // Espacement réduit
    }

    private generateInfoBlock(participant: any, options: any, startY: number): number {
        let currentY = startY;
        const blockHeight = 36; // Hauteur réduite
        const cellHeight = blockHeight / 3;
        const halfWidth = (this.pageWidth - 2 * this.margin) / 2;

        // Contour principal
        this.doc.setLineWidth(0.5 * 0.35);
        this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, blockHeight);

        // Lignes horizontales internes
        this.doc.line(this.margin, currentY + cellHeight, this.pageWidth - this.margin, currentY + cellHeight);
        this.doc.line(this.margin, currentY + 2 * cellHeight, this.pageWidth - this.margin, currentY + 2 * cellHeight);

        // Ligne verticale centrale
        this.doc.line(this.margin + halfWidth, currentY, this.margin + halfWidth, currentY + blockHeight);

        this.doc.setFontSize(10); // Taille de police réduite
        this.doc.setFont('helvetica', 'normal');

        // Rangée 1
        this.doc.text("Thème de l'Action de Formation:", this.margin + 2, currentY + 4);
        this.doc.text("Dates de la formation:", this.margin + halfWidth + 2, currentY + 4);

        // Rangée 2
        this.doc.text("Nom du bénéficiaire:", this.margin + 2, currentY + cellHeight + 4);
        this.doc.text(participant.name.split(' ').slice(-1)[0] || '', this.margin + 2, currentY + cellHeight + 8);

        this.doc.text("Prénom du bénéficiaire:", this.margin + halfWidth + 2, currentY + cellHeight + 4);
        this.doc.text(participant.name.split(' ').slice(0, -1).join(' ') || '', this.margin + halfWidth + 2, currentY + cellHeight + 8);

        // Rangée 3
        this.doc.text("N° CIN:", this.margin + 2, currentY + 2 * cellHeight + 4);
        this.doc.text("N° CNSS:", this.margin + halfWidth + 2, currentY + 2 * cellHeight + 4);

        return currentY + blockHeight + 8; // Espacement réduit
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
        const headerHeight = 7; // Hauteur de la ligne titre + options
        const questionHeight = 8;
        const totalHeight = headerHeight + questions.length * questionHeight;

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
        for (let i = 0; i < questions.length; i++) {
            const questionY = startY + headerHeight + (i + 1) * questionHeight;

            // Ligne horizontale entre questions (sauf pour la dernière)
            if (i < questions.length - 1) {
                this.doc.line(this.margin, questionY, this.pageWidth - this.margin, questionY);
            }

            // Texte de la question
            const questionLines = this.doc.splitTextToSize(questions[i], col1Width - 4);
            const lineY = startY + headerHeight + i * questionHeight + 5.5;
            this.doc.text(questionLines, this.margin + 2, lineY);

            // Cases à cocher (4 options)
            let xPos = this.margin + col1Width;
            for (let j = 0; j < 4; j++) {
                const checkboxX = xPos + (optionWidth - 3) / 2;
                const checkboxY = lineY - 2.5;
                this.doc.circle(checkboxX + 1.5, checkboxY + 1.5, 1.1);
                xPos += optionWidth;
            }
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
        const firstLineY = currentY + 6;
        const secondLineY = currentY + 14;

        // LIGNE 1: Labels "Fait à:" (gauche) et "Le:" (droite)
        this.doc.text("Fait à:", this.margin + 2, firstLineY);
        this.doc.text("Le:", this.margin + leftWidth * 0.55, firstLineY);

        // LIGNE 2: Champs de saisie de même taille
        const fieldWidth = leftWidth * 0.4; // Largeur identique pour les deux champs

        // Champ "Fait à"
        this.doc.line(this.margin + 2, secondLineY, this.margin + 2 + fieldWidth, secondLineY);

        // Champ "Le" avec icône calendrier
        const leFieldStart = this.margin + leftWidth * 0.55;
        this.doc.line(leFieldStart, secondLineY, leFieldStart + fieldWidth - 8, secondLineY);
        this.doc.text("📅", leFieldStart + fieldWidth - 6, secondLineY);

        // Partie droite
        this.doc.text("Signature du bénéficiaire:", this.margin + leftWidth + 5, currentY + 8);
        this.doc.rect(this.margin + leftWidth + 5, currentY + 10, rightWidth - 10, 12);

        return currentY + blockHeight + 5;
    }

    private generateFooterSection(): void {
        const footerY = this.pageHeight - 15;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(this.baseFont * 0.9);

        const footerText = "Ce formulaire est disponible sur le Portail des CSF à l'adresse: http://csf.ofppt.org.ma";
        const textWidth = this.doc.getTextWidth(footerText);
        this.doc.text(footerText, (this.pageWidth - textWidth) / 2, footerY);
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