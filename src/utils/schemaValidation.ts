import { Schema } from 'yup';

import { formatYupError } from './formatYupError';

export const schemaValidation = async (schema: Schema<any>, input: any) => {
  try {
    await schema.validate(input, { abortEarly: false });
  } catch (error) {
    const errors = formatYupError(error);

    return errors;
  }

  return null;
};
