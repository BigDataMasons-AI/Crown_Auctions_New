import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

interface ContactInquiryRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, subject, message }: ContactInquiryRequest = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize all user inputs
    const safeName = escapeHtml(name.trim().slice(0, 100));
    const safeEmail = escapeHtml(email.trim().slice(0, 255));
    const safeSubject = escapeHtml(subject.trim().slice(0, 200));
    const safeMessage = escapeHtml(message.trim().slice(0, 2000));

    console.log(`Sending contact inquiry from ${safeEmail}`);

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Crown Auctions <onboarding@resend.dev>",
      to: ["admin@crownauctions.com"], // Replace with actual admin email
      subject: `New Inquiry: ${safeSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #b8860b, #d4af37); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Crown Auctions</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">New Contact Inquiry</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Contact Details</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <h3 style="color: #1a1a2e;">Message:</h3>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37;">
              <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>
          </div>
          <div style="padding: 20px; background: #1a1a2e; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              This inquiry was submitted through the Crown Auctions website.
            </p>
          </div>
        </div>
      `,
    });

    // Send confirmation to user
    const userEmailResponse = await resend.emails.send({
      from: "Crown Auctions <onboarding@resend.dev>",
      to: [email],
      subject: "We received your inquiry - Crown Auctions",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #b8860b, #d4af37); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Crown Auctions</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Thank You for Contacting Us</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Dear ${safeName},</h2>
            <p style="color: #333; line-height: 1.6;">
              Thank you for reaching out to Crown Auctions. We have received your inquiry and our team will review it promptly.
            </p>
            <p style="color: #333; line-height: 1.6;">
              You can expect a response within 24-48 business hours.
            </p>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37; margin: 20px 0;">
              <h3 style="color: #1a1a2e; margin-top: 0;">Your Inquiry:</h3>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <p style="white-space: pre-wrap;">${safeMessage}</p>
            </div>
            <p style="color: #333; line-height: 1.6;">
              Best regards,<br>
              <strong>The Crown Auctions Team</strong>
            </p>
          </div>
          <div style="padding: 20px; background: #1a1a2e; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
              © Crown Auctions. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Emails sent successfully:", { adminEmailResponse, userEmailResponse });

    return new Response(
      JSON.stringify({ success: true, message: "Inquiry sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-inquiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
