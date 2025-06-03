import React, {ChangeEvent, useState} from "react";
import MultiSelectField from "@/components/FormComponents/MultiselectField";
import InputField from "@/components/FormComponents/InputField";
import TextAreaField from "@/components/FormComponents/TextAreaField";
import Modal from "@/components/Modal";
import RadioButton from "@/components/FormComponents/RadioButton";
import FolderIcon from "@/components/Svgs/FolderIcon";

interface FormData {
    site: string;
    domaine: string;
    nbrDay: string;
    nbrGroup: string;
    qualification: string;
    validity: string;
    objective: string;
    content: string;
    department: string;
    theme: string;
    type: string;
}

const index = () => {
    const [formData, setFormData] = useState({
        site: "",
        domaine: "",
        nbrDay: "",
        nbrGroup: "",
        qualification: "",
        validity: "",
        objective: "",
        content: "",
        department: "",
        theme: "",
        type: "",
    });

    const [isModalOpen, setModalOpen] = useState(false);

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);
    const handleSave = () => {
        closeModal();
        setTimeout(() => {
            alert("Requête enregistrée avec succès !");
        }, 100);
    };

    const [selectedOption, setSelectedOption] = useState("");

    const [siteSelectedOption, setSiteSelectedOption] = useState<string[]>([]);
    const [domainSelectedOption, setDomainSelectedOption] = useState<string[]>(
        []
    );
    const [departmentSelectedOption, setDepartmentSelectedOption] = useState<string[]>([]);

    const options = [
        {
            id: "option1",
            value: "catalogue",
            label: "Enregistrer dans le catalogue interne et le plan de formation",
        },
        {
            id: "option2",
            value: "plan",
            label: "Enregistrer uniquement dans le plan de formation",
        },
    ];

    return (
        <form className="mx-auto bg-white font-title rounded-lg px-6 pb-14 pt-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24 mb-4">
                <MultiSelectField
                    options={["Rabat", "Casablanca", "Tanger", "El Jadida"]}
                    value={siteSelectedOption}
                    onChange={setSiteSelectedOption}
                    label="Site"
                />
                <MultiSelectField
                    options={["IT", "RH", "Sécurité"]}
                    value={departmentSelectedOption}
                    onChange={setDepartmentSelectedOption}
                    label="Département"
                />
                <MultiSelectField
                    options={["Option 1", "Option 2", "Option 3", "Option 4"]}
                    value={domainSelectedOption}
                    onChange={setDomainSelectedOption}
                    label="Domaine"
                />
                <InputField
                    label="Thème"
                    name="theme"
                    value={formData.theme}
                    onChange={handleInputChange}
                />
                <InputField
                    label="Nbr de jour"
                    name="nbrDay"
                    type="number"
                    value={formData.nbrDay}
                    onChange={handleInputChange}
                />
                <InputField
                    label="Type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                />
                <InputField
                    label="Nbr de groupe"
                    name="nbrGroup"
                    type="number"
                    value={formData.nbrGroup}
                    onChange={handleInputChange}
                />
                <InputField
                    label="Qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-x-20">
                <div className="col-span-1 grid gap-y-4">
                    <InputField
                        label="Qualification"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                    />
                    <InputField
                        label="Validité"
                        name="validity"
                        type="date"
                        value={formData.validity}
                        onChange={handleInputChange}
                    />
                    <TextAreaField
                        label="Objectif"
                        name="objective"
                        value={formData.objective}
                        onChange={handleInputChange}
                    />
                    <TextAreaField
                        label="Contenu"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="col-span-1"></div>
            </div>

            <div className="mt-5 text-right text-xs md:text-sm lg:text-base">
                <button
                    type="button"
                    className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                    onClick={openModal}
                >
                    Enregistrer
                </button>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={"Sélection de la source"}
                subtitle={"Veuillez choisir la destination de ce nouveau besoin"}
                actions={[
                    {label: "Annuler", onClick: closeModal, className: "border"},
                    {
                        label: "Valider",
                        onClick: handleSave,
                        className:
                            "bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd text-white",
                    },
                ]}
                icon={<FolderIcon/>}
            >
                <div className="flex flex-col items-start justify-center space-y-4">
                    {options.map((option) => (
                        <RadioButton
                            key={option.id}
                            id={option.id}
                            name="destination"
                            value={option.value}
                            label={option.label}
                            checked={selectedOption === option.value}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className={"w-4 h-4 md:w-6 md:h-6"}
                        />
                    ))}
                </div>
            </Modal>
        </form>
    );
};

export default index;