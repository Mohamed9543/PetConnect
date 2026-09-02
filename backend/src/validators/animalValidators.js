const { body } = require("express-validator");

const createAnimalValidator = [
  body("name").trim().notEmpty().withMessage("Le nom de l'animal est requis."),
  body("type").isIn(["dog", "cat", "other"]).withMessage("Type d'animal invalide."),
  body("gender").isIn(["male", "female"]).withMessage("Le sexe est invalide."),
  body("age").isFloat({ min: 0, max: 40 }).withMessage("L'âge doit être un nombre valide."),
  body("ageCategory").isIn(["baby", "young", "adult"]).withMessage("Catégorie d'âge invalide."),
  body("description").optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage("La description est trop longue."),
];

module.exports = { createAnimalValidator };
