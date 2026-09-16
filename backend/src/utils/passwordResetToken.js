const jwt = require("jsonwebtoken");

const PURPOSE = "password-reset";

// Short-lived, single-purpose JWT issued after a correct OTP so the client
// doesn't have to resend the OTP on the final reset-password step. The
// `purpose` claim keeps this from being usable as a normal auth token even
// though it's signed with the same secret.
function generatePasswordResetToken(userId) {
  return jwt.sign({ id: userId, purpose: PURPOSE }, process.env.JWT_SECRET, {
    expiresIn: "10m",
    algorithm: "HS256",
  });
}

function verifyPasswordResetToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  if (decoded.purpose !== PURPOSE) throw new Error("Jeton invalide");
  return decoded;
}

module.exports = { generatePasswordResetToken, verifyPasswordResetToken };
