import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import { AuthContext } from './components/Auth/AuthContext';
import { ErrorNotification } from './components/Error/ErrorNotification';
import { TodoList } from './components/TodoList/TodoList';
import {
  getTodos, addTodo, deleteTodo, updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoCount } from './components/TodoCount/TodoCount';
import { TodoFilter } from './components/Filter/TodoFilter';
import { FilterBy } from './types/FilterType';

export const App: React.FC = () => {
  const user = useContext(AuthContext);
  const newTodoField = useRef<HTMLInputElement>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sortBy, setSortBy] = useState(FilterBy.All);
  const [errorMessage, setErrorMessage] = useState('');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number>(0);

  useEffect(() => {
    if (newTodoField.current) {
      newTodoField.current.focus();
    }
  }, []);

  useEffect(() => {
    newTodoField.current?.focus();
  }, [isAdding]);

  useEffect(() => {
    getTodos(user?.id || 0)
      .then(todosFromServer => setTodos(todosFromServer))
      .catch(() => setErrorMessage('Unable to load data'));
  }, [user]);

  const visibleTodo = todos.filter((todo) => {
    switch (sortBy) {
      case FilterBy.All:
        return todo;

      case FilterBy.Active:
        return !todo.completed;

      case FilterBy.Completed:
        return todo.completed;

      default:
        return true;
    }
  });

  const activeTodo = todos.filter((todo) => {
    return !todo.completed;
  });

  const completedTodo = todos.filter((todo) => {
    return todo.completed;
  });

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setErrorMessage('');

    setNewTodoTitle(value);
  };

  const handleAddNewTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTodoTitle.trim()) {
      setErrorMessage('Title can\'t be empty');

      return;
    }

    setIsAdding(true);
    try {
      const newTodo = await addTodo(newTodoTitle, user?.id || 0);

      setTodos(prevTodos => [...prevTodos, newTodo]);
      setNewTodoTitle('');
    } catch {
      setErrorMessage('Unable to add a todo');
    }

    setIsAdding(false);
  };

  const handleDeleteTodo = async (todoId: number) => {
    setIsLoading(true);
    setSelectedTodoId(todoId);
    try {
      await deleteTodo(todoId);

      setIsLoading(false);
      setSelectedTodoId(0);

      setTodos([...visibleTodo].filter((todo) => todo.id !== todoId));
    } catch {
      setErrorMessage('Unable to delete a todo');
    }
  };

  const deleteCompletedTodo = () => {
    try {
      completedTodo.map((todo) => deleteTodo(todo.id));
      setTodos([...todos].filter(todo => !todo.completed));
    } catch {
      setErrorMessage('Unable to delete a todos');
    }
  };

  const handleUpdateTodo = async (todo: Todo) => {
    const { id, completed } = todo;

    setIsLoading(true);
    setSelectedTodoId(id);
    try {
      updateTodo(id, { completed: !completed });
      const currentTodo = todo;

      currentTodo.completed = !currentTodo.completed;

      setSelectedTodoId(id);

      setTodos([...todos]);
    } catch {
      setErrorMessage('Unable to update a todo');
    }
  };

  function checkAllCompleteTodo(todo: Todo) {
    updateTodo(todo.id, { completed: !todo.completed });
    const currentTodo = todo;

    currentTodo.completed = !currentTodo.completed;
  }

  const handleCheckAllTodo = () => {
    if (activeTodo.length > 0) {
      activeTodo.forEach((todo) => {
        checkAllCompleteTodo(todo);
      });
    } else {
      todos.forEach((todo) => {
        checkAllCompleteTodo(todo);
      });
    }

    setTodos([...todos]);
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            aria-label="Toggle All Todo"
            data-cy="ToggleAllButton"
            type="button"
            className="todoapp__toggle-all active"
            onClick={handleCheckAllTodo}
          />

          <form onSubmit={handleAddNewTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              ref={newTodoField}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={handleInput}
              disabled={isAdding}
            />
          </form>
        </header>

        <TodoList
          todos={visibleTodo}
          onDelete={handleDeleteTodo}
          isAdding={isAdding}
          newTodoTitle={newTodoTitle}
          isLoading={isLoading}
          handleUpdateTodo={handleUpdateTodo}
          selectedTodoId={selectedTodoId}
          setSelectedTodoId={setSelectedTodoId}
        />

        <footer className="todoapp__footer" data-cy="Footer">
          <TodoCount activeTodo={activeTodo} />
          <TodoFilter
            setSortBy={setSortBy}
            clearAllCompleted={deleteCompletedTodo}
            completedTodo={completedTodo}
          />
        </footer>

      </div>
      {errorMessage
        && (
          <ErrorNotification
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        )}

    </div>
  );
};
