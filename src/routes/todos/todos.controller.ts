import express from 'express';
import { Types } from 'mongoose';
import * as yup from 'yup';

import { HttpException } from '@src/exceptions';
import { Todo, RequestWithUser } from '@src/interfaces';
import { schemaValidation } from '@src/utils/schemaValidation';
import { validationError } from '@src/utils/validationError';

import { TodoDto } from './todo.dto';
import TodosService from './todos.service';

const createTodoSchema = yup.object().shape({
  title: yup.string().required('Title can not be blank'),
});

const updateTodoSchema = yup.object().shape({
  _id: yup
    .string()
    .length(24)
    .required(),
  title: yup.string().min(1),
  completed: yup.boolean(),
});

class TodosController {
  public todosService = new TodosService();

  public getAll = async (
    parent,
    args,
    request: RequestWithUser
  ): Promise<any> => {
    try {
      const limitTo: number = args.limit ? parseInt(args.limit) : 10;
      const todos = await this.todosService.getAll(limitTo, request.user._id);

      return { data: todos };
    } catch (error) {
      return {
        error: {
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  };

  public create = async (parent, { todoInput }, request): Promise<any> => {
    const errors = await schemaValidation(createTodoSchema, todoInput);

    if (errors) {
      return validationError('Bad request', 400, errors);
    }

    try {
      const todoData: TodoDto = {
        ...todoInput,
        createdBy: request.user._id,
      };

      const todo = await this.todosService.create(todoData);

      return { data: todo };
    } catch (error) {
      return {
        error: {
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  };

  public update = async (parent, { todoUpdateInput }) => {
    try {
      const errors = await schemaValidation(updateTodoSchema, todoUpdateInput);

      if (errors) {
        return validationError('Bad request', 400, errors);
      }

      const todoData: Todo = todoUpdateInput;

      const todo = await this.todosService.update(todoData);

      return {
        data: todo,
      };
    } catch (error) {
      return {
        error: {
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  };

  private remove = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const todoToRemoveId: string = request.params.id;

      // NOTE: Validate id param manually for now. Check if it is possible to do it with express-validator.
      if (!todoToRemoveId || !todoToRemoveId.match(/^[0-9a-fA-F]{24}$/)) {
        const errors = [{ msg: 'Invalid id', param: 'id', location: 'params' }];

        return next(
          new HttpException(400, 'Wrong request params!', { errors })
        );
      }

      const todo = await this.todosService.remove(
        Types.ObjectId(todoToRemoveId)
      );

      response.send({
        success: true,
        todo,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new TodosController();
