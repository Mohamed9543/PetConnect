const { body } = require("express-validator");

const createReportValidator = [
  body("type").isIn(["lost", "found"]).withMessage("Type de signalement invalide."),
  body("animalType").isIn(["dog", "cat", "other"]).withMessage("Type d'animal invalide."),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Localisation invalide."),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Localisation invalide."),
  body("date").notEmpty().withMessage("La date est requise."),
  body("contact").trim().notEmpty().withMessage("Un contact est requis pour être recontacté."),
  body("description").optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage("La description est trop longue."),
];

const updateReportValidator = [
  body("animalType").optional({ checkFalsy: true }).isIn(["dog", "cat", "other"]).withMessage("Type d'animal invalide."),
  body("contact").optional({ checkFalsy: true }).trim().notEmpty().withMessage("Un contact est requis pour être recontacté."),
  body("description").optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage("La description est trop longue."),
  body("status").optional({ checkFalsy: true }).isIn(["active", "in_progress", "found", "resolved"]).withMessage("Statut invalide."),
];

module.exports = { createReportValidator, updateReportValidator };
