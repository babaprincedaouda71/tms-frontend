import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {F4_EVALUATION_URLS} from "@/config/urls";
import {AlertCircle} from "lucide-react";

export default function F4EvaluationResponsePage() {
    const router = useRouter();
    const {token} = router.query;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const scanQRCode = async () => {
        try {
            const response = await fetch(`${F4_EVALUATION_URLS.scan}/${token}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la validation du QR code');
            }

            const data = await response.json();

            if (!data.valid) {
                setError(data.message || 'QR code invalide');
                return
            }
        } catch (error) {
            setError(error.message || 'Erreur lors de la validation du QR code');
            return
        } finally {
            setIsLoading(false);
        }
    }

    // Effet pour scanner le qr code au chargement
    useEffect(() => {
        if (token && typeof token === 'string') {
            scanQRCode();
        }
    }, [token]);

    // rendu conditionnel selon l'état
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-base sm:text-lg">Validation du QR code...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-redShade-500 mx-auto mb-4"/>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
                        <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-base font-medium"
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div> Hello</div>
    )
}

F4EvaluationResponsePage.useLayout = false