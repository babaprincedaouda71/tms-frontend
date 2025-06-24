import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import TextAreaField from "@/components/FormComponents/TextAreaField";
import Switch from "@/components/FormComponents/Switch";
import Table from "@/components/Tables/Table/index";
import ModalButton from "@/components/ModalButton";
import SearchFilterAddBar from "@/components/SearchFilterAddBar";
import StatusRenderer from "@/components/Tables/StatusRenderer";
import {useRouter} from "next/router";
import PlusIcon from "@/components/Svgs/PlusIcon";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import {handleSort} from "@/utils/sortUtils";
import {statusConfig} from "@/config/tableConfig";
import useTable from "@/hooks/useTable";
import DynamicActionsRenderer from "@/components/Tables/DynamicActionsRenderer";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import {TRAINING_URLS} from "@/config/urls";
import InputField from "@/components/FormComponents/InputField";

interface FormData {
    domain: number | null; // Pourrait être string | number | undefined selon InputField
    theme: string;
    objective: string;
    content: string;
    csf: boolean;
    csfPlanifie: string;
    comment?: string; // Ajout du champ commentaire à l'interface
}

interface GroupData {
    id: number;
    name: string;
    dates: string | null; // Date au format ISO
    startDate: string | null;
    participantCount: number;
    dayCount: number;
    price: number;
    trainerName: string | null;
    status: string; // Correspond à GroupeStatusEnums côté backend
}

const TABLE_HEADERS = [
    "Groupe",
    "Date",
    "Éffectif",
    "Nbr de jours",
    "Coût",
    "Fournisseur",
    "Statut",
    "Actions",
];
const TABLE_KEYS = [
    "name",
    "dates",
    "participantCount",
    "dayCount",
    "price",
    "trainerName",
    "status",
    "actions",
];

const ACTIONS_TO_SHOW = ["edit", "delete"];
const RECORDS_PER_PAGE = 4;

