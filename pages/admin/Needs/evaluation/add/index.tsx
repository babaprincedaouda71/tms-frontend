import React, {ChangeEvent, useEffect, useMemo, useState} from 'react';
import {
    DepartmentProps,
    EvaluationCampaignParticipantProps,
    NeedsEvaluationAddProps,
    QuestionnaireProps,
    SiteProps,
    UpdateCampaignProps
} from '@/types/dataTypes';
import useTable from "@/hooks/useTable";
import useSWR from "swr";
import {CAMPAIGN_URLS, DEPARTMENT_URLS, QUESTIONNAIRE_URLS, SITE_URLS, USERS_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import {useRouter} from 'next/router';
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import {UserRole} from "@/contexts/AuthContext";
import InputField from "@/components/FormComponents/InputField";
import MultiSelectField from "@/components/FormComponents/MultiselectField";
import TextAreaField from "@/components/FormComponents/TextAreaField";
import SearchFilterAddBar from "@/components/SearchFilterAddBar";
import ModalButton from "@/components/ModalButton";
import Table from "@/components/Tables/Table/index";
import {handleSort} from "@/utils/sortUtils";

const TABLE_HEADERS = ["Code", "Nom", "Prénoms", "Poste", "Niveau", "Manager", "Département", "Sélection"];
const TABLE_KEYS = ["code", "firstName", "lastName", "poste", "level", "manager", "department", "selection"];
const RECORDS_PER_PAGE = 10;

interface FormData {
    campaignTitle: string;
    instructions: string;
    site: number[];
    department: number[]; // Stocke les IDs des départements sélectionnés
    questionnaire: string[];
    participantIds: number[];
}

const Index = () => {
    const {navigateTo} = useRoleBasedNavigation();
    const {query} = useRouter();
    const campaignId = query.id as string | undefined;
    const isEditMode = !!campaignId;

    // États locaux
    const [formData, setFormData] = useState<FormData>({
        campaignTitle: "",
        instructions: "",
        site: [],
        department: [], // Stocke les IDs des départements sélectionnés
        questionnaire: [],
        participantIds: [],
    });
    const [errors, setErrors] = useState({});

    // Fetching des données nécessaires
    const {data: user} = useSWR<EvaluationCampaignParticipantProps[]>(USERS_URLS.fetchCampaignEvaluationParticipants, fetcher);
    // memoizedUserData contient la liste complète des utilisateurs non filtrée
    const memoizedUserData = useMemo(() => user || [], [user]);

    const {data: sitesData} = useSWR<SiteProps[]>(SITE_URLS.mutate, fetcher);
    const {data: departmentsData} = useSWR<DepartmentProps[]>(DEPARTMENT_URLS.mutate, fetcher); // Nous avons besoin de departmentsData
    const {data: questionnairesData} = useSWR<QuestionnaireProps[]>(QUESTIONNAIRE_URLS.mutate, fetcher);

    const {data: campaignData} = useSWR<UpdateCampaignProps>(
        isEditMode && campaignId ? `${CAMPAIGN_URLS.getDetails}/${campaignId}` : null,
        fetcher
    );

    // Pré-remplissage du formulaire en mode édition
    useEffect(() => {
        if (isEditMode && campaignData) {
            setFormData({
                campaignTitle: campaignData.title || "",
                instructions: campaignData.instructions || "",
                site: campaignData.siteIds || [],
                department: campaignData.departmentIds || [],
                questionnaire: campaignData.questionnaireIds || [],
                participantIds: campaignData.participantIds || [],
            });
        } else if (!isEditMode) {
            // Réinitialiser le formulaire en mode ajout si nécessaire
            setFormData({
                campaignTitle: "",
                instructions: "",
                site: [],
                department: [],
                questionnaire: [],
                participantIds: [],
            });
        }
    }, [isEditMode, campaignData]);

    // Formatage des options pour les Sélections Multiples
    const sitesOptionsFormatted = useMemo(() => {
        return sitesData ? sitesData.map(site => ({label: site.label, id: site.id})) : [];
    }, [sitesData]);

    const departmentsOptionsFormatted = useMemo(() => {
        return departmentsData ? departmentsData.map(dept => ({label: dept.name, id: dept.id})) : [];
    }, [departmentsData]);

    const questionnairesOptionsFormatted = useMemo(() => {
        return questionnairesData ? questionnairesData.map(questionnaire => ({
            label: questionnaire.title,
            id: questionnaire.id
        })) : [];
    }, [questionnairesData]);

    // **MODIFICATION : Filtrer les utilisateurs par département sélectionné (en utilisant les noms)**
    const filteredUsers = useMemo(() => {
        const selectedDepartmentIds = formData.department; // Tableau des IDs des départements sélectionnés

        // Si aucun département n'est sélectionné, retourner tous les utilisateurs
        if (!selectedDepartmentIds || selectedDepartmentIds.length === 0) {
            return memoizedUserData;
        }

        // Trouve les noms de départements correspondants aux IDs sélectionnés
        const selectedDepartmentNames = departmentsData
            ? departmentsData
                .filter(dept => selectedDepartmentIds.includes(dept.id))
                .map(dept => dept.name)
            : [];

        // Si on n'a pas pu trouver de noms de départements pour les IDs sélectionnés, ne rien afficher (ou afficher tous, selon le besoin)
        // Ici, on choisit de ne rien afficher si departmentsData n'est pas encore chargé ou si aucun nom correspondant n'est trouvé.
        if (selectedDepartmentNames.length === 0) {
            return memoizedUserData.length === 0 ? [] : memoizedUserData;
        }

        // Filtrer les utilisateurs dont le nom de département est dans la liste des noms sélectionnés
        return memoizedUserData.filter(user =>
            // On vérifie si user.department existe et s'il est inclus dans la liste des noms de départements sélectionnés
            user.department && selectedDepartmentNames.includes(user.department)
        );
    }, [memoizedUserData, formData.department, departmentsData]); // Dépendances : la liste complète des users, les départements sélectionnés (IDs), et la liste complète des départements (pour trouver les noms)

    // Configuration du tableau - utilise maintenant la liste filtrée
    const {
        visibleColumns,
        handleSortData,
        toggleColumnVisibility,
        totalRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedData,
        sortableColumns,
    } = useTable(
        filteredUsers,
        TABLE_HEADERS,
        TABLE_KEYS,
        RECORDS_PER_PAGE);

    // Gestion des changements dans les inputs
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setErrors(prevErrors => ({...prevErrors, [name]: ""}));
    };

    // Gestion du submit du formulaire
    const handleSubmit = () => {
        const dataToSend = {
            title: formData.campaignTitle,
            instructions: formData.instructions,
            siteIds: formData.site,
            departmentIds: formData.department,
            questionnaireIds: formData.questionnaire,
            participantIds: formData.participantIds,
        };

        const url = isEditMode ? `${CAMPAIGN_URLS.update}/${campaignId}` : CAMPAIGN_URLS.add;
        const method = isEditMode ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Succès:', data);
                navigateTo('/Needs/evaluation?tab=campaign');
            })
            .catch((error) => {
                console.error('Erreur:', error);
            });
    };

    // Rendu personnalisé pour la colonne de sélection
    const renderers = {
        selection: (_: string, row: NeedsEvaluationAddProps) => {
            const isSelected = formData.participantIds.includes(row.id);

            const handleCheckboxChange = () => {
                setFormData(prev => {
                    const newParticipantIds = [...prev.participantIds];
                    const index = newParticipantIds.indexOf(row.id);
                    if (isSelected) {
                        if (index > -1) {
                            newParticipantIds.splice(index, 1);
                        }
                    } else {
                        newParticipantIds.push(row.id);
                    }
                    return {...prev, participantIds: newParticipantIds};
                });
            };

            return (
                <div className="flex justify-center items-center">
                    <input
                        type="checkbox"
                        className="h-5 w-5 accent-primary"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        aria-label={`Sélectionner ${row.firstName} ${row.lastName}`}
                    />
                </div>
            );
        },
    };

    // Gestion des changements dans les MultiSelect
    const handleMultiSelectChange = (name: keyof FormData, selectedLabels: string[]) => {
        let selectedIds: (number | string)[] = [];
        switch (name) {
            case "site":
                selectedIds = selectedLabels
                    .map(label => sitesData?.find(site => site.label === label)?.id)
                    .filter((id): id is number => id !== undefined);
                break;
            case "department":
                selectedIds = selectedLabels
                    .map(label => departmentsData?.find(dept => dept.name === label)?.id)
                    .filter((id): id is number => id !== undefined);
                break;
            case "questionnaire":
                selectedIds = selectedLabels
                    .map(label => questionnairesData?.find(q => q.title === label)?.id)
                    .filter((id): id is string => id !== undefined);
                break;
            default:
                break;
        }
        setFormData(prev => ({
            ...prev,
            [name]: selectedIds.filter(id => typeof id === (name === 'questionnaire' ? 'string' : 'number')) as
                (typeof name extends 'questionnaire' ? string[] : number[]),
        }));
        setErrors(prevErrors => ({...prevErrors, [name]: ""}));
    };


    // Gestion du retour à la liste
    const handleBackToList = () => {
        navigateTo('/Needs/evaluation?tab=campaign');
    };

    const pageTitle = isEditMode ? "Modifier la Campagne d'évaluation" : "Nouvelle Campagne d'évaluation";
    const submitButtonText = isEditMode ? "Enregistrer les modifications" : "Enregistrer";

    return (
        <ProtectedRoute requiredRole={UserRole.Admin}>
            <div className='mx-auto bg-white font-title rounded-lg px-6 pb-2 pt-6'>
                {/* Titre global et bouton Retour */}
                <div className="relative flex items-center mb-4">
                    {/* Bouton Retour à la liste alignée à gauche */}
                    <button
                        onClick={handleBackToList}
                        className="text-blue-500 border-2 rounded-xl p-2 hover:underline focus:outline-none"
                    >
                        Retour à la liste
                    </button>

                    <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none">
                        <h1 className="text-2xl font-semibold text-gray-800 pointer-events-auto">
                            {pageTitle}
                        </h1>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24 mb-4">
                    <InputField
                        label="Titre de la campagne"
                        name="campaignTitle"
                        value={formData.campaignTitle}
                        onChange={handleInputChange}
                    />
                    <MultiSelectField
                        options={sitesOptionsFormatted.map(opt => opt.label)}
                        label="Site"
                        value={formData.site.map(id => sitesData?.find(s => s.id === id)?.label || '')}
                        onChange={(values) => handleMultiSelectChange("site", values)}
                    />
                    {/* Champ de sélection de Département */}
                    <MultiSelectField
                        options={departmentsOptionsFormatted.map(opt => opt.label)}
                        label="Département"
                        value={formData.department.map(id => departmentsData?.find(d => d.id === id)?.name || '')}
                        onChange={(values) => handleMultiSelectChange("department", values)}
                    />
                    <MultiSelectField
                        options={questionnairesOptionsFormatted.map(opt => opt.label)}
                        label="Questionnaire"
                        value={formData.questionnaire.map(id => questionnairesData?.find(q => q.id === id)?.title || '')}
                        onChange={(values) => handleMultiSelectChange("questionnaire", values)}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-x-20">
                    <TextAreaField
                        label="Instruction"
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleInputChange}
                        className=''
                    />
                </div>

                <div className="flex items-start gap-2 md:gap-8 mt-4">
                    <SearchFilterAddBar
                        isLeftButtonVisible={false}
                        isFiltersVisible={false}
                        isRightButtonVisible={false}
                        leftTextButton="Filtrer les colonnes"
                        rightTextButton="Nouvel"
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

                {/* Section : Tableau des données */}
                <Table
                    data={paginatedData} // Le tableau utilise toujours les données paginées et filtrées
                    keys={TABLE_KEYS}
                    headers={TABLE_HEADERS}
                    sortableCols={sortableColumns}
                    onSort={(column, order) => handleSortData(column, order, handleSort)}
                    totalRecords={totalRecords} // totalRecords est calculé sur les données filtrées
                    isPagination
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                    }}
                    visibleColumns={visibleColumns}
                    renderers={renderers}
                />

                {/* Section : Bouton d'action */}
                <div className="text-right text-xs md:text-sm lg:text-base">
                    <button
                        type="button"
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                        onClick={handleSubmit}
                    >
                        {submitButtonText}
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Index;