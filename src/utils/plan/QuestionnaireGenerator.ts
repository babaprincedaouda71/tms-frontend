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
                // Pré-générer le QR code pour optimiser les performances
                await this.preGenerateQRCode(qrToken.token, options.getBaseUrl, QRCode);
                validParticipants.push({participant, qrToken});
            }
        }

        if (validParticipants.length === 0) {
            throw new Error('Aucun token QR valide trouvé pour les participants sélectionnés');
        }

        // Générer les pages par batch optimisé
        const batchSize = Math.min(15, validParticipants.length);

        for (let batchStart = 0; batchStart < validParticipants.length; batchStart += batchSize) {
            const batch = validParticipants.slice(batchStart, Math.min(batchStart + batchSize, validParticipants.length));

            for (const {participant, qrToken} of batch) {
                if (options.onProgress) {
                    options.onProgress({
                        current: participantsProcessed + 1,
                        total: validParticipants.length,
                        percentage: ((participantsProcessed + 1) / validParticipants.length) * 100,
                        currentParticipant: participant.name
                    });
                }

                try {
                    await this.generateParticipantPage(
                        participant,
                        qrToken,
                        evaluationData,
                        options,
                        participantsProcessed
                    );
                    participantsProcessed++;
                } catch (error) {
                    console.error(`Erreur pour le participant ${participant.name}:`, error);
                    // Continuer avec les autres participants
                }

                // Pause optimisée pour gros volumes
                if (participantsProcessed % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }
        }

        if (participantsProcessed === 0) {
            throw new Error('Aucun questionnaire généré avec succès');
        }

        // Nettoyer le cache
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

    private async generateParticipantPage(
        participant: any,
        qrToken: any,
        evaluationData: any,
        options: any,
        pageIndex: number
    ): Promise<void> {
        // Ajouter une nouvelle page si ce n'est pas la première
        if (pageIndex > 0) {
            this.doc.addPage();
        }

        // Calcul de l'espace disponible pour optimiser la mise en page
        const availableHeight = this.pageHeight - 2 * this.margin - 20; // 20mm pour footer
        const questionsCount = evaluationData.questionnaire.questions.length;

        let currentY = this.generateCompactHeader(evaluationData, qrToken, options);
        currentY = this.generateCompactParticipantInfo(participant, options, currentY);
        currentY = this.generateCompactInstructions(evaluationData, currentY);
        currentY = this.generateCompactQuestions(evaluationData, currentY, availableHeight - currentY + this.margin);
        this.generateFooter(participant, qrToken, pageIndex);
    }

    private generateCompactHeader(evaluationData: any, qrToken: any, options: any): number {
        // En-tête compact
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        const title = evaluationData.questionnaire.title;

        // Position du titre décalée pour laisser place au QR code
        const maxTitleWidth = this.pageWidth - 45; // 45mm pour QR code + marge
        const titleLines = this.doc.splitTextToSize(title, maxTitleWidth);
        this.doc.text(titleLines, this.margin, 20);

        // Sous-titre compact
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        const subtitle = evaluationData.label;
        const subtitleLines = this.doc.splitTextToSize(subtitle, maxTitleWidth);
        this.doc.text(subtitleLines, this.margin, 28);

        // QR Code depuis le cache
        this.addQRCodeFromCache(qrToken.token);

        return 40;
    }

    private addQRCodeFromCache(token: string): void {
        const qrCodeDataUrl = this.qrCodeCache.get(token);
        if (qrCodeDataUrl) {
            const qrSize = 25;
            const qrX = this.pageWidth - this.margin - qrSize;
            const qrY = 10;

            this.doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            // Texte sous le QR code - compact
            this.doc.setFontSize(7);
            this.doc.setFont('helvetica', 'normal');
            const qrText = 'Scanner pour répondre';
            const qrTextWidth = this.doc.getTextWidth(qrText);
            this.doc.text(qrText, qrX + (qrSize - qrTextWidth) / 2, qrY + qrSize + 3);
        }
    }

    private generateCompactParticipantInfo(participant: any, options: any, startY: number): number {
        let currentY = startY;

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Informations:', this.margin, currentY);
        currentY += 6;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);

        const infos = [
            `Participant: ${participant.name}`,
            `Formation: ${options.trainingTheme}`,
            `Date: ${new Date().toLocaleDateString('fr-FR')}`
        ];

        for (const info of infos) {
            this.doc.text(info, this.margin + 3, currentY);
            currentY += 4;
        }

        return currentY + 8;
    }

    private generateCompactInstructions(evaluationData: any, startY: number): number {
        let currentY = startY;

        // Instructions très compactes
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'italic');
        const instruction = 'Cochez la case correspondant à votre réponse. * = obligatoire';

        const lines = this.doc.splitTextToSize(instruction, this.pageWidth - 2 * this.margin);
        this.doc.text(lines, this.margin, currentY);
        currentY += lines.length * 4 + 6;

        return currentY;
    }

    private generateCompactQuestions(evaluationData: any, startY: number, availableHeight: number): number {
        let currentY = startY;
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');

        const questions = evaluationData.questionnaire.questions;

        // Calculer l'espace total nécessaire pour toutes les questions
        let totalEstimatedHeight = 0;
        for (const question of questions) {
            totalEstimatedHeight += this.estimateQuestionHeight(question);
        }

        // Si l'espace estimé dépasse l'espace disponible, ajuster la taille des polices
        let fontSize = 9;
        let optionsFontSize = 8;
        if (totalEstimatedHeight > availableHeight) {
            fontSize = 8;
            optionsFontSize = 7;
            this.doc.setFontSize(fontSize);
        }

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // Vérifier qu'il reste un minimum d'espace
            if (currentY > this.pageHeight - 30) {
                console.warn(`Question ${i + 1} ne peut pas être affichée par manque d'espace`);
                break;
            }

            currentY = this.generateAdaptiveQuestion(question, i + 1, currentY, fontSize, optionsFontSize);
        }

        return currentY;
    }

    private estimateQuestionHeight(question: any): number {
        let height = 8; // Titre de la question

        if (question.options && question.options.length > 0) {
            height += question.options.length * 4; // 4mm par option
        } else if (question.levels && question.levels.length > 0) {
            height += question.levels.length * 4; // 4mm par niveau
        } else {
            height += 12; // Zone de texte libre (3 lignes * 4mm)
        }

        return height + 2; // +2mm d'espacement
    }

    private generateAdaptiveQuestion(question: any, questionNumber: number, startY: number, fontSize: number, optionsFontSize: number): number {
        let currentY = startY;

        // Titre de la question
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(fontSize);
        const questionHeader = `${questionNumber}. ${question.text}${question.required ? ' *' : ''}`;
        const questionLines = this.doc.splitTextToSize(questionHeader, this.pageWidth - 2 * this.margin);

        // Limiter à 2 lignes maximum pour le titre
        const titleLines = questionLines.slice(0, 2);
        if (questionLines.length > 2) {
            titleLines[1] = titleLines[1].substring(0, titleLines[1].length - 3) + '...';
        }

        this.doc.text(titleLines, this.margin, currentY);
        currentY += titleLines.length * (fontSize * 0.5) + 2;

        // Options de réponse
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(optionsFontSize);

        if (question.options && question.options.length > 0) {
            // Afficher TOUTES les options avec espacement adaptatif
            const optionSpacing = Math.max(3.5, Math.min(5, (this.pageHeight - currentY - 30) / question.options.length));

            for (const option of question.options) {
                if (currentY > this.pageHeight - 25) {
                    console.warn('Option tronquée par manque d\'espace');
                    break;
                }

                this.doc.rect(this.margin + 3, currentY - 2, 2.5, 2.5);

                // Tronquer l'option si elle est trop longue
                const maxOptionLength = Math.floor((this.pageWidth - this.margin - 15) / (optionsFontSize * 0.4));
                const optionText = option.length > maxOptionLength ?
                    option.substring(0, maxOptionLength - 3) + '...' : option;

                this.doc.text(optionText, this.margin + 7, currentY);
                currentY += optionSpacing;
            }
        } else if (question.levels && question.levels.length > 0) {
            // Afficher TOUS les niveaux avec espacement adaptatif
            const levelSpacing = Math.max(3.5, Math.min(5, (this.pageHeight - currentY - 30) / question.levels.length));

            for (const level of question.levels) {
                if (currentY > this.pageHeight - 25) {
                    console.warn('Niveau tronqué par manque d\'espace');
                    break;
                }

                this.doc.rect(this.margin + 3, currentY - 2, 2.5, 2.5);

                // Tronquer le niveau si il est trop long
                const maxLevelLength = Math.floor((this.pageWidth - this.margin - 15) / (optionsFontSize * 0.4));
                const levelText = level.length > maxLevelLength ?
                    level.substring(0, maxLevelLength - 3) + '...' : level;

                this.doc.text(levelText, this.margin + 7, currentY);
                currentY += levelSpacing;
            }
        } else {
            // Zone de texte libre - toujours 3 lignes
            for (let k = 0; k < 3; k++) {
                if (currentY > this.pageHeight - 25) break;
                this.doc.line(this.margin + 3, currentY, this.pageWidth - this.margin, currentY);
                currentY += 4;
            }
        }

        return currentY + 2; // Espacement entre questions
    }

    private generateFooter(participant: any, qrToken: any, pageIndex: number): void {
        this.doc.setFontSize(7);
        this.doc.setFont('helvetica', 'italic');
        const footerText = `${participant.name} - Token: ${qrToken.token.substring(0, 8)}... - Page ${pageIndex + 1}`;
        this.doc.text(footerText, this.margin, this.pageHeight - 8);
    }
}