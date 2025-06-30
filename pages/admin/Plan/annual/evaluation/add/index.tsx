import CustomSelect from '@/components/FormComponents/CustomSelect'
import InputField from '@/components/FormComponents/InputField'
import Table from '@/components/Tables/Table/index'
import React, {useCallback, useMemo, useState} from 'react'
import {QuestionnaireProps} from '@/types/dataTypes'
import {handleSort} from '@/utils/sortUtils'
import useTable from '@/hooks/useTable'
import useSWR from "swr";
import {GROUPE_EVALUATION_URLS, QUESTIONNAIRE_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import {useRouter} from "next/router";

interface ParticipantProps {
    id: number;
    firstName: string;
    lastName: string;
}

interface FormData {
    label: string;
    questionnaireId: string;
    participantIds: number[];
}

interface FormErrors {
    label?: string;
    questionnaireId?: string;
    participantIds?: string;
}

const TABLE_HEADERS = [
    "Nom",
    "Prénoms",
    "Sélection",
];

const TABLE_KEYS = [
    "firstName",
    "lastName",
    "select",
];

const RECORDS_PER_PAGE = 4;

const EvaluationForm = ({onClick}) => {
    const router = useRouter();
    const {trainingId, groupId} = router.query;

    // États du formulaire
    const [formData, setFormData] = useState<FormData>({
        label: "",
        questionnaireId: "",
        participantIds: [],
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());

    // Récupération des données des questionnaires
    const {data: questionnairesData, error: questionnairesError} = useSWR<QuestionnaireProps[]>(
        QUESTIONNAIRE_URLS.mutate,
        fetcher
    );

    const questionnairesOptionsFormatted = useMemo(() => {
        return questionnairesData ? questionnairesData.map(questionnaire => ({
            label: questionnaire.title,
            value: questionnaire.id.toString()
        })) : [];
    }, [questionnairesData]);

    // Récupération des données des participants
    const {
        data: participantsData,
        error: participantsError,
        mutate
    } = useSWR<ParticipantProps[]>(
        GROUPE_EVALUATION_URLS.fetchParticipants + `/${trainingId}/${groupId}`,
        fetcher
    );

    const memorizedData = useMemo(() => participantsData || [], [participantsData]);
    const {
        visibleColumns,
        handleSortData,
        totalRecords,
        sortableColumns,
        paginatedData,
    } = useTable(memorizedData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE);

    // Validation du formulaire
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        // Validation du label
        if (!formData.label.trim()) {
            newErrors.label = "Le label est obligatoire";
        } else if (formData.label.trim().length < 3) {
            newErrors.label = "Le label doit contenir au moins 3 caractères";
        } else if (formData.label.trim().length > 100) {
            newErrors.label = "Le label ne peut pas dépasser 100 caractères";
        }

        // Validation du questionnaire
        if (!formData.questionnaireId) {
            newErrors.questionnaireId = "Veuillez sélectionner un questionnaire";
        }

        // Validation des participants
        if (selectedParticipants.size === 0) {
            newErrors.participantIds = "Veuillez sélectionner au moins un participant";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, selectedParticipants]);

    // Gestion des changements dans les champs du formulaire
    const handleChange = useCallback((event: { name: string; value: string }) => {
        const {name, value} = event;

        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value,
        }));

        // Effacer l'erreur du champ modifié
        if (errors[name as keyof FormErrors]) {
            setErrors(prevErrors => ({
                ...prevErrors,
                [name]: undefined,
            }));
        }
    }, [errors]);

    // Gestion de la sélection des participants
    const handleParticipantToggle = useCallback((participant: ParticipantProps) => {
        setSelectedParticipants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(participant.id)) {
                newSet.delete(participant.id);
            } else {
                newSet.add(participant.id);
            }

            // Mettre à jour formData
            setFormData(prevData => ({
                ...prevData,
                participantIds: Array.from(newSet)
            }));

            // Effacer l'erreur de sélection si des participants sont sélectionnés
            if (newSet.size > 0 && errors.participantIds) {
                setErrors(prev => ({
                    ...prev,
                    participantIds: undefined
                }));
            }

            return newSet;
        });
    }, [errors.participantIds]);

    // Sélectionner/désélectionner tous les participants
    const handleSelectAll = useCallback(() => {
        const allIds = memorizedData.map(p => p.id);
        const allSelected = allIds.every(id => selectedParticipants.has(id));

        if (allSelected) {
            setSelectedParticipants(new Set());
            setFormData(prev => ({...prev, participantIds: []}));
        } else {
            setSelectedParticipants(new Set(allIds));
            setFormData(prev => ({...prev, participantIds: allIds}));
        }
    }, [memorizedData, selectedParticipants]);

    // Soumission du formulaire
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                label: formData.label.trim(),
                questionnaireId: formData.questionnaireId,
                participantIds: Array.from(selectedParticipants)
            };

            const response = await fetch(
                `${GROUPE_EVALUATION_URLS.add}/${trainingId}/${groupId}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                throw new Error('Erreur lors de la création de l\'évaluation');
            }

            await mutate(); // Rafraîchir les données
            onClick(); // Fermer le formulaire

        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            alert("Erreur lors de la création de l'évaluation");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, selectedParticipants, validateForm, groupId, onClick, mutate]);

    // Renderers pour le tableau
    const renderers = {
        select: (_: string, row: ParticipantProps) => (
            <div className="flex justify-center items-center">
                <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary cursor-pointer"
                    checked={selectedParticipants.has(row.id)}
                    onChange={() => handleParticipantToggle(row)}
                    aria-label={`Sélectionner ${row.firstName} ${row.lastName}`}
                />
            </div>
        ),
    };

    // Gestion des états de chargement et d'erreur
    if (questionnairesError || participantsError) {
        return (
            <div className="text-center p-4 text-red-500">
                Erreur lors du chargement des données. Veuillez réessayer.
            </div>
        );
    }

    if (!questionnairesData || !participantsData) {
        return (
            <div className="text-center p-4">
                Chargement...
            </div>
        );
    }

    return (
        <form className='flex flex-col gap-4' onSubmit={(e) => e.preventDefault()}>
            {/* Champ Label */}
            <InputField
                label="Label"
                name='label'
                value={formData.label}
                onChange={(e) => handleChange({name: 'label', value: e.target.value})}
                error={errors.label}
            />

            {/* Sélection du questionnaire */}
            <div className='flex items-center gap-4'>
                <CustomSelect
                    name='questionnaireId'
                    label='Type de questionnaire *'
                    options={questionnairesOptionsFormatted.map(opt => opt.label)}
                    value={questionnairesOptionsFormatted.find(opt => opt.value === formData.questionnaireId)?.label || ''}
                    onChange={(event) => {
                        const selectedOption = questionnairesOptionsFormatted.find(opt => opt.label === event.value);
                        if (selectedOption) {
                            handleChange({name: 'questionnaireId', value: selectedOption.value});
                        }
                    }}
                    error={errors.questionnaireId}
                />
                <img src='/images/view_eval.svg' alt="Voir l'évaluation" className="cursor-pointer"/>
            </div>

            {/* Section participants */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-formInputTextColor">
                        Sélection des participants *
                        ({selectedParticipants.size} sélectionné{selectedParticipants.size > 1 ? 's' : ''})
                    </h3>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-sm text-primary hover:underline"
                    >
                        {memorizedData.every(p => selectedParticipants.has(p.id)) ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                </div>

                {errors.participantIds && (
                    <p className="text-sm text-red-500">{errors.participantIds}</p>
                )}

                <Table
                    data={paginatedData}
                    keys={TABLE_KEYS}
                    headers={TABLE_HEADERS}
                    sortableCols={sortableColumns}
                    onSort={(column, order) => handleSortData(column, order, handleSort)}
                    isPagination={false}
                    totalRecords={totalRecords}
                    loading={false}
                    onAdd={() => null}
                    visibleColumns={visibleColumns}
                    renderers={renderers}
                />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-between text-xs md:text-sm lg:text-base pt-4">
                <button
                    type='button'
                    className='border border-gray-300 p-2 md:p-3 lg:p-4 rounded-xl hover:bg-gray-50 transition-colors'
                    onClick={onClick}
                    disabled={isSubmitting}
                >
                    Annuler
                </button>
                <button
                    type="button"
                    className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedParticipants.size === 0}
                >
                    {isSubmitting ? 'Création...' : 'Valider'}
                </button>
            </div>
        </form>
    );
};

export default EvaluationForm;