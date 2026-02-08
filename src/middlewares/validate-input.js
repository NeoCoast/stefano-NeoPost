const Ajv = require('ajv');

const ajv = new Ajv();

const validateInput = (schema) => {
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const valid = validate(req.body);

    if (!valid) {
      res.status(400).json({ message: 'Invalid input', errors: validate.errors });
      return;
    }

    next();
  };
};

module.exports = { validateInput };
