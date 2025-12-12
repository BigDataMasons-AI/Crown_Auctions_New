import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundStatusEmailRequest {
  depositId: string;
  status: "approved" | "rejected";
  amount: number;
  currency: string;
  language?: string;
}

// Sanitize HTML to prevent XSS
const sanitizeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Translations for email content
const translations = {
  en: {
    approvedSubject: "Your Refund Request Has Been Approved - Crown Auctions",
    rejectedSubject: "Update on Your Refund Request - Crown Auctions",
    refundApproved: "Refund Approved",
    refundRequestUpdate: "Refund Request Update",
    dear: "Dear",
    valuedCustomer: "Valued Customer",
    approvedMessage: "Great news! Your refund request for your bidding deposit has been approved.",
    refundAmount: "Refund Amount",
    depositAmount: "Deposit Amount",
    processingTime: "The refund will be processed to your original payment method within 5-10 business days.",
    thankYou: "Thank you for being a valued member of Crown Auctions. We hope to see you again soon!",
    rejectedMessage: "We regret to inform you that your refund request for your bidding deposit could not be processed at this time.",
    rejectedReason: "This may be due to active bids or ongoing auction participation. Your deposit remains active and you can continue to participate in auctions.",
    contactSupport: "If you have any questions, please don't hesitate to contact our support team.",
    copyright: "© 2024 Crown Auctions. All rights reserved.",
    direction: "ltr",
  },
  ar: {
    approvedSubject: "تمت الموافقة على طلب الاسترداد الخاص بك - كراون للمزادات",
    rejectedSubject: "تحديث بشأن طلب الاسترداد الخاص بك - كراون للمزادات",
    refundApproved: "تمت الموافقة على الاسترداد",
    refundRequestUpdate: "تحديث طلب الاسترداد",
    dear: "عزيزي",
    valuedCustomer: "العميل الكريم",
    approvedMessage: "أخبار سارة! تمت الموافقة على طلب استرداد مبلغ التأمين الخاص بك.",
    refundAmount: "مبلغ الاسترداد",
    depositAmount: "مبلغ التأمين",
    processingTime: "ستتم معالجة الاسترداد إلى طريقة الدفع الأصلية خلال 5-10 أيام عمل.",
    thankYou: "شكراً لكونك عضواً قيّماً في كراون للمزادات. نأمل أن نراك مجدداً قريباً!",
    rejectedMessage: "نأسف لإبلاغك بأنه لم يتم معالجة طلب استرداد مبلغ التأمين الخاص بك في هذا الوقت.",
    rejectedReason: "قد يكون هذا بسبب وجود عروض نشطة أو مشاركة مستمرة في المزادات. يظل مبلغ التأمين الخاص بك نشطاً ويمكنك الاستمرار في المشاركة في المزادات.",
    contactSupport: "إذا كانت لديك أي أسئلة، لا تتردد في الاتصال بفريق الدعم لدينا.",
    copyright: "© 2024 كراون للمزادات. جميع الحقوق محفوظة.",
    direction: "rtl",
  },
  fr: {
    approvedSubject: "Votre demande de remboursement a été approuvée - Crown Auctions",
    rejectedSubject: "Mise à jour de votre demande de remboursement - Crown Auctions",
    refundApproved: "Remboursement approuvé",
    refundRequestUpdate: "Mise à jour de la demande de remboursement",
    dear: "Cher(e)",
    valuedCustomer: "Client estimé",
    approvedMessage: "Bonne nouvelle ! Votre demande de remboursement de votre dépôt de garantie a été approuvée.",
    refundAmount: "Montant du remboursement",
    depositAmount: "Montant du dépôt",
    processingTime: "Le remboursement sera traité sur votre mode de paiement original dans un délai de 5 à 10 jours ouvrables.",
    thankYou: "Merci d'être un membre précieux de Crown Auctions. Nous espérons vous revoir bientôt !",
    rejectedMessage: "Nous avons le regret de vous informer que votre demande de remboursement de votre dépôt de garantie n'a pas pu être traitée pour le moment.",
    rejectedReason: "Cela peut être dû à des enchères actives ou à une participation en cours aux enchères. Votre dépôt reste actif et vous pouvez continuer à participer aux enchères.",
    contactSupport: "Si vous avez des questions, n'hésitez pas à contacter notre équipe d'assistance.",
    copyright: "© 2024 Crown Auctions. Tous droits réservés.",
    direction: "ltr",
  },
};

