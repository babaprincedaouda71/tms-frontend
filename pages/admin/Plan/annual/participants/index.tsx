import React, {useEffect, useState} from 'react'; // Import useEffect
import {UserProps} from '@/types/dataTypes';
import useSWR from "swr";

// Components
import InputField from '@/components/FormComponents/InputField';
import Table from '@/components/Tables/Table/index';
import StatusRenderer from '@/components/Tables/StatusRenderer';
import {handleSort} from '@/utils/sortUtils';
import {statusConfig} from '@/config/tableConfig';
import DynamicActionsRenderer from '@/components/Tables/DynamicActionsRenderer';
import {NEEDS_GROUP_URLS, TRAINING_GROUPE_URLS, TRAINING_URLS, USERS_URLS} from '@/config/urls';
import {fetcher} from '@/services/api';
import useTable from '@/hooks/useTable';
import Alert from '@/components/Alert';
import {useRouter} from 'next/router';
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";

const TABLE_HEADERS_1 = ["Code", "Nom", "Prénoms", "Poste", "Niveau", "Manager", "Sélection"];
const TABLE_HEADERS_2 = ["Nom", "Prénoms", "CIN", "CNSS", "Statut", "Actions"];
const TABLE_KEYS_1 = ["code", "firstName", "lastName", "position", "level", "manager", "selection"];
const TABLE_KEYS_2 = ["firstName", "lastName", "cin", "cnss", "status", "actions"];

const ACTIONS_TO_SHOW = ["cancel"];
const RECORDS_PER_PAGE = 5;

// Définir une interface pour les données du groupe, incluant les IDs des utilisateurs sélectionnés
interface GroupData {
    id?: number; // ID du groupe si en mode édition
    targetAudience: string;
    managerCount: number;
    employeeCount: number;
    workerCount: number;
    temporaryWorkerCount: number;
    userGroupIds: number[]; // Assumant que les IDs sont des nombres
    // Ajoutez d'autres propriétés du groupe si nécessaire
}

interface ParticipantsProps {
    trainingId: string | string[] | undefined; // ID du besoin, requis pour l'ajou
    groupData?: GroupData; // Rendre groupData optionnel
    onGroupDataUpdated: (newGroupData: GroupData) => void; // Updated prop
}

