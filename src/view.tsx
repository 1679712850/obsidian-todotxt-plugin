import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { TextFileView } from "obsidian";
import { TodoListView } from "./ui/todolist";

export const VIEW_TYPE_CSV = "todotxt-view";
export type TODO = {
  id: number;
  completed: boolean;
  completedDate?: string;
  priority: string;
  createDate?: string;
  description: string;
};

// x 2020-11-19 2020-11-16 Pay Amex Cash Card Bill (Due Dec 11th) t:2020-11-21 +Home @Bills
// (B) 2020-11-17 Update Mac systems +Home
const TODO_RE = RegExp(
  "^" +
    "((?<completed>x) )?" +
    "(\\((?<priority>[A-Z])\\) )?" +
    "((?<firstDate>[0-9]{4}-[0-9]{2}-[0-9]{2}) )?" +
    "((?<secondDate>[0-9]{4}-[0-9]{2}-[0-9]{2}) )?" +
    "(?<description>.*?)" +
    "$"
);

export class CSVView extends TextFileView {
  todoData: TODO[];
  root: Root;

  // Convert from TODO[] to string before writing to disk
  getViewData() {
    console.log(`[TodoTxt] getViewData`);
    return this.todoData
      .map((todo: TODO) =>
        [
          todo.completed ? "x" : null,
          todo.priority && !todo.completed ? `(${todo.priority})` : null,
          todo.completedDate,
          todo.createDate,
          todo.description,
          todo.priority && todo.completed ? `pri:${todo.priority}` : null,
        ]
          .filter((item) => item)
          .join(" ")
      )
      .join("\n");
  }

  // Convert string from disk to TODO[]
  setViewData(data: string, clear: boolean) {
    console.log(`[TodoTxt] setViewData`);
    this.todoData = data
      .split("\n")
      .filter((line) => line)
      .map((line, id) => {
        const result = TODO_RE.exec(line);
        const groups = result?.groups;
        if (groups) {
          return {
            id,
            completed: !!groups.completed,
            priority: groups.priority ?? "",
            createDate: groups.secondDate ?? groups.firstDate,
            completedDate: groups.secondDate ? groups.firstDate : undefined,
            description: groups.description,
          };
        } else {
          console.error(`[TodoTxt] setViewData: cannot match todo`, line);
          return {
            id,
            completed: false,
            priority: "",
            description: `not parsed: ${line}`,
          };
        }
      });
    console.log(`[TodoTxt] setViewData:`, { todoData: this.todoData });

    this.refresh();
  }

  clear() {
    this.todoData = [];
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
  }

  async onClose() {
    this.root.unmount();
  }

  getViewType() {
    return VIEW_TYPE_CSV;
  }

  update(todos: TODO[]) {
    console.log(`[TodoTxt] update`, { todos });
    this.todoData = todos;
    this.refresh();
    this.requestSave();
  }

  refresh() {
    console.log(`[TodoTxt] refresh:`);
    this.root.render(
      <TodoListView todos={this.todoData} onChange={this.update.bind(this)} />
    );
  }
}
