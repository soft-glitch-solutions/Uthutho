// app/api/google-places/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    const radius = searchParams.get('radius');
    const region = searchParams.get('region');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        console.error('Google Places API key missing');
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Build Google Places API URL
    let googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    if (region) {
        googleUrl += `&region=${region}`;
    }

    if (location && radius) {
        googleUrl += `&location=${location}&radius=${radius}`;
    }

    try {
        const response = await fetch(googleUrl);
        const data = await response.json();

        // Return with CORS headers for your domain
        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://mobile.uthutho.co.za',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch from Google Places API' }, { status: 500 });
    }
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'https://mobile.uthutho.co.za',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}