# Pet API 完整总结

**版本**: 1.0.0 | **完成日期**: 2025-11-01 | **状态**: ✅ 已完成并测试

---

## 📋 功能概览

Pet API 实现了宠物档案管理的核心功能，包括：
- ✅ 宠物 CRUD（创建、读取、更新、删除）
- ✅ 多成员共享机制（主主人 + 共享成员）
- ✅ 细粒度权限控制
- ✅ 软删除支持
- ✅ 完整的输入验证和错误处理

---

## 🔌 API 端点列表

### 1. 创建宠物
```http
POST /api/pets
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "小白",              // 必填：宠物名称
  "species": "cat",            // 必填：物种（cat/dog/bird/rabbit/reptile/fish/other）
  "breed": "英国短毛猫",        // 可选：品种
  "sex": "male",               // 可选：性别（male/female/unknown）
  "birthDate": "2023-01-15",   // 可选：生日（ISO 8601 日期）
  "color": "白色",             // 可选：颜色
  "settings": {                // 可选：个性化设置
    "isPublic": false,
    "allowComments": true
  }
}
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "小白",
    "species": "cat",
    "breed": "英国短毛猫",
    "sex": "male",
    "birthDate": "2023-01-15",
    "color": "白色",
    "primaryOwnerId": "user-uuid",
    "settings": { "isPublic": false, "allowComments": true },
    "createdAt": "2025-11-01T...",
    "updatedAt": "2025-11-01T..."
  }
}
```

**权限**: 任何已认证用户可创建宠物，创建者自动成为主主人

---

### 2. 获取我的所有宠物
```http
GET /api/pets
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "小白",
      "species": "cat",
      "breed": "英国短毛猫",
      "sex": "male",
      "birthDate": "2023-01-15",
      "color": "白色",
      "primaryOwnerId": "user-uuid",
      "settings": {},
      "createdAt": "2025-11-01T...",
      "updatedAt": "2025-11-01T...",
      "owners": [
        {
          "userId": "user-uuid",
          "role": "primary",
          "note": null,
          "addedAt": "2025-11-01T..."
        }
      ]
    }
  ],
  "count": 1
}
```

**权限**: 返回用户作为主主人或共享成员的所有宠物

---

### 3. 获取宠物详情
```http
GET /api/pets/:id
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "小白",
    "species": "cat",
    // ... 其他字段
    "owners": [
      {
        "userId": "user-uuid",
        "role": "primary",
        "note": null,
        "addedAt": "2025-11-01T...",
        "user": {
          "id": "user-uuid",
          "username": "testuser",
          "profile": {
            "displayName": "测试用户",
            "avatarUrl": null
          }
        }
      }
    ]
  }
}
```

**权限**: 仅主主人和共享成员可查看

---

### 4. 更新宠物信息
```http
PATCH /api/pets/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体** (所有字段可选):
```json
{
  "name": "小白白",
  "breed": "英短",
  "color": "纯白色",
  "settings": {
    "isPublic": true
  }
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "小白白",
    // ... 更新后的完整信息
  }
}
```

**权限**: 仅主主人可更新

---

### 5. 删除宠物（软删除）
```http
DELETE /api/pets/:id
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "Pet deleted successfully"
}
```

**权限**: 仅主主人可删除  
**说明**: 软删除，设置 `deletedAt` 字段，不物理删除数据

---

### 6. 添加宠物共享成员
```http
POST /api/pets/:id/owners
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "userId": "target-user-uuid",  // 必填：要添加的用户 ID
  "role": "family",              // 必填：角色（family/friend/vet/other）
  "note": "我的家人"             // 可选：备注
}
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "petId": "pet-uuid",
    "userId": "target-user-uuid",
    "role": "family",
    "note": "我的家人",
    "addedAt": "2025-11-01T..."
  }
}
```

**权限**: 主主人和现有共享成员都可以添加新成员  
**限制**: 
- 不能重复添加同一用户
- 不能添加不存在的用户

---

### 7. 移除宠物共享成员
```http
DELETE /api/pets/:id/owners/:userId
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "Pet owner removed successfully"
}
```

**权限**: 仅主主人可移除成员  
**限制**: 不能移除主主人自己

---

## 🔐 权限模型

### 角色定义

| 角色 | 代码 | 权限 |
|------|------|------|
| **主主人** | `primary` | 完全控制：CRUD、添加/移除成员 |
| **家人** | `family` | 查看、添加新成员 |
| **朋友** | `friend` | 查看、添加新成员 |
| **兽医** | `vet` | 查看、添加新成员 |
| **其他** | `other` | 查看、添加新成员 |

### 权限矩阵

| 操作 | 主主人 | 共享成员 |
|------|--------|----------|
| 查看宠物 | ✅ | ✅ |
| 创建宠物 | ✅ | - |
| 更新宠物 | ✅ | ❌ |
| 删除宠物 | ✅ | ❌ |
| 添加成员 | ✅ | ✅ |
| 移除成员 | ✅ | ❌ |

---

## 📊 数据模型

### Pet 表
```prisma
model Pet {
  id             String    @id @default(uuid)
  name           String    // 宠物名称
  species        String    // 物种
  breed          String?   // 品种
  sex            String?   // 性别
  birthDate      DateTime? // 生日
  color          String?   // 颜色
  avatarAssetId  String?   // 头像素材 ID
  primaryOwnerId String    // 主主人 ID
  settings       Json      // 个性化设置
  createdAt      DateTime
  updatedAt      DateTime
  deletedAt      DateTime? // 软删除
  
  // 关系
  primaryOwner User
  owners       PetOwner[]
  assets       PetAsset[]
  // ... 其他关系
}
```

### PetOwner 表（共享关系）
```prisma
model PetOwner {
  petId   String
  userId  String
  role    String   // 'primary' | 'family' | 'friend' | 'vet' | 'other'
  note    String?  // 备注
  addedAt DateTime
  
  // 关系
  pet  Pet
  user User
  
  @@id([petId, userId])
}
```

---

## 🧪 测试覆盖

### 自动化测试（17 个测试用例）

**功能测试**:
1. ✅ 创建宠物 - 基础功能
2. ✅ 创建多个不同物种的宠物（cat/dog/bird/rabbit/reptile/fish/other）
3. ✅ 获取用户的所有宠物
4. ✅ 获取宠物详情
5. ✅ 更新宠物信息
6. ✅ 添加共享成员
7. ✅ 共享成员无法修改宠物
8. ✅ 移除共享成员
9. ✅ 删除宠物（软删除）

**验证测试**:
10. ✅ 缺少必填字段（name, species）
11. ✅ 无效的枚举值（species, sex, role）

**认证测试**:
12. ✅ 未认证访问返回 401

**权限测试**:
13. ✅ 非主人无法修改宠物
14. ✅ 非主人无法删除宠物
15. ✅ 资源不存在返回 404
16. ✅ 不能移除主主人
17. ✅ 只有主主人可以移除成员

**运行测试**:
```bash
cd backend
node scripts/test-pet-api.js
```

**测试文件**:
- `backend/scripts/test-pet-api.js` - 自动化测试脚本
- `backend/pet-api-tests.http` - HTTP 客户端测试集合

---

## 🚨 错误处理

### 常见错误响应

**400 Bad Request** - 验证错误:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "species",
        "message": "\"species\" must be one of [cat, dog, bird, rabbit, reptile, fish, other]"
      }
    ]
  }
}
```

