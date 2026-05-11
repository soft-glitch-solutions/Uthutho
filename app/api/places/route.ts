// app/api/places.ts
import { ExpoRequest, ExpoResponse } from 'expo-router';

const GOOGLE_PLACES_API_KEY = 'AIzaSyCNhnn5T_4Hq2ZRwK6JTBC0ju0anA99jA4';

export async function GET(request: ExpoRequest) {
    const url = new URL(request.url);
    const input = url.searchParams.get('input');
    const sessiontoken = url.searchParams.get('sessiontoken');

    if (!input) {
        return ExpoResponse.json({ error: 'Input required' }, { status: 400 });
    }

    try {
        const typesParam = 'geocode|establishment';
        const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&sessiontoken=${sessiontoken}&components=country:za&types=${encodeURIComponent(typesParam)}`;

        const response = await fetch(googleUrl);
        const data = await response.json();

        return ExpoResponse.json(data);
    } catch (error) {
        return ExpoResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
    }
}