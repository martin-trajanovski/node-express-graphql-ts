import AuthenticationController from '@src/routes/authentication/authentication.controller';

export default {
  queries: {
    login: AuthenticationController.loginUser,
  },
};
