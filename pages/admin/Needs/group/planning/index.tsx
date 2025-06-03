import React, {ChangeEvent, useEffect, useMemo, useState} from 'react'
import MultipleInputField from "@/components/FormComponents/MultipleInputField";
import MultiSelectField from "@/components/FormComponents/MultiselectField";
import {NEEDS_GROUP_URLS, NEEDS_URLS} from '@/config/urls';
import {DepartmentProps, SiteProps} from '@/types/dataTypes';
import InputField from '@/components/FormComponents/InputField';
import {GroupData} from '../add-group';
import Alert from '@/components/Alert';
import {useRouter} from 'next/router';
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";

interface PlanningProps {
    groupId?: string | string[] | undefined;
    needId: string | string[] | undefined;
    siteData: SiteProps[] | undefined;
    departmentData: DepartmentProps[] | undefined;
    groupData?: GroupData; // Remplacez par le type approprié si nécessaire
    isEditMode?: boolean;
    onGroupDataUpdated: (newGroupData: GroupData) => void; // Updated prop
}

// Définis un type ou une interface pour l'objet errors
interface FormErrors {
    fromDate?: string;
    toDate?: string;
    fromMorning?: string;
    toMorning?: string;
    fromAfternoon?: string;
    toAfternoon?: string;
    general?: string;
    // Ajoute ici les autres champs pour lesquels tu pourrais avoir des erreurs
}

interface FormData {
    site: number[];
    department: number[];
    location: string;
    city: string;
    dates: string[]; // Liste de dates
}

