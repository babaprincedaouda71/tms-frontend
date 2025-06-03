import * as React from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import {useAuth} from "@/contexts/AuthContext";

const Layout = ({children}) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const {user, loading} = useAuth();

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Afficher un écran de chargement pendant la vérification de l'authentification
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Si l'utilisateur n'est pas connecté et que nous ne sommes pas en train de charger,
    // afficher uniquement le contenu sans le layout
    if (!user) {
        return <main className="w-full">{children}</main>;
    }

    // Si l'utilisateur est connecté, afficher le layout complet
    return (
        <div className="flex min-h-screen bg-backColor relative">
            {/* Overlay pour mobile */}
            <div
                className={`
                    fixed inset-0 bg-black bg-opacity-50 z-50 lg-custom:hidden transition-opacity duration-300
                    ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Conteneur de la Sidebar avec position fixe sur desktop */}
            <div
                className={`
                    fixed lg-custom:fixed inset-y-0 left-0 z-50 h-full
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg-custom:translate-x-0"}
                    ${sidebarCollapsed ? "w-20" : "w-64"}
                `}
            >
                {/* Sidebar avec hauteur complète */}
                <div className="h-full">
                    <Sidebar collapsed={sidebarCollapsed}/>
                </div>

                {/* Bouton toggle avec position absolue par rapport au conteneur fixe */}
                <button
                    onClick={toggleSidebar}
                    className="absolute hidden lg-custom:flex items-center justify-center -right-5 top-1/2 -translate-y-1/2
                        w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                >
                    {sidebarCollapsed ? (
                        <FaChevronRight size={20} className="text-gray-600"/>
                    ) : (
                        <FaChevronLeft size={20} className="text-gray-600"/>
                    )}
                </button>
            </div>

            {/* Contenu principal avec marge pour compenser la sidebar */}
            <div
                className={`
                    flex-1 flex flex-col min-w-0
                    transition-all duration-300 ease-in-out
                    ${sidebarCollapsed ? "lg-custom:ml-20" : "lg-custom:ml-64"}
                `}
            >
                <Header onMenuClick={() => setSidebarOpen(true)}/>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-backColor w-full lg:px-5">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;