import { makeExecutableSchema } from 'graphql-tools';

import schemaDirectives from '../directives';
import resolvers from '../resolvers';

const typeDefs = `
  directive @isAuthenticated on FIELD | FIELD_DEFINITION

  type User {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    refreshToken: String!
  }

  type Todo {
    _id: ID!
    title: String!
    completed: Boolean!
    createdBy: User!
  }

  type ValidateError {
    path: String!
    message: String!
  }

  type Error {
    message: String!
    statusCode: Int!
    errors: [ValidateError]
  }

  type AuthData {
    token: String!
    expiresAt: Float!
  }

  type AuthDataResponse {
    data: AuthData
    error: Error
  }

  type TodoResponse {
    data: Todo
    error: Error
  }

  type TodosResponse {
    data: [Todo]
    error: Error
  }

  input TodoInput {
    title: String!
    completed: Boolean
  }

  input TodoUpdateInput {
    _id: ID!
    title: String
    completed: Boolean
  }

  type RootQuery {
    login(email: String!, password: String!): AuthDataResponse!
    todos: TodosResponse! @isAuthenticated
  }

  type RootMutation {
    createTodo(todoInput: TodoInput): TodoResponse! @isAuthenticated
    updateTodo(todoUpdateInput: TodoUpdateInput): TodoResponse! @isAuthenticated
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`;

export default makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives,
});