const Planning: React.FC<PlanningProps> = ({
                                               groupId,
                                               needId,
                                               siteData,
                                               departmentData,
                                               groupData,
                                               isEditMode,
                                               onGroupDataUpdated
                                           }) => {
    const {navigateTo, isCurrentPath, getPathWithoutRolePrefix} = useRoleBasedNavigation();
    const router = useRouter();
    // etat pour gérer les alertes
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('success'); // Type de l'alerte

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage('');
    };

    const [formData, setFormData] = useState<FormData>(() => {
        // Initialiser avec les données du groupe si en mode édition
        return {
            site: [],
            department: [],
            location: "",
            city: "",
            dates: [],
        };
    });
    const sitesOptionsFormatted = useMemo(() => {
        if (siteData) {
            return siteData.map(site => ({label: site.label, id: site.id}));
        }
        return [];
    }, [siteData]);
    const departmentsOptionsFormatted = useMemo(() => {
        if (departmentData) {
            return departmentData.map(dept => ({label: dept.name, id: dept.id}));
        }
        return [];
    }, [departmentData]);


    useEffect(() => {
        if (needId) {
            const fetchNeedData = async () => {
                try {
                    const response = await fetch(NEEDS_URLS.getNeedForAddGroup + `/${needId}`, {
                        method: "GET",
                        credentials: "include",
                    });

                    if (!response.ok) {
                        throw new Error("Failed to fetch need data");
                    }

                    const needData = await response.json();

                    if (isEditMode || groupData) {
                        setFormData({
                            site: needData.site?.map(site => site.id) || [],
                            department: needData.department?.map(dept => dept.id) || [],
                            location: groupData.location || "",
                            city: groupData.city || "",
                            dates: groupData.dates || [""],
                        });
                    }
                    // Sinon, initialiser avec des valeurs par défaut
                    else {
                        setFormData({
                            site: needData.site?.map(site => site.id) || [],
                            department: needData.department?.map(dept => dept.id) || [],
                            location: "",
                            city: "",
                            dates: [], // Assurez-vous que c'est un tableau de chaînes

                        });
                    }

                } catch (error) {
                    console.error("Erreur lors de la récupération des données du besoin :", error);
                    // Gérer l'erreur ici, par exemple afficher un message à l'utilisateur
                }
            };

            fetchNeedData();
        }
    }, [needId]);
    const [formValues, setFormValues] = useState({
        fromDate: "", // Ajout pour la date unique ou la date de début
        toDate: "",   // Ajout pour la date de fin (si applicable)
        fromMorning: "",
        fromAfternoon: "",
        toMorning: "",
        toAfternoon: "",
    });

    const [errors, setErrors] = useState<FormErrors>({}); // Utilise le type FormErrors ici

    const handleChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues({...formValues, [name]: e.target.value});
        // Effacer l'erreur pour ce champ si elle existe
        setErrors(prevErrors => ({...prevErrors, [name]: ''}));
    };

    const handleChangeSelect = (event) => {
        const {name, value} = event;
        setFormValues(prevFormData => ({...prevFormData, [name]: value}));
        // Effacer l'erreur pour ce champ si elle existe
        setErrors(prevErrors => ({...prevErrors, [name]: ''}));
    };

    const handleMultiSelectChange = (name: keyof FormData, selectedLabels: string[]) => {
        let selectedIds: number[] = [];
        switch (name) {
            case "site":
                selectedIds = selectedLabels
                    .map(label => siteData?.find(site => site.label === label)?.id)
                    .filter((id): id is number => id !== undefined);
                break;
            case "department":
                selectedIds = selectedLabels
                    .map(name => departmentData?.find(dept => dept.name === name)?.id)
                    .filter((id): id is number => id !== undefined);
                break;
            default:
                break;
        }
        setFormData(prev => ({...prev, [name]: selectedIds}));
        setErrors(prevErrors => ({...prevErrors, [name]: ""}));
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        let newValue = value;
        if (name === "nbrGroup") {
            if (value === "0") {
                return;
            }
            const parsedValue = parseInt(value, 10);
            if (isNaN(parsedValue) || parsedValue < 1) {
                newValue = "1";
            } else {
                newValue = String(parsedValue);
            }
        } else if (name.startsWith("dates-")) {
            const index = parseInt(name.split("-")[1]);
            const newDates = [...formData.dates];
            newDates[index] = value;
            setFormData(prev => ({...prev, dates: newDates}));
            // Gérer les erreurs spécifiques aux dates si nécessaire
            return;
        }
        setFormData(prev => ({...prev, [name]: newValue}));
        setErrors(prevErrors => ({...prevErrors, [name]: ""}));
    };

    const addDate = () => {
        setFormData(prev => ({...prev, dates: [...prev.dates, '']}));
        // Réinitialiser les erreurs de date lors de l'ajout
        setErrors(prevErrors => ({...prevErrors, fromDate: undefined}));
    };

    const removeDate = (index: number) => {
        if (formData.dates.length > 1) {
            const newDates = [...formData.dates];
            newDates.splice(index, 1);
            setFormData(prev => ({...prev, dates: newDates}));
        }
    };

    /* const validateForm = () => {
        let isValid = true;
        const newErrors: FormErrors = {}; // Utilise le type FormErrors ici

        if (!formData.type) {
            newErrors.type = 'Le type de formation est obligatoire.';
            isValid = false;
        }
        if (!formValues.fromDate) {
            newErrors.fromDate = 'La date de début est obligatoire.';
            isValid = false;
        }
        if (!formValues.fromMorning || !formValues.toMorning) {
            newErrors.fromMorning = 'Les horaires du matin sont obligatoires.';
            newErrors.toMorning = 'Les horaires du matin sont obligatoires.';
            isValid = false;
        }
        // ... autres validations

        setErrors(newErrors);
        return isValid;
    }; */

    const handleSubmit = async () => {
        const sitesToSend = formData.site.map(id => {
            const site = siteData?.find(s => s.id === id);
            return site ? {id: site.id, label: site.label} : null;
        }).filter((site): site is { id: number; label: string } => site !== null);

        const departmentsToSend = formData.department.map(id => {
            const dept = departmentData?.find(d => d.id === id);
            return dept ? {id: dept.id, name: dept.name} : null;
        }).filter((dept): dept is { id: number; name: string } => dept !== null);

        const payload = {
            site: sitesToSend,
            department: departmentsToSend,
            location: formData.location,
            city: formData.city,
            dates: formData.dates,
            morningStartTime: formValues.fromMorning,
            morningEndTime: formValues.toMorning,
            afternoonStartTime: formValues.fromAfternoon,
            afternoonEndTime: formValues.toAfternoon,
        }
        console.log("Payload à envoyer :", payload);

        try {
            console.log("Is edit mode:", isEditMode);
            const url = groupData
                ? `${NEEDS_GROUP_URLS.editGroupPlanning}/${groupData.id}`
                : `${NEEDS_GROUP_URLS.addGroupPlanning}/${needId}`;
            const response = await fetch(url, { // Remplace '/api/groupes' par l'URL de ton API
                method: groupData ? 'PUT' : 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Gérer le succès (redirection, message, etc.)
                console.log('Groupe enregistré avec succès !');
                const responseData: GroupData = await response.json(); // Type assertion
                onGroupDataUpdated(responseData); // Calling the prop function with the response data
                // Afficher l'alerte de succès
                setAlertMessage('Mise à jour effectuée avec succès !');
                setAlertType('success');
                setShowAlert(true);

                navigateTo(NEEDS_GROUP_URLS.addPage, {
                    query: {needId: needId, groupId: responseData.id},
                });
            } else {
                // Gérer les erreurs de l'API
                const errorData = await response.json();
                console.error('Erreur lors de l\'enregistrement du groupe:', errorData);
                setErrors(errorData.errors || {general: 'Une erreur est survenue lors de l\'enregistrement.'}); // Adapter en fonction de la structure de l'erreur de l'API
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la requête:', error);
            setErrors({general: 'Erreur de connexion au serveur.'});
        }

    };

    return (
        <form onSubmit={(e) => e.preventDefault()}> {/* Empêcher la soumission par défaut du formulaire */}
            {showAlert && (
                <Alert
                    message={alertMessage}
                    type={alertType}
                    onClose={handleCloseAlert}
                />
            )}
            <div className='grid md:grid-cols-2 md:gap-10 gap-4'>
                <MultiSelectField
                    options={sitesOptionsFormatted.map(opt => opt.label)}
                    label="Site"
                    value={formData.site.map(id => siteData?.find(s => s.id === id)?.label || '')}
                    onChange={(values) => handleMultiSelectChange("site", values)}
                />
                <MultiSelectField
                    options={departmentsOptionsFormatted.map(opt => opt.label)}
                    label="Département"
                    value={formData.department.map(id => departmentData?.find(d => d.id === id)?.name || '')}
                    onChange={(values) => handleMultiSelectChange("department", values)}
                />
                <InputField
                    label="Lieu"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                />
                <InputField
                    label="Ville"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                />
                {/* Champ pour la date */}
                <div className="md:col-span-1">
                    <div className="flex justify-between items-center mb-2">
                        <label
                            className="block break-words font-tHead text-formInputTextColor font-semibold text-xs md:text-sm lg:text-base">
                            Date(s)
                        </label>
                        <button
                            type="button"
                            onClick={addDate}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm focus:outline-none focus:shadow-outline"
                        >
                            +
                        </button>
                    </div>
                    <div>
                        {formData.dates.map((date, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <InputField
                                    label=""
                                    name={`dates-${index}`}
                                    type="date"
                                    value={date}
                                    onChange={handleInputChange}
                                    className="flex-grow"
                                    error={errors.fromDate?.[index]}
                                />
                                {formData.dates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDate(index)}
                                        className="bg-red hover:bg-red-700 text-white font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        -
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <MultipleInputField
                    label="Horaires"
                    fromFields={[
                        {
                            label: "De",
                            name: "fromMorning",
                            type: "time",
                            value: formValues.fromMorning,
                            onChange: handleChange("fromMorning"),
                        },
                        {
                            label: "De",
                            name: "fromAfternoon",
                            type: "time",
                            value: formValues.fromAfternoon,
                            onChange: handleChange("fromAfternoon"),
                        }
                    ]}
                    toFields={[
                        {
                            label: "À",
                            name: "toMorning",
                            type: "time",
                            value: formValues.toMorning,
                            onChange: handleChange("toMorning"),
                        },
                        {
                            label: "À",
                            name: "toAfternoon",
                            type: "time",
                            value: formValues.toAfternoon,
                            onChange: handleChange("toAfternoon"),
                        }
                    ]}
                    errorFrom={errors.fromMorning}
                    errorTo={errors.toMorning}
                />
            </div>
            {/* Affichage des erreurs générales */}
            {errors.general && (
                <div className="text-red-500 mt-2">{errors.general}</div>
            )}
            {/* Bouton Enregistrer */}
            <div className="flex justify-end mt-4">
                <button
                    type='submit' // Changer le type en 'submit' pour utiliser l'événement onSubmit du formulaire
                    className="px-6 py-2 bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd text-white rounded-md hover:bg-violet-700 transition-colors"
                    onClick={handleSubmit} // Appeler la fonction handleSubmit au clic
                >
                    Enregistrer
                </button>
            </div>
        </form>
    )
}

export default Planning