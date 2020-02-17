export const validationError = (
  message: string,
  statusCode: number,
  errors: any
) => {
  return {
    error: {
      message,
      statusCode,
      errors,
    },
  };
};
