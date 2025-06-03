import React from "react";

interface FolderIconProps {
    color?: string; // Couleur du SVG
    width?: number | string; // Largeur du SVG
    height?: number | string; // Hauteur du SVG
    strokeWidth?: number; // Épaisseur du trait
    className?: string; // Classe CSS supplémentaire
}

const FolderIcon: React.FC<FolderIconProps> = ({
                                                   color = "#475569",
                                                   width = 24,
                                                   height = 24,
                                                   strokeWidth = 2,
                                                   className = "",
                                               }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className} // Permet d'ajouter des classes CSS personnalisées
        >
            <path
                d="M5.39999 5.32959V3.52959C5.39999 2.86685 5.93724 2.32959 6.59999 2.32959H18C18.6627 2.32959 19.2 2.86685 19.2 3.52959V8.32959M2.40093 19.2706L2.40102 10.1463C2.40102 9.23235 2.40068 7.93062 2.40039 6.98807C2.40019 6.32515 2.93752 5.78838 3.60044 5.78838H9.31865L12.0837 8.74202H20.4C21.0627 8.74202 21.6 9.2793 21.6 9.94205L21.5997 19.2707C21.5996 20.5962 20.5251 21.6707 19.1997 21.6707L4.80092 21.6706C3.47543 21.6706 2.40091 20.5961 2.40093 19.2706Z"
                stroke={color} // Couleur personnalisable
                strokeWidth={strokeWidth} // Épaisseur du trait personnalisable
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default FolderIcon;