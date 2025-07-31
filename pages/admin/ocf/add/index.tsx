import React, { useState } from "react";
import InputField from "@/components/FormComponents/InputField";
import FileInputField from "@/components/FormComponents/FileInputField";

const AddOCFPage = () => {
    // État pour stocker les données du formulaire
    const [formData, setFormData] = useState({
        corporateName: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        staff: "",
        creationDate: "",
        legalForme: "",
        ice: "",
        rc: "",
        patent: "",
        if: "",
        cnss: "",
        pStaff: "",
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

    // Fonction pour gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    return (
        <div className="mx-auto bg-white font-title rounded-lg px-6 py-4">
            <section>
                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations sur l'entreprise
                </h2>
                <hr className="my-6 border-gray-300" />

                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <InputField
                        label="Raison social"
                        name="corporateName"
                        onChange={handleChange}
                    />
                    <InputField label="ICE" name="ice" onChange={handleChange} />
                    <InputField label="Adresse" name="address" onChange={handleChange} />
                    <InputField label="RC" name="rc" onChange={handleChange} />
                    <InputField label="Téléphone" name="phone" onChange={handleChange} />
                    <InputField label="Patente" name="patent" onChange={handleChange} />
                    <InputField label="Email" name="email" onChange={handleChange} />
                    <InputField label="IF" name="if" onChange={handleChange} />
                    <InputField label="Site web" name="website" onChange={handleChange} />
                    <InputField label="CNSS" name="cnss" onChange={handleChange} />
                    <InputField
                        label="Éffectif permanent"
                        name="staff"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Éffectif permanent"
                        name="pStaff"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Date de création"
                        name="créationDate"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Mot de passe"
                        name="password"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Forme juridique"
                        name="legalForm"
                        onChange={handleChange}
                    />
                </div>
            </section>
            <section>
                <hr className="my-6 border-gray-300" />
                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations sur le représentant légal
                </h2>
                <hr className="my-6 border-gray-300" />
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <InputField
                        label="Nom complet"
                        name="nameLegalRepresentant"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Téléphone"
                        name="phoneLegalRepresentant"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Fonction"
                        name="positionLegalRepresentant"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Email"
                        name="emailLegalRepresentant"
                        onChange={handleChange}
                    />
                </div>
            </section>
            <section>
                <hr className="my-6 border-gray-300" />

                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations sur le contact principal
                </h2>
                <hr className="my-6 border-gray-300" />

                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <InputField
                        label="Nom complet"
                        name="nameMainContact"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Téléphone"
                        name="phoneMainContact"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Fonction"
                        name="positionMainContact"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Email"
                        name="emailMainContact"
                        onChange={handleChange}
                    />
                </div>
            </section>
            <section>
                <hr className="my-6 border-gray-300" />

                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Documents
                </h2>
                <hr className="my-6 border-gray-300" />

                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <InputField
                        label="Statut juridique"
                        name="legalForme"
                        onChange={handleChange}
                    />
                    <FileInputField
                        label="Attestation d'éligibilité"
                        name=""
                        onChange={handleChange}
                    />
                    <InputField
                        label="Modèle J RC"
                        name="emailMainContact"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Police d'assurance"
                        name="emailMainContact"
                        onChange={handleChange}
                    />
                    <FileInputField
                        label="Certificat de régularité fiscal"
                        name="positionMainContact"
                        onChange={handleChange}
                    />
                    <FileInputField
                        label="Attestation de RIB bancaire"
                        name="emailMainContact"
                        onChange={handleChange}
                    />
                    <InputField
                        label="Autres certifications"
                        name="emailMainContact"
                        onChange={handleChange}
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
                    <InputField
                        label="Conditions générales de vente"
                        name="emailMainContact"
                        onChange={handleChange}
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
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                >
                    Enregistrer
                </button>
            </div>
        </div>
    );
};

export default AddOCFPage;