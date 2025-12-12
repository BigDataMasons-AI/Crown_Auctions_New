import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (Supabase provides this)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || '8.8.8.8'; // fallback for testing

    console.log('Detecting region for IP:', clientIP);

    // Use ip-api.com for free geo-location (no API key needed)
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,countryCode,country`);
    
    if (!geoResponse.ok) {
      console.error('Geo API error:', geoResponse.status);
      return new Response(
        JSON.stringify({ region: 'global', country: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geoData = await geoResponse.json();
    console.log('Geo data:', geoData);

    if (geoData.status === 'success') {
      return new Response(
        JSON.stringify({ 
          region: geoData.countryCode || 'global',
          country: geoData.country || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to global if geo lookup fails
    return new Response(
      JSON.stringify({ region: 'global', country: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting region:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ region: 'global', country: null, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
