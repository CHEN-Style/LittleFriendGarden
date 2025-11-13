# Little Friend Garden - 前端开发进度

**版本**: 1.0.0 | **最后更新**: 2025-11-07 | **状态**: 🟡 P1 开发中

---

## 📋 项目信息

### 技术栈
- **框架**: React Native (Expo)
- **版本**: React 19.1.0, React Native 0.81.5
- **导航**: React Navigation (待集成)
- **状态管理**: Context API / Redux (待决定)
- **HTTP 客户端**: Axios / Fetch (待决定)
- **UI 组件库**: React Native Elements / NativeBase (待决定)

### 后端 API 基础信息
- **Base URL**: `http://localhost:3000/api` (开发环境)
- **认证方式**: JWT Bearer Token
- **API 文档**: 参考 `backend/PROJECT-GUIDELINES.md`

---

## ✅ 已完成功能

### 基础设施
- ⏳ 项目初始化
- ⏳ 导航系统搭建
- ⏳ API 服务层封装
- ⏳ 认证状态管理
- ⏳ 错误处理机制
- ⏳ 加载状态管理

---

## 📱 页面开发进度

### 1. 认证与引导模块

#### 1.1 启动引导页
- ✅ 品牌展示（Logo、应用名称、标语）
- ✅ 登录/注册入口（主要按钮和次要按钮）
- ✅ 功能亮点展示（宠物管理、健康记录、家庭共享）
- ✅ 动画效果（淡入和上滑动画）
- ✅ 设计风格（参考 DSN-GUIDE，使用橙色主题）

#### 1.2 注册页 (`RegisterScreen`)
- ⏳ 邮箱/用户名/手机号输入
- ⏳ 密码输入（含强度提示）
- ⏳ 注册表单验证
- ⏳ 调用 `POST /api/auth/register`
- ⏳ 错误提示处理
- ⏳ 注册成功后跳转

#### 1.3 登录页 (`LoginScreen`)
- ⏳ 邮箱/用户名输入
- ⏳ 密码输入
- ⏳ 调用 `POST /api/auth/login`
- ⏳ Token 存储（AsyncStorage）
- ⏳ 错误提示处理
- ⏳ 登录成功后跳转

#### 1.4 个人资料完善页（可选）
- ⏳ 昵称设置
- ⏳ 简介编辑
- ⏳ 头像上传
- ⏳ 调用 `PATCH /api/auth/me`

---

### 2. 主框架与导航

#### 2.1 底部导航栏 (`BottomTabNavigator`)
- ⏳ Tab 1: 宠物 (`PetsTab`)
- ⏳ Tab 2: 待办 (`TodosTab`)
- ⏳ Tab 3: 日历 (`CalendarTab`)
- ⏳ Tab 4: 社群 (`SocialTab`)
- ⏳ Tab 5: 我的 (`ProfileTab`)

#### 2.2 顶部导航栏
- ⏳ 标题显示
- ⏳ 搜索入口（部分页面）
- ⏳ 通知入口（预留）
- ⏳ 快速创建按钮（部分页面）

---

### 3. 宠物域模块

#### 3.1 宠物列表页 (`PetsListScreen`)
- ⏳ 获取我的所有宠物 `GET /api/pets`
- ⏳ 宠物卡片展示（头像、名字、物种、共享成员数）
- ⏳ 下拉刷新
- ⏳ 点击跳转详情
- ⏳ 创建宠物按钮

#### 3.2 宠物详情页 (`PetDetailScreen`)
- ⏳ 基本信息展示
  - ⏳ 头像、名字、物种、性别、生日、颜色
  - ⏳ 共享成员列表
- ⏳ Tab 切换（体重/喂养/医疗/提醒）
- ⏳ 编辑按钮（权限控制）
- ⏳ 管理共享成员入口

**子页面**:
- ⏳ 体重 Tab (`PetWeightTab`)
  - ⏳ 体重记录列表 `GET /api/pets/:petId/weights`
  - ⏳ 体重折线图（使用图表库）
  - ⏳ 最近记录展示
  - ⏳ 添加体重按钮
- ⏳ 喂养 Tab (`PetFeedingTab`)
  - ⏳ 喂养记录时间线 `GET /api/pets/:petId/feedings`
  - ⏳ 筛选功能（时间范围）
  - ⏳ 添加喂养记录按钮
- ⏳ 医疗 Tab (`PetMedicalTab`)
  - ⏳ 医疗记录列表 `GET /api/pets/:petId/medicals`
  - ⏳ 按类型筛选（疫苗/用药等）
  - ⏳ 添加医疗记录按钮
  - ⏳ 查看详情功能
- ⏳ 提醒 Tab (`PetReminderTab`)
  - ⏳ 提醒列表 `GET /api/pets/:petId/reminders`
  - ⏳ 跳转提醒详情

#### 3.3 创建/编辑宠物页 (`PetFormScreen`)
- ⏳ 基本信息表单
  - ⏳ 名字、物种、性别、生日、颜色
