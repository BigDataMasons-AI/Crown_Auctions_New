import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ItemInquiryRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  itemType: string;
  ringSetting?: string;
  diamondShape?: string;
  caratRange?: string;
  diamondType?: string;
  watchBrand?: string;
  watchModel?: string;
  necklaceBrand?: string;
  braceletBrand?: string;
  earringBrand?: string;
  hasOriginalBox?: boolean;
  hasPaperwork?: boolean;
  imageCount: number;
  imageUrls?: string[];
}

// Sanitize HTML to prevent XSS
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-item-inquiry");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ItemInquiryRequest = await req.json();
    console.log("Processing inquiry from:", data.email);

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Sanitize all user inputs
    const sanitizedData = {
      firstName: escapeHtml(data.firstName),
      lastName: escapeHtml(data.lastName),
      email: escapeHtml(data.email),
      phone: escapeHtml(data.phone),
      itemType: escapeHtml(data.itemType || 'ring'),
      ringSetting: data.ringSetting ? escapeHtml(data.ringSetting) : undefined,
      diamondShape: data.diamondShape ? escapeHtml(data.diamondShape) : undefined,
      caratRange: data.caratRange ? escapeHtml(data.caratRange) : undefined,
      diamondType: data.diamondType ? escapeHtml(data.diamondType) : undefined,
      watchBrand: data.watchBrand ? escapeHtml(data.watchBrand) : undefined,
      watchModel: data.watchModel ? escapeHtml(data.watchModel) : undefined,
      necklaceBrand: data.necklaceBrand ? escapeHtml(data.necklaceBrand) : undefined,
      braceletBrand: data.braceletBrand ? escapeHtml(data.braceletBrand) : undefined,
      earringBrand: data.earringBrand ? escapeHtml(data.earringBrand) : undefined,
      hasOriginalBox: data.hasOriginalBox || false,
      hasPaperwork: data.hasPaperwork || false,
      imageCount: data.imageCount || 0,
      imageUrls: data.imageUrls || [],
    };

    // Save to database
    console.log("Saving inquiry to database...");
    const { data: insertedData, error: dbError } = await supabase
      .from('item_inquiries')
      .insert({
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        item_type: sanitizedData.itemType,
        ring_setting: sanitizedData.ringSetting || null,
        diamond_shape: sanitizedData.diamondShape || null,
        carat_range: sanitizedData.caratRange || null,
        diamond_type: sanitizedData.diamondType || null,
        watch_brand: sanitizedData.watchBrand || null,
        watch_model: sanitizedData.watchModel || null,
        necklace_brand: sanitizedData.necklaceBrand || null,
        bracelet_brand: sanitizedData.braceletBrand || null,
        earring_brand: sanitizedData.earringBrand || null,
        has_original_box: sanitizedData.hasOriginalBox,
        has_paperwork: sanitizedData.hasPaperwork,
        image_count: sanitizedData.imageCount,
        image_urls: sanitizedData.imageUrls,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("Inquiry saved to database:", insertedData?.id);

    // Build item details section based on item type
    let itemDetails = `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Item Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.itemType}</td></tr>`;
    
    // Ring/Diamond specific fields
    if (sanitizedData.ringSetting) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Ring Setting:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.ringSetting}</td></tr>`;
    }
    if (sanitizedData.diamondShape) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Diamond Shape:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.diamondShape}</td></tr>`;
    }
    if (sanitizedData.caratRange) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Carat Range:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.caratRange}</td></tr>`;
    }
    if (sanitizedData.diamondType) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Diamond Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.diamondType}</td></tr>`;
    }

    // Watch specific fields
    if (sanitizedData.watchBrand) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Watch Brand:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.watchBrand}</td></tr>`;
    }
    if (sanitizedData.watchModel) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Watch Model:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.watchModel}</td></tr>`;
    }

    // Box and Paperwork (for watches, earrings, bracelets, and necklaces)
    if (sanitizedData.itemType === 'watch' || sanitizedData.itemType === 'earrings' || sanitizedData.itemType === 'bracelet' || sanitizedData.itemType === 'necklace') {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Original Box:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.hasOriginalBox ? '✓ Yes' : '✗ No'}</td></tr>`;
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Paperwork:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.hasPaperwork ? '✓ Yes' : '✗ No'}</td></tr>`;
    }

    // Necklace specific fields
    if (sanitizedData.necklaceBrand) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Necklace Brand:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.necklaceBrand}</td></tr>`;
    }

    // Bracelet specific fields
    if (sanitizedData.braceletBrand) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Bracelet Brand:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.braceletBrand}</td></tr>`;
    }

    // Earring specific fields
    if (sanitizedData.earringBrand) {
      itemDetails += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Earring Brand:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.earringBrand}</td></tr>`;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Item Inquiry</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">New Item Inquiry Received</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1a365d; margin-top: 0;">Contact Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.firstName} ${sanitizedData.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${sanitizedData.phone}">${sanitizedData.phone}</a></td>
            </tr>
          </table>

          <h2 style="color: #1a365d;">Item Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${itemDetails}
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Images Uploaded:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${sanitizedData.imageCount} image(s)</td>
            </tr>
          </table>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This inquiry was submitted through the item submission form on your website.
          </p>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to admin...");
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crown Auctions <onboarding@resend.dev>",
        to: ["onboarding@resend.dev"], // Replace with actual admin email
        subject: `New Item Inquiry: ${sanitizedData.itemType} from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
        html: emailHtml,
        reply_to: sanitizedData.email,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, id: insertedData?.id || emailResult.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-item-inquiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
