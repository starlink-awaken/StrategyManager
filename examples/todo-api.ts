#!/usr/bin/env bun

/**
 * 简单的TODO应用REST API
 * 使用Bun.serve实现完整的CRUD操作
 */

// ==================== 类型定义 ====================

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string; // ISO时间戳
  updatedAt: string; // ISO时间戳
}

interface CreateTodoRequest {
  title: string;
  description?: string;
}

interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

// ==================== 内存存储 ====================

class TodoStore {
  private todos: Map<string, Todo> = new Map();
  private idCounter = 1;

  constructor() {
    // 添加一些示例数据
    this.create({
      title: "学习Bun框架",
      description: "了解Bun的基础知识和API"
    });
    this.create({
      title: "实现REST API",
      description: "创建一个简单的TODO应用API"
    });
    this.create({
      title: "编写文档",
      description: "为API添加使用说明和示例",
      completed: true
    });
  }

  // 生成唯一的ID
  private generateId(): string {
    return `todo_${this.idCounter++}`;
  }

  // 获取所有待办事项
  getAll(): Todo[] {
    return Array.from(this.todos.values());
  }

  // 获取单个待办事项
  getById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  // 创建待办事项
  create(data: CreateTodoRequest): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  // 更新待办事项
  update(id: string, data: UpdateTodoRequest): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) {
      return undefined;
    }

    const updatedTodo = {
      ...todo,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  // 删除待办事项
  delete(id: string): boolean {
    return this.todos.delete(id);
  }
}

// ==================== HTTP服务器 ====================

const store = new TodoStore();

// 创建HTTP服务器
const server = Bun.serve({
  port: 3000,
  
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    
    console.log(`${method} ${path}`);

    // 处理CORS预检请求
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    try {
      // 路由处理
      if (path === "/todos") {
        return handleTodos(request, method);
      } else if (path.startsWith("/todos/")) {
        const id = path.substring(7); // 移除 "/todos/"
        return handleTodoById(request, method, id);
      } else {
        return jsonResponse(404, { error: "Not Found", message: `路径 ${path} 不存在` });
      }
    } catch (error) {
      console.error("服务器错误:", error);
      return jsonResponse(500, { error: "Internal Server Error", message: "服务器内部错误" });
    }
  },

  // 服务器启动时的回调
  startup() {
    console.log(`🚀 TODO API服务器启动成功！`);
    console.log(`📡 访问地址: http://localhost:3000`);
    console.log(`📚 可用端点:`);
    console.log(`   GET    /todos        - 获取所有待办事项`);
    console.log(`   POST   /todos        - 创建新的待办事项`);
    console.log(`   GET    /todos/:id    - 获取单个待办事项`);
    console.log(`   PUT    /todos/:id    - 更新待办事项`);
    console.log(`   DELETE /todos/:id    - 删除待办事项`);
    console.log(`\n🔧 使用Ctrl+C停止服务器`);
  },

  // 错误处理
  error(error) {
    console.error("服务器错误:", error);
    return new Response("服务器内部错误", { status: 500 });
  }
});

// ==================== 辅助函数 ====================

function jsonResponse(status: number, data: any): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function parseRequestBody(request: Request): Promise<any> {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await request.json();
    }
    return null;
  } catch (error) {
    throw new Error("无效的JSON请求体");
  }
}

function validateTodoData(data: any): string | null {
  if (!data || typeof data !== "object") {
    return "请求体必须是JSON对象";
  }
  
  if (data.title !== undefined && (typeof data.title !== "string" || data.title.trim() === "")) {
    return "title必须是非空字符串";
  }
  
  if (data.description !== undefined && typeof data.description !== "string") {
    return "description必须是字符串";
  }
  
  if (data.completed !== undefined && typeof data.completed !== "boolean") {
    return "completed必须是布尔值";
  }
  
  return null;
}

// ==================== 路由处理函数 ====================

async function handleTodos(request: Request, method: string): Promise<Response> {
  switch (method) {
    case "GET":
      // 获取所有待办事项
      const todos = store.getAll();
      return jsonResponse(200, { todos });
      
    case "POST":
      // 创建新的待办事项
      const createData = await parseRequestBody(request) as CreateTodoRequest;
      const validationError = validateTodoData(createData);
      
      if (validationError) {
        return jsonResponse(400, { error: "Bad Request", message: validationError });
      }
      
      if (!createData.title || createData.title.trim() === "") {
        return jsonResponse(400, { error: "Bad Request", message: "title字段是必需的" });
      }
      
      const newTodo = store.create(createData);
      return jsonResponse(201, newTodo);
      
    default:
      return jsonResponse(405, { error: "Method Not Allowed", message: `不支持的方法: ${method}` });
  }
}

async function handleTodoById(request: Request, method: string, id: string): Promise<Response> {
  if (!id || id.trim() === "") {
    return jsonResponse(400, { error: "Bad Request", message: "ID不能为空" });
  }

  switch (method) {
    case "GET":
      // 获取单个待办事项
      const todo = store.getById(id);
      if (!todo) {
        return jsonResponse(404, { error: "Not Found", message: `ID为 ${id} 的待办事项不存在` });
      }
      return jsonResponse(200, todo);
      
    case "PUT":
      // 更新待办事项
      const updateData = await parseRequestBody(request) as UpdateTodoRequest;
      const validationError = validateTodoData(updateData);
      
      if (validationError) {
        return jsonResponse(400, { error: "Bad Request", message: validationError });
      }
      
      if (Object.keys(updateData).length === 0) {
        return jsonResponse(400, { error: "Bad Request", message: "至少需要一个更新字段" });
      }
      
      const updatedTodo = store.update(id, updateData);
      if (!updatedTodo) {
        return jsonResponse(404, { error: "Not Found", message: `ID为 ${id} 的待办事项不存在` });
      }
      return jsonResponse(200, updatedTodo);
      
    case "DELETE":
      // 删除待办事项
      const deleted = store.delete(id);
      if (!deleted) {
        return jsonResponse(404, { error: "Not Found", message: `ID为 ${id} 的待办事项不存在` });
      }
      return jsonResponse(204, null);
      
    default:
      return jsonResponse(405, { error: "Method Not Allowed", message: `不支持的方法: ${method}` });
  }
}

// 导出服务器实例以供测试使用
export default server;

// 如果直接运行此文件，启动服务器
if (import.meta.main) {
  console.log("🎯 正在启动TODO应用REST API服务器...");
  // 服务器已经在Bun.serve调用时启动
}