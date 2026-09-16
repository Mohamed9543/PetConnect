const { Resend } = require("resend");

let resend;
function getClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function sendPasswordResetOtp(to, otp) {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error("Service d'envoi d'email non configuré");
    error.statusCode = 500;
    throw error;
  }

  await getClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "PetConnect <onboarding@resend.dev>",
    to,
    subject: "Votre code de réinitialisation PetConnect",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Réinitialisation de mot de passe</h2>
        <p>Voici votre code de vérification, valable 10 minutes :</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1A1D1A;">${otp}</p>
        <p style="color: #5B625B; font-size: 13px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetOtp };
