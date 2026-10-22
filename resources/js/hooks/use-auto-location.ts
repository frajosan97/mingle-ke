// use-auto-location.ts
import { usePage, router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export function useAutoLocation() {
    const { location } = usePage<{ location: { has_coords: boolean } }>().props;
    const sent = useRef(false);

    useEffect(() => {
        // If backend already has coordinates, don't ask the browser
        if (location?.has_coords || sent.current) return;
        if (!('geolocation' in navigator)) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                sent.current = true;
                router.post('/location/update', {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                }, { preserveScroll: true, preserveState: true });
            },
            (err) => console.warn('Geolocation denied:', err.message)
        );
    }, [location?.has_coords]);
}