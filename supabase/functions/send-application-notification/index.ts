import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  dancerEmail: string;
  dancerName: string;
  eventName: string;
  status: 'approved' | 'rejected';
  organizerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dancerEmail, dancerName, eventName, status, organizerName }: NotificationRequest = await req.json();

    const isApproved = status === 'approved';
    const subject = isApproved 
      ? `🎉 Your application for ${eventName} has been approved!`
      : `Application Update for ${eventName}`;

    const htmlContent = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Congratulations ${dancerName}! 🎉</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Your application for <strong>${eventName}</strong> has been <strong style="color: #16a34a;">approved</strong>!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            The event organizer <strong>${organizerName}</strong> has reviewed your profile and would love to have you participate.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Log in to your dashboard to see more details and connect with the organizer.
          </p>
          <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #15803d;">
              <strong>Next Steps:</strong><br/>
              1. Check your dashboard for event details<br/>
              2. Prepare for the performance<br/>
              3. Stay in touch with the organizer
            </p>
          </div>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br/>
            <strong>DanceLink Team</strong>
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Application Update</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Dear ${dancerName},
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your interest in <strong>${eventName}</strong>. After careful consideration, the organizer has decided not to move forward with your application at this time.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            We encourage you to keep improving your skills and apply for other events on DanceLink!
          </p>
          <div style="margin-top: 30px; padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              Don't give up! Keep dancing and exploring new opportunities.
            </p>
          </div>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br/>
            <strong>DanceLink Team</strong>
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "DanceLink <onboarding@resend.dev>",
      to: [dancerEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