**401 Unauthorized** - 未认证:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden** - 权限不足:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only primary owner can update pet"
  }
}
```

**404 Not Found** - 资源不存在:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Pet not found"
  }
}
```

**409 Conflict** - 冲突:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "User is already an owner of this pet"
  }
}
```

---

## 📝 使用示例

### 场景 1: 创建宠物并分享给家人

```bash
# 1. 用户 A 登录
POST /api/auth/login
{ "email": "userA@example.com", "password": "password" }
# 获得 tokenA

# 2. 用户 A 创建宠物
POST /api/pets
Authorization: Bearer tokenA
{
  "name": "小白",
  "species": "cat",
  "breed": "英短"
}
# 获得 petId

# 3. 用户 B 登录（家人）
POST /api/auth/login
{ "email": "userB@example.com", "password": "password" }
# 获得 userB_id

# 4. 用户 A 添加用户 B 为共享成员
POST /api/pets/{petId}/owners
Authorization: Bearer tokenA
{
  "userId": "{userB_id}",
  "role": "family",
  "note": "我的妻子"
}

# 5. 用户 B 现在可以查看宠物
GET /api/pets/{petId}
Authorization: Bearer tokenB
```

### 场景 2: 更新宠物信息

```bash
# 只有主主人可以更新
PATCH /api/pets/{petId}
Authorization: Bearer tokenA
{
  "name": "小白白",
  "color": "纯白色",
  "settings": {
    "isPublic": true,
    "allowComments": true
  }
}
```

### 场景 3: 移除共享成员

```bash
# 只有主主人可以移除
DELETE /api/pets/{petId}/owners/{userB_id}
Authorization: Bearer tokenA
```

---

## 🏗️ 技术实现

### 架构分层
```
Routes (petRoutes.js)
  ↓
Controllers (petController.js)
  ↓
Services (petService.js)
  ↓
Repositories (petRepository.js)
  ↓
Prisma Client
  ↓
PostgreSQL
```

### 关键技术点

1. **输入验证**: 使用 Joi schemas 进行请求体验证
2. **认证**: JWT Bearer Token 认证
3. **权限控制**: 基于角色的访问控制（RBAC）
4. **错误处理**: 统一的错误处理中间件
5. **日志追踪**: Winston + Request ID
6. **软删除**: 保留历史数据，设置 deletedAt 字段

### 文件结构
```
backend/src/pet/
├── controllers/
│   └── petController.js       # HTTP 请求处理
├── services/
│   └── petService.js          # 业务逻辑
├── repositories/
│   └── petRepository.js       # 数据访问
└── routes/
    └── petRoutes.js           # 路由定义
```

---

## 🔄 后续扩展

### 已规划功能（阶段 3）
- [ ] 素材池管理（照片/视频上传）
- [ ] 体重记录
- [ ] 喂养记录
- [ ] 疫苗记录
- [ ] 用药记录
- [ ] 提醒系统

### 可能的优化
- [ ] 批量操作 API
- [ ] 宠物搜索和过滤
- [ ] 分页支持
- [ ] 缓存优化（Redis）
- [ ] 实时通知（WebSocket）

---

## 📚 相关文档

- [PROJECT-GUIDELINES.md](../PROJECT-GUIDELINES.md) - 项目开发基准
- [错误处理快速参考.md](./错误处理快速参考.md) - 错误处理指南
- [pet-api-tests.http](../pet-api-tests.http) - HTTP 测试集合
- [scripts/test-pet-api.js](../scripts/test-pet-api.js) - 自动化测试脚本

---

**版本**: 1.0.0 | **完成日期**: 2025-11-01 | **测试通过**: 17/17 ✅