const TrainingDetailsPage = () => {
    const {navigateTo, isCurrentPath, getPathWithoutRolePrefix, buildRoleBasedPath} = useRoleBasedNavigation();
    const router = useRouter();
    // Récupérer le thème depuis la navigation
    const {id, exercice, theme} = router.query;
    console.log("ID : ", id, "Exercice : ", exercice, "Theme : ", theme);

    // État pour stocker les données du formulaire
    const [formData, setFormData] = useState<FormData>({
        domain: null,
        theme: "",
        objective: "",
        content: "",
        csf: false,
        csfPlanifie: '',
        comment: '',
    });

    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchTrainingData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(TRAINING_URLS.getDetails + `/${id}`, {
                        method: "GET",
                        credentials: "include",
                    });

                    if (!response.ok) {
                        throw new Error(`Erreur lors de la récupération des données : ${response.status}`);
                    }

                    const trainingData = await response.json();
                    console.log(trainingData);

                    setFormData({
                        domain: trainingData.domain || null,
                        theme: trainingData.theme || "",
                        objective: trainingData.objective || "",
                        content: trainingData.content || "",
                        csf: trainingData.csf === true || trainingData.csf === 'true',
                        csfPlanifie: trainingData.csfPlanifie || '',
                        comment: trainingData.comment || '',
                    });

                    // Extraction des données des groupes
                    if (trainingData.groups && Array.isArray(trainingData.groups)) {
                        console.log("groupes");
                        setGroupData(trainingData.groups);
                    } else {
                        setGroupData([]); // S'assurer que l'état est un tableau même si l'API ne renvoie rien
                        console.warn("Les données des groupes sont absentes ou dans un format incorrect.");
                    }

                } catch (err) {
                    console.error("Erreur lors de la récupération des données du besoin :", err);
                    setError("Une erreur est survenue lors du chargement des détails du besoin.");
                } finally {
                    setLoading(false);
                }
            };

            fetchTrainingData();
        }
    }, [id]);

    const handleGroupDelete = (groupId: number) => {
        setGroupData((prevData) => prevData.filter((group) => group.id !== groupId));
    };

    const memoizedGroupData = useMemo(() => groupData || [], [groupData]);
    const {
        currentPage,
        visibleColumns,
        setCurrentPage,
        handleSortData,
        toggleColumnVisibility,
        totalPages,
        totalRecords,
        paginatedData,
        sortableColumns,
    } = useTable(
        memoizedGroupData,
        TABLE_HEADERS,
        TABLE_KEYS,
        RECORDS_PER_PAGE,
    );

    const handleSwitchChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            csf: checked,
            csfPlanifie: checked ? prev.csfPlanifie : "", // Reset la valeur si désactivé
        }));
    };

    // Fonction pour gérer les changements dans les champs du formulaire
    const handleChange = (event) => {
        const {name, value} = event;

        // Mettre à jour l'état formData avec la nouvelle valeur
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };
    // Composant SelectField pour CSF Planifié
    const planifieSelect = formData.csf ? (
        <InputField
            label={""}
            name="csfPlanifie"
            value={formData.csfPlanifie}
            disabled={true}
        />
    ) : null;

    // Gestionnaire de clic pour la colonne Groupe
    const handleGroupClick = (_: string, row: any) => {
        // Utiliser la même logique que customEditHandler
        navigateTo(buildRoleBasedPath("/Plan/annual/add-group"), {
            query: {
                trainingId: id,
                groupId: row.id,
            }
        });
    };

    // Configuration des colonnes cliquables
    const columnConfigs = {
        name: {
            onClick: handleGroupClick,
            className: "hover:underline cursor-pointer",
        },
    };

    const renderers = {
        name: (value: string, row: any) => (
            <div
                onClick={() => columnConfigs.name.onClick(value, row)}
                className={columnConfigs.name.className}
            >
                {value}
            </div>
        ),
        status: (value: string, row: GroupData) => (
            <StatusRenderer
                value={value}
                groupeConfig={statusConfig}
                row={row}
                statusOptions={["Brouillon", "Validé"]}
            />
        ),
        actions: (_: any, row: GroupData) => (
            <DynamicActionsRenderer
                actions={ACTIONS_TO_SHOW}
                row={row}
                onDeleteSuccess={handleGroupDelete}
                editUrl={TRAINING_URLS.addPage}
                customEditHandler={(row) => {
                    navigateTo(buildRoleBasedPath("/Plan/annual/add-group"), {
                        query: {
                            trainingId: id,
                            groupId: row.id,
                        }
                    });
                }}
            />
        )
    };

    // Gestion de la modification du champ Commentaire (si vous souhaitez l'activer)
    const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setFormData({...formData, comment: event.target.value});
    };

    const handleAddGroup = () => {
        navigateTo(buildRoleBasedPath("/Plan/annual/add-group"), {
            query: {
                trainingId: id,
            }
        });
    }

    return (
        <div className="bg-white rounded-xl">
            {/* Barre de navigation */}
            <BreadcrumbNav/>
            <div className="mx-auto bg-white font-title rounded-lg px-6 pb-14 pt-16">
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24 mb-4">
                    <InputField
                        label={"Domaine"}
                        name={"domain"}
                        value={formData.domain}
                        disabled={true}
                    />
                    <InputField
                        label={"Thème"}
                        value={formData.theme}
                        name={"theme"}
                        disabled={true}
                    />
                    <TextAreaField
                        label={"Objectif"}
                        value={formData.objective}
                        name={"objective"}
                        onChange={(e) => setFormData({...formData, objective: e.target.value})}

                    />
                    <TextAreaField
                        label={"Commentaire"}
                        value={formData.comment}
                        name={"comment"}
                        onChange={handleCommentChange}
                    />
                    <TextAreaField
                        label={"Contenu"}
                        value={formData.content}
                        name={"content"}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                    />
                    <Switch
                        label="CSF"
                        name="csf"
                        checked={formData.csf}
                        planifieField={planifieSelect}
                        onChange={() => {
                            // Empêche le changement d'état, donc le switch ne se togglera pas.
                            console.log("Le changement du switch CSF est désactivé.");
                        }}
                    />
                </div>

                {/* Tableau */}
                <div className="font-title text-xs md:text-sm lg:text-base bg-white rounded-xl pt-6">
                    <div className="flex items-start gap-2 md:gap-8 mb-4">
                        <SearchFilterAddBar
                            isLeftButtonVisible={false}
                            isFiltersVisible={false}
                            isRightButtonVisible={false}
                            leftTextButton="Filtrer les colonnes"
                            rightTextButton="Nouvelle"
                            onRightButtonClick={() => null}
                            filters={[]}
                            placeholderText={"Recherche de besoins"}
                        />
                        {/* Bouton pour afficher/masquer la fenêtre modale */}
                        <ModalButton
                            headers={TABLE_HEADERS}
                            visibleColumns={visibleColumns}
                            toggleColumnVisibility={toggleColumnVisibility}
                        />
                    </div>

                    {/* Conteneur du tableau avec overflow visible pour les dropdowns */}
                    <div className="overflow-visible relative">
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
                    </div>

                    {/* Bouton avec un meilleur espacement */}
                    <div className="mt-6 pl-8 text-xs md:text-sm lg:text-base">
                        <button
                            className="flex items-center font-title justify-center text-white bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd rounded-lg p-2 text-sm md:text-base md:px-4 md:py-3 hover:shadow-lg transition-shadow duration-200"
                            onClick={handleAddGroup}
                        >
                            <PlusIcon/>
                            <span className="hidden sm:block ml-2">Nouveau Groupe</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingDetailsPage;