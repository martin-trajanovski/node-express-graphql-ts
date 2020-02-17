import authentication from './authentication';
import todos from './todos';

const rootResolver = {
  RootQuery: {
    ...authentication.queries,
    ...todos.queries,
  },
  RootMutation: {
    ...todos.mutations,
  },
};

export default rootResolver;
