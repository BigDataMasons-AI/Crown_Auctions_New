import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppraiserStatusEmailRequest {
  applicantEmail: string;
  applicantName: string;
  status: "approved" | "rejected";
  adminNotes?: string;
}

// HTML sanitization function to prevent XSS
const sanitizeHtml = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicantEmail, applicantName, status, adminNotes }: AppraiserStatusEmailRequest = await req.json();

    console.log(`Sending ${status} email to appraiser applicant:`, applicantEmail);

    // Sanitize all user inputs
    const sanitizedName = sanitizeHtml(applicantName);
    const sanitizedNotes = sanitizeHtml(adminNotes);

    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = "Congratulations! Your Appraiser Application Has Been Approved";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #D4AF37 0%, #F4E5C2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .badge { display: inline-block; background: #D4AF37; color: #1a1a1a; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
              .notes { background: #f8f9fa; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #D4AF37; color: #1a1a1a; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Application Approved!</h1>
              </div>
              <div class="content">
                <p>Dear ${sanitizedName},</p>
                
                <p>We are thrilled to inform you that your application to become a watch appraiser has been <strong>approved</strong>!</p>
                
                <div class="badge">✓ APPROVED</div>
                
                <p>Welcome to our team of expert appraisers. Your expertise and qualifications have impressed us, and we look forward to working with you.</p>
                
                ${adminNotes ? `
                <div class="notes">
                  <strong>Admin Notes:</strong><br/>
                  ${sanitizedNotes}
                </div>
                ` : ''}
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Our team will contact you within 48 hours with onboarding details</li>
                  <li>You'll receive access credentials and training materials</li>
                  <li>We'll schedule an orientation session to get you started</li>
                </ul>
                
                <p>If you have any questions in the meantime, please don't hesitate to reach out to us.</p>
                
                <p>Best regards,<br/>
                <strong>Crown Auctions Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from Crown Auctions.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = "Update on Your Appraiser Application";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .badge { display: inline-block; background: #ef4444; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
              .notes { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Application Status Update</h1>
              </div>
              <div class="content">
                <p>Dear ${sanitizedName},</p>
                
                <p>Thank you for your interest in becoming a watch appraiser with Crown Auctions. After careful review of your application, we regret to inform you that we are unable to move forward with your application at this time.</p>
                
                <div class="badge">Application Not Approved</div>
                
                ${adminNotes ? `
                <div class="notes">
                  <strong>Feedback from our team:</strong><br/>
                  ${sanitizedNotes}
                </div>
                ` : ''}
                
                <p>We appreciate the time and effort you put into your application. Please know that this decision was not made lightly, and we encourage you to continue developing your expertise in watch appraisal.</p>
                
                <p>You are welcome to reapply in the future as you gain additional experience and qualifications.</p>
                
                <p>Thank you again for your interest in Crown Auctions.</p>
                
                <p>Best regards,<br/>
                <strong>Crown Auctions Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from Crown Auctions.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Crown Auctions <onboarding@resend.dev>",
      to: [applicantEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log(`Email sent successfully to ${applicantEmail}:`, emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-appraiser-status-email function:", error);
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
