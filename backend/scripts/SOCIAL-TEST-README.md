# 社交功能 API 测试指南

本文档说明如何测试社交功能的 API 接口。

## 📋 前置准备

### 1. 确保数据库迁移已完成

```bash
cd backend
npx prisma migrate dev
```

### 2. 启动后端服务器

```bash
cd backend
npm run dev
```

服务器应该在 `http://localhost:3000` 运行。

### 3. 安装测试依赖（如果尚未安装）

```bash
cd backend
npm install axios
```

## 🚀 运行测试

### 运行完整测试套件

```bash
cd backend
node scripts/test-social-api.cjs
```

测试脚本会自动完成以下操作：
1. 注册/登录测试用户
2. 创建话题
3. 创建和管理帖子
4. 创建和管理评论
5. 测试点赞功能
6. 测试搜索功能
7. 清理测试数据

## 📚 API 端点说明

### 话题（Topics）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/topics` | 创建话题 | ✅ |
| GET | `/api/topics` | 获取话题列表 | ❌ |
| GET | `/api/topics/:id` | 获取话题详情 | ❌ |
| PATCH | `/api/topics/:id` | 更新话题 | ✅ |
| DELETE | `/api/topics/:id` | 删除话题 | ✅ |

### 帖子（Posts）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/posts` | 创建帖子 | ✅ |
| GET | `/api/posts` | 获取帖子列表 | ❌ |
| GET | `/api/posts/search` | 搜索帖子 | ❌ |
| GET | `/api/posts/:id` | 获取帖子详情 | ❌ |
| PATCH | `/api/posts/:id` | 更新帖子 | ✅ |
| DELETE | `/api/posts/:id` | 删除帖子 | ✅ |

### 评论（Comments）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/comments` | 创建评论 | ✅ |
| GET | `/api/comments/:id` | 获取评论详情 | ❌ |
| GET | `/api/posts/:postId/comments` | 获取帖子评论 | ❌ |
| PATCH | `/api/comments/:id` | 更新评论 | ✅ |
| DELETE | `/api/comments/:id` | 删除评论 | ✅ |

### 点赞（Reactions）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/posts/:postId/reactions` | 为帖子点赞 | ✅ |
| DELETE | `/api/posts/:postId/reactions` | 移除帖子点赞 | ✅ |
| GET | `/api/posts/:postId/reactions` | 获取帖子点赞列表 | ❌ |
| GET | `/api/posts/:postId/reactions/stats` | 获取帖子点赞统计 | ❌ |
| POST | `/api/comments/:commentId/reactions` | 为评论点赞 | ✅ |
| DELETE | `/api/comments/:commentId/reactions` | 移除评论点赞 | ✅ |
| GET | `/api/comments/:commentId/reactions` | 获取评论点赞列表 | ❌ |
| GET | `/api/comments/:commentId/reactions/stats` | 获取评论点赞统计 | ❌ |

### 举报（Reports）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/reports/posts` | 举报帖子 | ✅ |
| POST | `/api/reports/comments` | 举报评论 | ✅ |
| GET | `/api/reports/posts` | 获取帖子举报列表（管理员）| ✅ |
| GET | `/api/reports/comments` | 获取评论举报列表（管理员）| ✅ |
| GET | `/api/reports/posts/:id` | 获取帖子举报详情（管理员）| ✅ |
| GET | `/api/reports/comments/:id` | 获取评论举报详情（管理员）| ✅ |
| PATCH | `/api/reports/posts/:id` | 处理帖子举报（管理员）| ✅ |
| PATCH | `/api/reports/comments/:id` | 处理评论举报（管理员）| ✅ |

## 🔍 使用 cURL 测试示例

### 1. 注册用户

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### 2. 创建话题

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "宠物健康",
    "description": "分享宠物健康相关的话题",
    "icon": "🏥"
  }'
```

### 3. 创建帖子

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topicId": "TOPIC_ID",
    "title": "我家狗狗的健康小贴士",
    "content": "今天分享一些养狗的健康小贴士...",
    "tags": ["健康", "养狗"]
  }'
```

### 4. 获取帖子列表

```bash
curl -X GET "http://localhost:3000/api/posts?limit=10&offset=0"
```

### 5. 创建评论

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "postId": "POST_ID",
    "content": "很有用的分享！"
  }'
```

### 6. 为帖子点赞

```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/reactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "kind": "like"
  }'
```

支持的点赞类型：
- `like` - 点赞
- `love` - 喜欢
- `haha` - 哈哈
- `wow` - 哇
- `sad` - 难过
- `angry` - 生气

### 7. 搜索帖子

```bash
curl -X GET "http://localhost:3000/api/posts/search?q=健康&limit=10"
```

## 📊 测试数据模型

### 创建话题请求

```json
{
  "name": "话题名称（必填，最多50字符）",
  "description": "话题描述（可选，最多500字符）",
  "icon": "🐶（可选，emoji图标）"
}
```

### 创建帖子请求

```json
{
  "topicId": "话题ID（必填）",
  "title": "帖子标题（必填，最多200字符）",
  "content": "帖子内容（必填，最多10000字符）",
  "images": ["图片URL1", "图片URL2"],
  "tags": ["标签1", "标签2"]
}
```

### 创建评论请求

```json
{
  "postId": "帖子ID（必填）",
  "parentId": "父评论ID（可选，用于回复）",
  "content": "评论内容（必填，最多2000字符）"
}
```

### 创建点赞请求

```json
{
  "kind": "点赞类型（必填：like/love/haha/wow/sad/angry）"
}
```

### 创建举报请求

```json
{
  "postId": "帖子ID（举报帖子时必填）",
  "commentId": "评论ID（举报评论时必填）",
  "reasonCode": "举报原因代码（必填：spam/abuse/harassment/inappropriate/copyright/other）",
  "reasonText": "详细说明（可选）"
}
```

## 🐛 常见问题

### 1. 401 Unauthorized

确保在请求头中包含有效的 JWT token：
```
Authorization: Bearer YOUR_TOKEN
```

### 2. 404 Not Found

- 检查 URL 是否正确
- 确保资源 ID 存在
- 确保服务器正在运行

### 3. 400 Bad Request

检查请求体是否符合要求的数据格式。

### 4. 403 Forbidden

- 对于帖子/评论：只有作者可以修改/删除
- 对于举报处理：需要管理员权限

## 📝 测试检查清单

- [ ] 用户可以创建话题
- [ ] 用户可以获取话题列表
- [ ] 用户可以创建帖子
- [ ] 用户可以获取帖子列表
- [ ] 用户可以搜索帖子
- [ ] 用户可以更新自己的帖子
- [ ] 用户可以删除自己的帖子
- [ ] 用户可以创建评论
- [ ] 用户可以创建回复
- [ ] 用户可以更新自己的评论
- [ ] 用户可以删除自己的评论
- [ ] 用户可以为帖子点赞
- [ ] 用户可以为评论点赞
- [ ] 用户可以移除点赞
- [ ] 用户可以查看点赞统计
- [ ] 用户可以举报帖子/评论
- [ ] 点赞计数正确更新
- [ ] 评论计数正确更新
- [ ] 软删除功能正常工作

## 🎯 下一步

完成测试后，可以：
1. 查看测试覆盖率
2. 添加更多边界情况测试
3. 进行性能测试
4. 集成到 CI/CD 流程

