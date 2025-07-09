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
    private margin = 20;

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

        // Filtrer les participants avec tokens valides
        for (const participant of participants) {
            const qrToken = evaluationData.qrTokens.find((token: any) =>
                token.participantId === participant.id
            );
            if (qrToken) {
                validParticipants.push({participant, qrToken});
            }
        }

        if (validParticipants.length === 0) {
            throw new Error('Aucun token QR valide trouvé pour les participants sélectionnés');
        }

        // Générer les pages par batch pour éviter la surcharge mémoire
        const batchSize = 10; // Traiter 10 participants à la fois

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

                // Pause pour permettre à l'UI de se mettre à jour
                if (participantsProcessed % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        }

        if (participantsProcessed === 0) {
            throw new Error('Aucun questionnaire généré avec succès');
        }

        return this.doc.output('blob');
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

        // Import dynamique de QRCode seulement quand nécessaire
        const QRCode = await import('qrcode');

        let currentY = this.generateHeader(evaluationData, qrToken, options);
        currentY = this.generateParticipantInfo(participant, options, currentY);
        currentY = this.generateInstructions(evaluationData, currentY);
        await this.generateQuestions(evaluationData, participant, currentY);
        this.generateFooter(participant, qrToken, pageIndex);
    }

    private generateHeader(evaluationData: any, qrToken: any, options: any): number {
        // En-tête
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        const title = evaluationData.questionnaire.title;
        const titleWidth = this.doc.getTextWidth(title);
        this.doc.text(title, (this.pageWidth - titleWidth) / 2, 25);

        // Sous-titre
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        const subtitle = evaluationData.label;
        const subtitleWidth = this.doc.getTextWidth(subtitle);
        this.doc.text(subtitle, (this.pageWidth - subtitleWidth) / 2, 35);

        // QR Code (sans attendre la promesse pour ne pas bloquer)
        this.generateQRCodeAsync(qrToken.token, options.getBaseUrl());

        return 55;
    }

    private async generateQRCodeAsync(token: string, getBaseUrl: () => string): Promise<void> {
        try {
            const QRCode = await import('qrcode');
            const qrUrl = `${getBaseUrl()}/public/f4-evaluation/scan/${token}`;

            const qrCodeDataUrl = QRCode.default.toDataURL(qrUrl, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                margin: 1,
                color: {dark: '#000000', light: '#FFFFFF'},
                width: 128
            });

            const qrSize = 30;
            const qrX = this.pageWidth - this.margin - qrSize;
            const qrY = 10;

            this.doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            // Texte sous le QR code
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            const qrText = 'Scanner pour répondre';
            const qrTextWidth = this.doc.getTextWidth(qrText);
            this.doc.text(qrText, qrX + (qrSize - qrTextWidth) / 2, qrY + qrSize + 4);
        } catch (error) {
            console.error('Erreur QR code:', error);
        }
    }

    private generateParticipantInfo(participant: any, options: any, startY: number): number {
        let currentY = startY;

        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Informations:', this.margin, currentY);
        currentY += 8;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);

        const infos = [
            `Participant: ${participant.name}`,
            `Formation: ${options.trainingTheme}`,
            `Groupe: ${options.groupName}`,
            `Date: ${new Date().toLocaleDateString('fr-FR')}`
        ];

        for (const info of infos) {
            this.doc.text(info, this.margin + 5, currentY);
            currentY += 6;
        }

        return currentY + 15;
    }

    private generateInstructions(evaluationData: any, startY: number): number {
        let currentY = startY;

        // Description
        if (evaluationData.questionnaire.description) {
            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'italic');
            const lines = this.doc.splitTextToSize(
                evaluationData.questionnaire.description,
                this.pageWidth - 2 * this.margin
            );
            this.doc.text(lines, this.margin, currentY);
            currentY += lines.length * 5 + 10;
        }

        // Instructions
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'italic');
        const instructions = [
            'Instructions: Veuillez cocher la case correspondant à votre réponse pour chaque question.',
            'Les questions marquées d\'un * sont obligatoires.'
        ];

        for (const instruction of instructions) {
            this.doc.text(instruction, this.margin, currentY);
            currentY += 8;
        }

        return currentY + 15;
    }

    private async generateQuestions(evaluationData: any, participant: any, startY: number): Promise<void> {
        let currentY = startY;
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');

        for (let i = 0; i < evaluationData.questionnaire.questions.length; i++) {
            const question = evaluationData.questionnaire.questions[i];

            // Vérifier l'espace disponible
            const estimatedSpace = 20 + (question.options?.length || 3) * 6;
            if (currentY + estimatedSpace > this.pageHeight - 30) {
                this.doc.addPage();
                currentY = this.margin;

                // En-tête de continuation
                this.doc.setFontSize(14);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(
                    `${evaluationData.questionnaire.title} - ${participant.name} (suite)`,
                    this.margin,
                    currentY
                );
                currentY += 15;
                this.doc.setFontSize(11);
                this.doc.setFont('helvetica', 'normal');
            }

            currentY = this.generateSingleQuestion(question, i + 1, currentY);
        }
    }

    private generateSingleQuestion(question: any, questionNumber: number, startY: number): number {
        let currentY = startY;

        // Titre de la question
        this.doc.setFont('helvetica', 'bold');
        const questionHeader = `${questionNumber}. ${question.text}${question.required ? ' *' : ''}`;
        const questionLines = this.doc.splitTextToSize(questionHeader, this.pageWidth - 2 * this.margin);
        this.doc.text(questionLines, this.margin, currentY);
        currentY += questionLines.length * 5 + 3;

        // Commentaire
        if (question.comment) {
            this.doc.setFont('helvetica', 'italic');
            this.doc.setFontSize(9);
            const commentLines = this.doc.splitTextToSize(
                `(${question.comment})`,
                this.pageWidth - 2 * this.margin - 10
            );
            this.doc.text(commentLines, this.margin + 5, currentY);
            currentY += commentLines.length * 4 + 3;
            this.doc.setFontSize(11);
        }

        // Options de réponse
        this.doc.setFont('helvetica', 'normal');
        currentY = this.generateQuestionOptions(question, currentY);

        return currentY + 10;
    }

    private generateQuestionOptions(question: any, startY: number): number {
        let currentY = startY;

        if (question.options && question.options.length > 0) {
            for (const option of question.options) {
                this.doc.rect(this.margin + 5, currentY - 3, 4, 4);
                const optionLines = this.doc.splitTextToSize(option, this.pageWidth - this.margin - 20);
                this.doc.text(optionLines, this.margin + 12, currentY);
                currentY += Math.max(6, optionLines.length * 5);
            }
        } else if (question.levels && question.levels.length > 0) {
            for (const level of question.levels) {
                this.doc.rect(this.margin + 5, currentY - 3, 4, 4);
                const levelLines = this.doc.splitTextToSize(level, this.pageWidth - this.margin - 20);
                this.doc.text(levelLines, this.margin + 12, currentY);
                currentY += Math.max(6, levelLines.length * 5);
            }
        } else {
            // Zone de texte libre
            this.doc.setFont('helvetica', 'italic');
            this.doc.setFontSize(9);
            this.doc.text('Réponse libre:', this.margin + 5, currentY);
            currentY += 5;
            this.doc.setFont('helvetica', 'normal');

            for (let k = 0; k < 3; k++) {
                this.doc.line(this.margin + 5, currentY, this.pageWidth - this.margin, currentY);
                currentY += 8;
            }
            this.doc.setFontSize(11);
        }

        return currentY;
    }

    private generateFooter(participant: any, qrToken: any, pageIndex: number): void {
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'italic');
        const footerText = `Page ${pageIndex + 1} - ${participant.name} - Token: ${qrToken.token.substring(0, 8)}...`;
        this.doc.text(footerText, this.margin, this.pageHeight - 10);
    }
}