const Participants = ({trainingId, groupData, onGroupDataUpdated}: ParticipantsProps) => {
    const {navigateTo} = useRoleBasedNavigation();
    // état pour gérer les alertes
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('success'); // Type de l'alerte

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage('');
    };
    // form data
    const [formData, setFormData] = useState({
        targetAudience: '',
        staff: 0,
        managerCount: 0,
        employeeCount: 0,
        workerCount: 0,
        temporaryWorkerCount: 0,
    });

    // État pour gérer l'erreur de validation de l'effectif
    const [staffError, setStaffError] = useState('');

    // Data and State
    const {
        data: initialUsersData,
        error: initialUsersError,
        isLoading: initialUsersLoading
    } = useSWR<UserProps[]>(USERS_URLS.mutate, fetcher); // Ajoutez error et isLoading pour une meilleure gestion
    const [users, setUsers] = useState<UserProps[]>([]); // Utilisateurs disponibles à sélectionner
    const [selectedUsers, setSelectedUsers] = useState<UserProps[]>([]); // Utilisateurs déjà sélectionnés pour le groupe
    const [tempSelectedUsers, setTempSelectedUsers] = useState<Set<string>>(new Set()); // Pour suivre les sélections temporaires dans la première table

    // --- Nouvel useEffect pour charger les données en mode édition ou initialiser en mode ajout ---
    useEffect(() => {
        // Assurez-vous que les données initiales des utilisateurs sont chargées
        if (initialUsersData) {
            if (groupData) {
                // --- Mode Édition ---
                console.log("Mode Édition: Chargement des données du groupe", groupData);

                // Charger les données du groupe dans le formulaire
                setFormData({
                    targetAudience: groupData.targetAudience || '', // Utiliser || '' pour éviter undefined
                    managerCount: groupData.managerCount || 0,
                    employeeCount: groupData.employeeCount || 0,
                    workerCount: groupData.workerCount || 0,
                    temporaryWorkerCount: groupData.temporaryWorkerCount || 0,
                    staff: groupData.managerCount + groupData.employeeCount + groupData.workerCount + groupData.temporaryWorkerCount || 0,

                });

                // Identifier les IDs des utilisateurs sélectionnés dans le groupe
                const selectedIds = new Set((groupData.userGroupIds || []).map(id => id));

                // Partitionner initialUsersData en utilisateurs sélectionnés et non sélectionnés
                const usersForEdit = initialUsersData.filter(user => !selectedIds.has(user.id));
                const selectedUsersForEdit = initialUsersData.filter(user => selectedIds.has(user.id));

                setUsers(usersForEdit); // Les autres utilisateurs disponibles
                setSelectedUsers(selectedUsersForEdit); // Les utilisateurs déjà dans le groupe

                // Valider l'effectif chargé
                const sumLoadedCounts = (groupData.managerCount || 0) + (groupData.employeeCount || 0) + (groupData.workerCount || 0) + (groupData.temporaryWorkerCount || 0);
                if (formData.staff !== 0 && sumLoadedCounts !== formData.staff) {
                    setStaffError('La somme des effectifs chargés (' + sumLoadedCounts + ') ne correspond pas à l\'effectif total chargé (' + formData.staff + ').');
                } else {
                    setStaffError('');
                }


            } else {
                // --- Mode Ajout ---
                console.log("Mode Ajout: Initialisation avec tous les utilisateurs");
                setUsers(initialUsersData); // Tous les utilisateurs sont disponibles pour l'ajout
                setSelectedUsers([]); // Aucun utilisateur n'est sélectionné au départ
                setFormData({ // Réinitialiser le formulaire en mode ajout si groupData devient null/undefined
                    targetAudience: '',
                    staff: 0,
                    managerCount: 0,
                    employeeCount: 0,
                    workerCount: 0,
                    temporaryWorkerCount: 0,
                });
                setStaffError(''); // Réinitialiser l'erreur en mode ajout
            }
        } else if (initialUsersError) {
            console.error("Erreur lors du chargement des utilisateurs initiaux:", initialUsersError);
            // Gérer l'erreur de chargement (afficher un message, etc.)
        }

    }, [groupData, initialUsersData, initialUsersError]); // Dépend des données du groupe et des utilisateurs initiaux

    // --- Le useMemo précédent pour initialiser users est supprimé car géré par useEffect ---

    // Hooks useTable restent les mêmes
    const {
        currentPage: currentPageUsers,
        visibleColumns: visibleColumnsUsers,
        setCurrentPage: setCurrentPageUsers,
        handleSortData: handleSortDataUsers,
        totalPages: totalPagesUsers,
        totalRecords: totalRecordsUsers,
        paginatedData: paginatedUsersData,
        sortableColumns: sortableColumnsUsers,
    } = useTable(
        users, // Utilise l'état 'users' géré par useEffect
        TABLE_HEADERS_1,
        TABLE_KEYS_1,
        RECORDS_PER_PAGE,
    );

    const {
        currentPage: currentPageSelected,
        visibleColumns: visibleColumnsSelected,
        setCurrentPage: setCurrentPageSelected,
        handleSortData: handleSortDataSelected,
        totalPages: totalPagesSelected,
        totalRecords: totalRecordsSelected,
        paginatedData: paginatedSelectedUsersData,
        sortableColumns: sortableColumnsSelected,
    } = useTable(
        selectedUsers, // Utilise l'état 'selectedUsers' géré par useEffect
        TABLE_HEADERS_2,
        TABLE_KEYS_2,
        RECORDS_PER_PAGE,
    );

    // Renderers restent les mêmes
    const renderers1 = {
        selection: (_: string, row: UserProps) => (
            <div className="flex justify-center items-center">
                <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={tempSelectedUsers.has(row.id.toString())}
                    onChange={(e) => {
                        const newTempSelectedUsers = new Set(tempSelectedUsers);
                        if (e.target.checked) {
                            newTempSelectedUsers.add(row.id.toString());
                        } else {
                            newTempSelectedUsers.delete(row.id.toString());
                        }
                        setTempSelectedUsers(newTempSelectedUsers);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Sélectionner ${row.firstName + ' ' + row.lastName}`}
                />
            </div>
        ),
    };

    const handleAddToSelected = () => {
        const usersToAdd = users.filter(user => tempSelectedUsers.has(user.id.toString()));
        if (usersToAdd.length > 0) {
            // Ajouter les utilisateurs sélectionnés à la liste des sélectionnés
            setSelectedUsers([...selectedUsers, ...usersToAdd]);
            // Retirer les utilisateurs sélectionnés de la liste des utilisateurs disponibles
            setUsers(users.filter(user => !tempSelectedUsers.has(user.id.toString())));
            // Réinitialiser les sélections temporaires
            setTempSelectedUsers(new Set());
        }
    };

    const handleCancelSelected = (userToRemove: UserProps) => {
        // Retirer l'utilisateur de la liste des sélectionnés
        setSelectedUsers(selectedUsers.filter(user => user.id !== userToRemove.id));
        // Ajouter l'utilisateur à la liste des utilisateurs disponibles
        setUsers([...users, userToRemove]);
        // S'assurer qu'il n'est pas dans les sélections temporaires (si jamais il y était)
        setTempSelectedUsers(prev => {
            const next = new Set(prev);
            next.delete(userToRemove.id.toString());
            return next;
        });
    };

    const renderers2 = {
        status: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
        actions: (_: any, row: UserProps) => (
            <DynamicActionsRenderer
                actions={ACTIONS_TO_SHOW}
                row={row}
                openCancelModal={() => handleCancelSelected(row)}
            />
        ),
    };

    // La logique de validation de l'effectif reste la même, mais s'applique aux valeurs de formData
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        let newValue;
        if (name === 'staff' || name.endsWith('Count')) {
            // Permettre la saisie de chaînes vides pour pouvoir effacer le champ
            newValue = value === '' ? '' : parseInt(value, 10) || 0;
        } else {
            newValue = value;
        }
        // Utiliser une fonction pour s'assurer d'avoir le dernier état pour la validation
        setFormData(prev => {
            const nextFormData = {...prev, [name]: newValue};
            // Validation en temps réel
            if (name === 'staff' || name.endsWith('Count')) {
                validateStaffCount(nextFormData);
            }
            return nextFormData;
        });
    };

    // Fonction de validation ajustée pour prendre le formulaire complet
    const validateStaffCount = (currentFormData: typeof formData) => {
        const {staff, managerCount, employeeCount, workerCount, temporaryWorkerCount} = currentFormData;

        // Convertir les valeurs en nombres, en traitant les chaînes vides comme 0 pour la somme
        const numStaff = typeof staff === 'number' ? staff : parseInt(staff as any, 10) || 0;
        const numManager = typeof managerCount === 'number' ? managerCount : parseInt(managerCount as any, 10) || 0;
        const numEmployee = typeof employeeCount === 'number' ? employeeCount : parseInt(employeeCount as any, 10) || 0;
        const numWorker = typeof workerCount === 'number' ? workerCount : parseInt(workerCount as any, 10) || 0;
        const numTemporary = typeof temporaryWorkerCount === 'number' ? temporaryWorkerCount : parseInt(temporaryWorkerCount as any, 10) || 0;


        const sumOfCounts = numManager + numEmployee + numWorker + numTemporary;

        // Appliquer la validation uniquement si l'effectif total n'est pas 0 ou si la somme n'est pas 0
        if ((numStaff !== 0 || sumOfCounts !== 0) && sumOfCounts !== numStaff) {
            setStaffError(`La somme des effectifs (${sumOfCounts}) doit être égale à l'effectif total (${numStaff}).`);
        } else {
            setStaffError('');
        }
    };

    const handleSubmit = async () => {
        const {
            targetAudience,
            staff,
            managerCount,
            employeeCount,
            workerCount,
            temporaryWorkerCount
        } = formData;

        // Convertir les valeurs du formulaire en nombres pour l'envoi
        const numManager = typeof managerCount === 'number' ? managerCount : parseInt(managerCount as any, 10) || 0;
        const numEmployee = typeof employeeCount === 'number' ? employeeCount : parseInt(employeeCount as any, 10) || 0;
        const numWorker = typeof workerCount === 'number' ? workerCount : parseInt(workerCount as any, 10) || 0;
        const numTemporary = typeof temporaryWorkerCount === 'number' ? temporaryWorkerCount : parseInt(temporaryWorkerCount as any, 10) || 0;


        const selectedUserIds = selectedUsers.map(user => user.id);

        // Validation finale avant l'envoi (assurez-vous qu'elle utilise les nombres)
        const sumOfCounts = numManager + numEmployee + numWorker + numTemporary;
        if (staff !== sumOfCounts) {
            setStaffError(`La somme des effectifs (${sumOfCounts}) doit être égale à l'effectif total (${staff}).`);
            return; // Empêcher la soumission si la validation échoue
        }

        const dataToSend = {
            id: groupData?.id, // Inclure l'ID si en mode édition
            targetAudience,
            managerCount: numManager,
            employeeCount: numEmployee,
            workerCount: numWorker,
            temporaryWorkerCount: numTemporary,
            userGroupIds: selectedUserIds,
        };

        console.log('Données à envoyer au backend:', dataToSend);
        try {
            const url = groupData ?
                `${TRAINING_GROUPE_URLS.editGroupParticipants}/${groupData.id}` : `${TRAINING_GROUPE_URLS.addGroupParticipants}/${trainingId}`; // URL pour l'ajout ou la mise à jour
            const method = groupData ? 'PUT' : 'POST'; //
            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
            if (response.ok) {
                console.log('Données envoyées avec succès');
                const responseData: GroupData = await response.json(); // Type assertion
                onGroupDataUpdated(responseData); // Calling the prop function with the response data
                // Afficher l'alerte de succès
                setAlertMessage('Mise à jour effectuée avec succès !');
                setAlertType('success');
                setShowAlert(true);

                navigateTo(TRAINING_URLS.addPage, {
                    query: {trainingId: trainingId, groupId: responseData.id},
                });
            } else {
                const errorData = await response.json();
                console.error('Erreur lors de l\'envoi des données:', errorData);
                // Gérer l'erreur ici (afficher un message, etc.)
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi des données:', error);

        }
    };

    // Optionnel: Afficher un indicateur de chargement ou une erreur pendant le fetch initial
    if (initialUsersLoading) {
        return <div>Chargement des utilisateurs...</div>;
    }

    if (initialUsersError) {
        return <div>Erreur lors du chargement des données.</div>;
    }


    return (
        <form className='' onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}> {/* Utiliser e.preventDefault() pour éviter le rechargement de page */}
            {showAlert && (
                <Alert
                    message={alertMessage}
                    type={alertType}
                    onClose={handleCloseAlert}
                />
            )}
            {/* Form Fields */}
            <div className="grid md:grid-cols-2 md:gap-10 gap-4">
                <div>
                    <InputField
                        label="Public cible"
                        name="targetAudience"
                        value={formData.targetAudience} // Lier la valeur à l'état du formulaire
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <InputField
                        type='number'
                        label="Éffectif"
                        name="staff"
                        value={formData.staff} // Lier la valeur à l'état du formulaire
                        onChange={handleInputChange}
                    />
                    {staffError && <p className="text-red text-sm">{staffError}</p>}
                    <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mt-5">
                        <InputField
                            type='number'
                            label="Manager"
                            name="managerCount"
                            value={formData.managerCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Employé"
                            name="employeeCount"
                            value={formData.employeeCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Ouvrier"
                            name="workerCount"
                            value={formData.workerCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Temporaire"
                            name="temporaryWorkerCount"
                            value={formData.temporaryWorkerCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>

            {/* Tables and Buttons */}
            <div className="mt-10">
                <Table
                    data={paginatedUsersData}
                    keys={TABLE_KEYS_1}
                    headers={TABLE_HEADERS_1}
                    sortableCols={sortableColumnsUsers}
                    onSort={(column, order) => handleSortDataUsers(column, order, handleSort)}
                    isPagination={false}
                    pagination={{
                        currentPage: currentPageUsers,
                        totalPages: totalPagesUsers,
                        onPageChange: setCurrentPageUsers,
                    }}
                    totalRecords={totalRecordsUsers}
                    // onAdd={() => console.log("Nouveau")} // Pas clair si 'onAdd' a du sens ici
                    visibleColumns={visibleColumnsUsers}
                    renderers={renderers1}
                    loading={initialUsersLoading} // Afficher l'état de chargement
                />
                {/* Section : Bouton d'action */}
                <div className="text-right text-xs md:text-sm lg:text-base mt-2"> {/* Ajout de marge */}
                    <button
                        type="button" // Utiliser type="button" pour ne pas soumettre le formulaire ici
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed" // Styles pour désactiver le bouton
                        onClick={handleAddToSelected}
                        disabled={tempSelectedUsers.size === 0} // Désactiver si rien n'est sélectionné temporairement
                    >
                        Ajouter à la liste ({tempSelectedUsers.size})
                    </button>
                </div>
            </div>
            <div className="mt-5">
                <Table
                    data={paginatedSelectedUsersData}
                    keys={TABLE_KEYS_2}
                    headers={TABLE_HEADERS_2}
                    sortableCols={sortableColumnsSelected}
                    onSort={(column, order) => handleSortDataSelected(column, order, handleSort)}
                    isPagination={false}
                    pagination={{
                        currentPage: currentPageSelected,
                        totalPages: totalPagesSelected,
                        onPageChange: setCurrentPageSelected,
                    }}
                    totalRecords={totalRecordsSelected}
                    loading={initialUsersLoading} // Afficher l'état de chargement
                    // onAdd={() => console.log("Nouveau")} // Pas clair si 'onAdd' a du sens ici
                    visibleColumns={visibleColumnsSelected}
                    renderers={renderers2}
                />
                {/* Section : Bouton d'action pour soumission */}
                <div className="text-right text-xs md:text-sm lg:text-base mt-2"> {/* Ajout de marge */}
                    <button
                        onClick={handleSubmit}
                        type="submit" // Utiliser type="submit" pour que ce bouton soumette le formulaire
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={staffError !== ''} // Désactiver si erreur
                    >
                        {groupData ? 'Mettre à jour' : 'Envoyer'} {/* Changer le texte du bouton selon le mode */}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default Participants;