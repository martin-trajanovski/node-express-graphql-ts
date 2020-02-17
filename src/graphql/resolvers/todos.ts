import TodosController from '@src/routes/todos/todos.controller';

export default {
  queries: {
    todos: TodosController.getAll,
  },
  mutations: {
    createTodo: TodosController.create,
    updateTodo: TodosController.update,
  },
};
