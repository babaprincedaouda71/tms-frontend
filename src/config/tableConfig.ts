import {GroupeConfig, PermissionConfig, StatusConfig} from "@/types/Table.types";


export const statusConfig: Record<string, StatusConfig> = {
    Actif: {
        label: "Actif",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Inactif: {
        label: "Inactif",
        color: "#475569",
        backgroundColor: "#47556926",
        showDot: true,
    },
    Non_Planifié: {
        label: "Non Planifié",
        color: "#475569",
        backgroundColor: "#47556926",
        showDot: true,
    },
    Brouillon: {
        label: "Brouillon",
        color: "#475569",
        backgroundColor: "#47556926",
        showDot: true,
    },
    Validé: {
        label: "Validé",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Publiée: {
        label: "Publiée",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Publié: {
        label: "Publié",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Terminé: {
        label: "Terminé",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Terminée: {
        label: "Terminée",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Fermé: {
        label: "Fermé",
        color: "#5051C3",
        backgroundColor: "#5051C326",
        showDot: true,
    },
    Auto: {
        label: "Auto",
        color: "#FFFFFF",
        backgroundColor: "#FFA411",
        showDot: true,
    },
    Réglé: {
        label: "Réglé",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    "Non Réglé": {
        label: "Non Réglé",
        color: "#DB2525",
        backgroundColor: "#DB252526",
        showDot: true,
    },
    Échu: {
        label: "Échu",
        color: "#475569",
        backgroundColor: "#47556926",
        showDot: true,
    },
    "Réalisée": {
        label: "Réalisée",
        color: "#08A710",
        backgroundColor: "#08a71026",
        showDot: true,
    },
    "Planifiée": {
        label: "Planifiée",
        color: "#D9AF0A",
        backgroundColor: "#D9AF0A26",
        showDot: true,
    },
    "Planifié": {
        label: "Planifié",
        color: "#D9AF0A",
        backgroundColor: "#D9AF0A26",
        showDot: true,
    },
    "Annulée": {
        label: "Annulée",
        color: "#DB2525",
        backgroundColor: "#DB252526",
        showDot: true,
    },
    "En cours": {
        label: "En cours",
        color: "#D9AF0A",
        backgroundColor: "#D9AF0A26",
        showDot: true,
    },
    Clôturée: {
        label: "Clôturée",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    'Accordée': {
        label: 'Accordée',
        color: '#08A710',
        backgroundColor: '#08a71026',
        showDot: true
    },
    'Remboursée': {
        label: 'Remboursée',
        color: '#08A710',
        backgroundColor: '#08a71026',
        showDot: true
    },
    Présent: {
        label: "Présent",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Absent: {
        label: "Absent",
        color: "#4680FE",
        backgroundColor: "#4680FE26",
        showDot: true,
    },
    Confirmé: {
        label: "Confirmé",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    "En attente": {
        label: "En attente",
        color: "#4680FE",
        backgroundColor: "#4680FE26",
        showDot: true,
    }
    , "Réalisé": {
        label: "Réalisé",
        color: "#4680FE",
        backgroundColor: "#4680FE26",
        showDot: true,
    },
    "Approuvée": {
        label: "Approuvée",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    "Acceptée": {
        label: "Acceptée",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    "Rejetée": {
        label: "Rejetée",
        color: "#DB2525",
        backgroundColor: "#DB252526",
        showDot: true,
    },
    "Annulé": {
        label: "Annulé",
        color: "#DB2525",
        backgroundColor: "#DB252526",
        showDot: true,
    },
    "Non envoyée": {
        label: "Non Envoyée",
        color: "#475569",
        backgroundColor: "#47556926",
        showDot: true,
    },
};

export const groupeConfig: Record<string, GroupeConfig> = {
    Admin: {
        label: "Admin",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Collaborateur: {
        label: "Collaborateur",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Manager: {
        label: "Manager",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Formateur: {
        label: "Formateur",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
    Default: {
        label: "Default",
        color: "#08A710",
        backgroundColor: "#08A71026",
        showDot: true,
    },
};


export const permissionConfig: Record<string, PermissionConfig> = {
    Admin: {
        label: "Admin",
        color: "text-white",
        backgroundColor: "bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd",
        showIcon: false,
    },
    _: {
        label: "Gérer l'accès",
        color: "text-white",
        backgroundColor: "bg-gradient-to-b from-gradientGreenStart to-gradientGreenEnd",
        showIcon: true,
    }
};

// Table Users
export const TABLE_USER_HEADER = [
    "Sélection",
    "Nom complet",
    "Groupe",
    "Date de création",
    "Statut",
    "Actions",
];

export const TABLE_USER_KEYS = [
    "selection",
    "fullName",
    "group",
    "creationDate",
    "status",
    "actions",
];

export const TABLE_USER_ACTIONS_TO_SHOW = ["view", "edit", "delete"];
export const TABLE_USER_RECORDS_PER_PAGE = 4;