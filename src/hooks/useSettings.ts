import { useState, useEffect } from 'react';

const SETTINGS_API_URL = 'https://fiestafood.vercel.app/api/settings';

export const useSettings = () => {
    const [deliveryRadius, setDeliveryRadius] = useState<number>(0); // Default strict (0km) to hide all until loading finishes
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(SETTINGS_API_URL, {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const json = await response.json();

            if (json.success && json.data && json.data.restaurantRadius) {
                const radiusInKm = Number(json.data.restaurantRadius);
                setDeliveryRadius(radiusInKm);
            }
        } catch (err) {
            console.error('Error fetching settings from API:', err);
            // Fallback to a reasonable default radius if API fails
            setDeliveryRadius(10); 
        } finally {
            setLoading(false);
        }
    };

    return { deliveryRadius, loading, error, refetch: fetchSettings };
};
