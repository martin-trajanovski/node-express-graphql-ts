import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import authMiddleware from '@src/middlewares/auth.middleware';

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async function(...args) {
      const [, , context] = args;

      await authMiddleware(context);

      return resolve.apply(this, args);
    };
  }
}

export default AuthDirective;
