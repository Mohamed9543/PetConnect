const { body } = require("express-validator");

const registerValidator = [
  body("firstName").trim().notEmpty().withMessage("Le prénom est requis."),
  body("lastName").trim().notEmpty().withMessage("Le nom est requis."),
  body("email").trim().isEmail().withMessage("L'adresse email n'est pas valide.").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  body("phone").optional({ checkFalsy: true }).isMobilePhone("any").withMessage("Le numéro de téléphone n'est pas valide."),
  body("role").optional({ checkFalsy: true }).isIn(["user", "association"]).withMessage("Type de compte invalide."),
  body("organizationName")
    .if(body("role").equals("association"))
    .trim()
    .notEmpty()
    .withMessage("Le nom de l'association est requis pour un compte professionnel."),
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("L'adresse email n'est pas valide.").normalizeEmail(),
  body("password").notEmpty().withMessage("Le mot de passe est requis."),
];

const forgotPasswordValidator = [
  body("email").trim().isEmail().withMessage("L'adresse email n'est pas valide.").normalizeEmail(),
];

const verifyResetOtpValidator = [
  body("email").trim().isEmail().withMessage("L'adresse email n'est pas valide.").normalizeEmail(),
  body("otp").trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage("Le code doit contenir 6 chiffres."),
];

const resetPasswordValidator = [
  body("resetToken").notEmpty().withMessage("Jeton de réinitialisation manquant."),
  body("newPassword").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères."),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
};
