import React, {useState} from "react";
import {OCF_URLS} from "@/config/urls";
import ProtectedRoute from "@/components/ProtectedRoute";
import {UserRole} from "@/contexts/AuthContext";
import FileInputField from "@/components/FormComponents/FileInputField";
import InputField from "@/components/FormComponents/InputField";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";

const INITIAL_FILES = {
    legalStatusFile: null,
    eligibilityCertificateFile: null,
    jrcTemplateFile: null,
    insurancePolicyFile: null,
    taxComplianceCertificateFile: null,
    bankStatementCertificateFile: null,
    termsAndConditionsFile: null,
    otherCertificationsFile: null,

};

const AddOCFPage = () => {
    // État pour stocker les fichiers
    const [files, setFiles] = useState(INITIAL_FILES);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const {navigateTo} = useRoleBasedNavigation();
    // État du formulaire (inchangé)
    const [formData, setFormData] = useState({
        corporateName: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        staff: "",
        creationDate: "",
        legalForm: "",
        ice: "",
        rc: "",
        patent: "",
        ifValue: "",
        cnss: "",
        permanentStaff: "",
        password: "",
        nameLegalRepresentant: "",
        positionLegalRepresentant: "",
        phoneLegalRepresentant: "",
        emailLegalRepresentant: "",
        nameMainContact: "",
        positionMainContact: "",
        phoneMainContact: "",
        emailMainContact: "",
    });

    // Fonction handleChange (inchangée)
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
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

    // Fonction handleSubmit modifiée pour utiliser fetch
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Données à envoyer :", formData);

        try {
            const formDataToSend = new FormData();

            const ocfData = {
                corporateName: formData.corporateName,
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                website: formData.website,
                staff: formData.staff,
                creationDate: formData.creationDate,
                legalForm: formData.legalForm,
                ice: formData.ice,
                rc: formData.rc,
                patent: formData.patent,
                ifValue: formData.ifValue,
                cnss: formData.cnss,
                permanentStaff: formData.permanentStaff,
                password: formData.password,
                nameLegalRepresentant: formData.nameLegalRepresentant,
                positionLegalRepresentant: formData.positionLegalRepresentant,
                phoneLegalRepresentant: formData.phoneLegalRepresentant,
                emailLegalRepresentant: formData.emailLegalRepresentant,
                nameMainContact: formData.nameMainContact,
                positionMainContact: formData.positionMainContact,
                phoneMainContact: formData.phoneMainContact,
                emailMainContact: formData.emailMainContact,
            }

            formDataToSend.append('ocfCreateDto', new Blob([JSON.stringify(ocfData)], {type: 'application/json'}));

            if (files.legalStatusFile) {
                formDataToSend.append('legalStatusFile', files.legalStatusFile);
            }
            if (files.eligibilityCertificateFile) {
                formDataToSend.append('eligibilityCertificateFile', files.eligibilityCertificateFile);
            }
            if (files.jrcTemplateFile) {
                formDataToSend.append('jrcTemplateFile', files.jrcTemplateFile);
            }
            if (files.insurancePolicyFile) {
                formDataToSend.append('insurancePolicyFile', files.insurancePolicyFile);
            }
            if (files.taxComplianceCertificateFile) {
                formDataToSend.append('taxComplianceCertificateFile', files.taxComplianceCertificateFile);
            }
            if (files.bankStatementCertificateFile) {
                formDataToSend.append('bankStatementCertificateFile', files.bankStatementCertificateFile);
            }
            if (files.termsAndConditionsFile) {
                formDataToSend.append('termsAndConditionsFile', files.termsAndConditionsFile);
            }
            if (files.otherCertificationsFile) {
                formDataToSend.append('otherCertificationsFile', files.otherCertificationsFile);
            }


            const response = await fetch(OCF_URLS.add, {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend,
            });

            // fetch ne lève pas d'erreur pour les statuts HTTP 4xx/5xx
            // Il faut donc vérifier la réponse manuellement
            if (!response.ok) {
                // Tenter de lire le corps de l'erreur pour plus de détails
                const errorData = await response.json().catch(() => ({message: 'Erreur inconnue'}));
                throw new Error(`Erreur HTTP ${response.status}: ${errorData.message}`);
            }

            navigateTo("/ocf");
        } catch (error) {
            console.error("Erreur lors de l'envoi des données :", error);
            alert(`Une erreur est survenue: ${error.message}`);
        }
    };

    return (
        <ProtectedRoute requiredRole={UserRole.Admin}>
            <form className="mx-auto bg-white font-title rounded-lg px-6 py-4" onSubmit={handleSubmit}>
                <section>
                    <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                        Informations sur l'entreprise
                    </h2>
                    <hr className="my-6 border-gray-300"/>

                    <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                        <InputField
                            label="Raison social"
                            name="corporateName"
                            onChange={handleChange}
                            value={formData.corporateName}
                        />
                        <InputField
                            label="ICE"
                            name="ice"
                            onChange={handleChange}
                            value={formData.ice}
                        />
                        <InputField
                            label="Adresse"
                            name="address"
                            onChange={handleChange}
                            value={formData.address}
                        />
                        <InputField
                            label="RC"
                            name="rc"
                            onChange={handleChange}
                            value={formData.rc}
                        />
                        <InputField
                            label="Téléphone"
                            name="phone"
                            onChange={handleChange}
                            value={formData.phone}
                        />
                        <InputField
                            label="Patente"
                            name="patent"
                            onChange={handleChange}
                            value={formData.patent}
                        />
                        <InputField
                            label="Email"
                            name="email"
                            onChange={handleChange}
                            value={formData.email}
                        />
                        <InputField
                            label="IF"
                            name="ifValue"
                            onChange={handleChange}
                            value={formData.ifValue}
                        />
                        <InputField
                            label="Site web"
                            name="website"
                            onChange={handleChange}
                            value={formData.website}
                        />
                        <InputField
                            label="CNSS"
                            name="cnss"
                            onChange={handleChange}
                            value={formData.cnss}
                        />
                        <InputField
                            label="Éffectif permanent"
                            name="staff"
                            onChange={handleChange}
                            value={formData.staff}
                        />
                        <InputField
                            label="Éffectif permanent"
                            name="permanentStaff"
                            onChange={handleChange}
                            value={formData.permanentStaff}
                        />
                        <InputField
                            label="Date de création"
                            type="date"
                            name="creationDate"
                            onChange={handleChange}
                            value={formData.creationDate}
                        />
                        <InputField
                            label="Mot de passe"
                            name="password"
                            onChange={handleChange}
                            value={formData.password}
                        />
                        <InputField
                            label="Forme juridique"
                            name="legalForm"
                            onChange={handleChange}
                            value={formData.legalForm}
                        />
                    </div>
                </section>
                <section>
                    <hr className="my-6 border-gray-300"/>
                    <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                        Informations sur le représentant légal
                    </h2>
                    <hr className="my-6 border-gray-300"/>
                    <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                        <InputField
                            label="Nom complet"
                            name="nameLegalRepresentant"
                            onChange={handleChange}
                            value={formData.nameLegalRepresentant}
                        />
                        <InputField
                            label="Téléphone"
                            name="phoneLegalRepresentant"
                            onChange={handleChange}
                            value={formData.phoneLegalRepresentant}
                        />
                        <InputField
                            label="Fonction"
                            name="positionLegalRepresentant"
                            onChange={handleChange}
                            value={formData.positionLegalRepresentant}
                        />
                        <InputField
                            label="Email"
                            name="emailLegalRepresentant"
                            onChange={handleChange}
                            value={formData.emailLegalRepresentant}
                        />
                    </div>
                </section>
                <section>
                    <hr className="my-6 border-gray-300"/>

                    <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                        Informations sur le contact principal
                    </h2>
                    <hr className="my-6 border-gray-300"/>

                    <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                        <InputField
                            label="Nom complet"
                            name="nameMainContact"
                            onChange={handleChange}
                            value={formData.nameMainContact}
                        />
                        <InputField
                            label="Téléphone"
                            name="phoneMainContact"
                            onChange={handleChange}
                            value={formData.phoneMainContact}
                        />
                        <InputField
                            label="Fonction"
                            name="positionMainContact"
                            onChange={handleChange}
                            value={formData.positionMainContact}
                        />
                        <InputField
                            label="Email"
                            name="emailMainContact"
                            onChange={handleChange}
                            value={formData.emailMainContact}
                        />
                    </div>
                </section>
                <section>
                    <hr className="my-6 border-gray-300"/>

                    <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                        Documents
                    </h2>
                    <hr className="my-6 border-gray-300"/>

                    <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                        <FileInputField
                            label="Statut juridique"
                            name="legalStatusFile"
                            onChange={handleFileChange('legalStatusFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <FileInputField
                            label="Attestation d'éligibilité"
                            name="eligibilityCertificateFile"
                            onChange={handleFileChange('eligibilityCertificateFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <FileInputField
                            label="Modèle J RC"
                            name="jrcTemplateFile"
                            onChange={handleFileChange('jrcTemplateFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <FileInputField
                            label="Police d'assurance"
                            name="insurancePolicyFile"
                            onChange={handleFileChange('insurancePolicyFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <FileInputField
                            label="Certificat de régularité fiscal"
                            name="taxComplianceCertificateFile"
                            onChange={handleFileChange('taxComplianceCertificateFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <FileInputField
                            label="Attestation de RIB bancaire"
                            name="bankStatementCertificateFile"
                            onChange={handleFileChange('bankStatementCertificateFile')}
                        />
                        <FileInputField
                            label="Autres certifications"
                            name="otherCertificationsFile"
                            onChange={handleFileChange('otherCertificationsFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <InputField
                            label="Référence clients"
                            name="emailMainContact"
                            onChange={handleChange}
                        />
                        <InputField
                            label="Qualification"
                            name="emailMainContact"
                            onChange={handleChange}
                        />
                        <FileInputField
                            label="Conditions générales de vente"
                            name="termsAndConditionsFile"
                            onChange={handleFileChange('termsAndConditionsFile')}
                            accept={"application/pdf,.pdf"}
                        />
                        <InputField
                            label="Validité"
                            name="emailMainContact"
                            onChange={handleChange}
                        />
                    </div>
                </section>
                {/* Bouton Submit */}
                <div className="mt-5 text-right text-xs md:text-sm lg:text-base">
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                    >
                        Enregistrer
                    </button>
                </div>
            </form>
        </ProtectedRoute>
    );
};

export default AddOCFPage;