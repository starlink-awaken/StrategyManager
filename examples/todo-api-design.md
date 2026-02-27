# TODO应用REST API设计

## API概览

一个简单的TODO应用REST API，包含完整的CRUD操作。

## 数据模型

```typescript
interface Todo {
  id: string;           // UUID
  title: string;        // 任务标题
  description?: string; // 可选描述
  completed: boolean;   // 完成状态
  createdAt: string;    // ISO时间戳
  updatedAt: string;    // ISO时间戳
}
```

## 端点

### 1. 获取所有待办事项
- **方法**: GET
- **路径**: `/todos`
- **响应**: `Todo[]`
- **状态码**: 200 OK
- **示例**: `GET http://localhost:3000/todos`

### 2. 获取单个待办事项
- **方法**: GET
- **路径**: `/todos/:id`
- **参数**: `id` (路径参数)
- **响应**: `Todo`
- **状态码**: 200 OK (成功), 404 Not Found (未找到)
- **示例**: `GET http://localhost:3000/todos/123`

### 3. 创建待办事项
- **方法**: POST
- **路径**: `/todos`
- **请求体**:
  ```json
  {
    "title": "任务标题",
    "description": "可选描述"
  }
  ```
- **响应**: `Todo` (新创建的待办事项)
- **状态码**: 201 Created (成功), 400 Bad Request (验证失败)
- **示例**: `POST http://localhost:3000/todos`

### 4. 更新待办事项
- **方法**: PUT
- **路径**: `/todos/:id`
- **参数**: `id` (路径参数)
- **请求体**: 部分`Todo`字段
  ```json
  {
    "title": "新标题",
    "completed": true
  }
  ```
- **响应**: `Todo` (更新后的待办事项)
- **状态码**: 200 OK (成功), 404 Not Found (未找到), 400 Bad Request (验证失败)
- **示例**: `PUT http://localhost:3000/todos/123`

### 5. 删除待办事项
- **方法**: DELETE
- **路径**: `/todos/:id`
- **参数**: `id` (路径参数)
- **响应**: 空
- **状态码**: 204 No Content (成功), 404 Not Found (未找到)
- **示例**: `DELETE http://localhost:3000/todos/123`

## 服务器配置

- **端口**: 3000
- **框架**: Bun.serve (原生Bun HTTP服务器)
- **存储**: 内存存储 (数组/Map)
- **启动**: `bun run examples/todo-api.ts`

## 示例请求

```bash
# 获取所有待办事项
curl http://localhost:3000/todos

# 创建新待办事项
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "学习Bun", "description": "学习Bun框架的基础知识"}'

# 更新待办事项
curl -X PUT http://localhost:3000/todos/123 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 删除待办事项
curl -X DELETE http://localhost:3000/todos/123
```