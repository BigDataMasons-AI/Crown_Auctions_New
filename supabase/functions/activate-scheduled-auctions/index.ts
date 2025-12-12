import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML sanitization to prevent XSS in emails
const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] || char));
};

interface Auction {
  id: string;
  title: string;
  start_time: string;
  status: string;
  approval_status: string;
  submitted_by: string;
  category: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate scheduler secret for security
    const secret = req.headers.get('x-scheduler-secret');
    const expectedSecret = Deno.env.get('SCHEDULER_SECRET');
    
    if (!expectedSecret || secret !== expectedSecret) {
      console.error('Unauthorized access attempt to scheduler function');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    
    console.log(`[${now}] Checking for scheduled auctions to activate...`);

    // Find all pending approved auctions whose start_time has passed
    const { data: scheduledAuctions, error: fetchError } = await supabase
      .from('auctions')
      .select('id, title, start_time, status, approval_status, submitted_by, category')
      .eq('status', 'pending')
      .eq('approval_status', 'approved')
      .lte('start_time', now);

    if (fetchError) {
      console.error('Error fetching scheduled auctions:', fetchError);
      throw fetchError;
    }

    if (!scheduledAuctions || scheduledAuctions.length === 0) {
      console.log('No scheduled auctions to activate');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No scheduled auctions to activate',
          activated: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${scheduledAuctions.length} auction(s) to activate:`, 
      scheduledAuctions.map((a: Auction) => `${a.title} (${a.id})`).join(', ')
    );

    // Activate all scheduled auctions
    const auctionIds = scheduledAuctions.map((a: Auction) => a.id);
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ status: 'active' })
      .in('id', auctionIds);

    if (updateError) {
      console.error('Error activating auctions:', updateError);
      throw updateError;
    }

    // Log admin actions for each activated auction
    const activityLogs = scheduledAuctions.map((auction: Auction) => ({
      admin_user_id: '00000000-0000-0000-0000-000000000000', // System user
      auction_id: auction.id,
      action_type: 'auto_start',
      auction_title: auction.title
    }));

    const { error: logError } = await supabase
      .from('admin_activity_log')
      .insert(activityLogs);

    if (logError) {
      console.error('Error logging admin actions:', logError);
      // Don't throw here, activation was successful
    }

    // Send email notifications to submitters asynchronously (don't await to avoid blocking)
    (async () => {
      for (const auction of scheduledAuctions) {
        try {
          // Get submitter's profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', auction.submitted_by)
            .single();

          if (profileError || !profile?.email) {
            console.error(`Failed to get profile for user ${auction.submitted_by}:`, profileError);
            continue;
          }

          const displayName = profile.full_name || profile.email.split('@')[0];

          // Send email notification
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .header h1 { color: white; margin: 0; font-size: 28px; }
                  .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                  .badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
                  .auction-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .cta-button { display: inline-block; background: #D4AF37; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
                  .icon { font-size: 48px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="icon">🚀</div>
                    <h1>Your Auction is Now Live!</h1>
                  </div>
                  <div class="content">
                    <h2>Hello ${escapeHtml(displayName)},</h2>
                    <p>Great news! Your scheduled auction has automatically gone live and is now accepting bids.</p>
                    
                    <div class="auction-details">
                      <h3 style="margin-top: 0; color: #10b981;">Auction Details</h3>
                      <p><strong>Title:</strong> ${escapeHtml(auction.title)}</p>
                      <p><strong>Category:</strong> ${escapeHtml(auction.category)}</p>
                      <p><strong>Auction ID:</strong> ${escapeHtml(auction.id)}</p>
                      <p><strong>Status:</strong> <span class="badge">🟢 Live & Active</span></p>
                      <p><strong>Started:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    <p><strong>What's happening now:</strong></p>
                    <ul>
                      <li>Your auction is visible to all bidders on the platform</li>
                      <li>Bidders can start placing their offers immediately</li>
                      <li>You'll receive real-time notifications for all bids</li>
                      <li>Track bidding activity live from your dashboard</li>
                    </ul>

                    <p style="margin-top: 30px;">
                      <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || '#'}/auction/${auction.id}" class="cta-button">View Your Live Auction</a>
                    </p>

                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                      <strong>Pro Tips:</strong><br>
                      • Monitor your auction regularly for new bids<br>
                      • Check your dashboard to see bidding patterns<br>
                      • You'll be notified via email if you're outbid<br>
                      • Good luck with your auction!
                    </p>

                    <p>If you have any questions, please don't hesitate to contact our support team.</p>

                    <p style="margin-top: 30px;">Best regards,<br><strong>Crown Auctions Team</strong></p>
                  </div>
                  <div class="footer">
                    <p>Crown Auctions - Premium Luxury Auction House</p>
                    <p style="font-size: 12px; color: #999;">This is an automated email. Please do not reply directly to this message.</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          await resend.emails.send({
            from: "Crown Auctions <onboarding@resend.dev>",
            to: [profile.email],
            subject: `🚀 Your Auction is Now Live - ${auction.title}`,
            html: htmlContent,
          });

          console.log(`Sent go-live notification for auction ${auction.id} to ${profile.email}`);
        } catch (emailError) {
          console.error(`Failed to send notification for auction ${auction.id}:`, emailError);
          // Continue with other notifications even if one fails
        }
      }
    })().catch(err => console.error('Error in email notification background task:', err));

    console.log(`Successfully activated ${scheduledAuctions.length} auction(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Activated ${scheduledAuctions.length} scheduled auction(s)`,
        activated: scheduledAuctions.length,
        auctions: scheduledAuctions.map((a: Auction) => ({ id: a.id, title: a.title }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in activate-scheduled-auctions function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
