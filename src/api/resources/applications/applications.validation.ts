
/*
  This code snippet is responsible for validating user input data using a validation schema defined with the Joi library
*/

import Joi from '@hapi/joi';
import log from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

/*

  This code defines a blueprint or schema for validating user data. 
  It uses the Joi library to create an object schema with specific validation rules for each field

*/

const blueprintApplication = Joi.object({
  position: Joi.string().required(),
  company: Joi.string().required(),
  companyWebsite: Joi.any(),
  linkApplication: Joi.any(),
  status: Joi.string().required(),
  notes: Joi.any(),
  appliedDate: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  linkedin: Joi.any(),
});

/*
  This blueprint is used to validate the request body in the validationUser middleware.

*/

export const validationApplication = (req: Request, res: Response, next: NextFunction) => {
  const resultado = blueprintApplication.validate(req.body, { abortEarly: false, convert: false });
  if (resultado.error === undefined) {
    next();
  } else {
    let errorDeValidacion = resultado.error.details.map(error => {
      return `[${error.message}]`;
    });
    log.warn(`The user data did not pass validation: ${JSON.stringify(req.body)} - ${errorDeValidacion}`);
    res.status(400).send(`${errorDeValidacion}`);
  }
};
