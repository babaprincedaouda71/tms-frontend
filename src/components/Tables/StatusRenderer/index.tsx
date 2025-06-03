import React, {useCallback, useState} from "react";
import {GroupeRendererProps} from "@/types/Table.types";
import {mutate} from "swr";
import {ConfirmModal} from "@/components/Tables/ConfirmModal";
import TeamRequestDetailsModal from "@/components/TeamRequestDetailsModal";

interface StatusConfig {
    label: string;
    color: string;
    backgroundColor: string;
    showDot?: boolean;
    icon?: React.ReactNode;
    pill?: {
        value: number;
        show: boolean;
    };
}

// Ajout des propriétés nécessaires
interface EnhancedStatusRendererProps extends GroupeRendererProps {
    row?: any; // Objet contenant les données de la ligne
    statusOptions?: string[]; // Liste des statuts possibles
    apiUrl?: string; // URL pour la mise à jour du statut
    mutateUrl?: string;
    isTeamRequest?: boolean; // Permet de différencier les comportements
}

const StatusRenderer: React.FC<EnhancedStatusRendererProps> = ({
                                                                   value,
                                                                   groupeConfig,
                                                                   row,
                                                                   statusOptions = [], // Définir la valeur par défaut comme un tableau vide
                                                                   apiUrl,
                                                                   mutateUrl,
                                                                   isTeamRequest = false
                                                               }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const config = groupeConfig[value] || {
        label: value,
        color: '#475569',
        backgroundColor: '#47556926'
    };

    const updateStatus = useCallback(async (newStatus: string) => {
        setSelectedStatus(newStatus);
        console.log("Nouveau status : " + newStatus);
        setIsConfirmationOpen(true);
    }, []);

    const handleConfirmation = useCallback(async (confirmed: boolean, newStatus: string | null) => {
        console.log("Before trying to confirm the status : " + confirmed);
        console.log("Row id: " + row?.id);
        if (confirmed && newStatus && row?.id) {
            console.log("Confirmed status : " + confirmed);
            try {
                setIsUpdating(true);

                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: row.id,
                        status: newStatus
                    })
                });

                console.log("Nouveau Status : ", newStatus);

                if (!response.ok) {
                    throw new Error(`Erreur lors de la mise à jour du statut: ${response.statusText}`);
                }

                // Rafraîchir les données avec SWR après mise à jour
                await mutate(mutateUrl);

            } catch (error) {
                console.error("Erreur lors de la mise à jour du statut:", error);
                // Optionnel : ajouter une notification d'erreur ici
            } finally {
                setIsUpdating(false);
                setIsMenuOpen(false);
            }
        }

        setIsConfirmationOpen(false);
        setSelectedStatus(null);
    }, [row?.id, apiUrl, mutateUrl]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Pour les demandes d'équipe, on ouvre le modal de détails
        if (isTeamRequest && row) {
            // Fermer tout autre modal potentiellement ouvert
            setIsMenuOpen(false);
            setIsConfirmationOpen(false);

            // Ouvrir le modal de détails
            setIsDetailsModalOpen(true);
            return;
        }

        // Pour les autres cas, on utilise le comportement précédent (menu déroulant)
        if (statusOptions.length > 0) {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    return (
        <div className="flex justify-center items-center relative">
            <div
                className="relative cursor-pointer"
                onClick={handleClick}
            >
                <div
                    className={`flex items-center py-[8px] px-[16px] rounded-lg font-extrabold ${isUpdating ? 'opacity-50' : ''}`}
                    style={{
                        color: config.color,
                        backgroundColor: config.backgroundColor
                    }}
                >
                    {config.showDot && (
                        <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{backgroundColor: config.color}}
                        />
                    )}
                    {config.icon && <span className="mr-2">{config.icon}</span>}
                    {config.label}
                </div>
                {config.pill?.show && (
                    <div className="absolute -top-0 -right-2 bg-red text-white text-xs p-0.5 rounded-full">
                        {config.pill.value}
                    </div>
                )}
            </div>

            {/* Menu déroulant pour sélectionner un nouveau statut */}
            {isMenuOpen && statusOptions.length > 0 && (
                <div className="absolute z-10 mt-2 bg-white border rounded-md shadow-lg top-full">
                    <ul className="py-1">
                        {statusOptions.map((statut) => (
                            <li
                                key={statut}
                                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${statut === value ? 'font-bold bg-gray-50' : ''}`}
                                onClick={() => updateStatus(statut)}
                            >
                                {groupeConfig[statut]?.label || statut}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Cliquer en dehors du menu pour le fermer */}
            {isMenuOpen && statusOptions.length > 0 && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Pop-up de confirmation */}
            <ConfirmModal
                isOpen={isConfirmationOpen}
                onClose={() => handleConfirmation(false, null)}
                onConfirm={() => handleConfirmation(true, selectedStatus)}
                title="Confirmer le changement de statut"
                message="Êtes-vous sûr de vouloir changer le statut?"
            />

            {/* Modal des détails de la demande */}
            {isTeamRequest && row && (
                <TeamRequestDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    request={row}
                    mutateUrl={mutateUrl}
                    apiUrl={apiUrl}
                />
            )}
        </div>
    );
};

export default StatusRenderer;