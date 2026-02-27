# TODO应用REST API示例

这是一个使用Bun.serve实现的简单TODO应用REST API，包含完整的CRUD操作。

## 快速开始

### 1. 启动服务器

```bash
cd /Volumes/Model/Workspace/Skills/local/StrategyManager
bun run examples/todo-api.ts
```

服务器将在 http://localhost:3000 启动，并显示以下信息：

```
🚀 TODO API服务器启动成功！
📡 访问地址: http://localhost:3000
📚 可用端点:
   GET    /todos        - 获取所有待办事项
   POST   /todos        - 创建新的待办事项
   GET    /todos/:id    - 获取单个待办事项
   PUT    /todos/:id    - 更新待办事项
   DELETE /todos/:id    - 删除待办事项
```

### 2. 使用curl测试API

#### 获取所有待办事项
```bash
curl http://localhost:3000/todos
```

#### 创建新的待办事项
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "学习TypeScript", "description": "学习TypeScript高级特性"}'
```

#### 获取单个待办事项
```bash
# 使用从GET /todos响应中获取的ID
curl http://localhost:3000/todos/todo_1
```

#### 更新待办事项
```bash
curl -X PUT http://localhost:3000/todos/todo_1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true, "title": "更新后的标题"}'
```

#### 删除待办事项
```bash
curl -X DELETE http://localhost:3000/todos/todo_1
```

## API参考

### 数据模型

```typescript
interface Todo {
  id: string;           // 自动生成的唯一ID (如: "todo_1")
  title: string;        // 任务标题
  description?: string; // 可选描述
  completed: boolean;   // 完成状态
  createdAt: string;    // ISO时间戳 (如: "2026-02-27T16:00:00.000Z")
  updatedAt: string;    // ISO时间戳
}
```

### 端点

#### GET `/todos`
获取所有待办事项列表。

**响应示例:**
```json
{
  "todos": [
    {
      "id": "todo_1",
      "title": "学习Bun框架",
      "description": "了解Bun的基础知识和API",
      "completed": false,
      "createdAt": "2026-02-27T16:00:00.000Z",
      "updatedAt": "2026-02-27T16:00:00.000Z"
    }
  ]
}
```

#### POST `/todos`
创建新的待办事项。

**请求体:**
```json
{
  "title": "任务标题",      // 必需
  "description": "描述"     // 可选
}
```

**响应示例:** (状态码: 201 Created)
```json
{
  "id": "todo_2",
  "title": "任务标题",
  "description": "描述",
  "completed": false,
  "createdAt": "2026-02-27T16:01:00.000Z",
  "updatedAt": "2026-02-27T16:01:00.000Z"
}
```

#### GET `/todos/:id`
获取指定ID的待办事项。

**响应示例:** (状态码: 200 OK)
```json
{
  "id": "todo_1",
  "title": "学习Bun框架",
  "description": "了解Bun的基础知识和API",
  "completed": false,
  "createdAt": "2026-02-27T16:00:00.000Z",
  "updatedAt": "2026-02-27T16:00:00.000Z"
}
```

**错误响应:** (状态码: 404 Not Found)
```json
{
  "error": "Not Found",
  "message": "ID为 todo_999 的待办事项不存在"
}
```

#### PUT `/todos/:id`
更新指定ID的待办事项。

**请求体:** (部分更新)
```json
{
  "title": "新标题",     // 可选
  "description": "新描述", // 可选
  "completed": true      // 可选
}
```

**响应示例:** (状态码: 200 OK)
```json
{
  "id": "todo_1",
  "title": "新标题",
  "description": "新描述",
  "completed": true,
  "createdAt": "2026-02-27T16:00:00.000Z",
  "updatedAt": "2026-02-27T16:02:00.000Z"
}
```

#### DELETE `/todos/:id`
删除指定ID的待办事项。

**响应:** 204 No Content (无响应体)

## 错误处理

服务器返回标准HTTP状态码和JSON错误信息：

| 状态码 | 含义 | 示例 |
|--------|------|------|
| 200 | 成功 | 获取/更新成功 |
| 201 | 创建成功 | 新待办事项创建成功 |
| 204 | 删除成功 | 待办事项删除成功 |
| 400 | 请求错误 | 无效的JSON、验证失败 |
| 404 | 未找到 | 待办事项不存在 |
| 405 | 方法不允许 | 不支持的HTTP方法 |
| 500 | 服务器错误 | 服务器内部错误 |

**错误响应格式:**
```json
{
  "error": "错误类型",
  "message": "详细错误信息"
}
```

## CORS支持

API支持跨域请求，设置了以下CORS头：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## 实现细节

### 技术栈
- **运行时**: Bun 1.0+
- **服务器**: `Bun.serve()` (原生HTTP服务器)
- **语言**: TypeScript
- **存储**: 内存存储 (Map数据结构)

### 架构特点
1. **无外部依赖**: 仅使用Bun原生API
2. **内存存储**: 简单易用，重启后数据丢失
3. **完整CRUD**: 支持所有基本操作
4. **输入验证**: 请求体验证和错误处理
5. **CORS支持**: 允许跨域请求

### 扩展建议
1. **持久化存储**: 添加JSON文件或数据库支持
2. **用户认证**: 添加JWT认证
3. **分页支持**: 为GET /todos添加分页
4. **过滤和排序**: 添加查询参数支持
5. **数据导出**: 添加导出功能

## 运行测试

启动服务器后，可以使用以下命令进行完整测试：

```bash
# 测试脚本
./examples/test-api.sh
```

或者手动测试：

```bash
# 1. 获取所有待办事项
curl -s http://localhost:3000/todos | jq

# 2. 创建新待办事项
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "测试任务"}' | jq

# 3. 获取新创建的待办事项
curl -s http://localhost:3000/todos/todo_4 | jq

# 4. 更新待办事项
curl -X PUT http://localhost:3000/todos/todo_4 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}' | jq

# 5. 删除待办事项
curl -X DELETE http://localhost:3000/todos/todo_4 -v
```

## 停止服务器

按 `Ctrl+C` 停止服务器。

## 许可证

此示例代码遵循MIT许可证。