const getEmailContent = (
  status: "approved" | "rejected",
  language: string,
  userName: string,
  formattedAmount: string
): { subject: string; html: string } => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const isRtl = t.direction === "rtl";
  const textAlign = isRtl ? "right" : "left";
  const fontFamily = isRtl ? "'Noto Sans Arabic', 'Georgia', serif" : "'Georgia', serif";

  if (status === "approved") {
    return {
      subject: t.approvedSubject,
      html: `
        <!DOCTYPE html>
        <html dir="${t.direction}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: ${fontFamily}; background-color: #0a1628; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f2744 0%, #1a3a5c 100%); border-radius: 12px; overflow: hidden; border: 1px solid #c9a961;">
            <div style="background: linear-gradient(135deg, #c9a961 0%, #e8d5a3 50%, #c9a961 100%); padding: 30px; text-align: center;">
              <h1 style="color: #0a1628; margin: 0; font-size: 28px; font-weight: normal;">Crown Auctions</h1>
            </div>
            <div style="padding: 40px 30px; text-align: ${textAlign};">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 40px; color: white;">✓</span>
                </div>
                <h2 style="color: #c9a961; margin: 0 0 10px; font-size: 24px; font-weight: normal;">${t.refundApproved}</h2>
              </div>
              <p style="color: #e8d5a3; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${t.dear} ${userName},
              </p>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${t.approvedMessage}
              </p>
              <div style="background: rgba(201, 169, 97, 0.1); border: 1px solid rgba(201, 169, 97, 0.3); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="color: #c9a961; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${t.refundAmount}</p>
                <p style="color: #22c55e; margin: 0; font-size: 32px; font-weight: bold;">${formattedAmount}</p>
              </div>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${t.processingTime}
              </p>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.8;">
                ${t.thankYou}
              </p>
            </div>
            <div style="background: rgba(0, 0, 0, 0.2); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(201, 169, 97, 0.2);">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                ${t.copyright}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  } else {
    return {
      subject: t.rejectedSubject,
      html: `
        <!DOCTYPE html>
        <html dir="${t.direction}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: ${fontFamily}; background-color: #0a1628; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f2744 0%, #1a3a5c 100%); border-radius: 12px; overflow: hidden; border: 1px solid #c9a961;">
            <div style="background: linear-gradient(135deg, #c9a961 0%, #e8d5a3 50%, #c9a961 100%); padding: 30px; text-align: center;">
              <h1 style="color: #0a1628; margin: 0; font-size: 28px; font-weight: normal;">Crown Auctions</h1>
            </div>
            <div style="padding: 40px 30px; text-align: ${textAlign};">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 40px; color: white;">!</span>
                </div>
                <h2 style="color: #c9a961; margin: 0 0 10px; font-size: 24px; font-weight: normal;">${t.refundRequestUpdate}</h2>
              </div>
              <p style="color: #e8d5a3; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${t.dear} ${userName},
              </p>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${t.rejectedMessage}
              </p>
              <div style="background: rgba(201, 169, 97, 0.1); border: 1px solid rgba(201, 169, 97, 0.3); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="color: #c9a961; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${t.depositAmount}</p>
                <p style="color: #e8d5a3; margin: 0; font-size: 32px; font-weight: bold;">${formattedAmount}</p>
              </div>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                ${t.rejectedReason}
              </p>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.8;">
                ${t.contactSupport}
              </p>
            </div>
            <div style="background: rgba(0, 0, 0, 0.2); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(201, 169, 97, 0.2);">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                ${t.copyright}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { depositId, status, amount, currency, language = "en" }: RefundStatusEmailRequest = await req.json();

    console.log(`Processing refund status email for deposit: ${depositId}, status: ${status}, language: ${language}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("user_deposits")
      .select("user_id")
      .eq("id", depositId)
      .single();

    if (depositError || !deposit) {
      throw new Error("Deposit not found");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", deposit.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    const t = translations[language as keyof typeof translations] || translations.en;
    const userName = sanitizeHtml(profile.full_name || t.valuedCustomer);
    const userEmail = profile.email;
    const formattedAmount = `${currency} ${amount.toFixed(2)}`;

    const { subject, html } = getEmailContent(status, language, userName, formattedAmount);

    const emailResponse = await resend.emails.send({
      from: "Crown Auctions <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: html,
    });

    console.log("Refund status email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-refund-status-email function:", error);
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
