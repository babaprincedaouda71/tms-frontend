import React, {useCallback, useMemo, useState} from 'react'
import ProtectedRoute from "@/components/ProtectedRoute";
import useSWR from "swr";
import {SiteProps} from "@/types/dataTypes";
import {SITE_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import useTable from "@/hooks/useTable";
import DynamicActionsRenderer from "@/components/Tables/DynamicActionsRenderer";
import SearchFilterAddBar from "@/components/SearchFilterAddBar";
import ModalButton from "@/components/ModalButton";
import Table from "@/components/Tables/Table/index";
import {handleSort} from "@/utils/sortUtils";
import Modal from "@/components/Modal";
import InputField from "@/components/FormComponents/InputField";
import CustomSelect from '@/components/FormComponents/CustomSelect';

const TABLE_HEADERS = [
    "Code",
    "Label",
    "Adresse",
    "Ville",
    "Téléphone",
    // "Manager",
    // "Poste",
    // "Email",
    // "",
    "Salle de formation",
    "Taille",
    "Actions",
];
const TABLE_KEYS = [
    "code",
    "label",
    "address",
    "city",
    "phone",
    "trainingRoom",
    "size",
    "actions",
];

const ACTIONS_TO_SHOW = ["edit", "delete"];

const RECORDS_PER_PAGE = 10;

const Site = () => {
    const {data: siteData, mutate} = useSWR<SiteProps[]>(SITE_URLS.mutate, fetcher);

    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isManagerModalOpen, setManagerModalOpen] = useState(false);
    const [formData, setFormData] = useState(
        {
            id: null,
            code: "",
            label: "",
            address: "",
            city: "",
            phone: "",
            trainingRoom: "Non",
            size: "",
            // manager: {
            //     firstName: "",
            //     lastName: "",
            //     job: "",
            //     email: "",
            //     phone: ""
            // }
        });

    const openModal = () => {
        setIsEditMode(false);
        setFormData({
            id: null,
            code: "",
            label: "",
            address: "",
            city: "",
            phone: "",
            trainingRoom: "Non",
            size: "",
            // manager: {
            //     firstName: "",
            //     lastName: "",
            //     job: "",
            //     email: "",
            //     phone: ""
            // }
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        // Assurons-nous que cette fonction ne cause pas d'erreurs
        try {
            setErrors({});
            setModalOpen(false);
            setFormData({
                id: null,
                code: "",
                label: "",
                address: "",
                city: "",
                phone: "",
                trainingRoom: "Non",
                size: "",
                // manager: {
                //     firstName: "",
                //     lastName: "",
                //     job: "",
                //     email: "",
                //     phone: ""
                // }
            });
            setIsEditMode(false);
        } catch (error) {
            console.error("Erreur lors de la fermeture du modal:", error);
        }
    };

    // Filtrer les données en fonction de la recherche
    const [searchValue, setSearchValue] = useState("");
    const filteredData = useMemo(() => {
        if (!siteData) return [];
        if (!searchValue.trim()) return siteData;

        return siteData.filter(site =>
            site.label.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [siteData, searchValue]);

    const memorizedData = useMemo(() => filteredData || [], [filteredData]);

    const {
        currentPage,
        visibleColumns,
        setCurrentPage,
        handleSortData,
        toggleColumnVisibility,
        totalRecords,
        paginatedData,
        sortableColumns,
        totalPages,
    } = useTable(memorizedData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE);

    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
        // Réinitialiser la pagination à la première page lorsque la recherche change
        setCurrentPage(1);
    }, [setCurrentPage]);

    const renderers = {
        actions: (_: any, row: SiteProps) => (
            <DynamicActionsRenderer actions={ACTIONS_TO_SHOW} row={row}
                                    deleteUrl={SITE_URLS.delete} viewUrl={SITE_URLS.view}
                                    mutateUrl={SITE_URLS.mutate}
                                    confirmMessage={`Êtes-vous sûr de vouloir supprimer le site ${row.label}  ?`}
                                    customEditHandler={() => handleEditSite(row)}
            />
        ),
    };

    /******* Start Add Site ******/
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prevFormData) => ({...prevFormData, [name]: value}));
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }
    }, [errors]);

    const handleSelectChange = useCallback((e: { name: string; value: string }) => {
        const {name, value} = e;
        setFormData((prevFormData) => ({...prevFormData, [name]: value}));
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }

        // Si trainingRoom est mis à "Non", vider le champ size
        if (name === "trainingRoom" && value === "Non") {
            setFormData(prevFormData => ({...prevFormData, size: ""}));
        }
    }, [errors]);

    // const handleManagerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    //     const {name, value} = e.target;
    //     setFormData((prevFormData) => ({
    //         ...prevFormData,
    //         manager: {
    //             ...prevFormData.manager,
    //             [name]: value
    //         }
    //     }));
    //     // Clear error when field is updated
    //     if (errors[`manager.${name}`]) {
    //         setErrors(prev => ({...prev, [`manager.${name}`]: undefined}));
    //     }
    // }, [errors]);

    const openManagerForm = () => {
        setManagerModalOpen(true);
    };

    const closeManagerForm = () => {
        setManagerModalOpen(false);
    };

    const handleSubmit = async () => {
        // Basic validation example
        const newErrors: Record<string, string> = {};

        if (!formData.label.trim()) {
            newErrors.label = "Le label est requis";
        }

        if (!formData.address.trim()) {
            newErrors.address = "L'adresse est requise";
        }

        if (!formData.city.trim()) {
            newErrors.city = "La ville est requise";
        }

        // Validation pour size seulement si trainingRoom est "Oui"
        if (formData.trainingRoom === "Oui" && !formData.size === undefined || formData.size === null) {
            newErrors.size = "La taille est requise pour une salle de formation";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Création d'une copie des données pour la soumission
        const submissionData = {...formData};


        // Proceed with form submission
        try {
            const url = isEditMode
                ? `${SITE_URLS.edit}/${formData.id}`
                : SITE_URLS.add;
            const method = isEditMode ? "PUT" : "POST";
            const result = await fetch(url, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            });

            if (!result.ok) {
                const errorData = await result.json();
                setErrors(errorData.message || "Erreur lors de l'ajout du site");
                return;
            }

            const json = await result.json();
            console.log("Success : ", json);
            await mutate(); // Rafraîchir les données après un ajout réussi
        } catch (error) {
            console.error("Erreur:", error);
        }

        console.log(submissionData);

        closeModal();
    };
    /******* End Add Site ******/

    /***** Start Edit Site ******/
    const handleEditSite = (row) => {
        setFormData({
            id: row.id,
            code: row.code,
            label: row.label,
            address: row.address,
            city: row.city,
            phone: row.phone,
            trainingRoom: row.trainingRoom,
            size: row.size,
            // manager: {
            //     firstName: "",
            //     lastName: "",
            //     job: "",
            //     email: "",
            //     phone: ""
            // }
        });
        setIsEditMode(true);
        setModalOpen(true);
    };
    /***** End Edit Site ******/

        // Déterminer si le champ Size doit être affiché
    const showSizeField = formData.trainingRoom === "Oui";

    return (
        <ProtectedRoute>
            <div>
                <div className="flex items-start gap-2 md:gap-8">
                    <SearchFilterAddBar
                        isLeftButtonVisible={false}
                        isFiltersVisible={false}
                        isRightButtonVisible={true}
                        leftTextButton="Filtrer les colonnes"
                        rightTextButton="Nouveau"
                        onRightButtonClick={openModal}
                        filters={[]}
                        placeholderText={"Recherche de sites"}
                    />
                    {/* Bouton pour afficher/masquer la fenêtre modale */}
                    <ModalButton
                        headers={TABLE_HEADERS}
                        visibleColumns={visibleColumns}
                        toggleColumnVisibility={toggleColumnVisibility}
                    />
                </div>

                {/* Tableau */}
                <Table
                    data={paginatedData}
                    keys={TABLE_KEYS}
                    headers={TABLE_HEADERS}
                    sortableCols={sortableColumns}
                    onSort={(column, order) => handleSortData(column, order, handleSort)}
                    isPagination={false}
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                    }}
                    totalRecords={totalRecords}
                    loading={false}
                    onAdd={() => console.log("Nouveau")}
                    visibleColumns={visibleColumns}
                    renderers={renderers}
                />

                {/* Add Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={isEditMode ? "Modification d'un site" : "Création d'un nouveau site"}
                    subtitle={"Veuillez remplir les champs ci-dessous"}
                    actions={[
                        {label: "Annuler", onClick: closeModal, className: "border"},
                        {
                            label: "Enregistrer",
                            onClick: handleSubmit,
                            className: "bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd text-white",
                        },
                    ]}
                    icon={undefined}
                >
                    <div className="space-y-6">
                        {/* Section Site */}
                        <div className="border rounded p-4">
                            <div className="bg-gray-100 px-2 py-1 mb-4 font-medium">Site</div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Label"
                                        name="label"
                                        value={formData.label}
                                        onChange={handleChange}
                                        error={errors.label}
                                    />
                                    <CustomSelect
                                        label="Salle de formation"
                                        name="trainingRoom"
                                        options={["Oui", "Non"]}
                                        value={formData.trainingRoom}
                                        onChange={handleSelectChange}
                                        error={errors.trainingRoom}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Adresse"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        error={errors.address}
                                    />
                                    {showSizeField && (
                                        <InputField
                                            label="Taille"
                                            name="size"
                                            value={formData.size}
                                            onChange={handleChange}
                                            error={errors.size}
                                        />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Ville"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        error={errors.city}
                                    />
                                    <InputField
                                        label="Téléphone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        error={errors.phone}
                                    />
                                </div>
                            </div>
                        </div>

                        {/*Section Manager*/}
                        {/*<div className="border rounded p-4">*/}
                        {/*    <div className="bg-gray-100 px-2 py-1 mb-4 font-medium">Manager</div>*/}
                        {/*    <div className="grid grid-cols-1 gap-4">*/}
                        {/*        <div className="grid grid-cols-2 gap-4">*/}
                        {/*            <InputField*/}
                        {/*                label="First Name"*/}
                        {/*                name="firstName"*/}
                        {/*                value={formData.manager.firstName}*/}
                        {/*                onChange={handleManagerChange}*/}
                        {/*                error={errors['manager.firstName']}*/}
                        {/*            />*/}
                        {/*            <InputField*/}
                        {/*                label="Email"*/}
                        {/*                name="email"*/}
                        {/*                type="email"*/}
                        {/*                value={formData.manager.email}*/}
                        {/*                onChange={handleManagerChange}*/}
                        {/*                error={errors['manager.email']}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*        <div className="grid grid-cols-2 gap-4">*/}
                        {/*            <InputField*/}
                        {/*                label="Last Name"*/}
                        {/*                name="lastName"*/}
                        {/*                value={formData.manager.lastName}*/}
                        {/*                onChange={handleManagerChange}*/}
                        {/*                error={errors['manager.lastName']}*/}
                        {/*            />*/}
                        {/*            <InputField*/}
                        {/*                label="Phone"*/}
                        {/*                name="phone"*/}
                        {/*                value={formData.manager.phone}*/}
                        {/*                onChange={handleManagerChange}*/}
                        {/*                error={errors['manager.phone']}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*        <div className="grid grid-cols-2 gap-4">*/}
                        {/*            <InputField*/}
                        {/*                label="Job"*/}
                        {/*                name="job"*/}
                        {/*                value={formData.manager.job}*/}
                        {/*                onChange={handleManagerChange}*/}
                        {/*                error={errors['manager.job']}*/}
                        {/*            />*/}
                        {/*            <div className="flex justify-end items-center">*/}
                        {/*                <button*/}
                        {/*                    className="flex items-center text-blue-500 hover:text-blue-700"*/}
                        {/*                    onClick={openManagerForm}*/}
                        {/*                    type="button"*/}
                        {/*                >*/}
                        {/*                    <div*/}
                        {/*                        className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">*/}
                        {/*                        <span>+</span>*/}
                        {/*                    </div>*/}
                        {/*                    Add new Manager*/}
                        {/*                </button>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                    </div>
                </Modal>
            </div>
        </ProtectedRoute>
    )
}

export default Site