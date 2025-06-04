import CustomSelect from '@/components/FormComponents/CustomSelect';
import FileInputField from '@/components/FormComponents/FileInputField';
import InputField from '@/components/FormComponents/InputField';
import TextAreaField from '@/components/FormComponents/TextAreaField';
import React, { useState } from 'react'

const AddFee = () => {
    // État pour stocker les données du formulaire
    const [formData, setFormData] = useState({
        type: "",
        supplier: "",
        bill: "",
        amount: "",
        description: "",
        payment: "",
        receiptOfPayment: "",
        deliveryOfTheBank: "",
        paymentDate: "",
        paymentMethod: "",
    });

    // Fonction pour gérer les changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Fonction pour gérer les changements dans les champs du formulaire
    const handleSelectChange = (event) => {
        const { name, value } = event;

        // Mettre à jour l'état formData avec la nouvelle valeur
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    return (
        <form>
            <section>
                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations générales
                </h2>
                <hr className="my-6 border-gray-300" />
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <CustomSelect label='Type de frais' value={formData.type} name='type' options={["Frais de restauration", "Frais de déplacement"]} onChange={handleSelectChange} />
                    {/*<InputField label="Montant" name="amount" onChange={handleChange} />*/}
                    {/*<InputField label="Fournisseur" name="supplier" onChange={handleChange} />*/}
                    <FileInputField label="Facture" name="bill" onChange={handleChange} />
                    <TextAreaField label="Description" name="description" onChange={handleChange} />
                </div>
            </section>
            <hr className="my-6 border-gray-300" />
            <section>
                <h2 className="text-base text-textColor md:text-lg lg:text-xl font-bold mb-4 text-center md:text-start">
                    Informations financières
                </h2>
                <hr className="my-6 border-gray-300" />
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24">
                    <CustomSelect label='Paiement' value={formData.payment} name='payment' options={["Chèque", "Virement"]} onChange={handleSelectChange} />
                    {/*<InputField type='date' label="Date de paiement" name="paymentDate" onChange={handleChange} />*/}
                    <FileInputField label="Reçu de paiement" name="receiptOfPayment" onChange={handleChange} />
                    {/*<InputField label="Méthode de paiement" name="paymentMethod" onChange={handleChange} />*/}
                    <FileInputField label="Remise à la banque" name="deliveryOfTheBank" onChange={handleChange} />
                </div>
            </section>
            {/* Bouton Submit */}
            <div className="mt-5 text-right text-xs md:text-sm lg:text-base">
                <button
                    type="button"
                    className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                >
                    Enregistrer
                </button>
            </div>
        </form>
    )
}

export default AddFee