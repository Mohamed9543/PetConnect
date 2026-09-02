const { validationResult } = require("express-validator");

// Runs after a chain of express-validator checks; turns the first failure
// into the same { message } shape the rest of the API already returns,
// so the mobile client's error handling doesn't need a special case.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  next();
}

module.exports = validate;
