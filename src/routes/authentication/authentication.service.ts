import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import {
  HttpException,
  UserWithThatEmailAlreadyExistsException,
  WrongCredentialsException,
} from '@src/exceptions';
import {
  DataStoredInToken,
  TokenData,
  User,
  LoginActivity,
} from '@src/interfaces';
import { userModel } from '@src/models';
import redisClient from '@src/utils/redis';

import CreateUserDto from '../user/user.dto';
import LogInDto from './login.dto';

const AUTH_TOKEN_EXPIRATION = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRATION = 60 * 60 * 60; // 1 day

class AuthenticationService {
  private user = userModel;

  public async register(userData: CreateUserDto) {
    if (await this.user.findOne({ email: userData.email })) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
    });
    user.password = '';

    return {
      user,
    };
  }

  public async login(logInData: LogInDto) {
    const user = await this.user.findOne({ email: logInData.email });

    if (user) {
      const isPasswordMatching = await bcrypt.compare(
        logInData.password,
        user.password
      );

      if (isPasswordMatching) {
        user.password = '';
        const authToken = this.createToken(user);
        // const refreshToken = await this.createRefreshToken(user);
        await this.logUserActivity(user, 'login');

        // if (redisClient.getClient && redisClient.getClient.connected) {
        //   redisClient.getClient.set(refreshToken, authToken.token);
        //   redisClient.getClient.expire(refreshToken, REFRESH_TOKEN_EXPIRATION);
        // }

        return authToken;
      } else {
        throw new WrongCredentialsException();
      }
    } else {
      throw new WrongCredentialsException();
    }
  }

  public async logout(refreshToken: string) {
    if (redisClient.getClient && redisClient.getClient.connected) {
      const authTokenInRedis = await redisClient.getAsync(refreshToken);

      // NOTE: Set the auth token as blacklisted and make it expire after AUTH_TOKEN_EXPIRATION.
      redisClient.getClient.set(authTokenInRedis, 'blacklisted');
      redisClient.getClient.expire(authTokenInRedis, AUTH_TOKEN_EXPIRATION);

      if (authTokenInRedis) {
        redisClient.getClient.del(refreshToken);
      }
    }

    return {
      success: true,
    };
  }

  public refreshToken = async (refreshToken: string) => {
    let authTokenInRedis;
    let redisIsDown = false;

    if (redisClient.getClient && redisClient.getClient.connected) {
      authTokenInRedis = await redisClient.getAsync(refreshToken);
    } else {
      redisIsDown = true;
    }

    if (authTokenInRedis || redisIsDown) {
      const user = await this.validateRefreshToken(refreshToken);
      const authToken = this.createToken(user);

      return authToken;
    } else {
      throw new HttpException(401, 'Refresh token expired - session ended.');
    }
  };

  private validateRefreshToken = async (refreshToken: string) => {
    const secret = process.env.REFRESH_TOKEN_SECRET;

    try {
      jwt.verify(refreshToken, secret);
    } catch (error) {
      this.logout(refreshToken);

      throw new HttpException(401, 'Refresh token expired - session ended.');
    }

    try {
      const user = await this.user.findOne({ refreshToken });

      return user;
    } catch (error) {
      throw new HttpException(500, 'Something went wrong!');
    }
  };

  private createToken(user: User): TokenData {
    const expiresInMS = AUTH_TOKEN_EXPIRATION * 1000;
    const expiresAt = new Date(Date.now() + expiresInMS).getTime();
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };

    return {
      expiresAt,
      token: jwt.sign(dataStoredInToken, secret, {
        expiresIn: AUTH_TOKEN_EXPIRATION,
      }),
    };
  }

  private async createRefreshToken(user: User): Promise<string> {
    const secret = process.env.REFRESH_TOKEN_SECRET;

    const refreshToken = jwt.sign({ type: 'refresh' }, secret, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    await this.user.findOneAndUpdate({ email: user.email }, { refreshToken });

    // TODO: Update all depredated mongoose functions. There are warnings in the console, check them all!
    return refreshToken;
  }

  public logUserActivity = (user: User, activity: string) => {
    return LoginActivity.create({ userID: user._id, activityType: activity });
  };
}

export default AuthenticationService;
