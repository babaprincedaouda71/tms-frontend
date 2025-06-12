import CustomSelect from '@/components/FormComponents/CustomSelect';
import FileInputField from '@/components/FormComponents/FileInputField';
import TextAreaField from '@/components/FormComponents/TextAreaField';
import InputField from '@/components/FormComponents/InputField';
import React, {useState} from 'react';
import {FiCornerUpLeft} from "react-icons/fi";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import {useRouter} from "next/router";
import {GROUPE_INVOICE_URLS} from "@/config/urls";

const AddGroupeInvoice = () => {
    const {navigateTo} = useRoleBasedNavigation();
    const router = useRouter();
    const {trainingId, groupId} = router.query; // Récupérer l'ID du groupe depuis l'URL
    // État pour stocker les données du formulaire
    const [formData, setFormData] = useState({
        type: "",
        description: "",
        amount: "",
        paymentDate: "",
        paymentMethod: "",
    });

    // État pour stocker les fichiers (un seul fichier par champ)
    const [files, setFiles] = useState({
        invoiceFile: null,
        bankRemiseFile: null,
        receiptFile: null,
    });

    // État pour les erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Options pour les selects
    const typeOptions = [
        "Formation professionnelle",
        "Frais de restauration",
        "Frais de déplacement",
        "Matériel pédagogique",
        "Location de salle",
        "Intervenant externe",
        "Frais administratifs"
    ];

    const paymentMethodOptions = [
        "Chèque",
        "Virement bancaire",
        "Carte bancaire",
        "Espèces",
        "Prélèvement automatique"
    ];

    // Fonction pour gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Supprimer l'erreur pour ce champ s'il y en avait une
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Fonction pour gérer les changements dans les selects
    const handleSelectChange = (event) => {
        const {name, value} = event;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Supprimer l'erreur pour ce champ s'il y en avait une
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Fonction pour gérer les changements de fichiers
    const handleFileChange = (fieldName) => (selectedFiles) => {
        // Prendre seulement le premier fichier (pas de multiple)
        const file = selectedFiles.length > 0 ? selectedFiles[0] : null;

        // Validation du fichier PDF
        if (file) {
            if (!isPdfFile(file)) {
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: "Seuls les fichiers PDF sont acceptés"
                }));
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB max
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: "Le fichier ne peut pas dépasser 10MB"
                }));
                return;
            }
        }

        setFiles(prev => ({
            ...prev,
            [fieldName]: file
        }));

        // Supprimer l'erreur pour ce fichier s'il y en avait une
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    };

    // Fonction pour vérifier si c'est un fichier PDF
    const isPdfFile = (file) => {
        const contentType = file.type;
        const filename = file.name;

        return (contentType && contentType === "application/pdf") ||
            (filename && filename.toLowerCase().endsWith(".pdf"));
    };

    // Validation du formulaire
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.type.trim()) {
            newErrors.type = "Le type de facture est obligatoire";
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Le montant doit être supérieur à 0";
        }

        if (!formData.description.trim()) {
            newErrors.description = "La description est obligatoire";
        }

        if (!formData.paymentMethod.trim()) {
            newErrors.paymentMethod = "La méthode de paiement est obligatoire";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fonction pour soumettre le formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Créer FormData pour l'envoi multipart
            const formDataToSend = new FormData();

            // Ajouter les données JSON comme Blob avec le bon Content-Type
            const invoiceData = {
                type: formData.type,
                description: formData.description,
                amount: parseFloat(formData.amount),
                paymentDate: formData.paymentDate || null,
                paymentMethod: formData.paymentMethod,
                creationDate: new Date().toISOString().split('T')[0]
            };

            // Le @RequestPart attend un objet JSON, pas une string
            formDataToSend.append('invoice', new Blob([JSON.stringify(invoiceData)], {
                type: 'application/json'
            }));

            // Ajouter les fichiers s'ils existent
            if (files.invoiceFile) {
                formDataToSend.append('invoiceFile', files.invoiceFile);
            }
            if (files.bankRemiseFile) {
                formDataToSend.append('bankRemiseFile', files.bankRemiseFile);
            }
            if (files.receiptFile) {
                formDataToSend.append('receiptFile', files.receiptFile);
            }

            // Envoyer la requête
            const response = await fetch(`${GROUPE_INVOICE_URLS.addGroupeInvoice}/${groupId}`, {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend,
            });

            if (response.ok) {
                // Succès - rediriger vers la liste
                navigateTo(`/Plan/annual/add-group`, {
                    query : {
                        trainingId: trainingId,
                        groupId: groupId,
                        tab: 'accounting',
                    }
                });
            } else {
                const errorData = await response.json();
                console.error('Erreur lors de la création:', errorData);
                // Afficher un message d'erreur à l'utilisateur
                setErrors({submit: "Erreur lors de la création de la facture"});
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            setErrors({submit: "Erreur de connexion"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToList = () => {
        navigateTo(`/Plan/annual/add-group`, {
            query : {
                trainingId: trainingId,
                groupId: groupId,
            }
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <section>
                <div className="relative pl-2 flex items-center mb-4">
                    {/* Bouton Retour à la liste aligné à gauche */}
                    <button
                        type="button"
                        onClick={handleBackToList}
                        className="text-blue-500 border-2 flex gap-2 rounded-xl p-2 hover:underline focus:outline-none"
                    >
                        <FiCornerUpLeft size={24}/>
                        Retour à la liste
                    </button>

                    {/* Titre centré */}
                    <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none">
                        <h1 className="text-2xl font-semibold text-gray-800 pointer-events-auto">
                            Ajouter une facture
                        </h1>
                    </div>
                </div>

                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations générales
                </h2>
                <hr className="my-6 border-gray-300"/>

                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <CustomSelect
                        label='Type de facture'
                        value={formData.type}
                        name='type'
                        options={typeOptions}
                        onChange={handleSelectChange}
                        error={errors.type}
                    />

                    <InputField
                        type="number"
                        label="Montant"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        minValue="1"
                        error={errors.amount}
                    />

                    <FileInputField
                        label="Fichier de facture (PDF)"
                        name="invoiceFile"
                        onChange={handleFileChange('invoiceFile')}
                        accept="application/pdf,.pdf"
                    />
                    {errors.invoiceFile && (
                        <p className="text-sm text-red mt-1 col-span-full">{errors.invoiceFile}</p>
                    )}

                    <TextAreaField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        error={errors.description}
                    />
                </div>
            </section>

            <hr className="my-6 border-gray-300"/>

            <section>
                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations de paiement
                </h2>
                <hr className="my-6 border-gray-300"/>

                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <CustomSelect
                        label='Méthode de paiement'
                        value={formData.paymentMethod}
                        name='paymentMethod'
                        options={paymentMethodOptions}
                        onChange={handleSelectChange}
                        error={errors.paymentMethod}
                    />

                    <InputField
                        type='date'
                        label="Date de paiement"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                    />

                    <FileInputField
                        label="Reçu de paiement (PDF)"
                        name="receiptFile"
                        onChange={handleFileChange('receiptFile')}
                        accept="application/pdf,.pdf"
                    />
                    {errors.receiptFile && (
                        <p className="text-sm text-red mt-1 col-span-full">{errors.receiptFile}</p>
                    )}

                    <FileInputField
                        label="Remise de la banque (PDF)"
                        name="bankRemiseFile"
                        onChange={handleFileChange('bankRemiseFile')}
                        accept="application/pdf,.pdf"
                    />
                    {errors.bankRemiseFile && (
                        <p className="text-sm text-red mt-1 col-span-full">{errors.bankRemiseFile}</p>
                    )}
                </div>
            </section>

            {/* Messages d'erreur globaux */}
            {errors.submit && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errors.submit}
                </div>
            )}

            {/* Bouton Submit */}
            <div className="mt-5 text-right text-xs md:text-sm lg:text-base">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`${
                        isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700'
                    } text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl transition-colors`}
                >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
};

export default AddGroupeInvoice;