- ⏳ 头像上传（图片选择器）
- ⏳ 调用 `POST /api/pets` 或 `PATCH /api/pets/:id`
- ⏳ 表单验证
- ⏳ 保存成功跳转

#### 3.4 管理共享成员页 (`PetOwnersScreen`)
- ⏳ 成员列表展示
- ⏳ 添加成员功能 `POST /api/pets/:id/owners`
- ⏳ 移除成员功能 `DELETE /api/pets/:id/owners/:userId`
- ⏳ 权限提示

---

### 4. 待办系统模块

#### 4.1 待办列表页 (`TodosListScreen`)
- ⏳ 获取待办列表 `GET /api/todos`
- ⏳ 筛选功能（状态/优先级/时间范围）
- ⏳ 待办卡片展示
- ⏳ 快速完成（打勾）
- ⏳ 滑动操作（归档/删除）
- ⏳ 下拉刷新
- ⏳ 创建待办按钮

#### 4.2 待办详情页 (`TodoDetailScreen`)
- ⏳ 详细信息展示
  - ⏳ 标题、描述、关联宠物、优先级、时间、标签
- ⏳ 编辑按钮
- ⏳ 完成/归档/删除操作
- ⏳ 调用相应 API

#### 4.3 新建/编辑待办页 (`TodoFormScreen`)
- ⏳ 表单字段
  - ⏳ 标题、描述、关联宠物选择、优先级、时间、标签
- ⏳ 调用 `POST /api/todos` 或 `PATCH /api/todos/:id`
- ⏳ 表单验证

#### 4.4 批量操作功能
- ⏳ 批量选择 UI
- ⏳ 批量完成 `POST /api/todos/batch/complete`
- ⏳ 批量归档 `POST /api/todos/batch/archive`

---

### 5. 日历聚合模块

#### 5.1 日历聚合页 (`CalendarScreen`)
- ⏳ Tab 切换（全部/今日/本周/逾期/统计）
- ⏳ 获取日历项目 `GET /api/calendar`
- ⏳ 统一列表展示（待办/提醒）
- ⏳ 图标区分来源类型
- ⏳ 筛选功能（状态/类型/时间范围）
- ⏳ 下拉刷新

#### 5.2 统计视图 (`CalendarStatsScreen`)
- ⏳ 获取统计 `GET /api/calendar/stats`
- ⏳ 饼图/条形图展示（使用图表库）
- ⏳ 待办与提醒数量
- ⏳ 逾期数量

---

### 6. 提醒系统模块

#### 6.1 提醒列表页 (`RemindersListScreen`)
- ⏳ 获取提醒列表 `GET /api/reminders/my`
- ⏳ 按宠物/状态筛选
- ⏳ 提醒卡片展示
- ⏳ 下拉刷新

#### 6.2 提醒详情页 (`ReminderDetailScreen`)
- ⏳ 详细信息展示
  - ⏳ 标题、描述、优先级、计划时间、重复规则
- ⏳ 完成/忽略/删除操作
- ⏳ 调用相应 API

#### 6.3 新建/编辑提醒页 (`ReminderFormScreen`)
- ⏳ 表单字段
  - ⏳ 选择宠物、时间、重复规则、优先级
- ⏳ 调用 `POST /api/pets/:petId/reminders` 或 `PATCH /api/reminders/:id`
- ⏳ 表单验证

---

### 7. 社群域模块

#### 7.1 社交首页/Feed (`SocialFeedScreen`)
- ⏳ 获取帖子列表 `GET /api/posts`
- ⏳ 瀑布流/列表展示
  - ⏳ 帖子标题、作者、时间、点赞数
  - ⏳ 图片/视频展示
- ⏳ 点赞功能 `POST /api/posts/:id/reactions`
- ⏳ 收藏功能（如后端支持）
- ⏳ 点击跳转详情
- ⏳ 下拉刷新
- ⏳ 上拉加载更多

#### 7.2 帖子详情页 (`PostDetailScreen`)
- ⏳ 帖子正文展示
- ⏳ 图片/视频展示
- ⏳ 话题标签展示
- ⏳ 评论列表 `GET /api/posts/:id/comments`
- ⏳ 楼中楼评论展示
- ⏳ 评论点赞功能
- ⏳ 发布评论 `POST /api/posts/:id/comments`
- ⏳ 回复评论功能

#### 7.3 发布帖子页 (`PostCreateScreen`)
- ⏳ 文本输入
- ⏳ 图片/视频选择（多选）
- ⏳ 话题选择
- ⏳ 可见性设置
- ⏳ 允许评论开关
- ⏳ 调用 `POST /api/posts`
- ⏳ 图片上传处理

#### 7.4 帖子搜索/话题页 (`TopicsScreen`)
- ⏳ 搜索框
- ⏳ 热门话题展示 `GET /api/topics`
- ⏳ 话题详情页
  - ⏳ 话题介绍
  - ⏳ 关联帖子列表

---

### 8. 用户中心模块

