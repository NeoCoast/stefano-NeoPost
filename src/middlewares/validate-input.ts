import Ajv, { type Schema } from 'ajv';
import type { Request, Response, NextFunction } from 'express';

const ajv = new Ajv();

export const validateInput = (schema: Schema) => {
  const validate = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction): void => {
    const valid = validate(req.body);

    if (!valid) {
      res.status(400).json({ message: 'Invalid input', errors: validate.errors });
      return;
    }

    next();
  };
};
