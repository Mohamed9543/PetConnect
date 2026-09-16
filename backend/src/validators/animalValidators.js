const { body } = require("express-validator");

const createAnimalValidator = [
  body("name").trim().notEmpty().withMessage("Le nom de l'animal est requis."),
  body("type").isIn(["dog", "cat", "other"]).withMessage("Type d'animal invalide."),
  body("gender").isIn(["male", "female"]).withMessage("Le sexe est invalide."),
  body("age").isFloat({ min: 0, max: 40 }).withMessage("L'âge doit être un nombre valide."),
  body("ageCategory").isIn(["baby", "young", "adult"]).withMessage("Catégorie d'âge invalide."),
  body("description").optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage("La description est trop longue."),
];

const updateAnimalValidator = [
  body("name").optional({ checkFalsy: true }).trim().notEmpty().withMessage("Le nom de l'animal est requis."),
  body("type").optional({ checkFalsy: true }).isIn(["dog", "cat", "other"]).withMessage("Type d'animal invalide."),
  body("gender").optional({ checkFalsy: true }).isIn(["male", "female"]).withMessage("Le sexe est invalide."),
  body("age").optional({ checkFalsy: true }).isFloat({ min: 0, max: 40 }).withMessage("L'âge doit être un nombre valide."),
  body("ageCategory").optional({ checkFalsy: true }).isIn(["baby", "young", "adult"]).withMessage("Catégorie d'âge invalide."),
  body("status").optional({ checkFalsy: true }).isIn(["available", "pending", "adopted"]).withMessage("Statut invalide."),
  body("description").optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage("La description est trop longue."),
];

module.exports = { createAnimalValidator, updateAnimalValidator };