#### 8.1 个人资料页 (`ProfileScreen`)
- ⏳ 用户信息展示
  - ⏳ 头像、昵称、简介
  - ⏳ 关注/粉丝统计（预留）
- ⏳ 编辑资料按钮

#### 8.2 个人设置页 (`SettingsScreen`)
- ⏳ 修改资料功能
- ⏳ 头像上传
- ⏳ 调用 `PATCH /api/auth/me`
- ⏳ 退出登录功能

---

### 9. 辅助页面

#### 9.1 错误/空状态页
- ⏳ 无数据状态
- ⏳ 网络错误状态
- ⏳ 权限不足状态
- ⏳ 404 错误状态

#### 9.2 加载/刷新指示
- ⏳ 下拉刷新组件
- ⏳ 分页加载指示
- ⏳ 骨架屏（可选）

#### 9.3 权限提示
- ⏳ 访问被移除宠物的提示
- ⏳ 未登录访问受限页面的提示

---

## 🔧 基础设施开发

### API 服务层
- ⏳ API 客户端封装（Axios/Fetch）
- ⏳ 请求拦截器（Token 注入）
- ⏳ 响应拦截器（错误处理）
- ⏳ API 端点常量定义
- ⏳ 各模块 API 方法封装
  - ⏳ Auth API
  - ⏳ Pet API
  - ⏳ Todo API
  - ⏳ Calendar API
  - ⏳ Reminder API
  - ⏳ Social API

### 状态管理
- ⏳ 认证状态管理（Context/Redux）
- ⏳ Token 存储（AsyncStorage）
- ⏳ 用户信息缓存
- ⏳ 全局错误状态

### 导航系统
- ⏳ React Navigation 安装配置
- ⏳ 导航栈定义
- ⏳ 路由参数类型定义
- ⏳ 深层链接支持（可选）

### UI 组件库
- ⏳ 基础组件封装
  - ⏳ Button
  - ⏳ Input
  - ⏳ Card
  - ⏳ List
  - ⏳ Modal
  - ⏳ Loading
  - ⏳ Empty State
- ⏳ 图表组件集成（体重趋势等）

### 工具函数
- ⏳ 日期格式化
- ⏳ 图片处理
- ⏳ 表单验证
- ⏳ 错误消息映射

---

## 📊 开发优先级

### 阶段 1: 基础架构（高优先级）
1. ✅ 项目初始化
2. ⏳ 导航系统搭建
3. ⏳ API 服务层封装
4. ⏳ 认证状态管理
5. ⏳ 基础 UI 组件

### 阶段 2: 核心功能（高优先级）
1. ⏳ 认证流程（登录/注册）
2. ⏳ 宠物管理（列表/详情/创建）
3. ⏳ 待办系统（列表/创建/完成）
4. ⏳ 日历聚合（今日/本周/逾期）

### 阶段 3: 扩展功能（中优先级）
1. ⏳ 提醒系统
2. ⏳ 宠物记录（体重/喂养/医疗）
3. ⏳ 社群功能（Feed/发帖/评论）

### 阶段 4: 优化与完善（低优先级）
1. ⏳ 用户体验优化
2. ⏳ 性能优化
3. ⏳ 错误处理完善
4. ⏳ 无障碍支持

---

## 🧪 测试计划

### 单元测试
- ⏳ API 服务层测试
- ⏳ 工具函数测试
- ⏳ 组件测试

### 集成测试
- ⏳ 认证流程测试
- ⏳ 宠物 CRUD 测试
- ⏳ 待办流程测试

### E2E 测试
- ⏳ 完整用户流程测试
- ⏳ 跨页面导航测试

---

## 📝 待解决问题

### 技术选型
- [ ] 状态管理方案（Context API vs Redux）
- [ ] HTTP 客户端（Axios vs Fetch）
- [ ] UI 组件库（React Native Elements vs NativeBase）
- [ ] 图表库选择（react-native-chart-kit vs victory-native）
- [ ] 图片上传方案（expo-image-picker + 后端上传接口）

### 设计规范
- [ ] 设计系统定义（颜色/字体/间距）
- [ ] 组件样式规范
- [ ] 交互规范

### 性能优化
- [ ] 图片懒加载
- [ ] 列表虚拟化
- [ ] 缓存策略

---

## 📚 相关文档

- [后端 API 文档](../backend/PROJECT-GUIDELINES.md)
- [数据库模型](../backend/docs/数据库模型.md)
- [错误处理指南](../backend/docs/错误处理快速参考.md)

---

## 📞 开发注意事项

1. **API 调用**: 所有 API 调用必须通过封装的 API 服务层
2. **错误处理**: 统一使用错误处理机制，友好提示用户
3. **加载状态**: 所有异步操作必须显示加载状态
4. **权限控制**: 根据用户权限显示/隐藏功能
5. **Token 管理**: Token 过期自动刷新或跳转登录
6. **数据缓存**: 合理使用缓存，减少不必要的 API 调用

---

**最后更新**: 2025-11-07  
**当前阶段**: 项目规划完成，准备开始开发

