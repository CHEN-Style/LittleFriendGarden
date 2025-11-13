# 多平台开发配置指南

## 问题背景

当你同时在**手机（Expo Go）**和**电脑浏览器（Web）**上测试应用时，会遇到网络地址不一致的问题：
- **手机 Expo Go**：需要使用电脑的局域网 IP（如 `172.20.10.2`）
- **电脑浏览器**：需要使用 `localhost`

## 解决方案

现在 `services/api.js` 已经配置为**自动检测运行平台**，无需手动切换！

### 自动检测逻辑

```
📱 手机 Expo Go  → 使用 MANUAL_DEV_IP (172.20.10.2)
🌐 电脑浏览器    → 自动使用 localhost
🤖 Android 模拟器 → 使用 10.0.2.2
🍎 iOS 模拟器    → 使用 localhost
```

## 使用方法

### 1. 配置后端 IP（仅需一次）

打开 `frontend-js/services/api.js`，找到：

```javascript
// 手动指定开发 IP（用于 Expo Go 手机端）
const MANUAL_DEV_IP = '172.20.10.2';  // 👈 改成你的电脑 IP
```

### 2. 查看你的电脑 IP 地址

在 Windows PowerShell 中运行：

```powershell
ipconfig
```

找到你正在使用的网络适配器（WiFi 或热点），复制 IPv4 地址。

### 3. 确保后端监听所有接口

在 `backend/app.js` 中确保：

```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`后端服务运行在 http://0.0.0.0:${PORT}`);
});
```

**不要** 只监听 `localhost`！

## 测试步骤

### 在手机上测试（Expo Go）

1. 手机开启热点
2. 电脑连接手机热点
3. 启动后端：`cd backend && npm start`
4. 启动前端：`cd frontend-js && npx expo start`
5. 手机扫描二维码

**预期日志：**
```
📱 检测到移动环境，使用手动指定 IP
📡 API URL: http://172.20.10.2:3000/api
```

### 在电脑浏览器上测试（Web）

1. 确保后端正在运行
2. 在前端目录运行 `npx expo start`
3. 按 `w` 键在浏览器中打开

**预期日志：**
```
🌐 检测到 Web 环境，使用 localhost
📡 API URL: http://localhost:3000/api
```

## 常见问题

### Q1: 手机连不上后端？

**检查清单：**
- [ ] 手机和电脑在同一网络
- [ ] `MANUAL_DEV_IP` 设置正确
- [ ] 后端使用 `0.0.0.0` 监听
- [ ] 防火墙允许端口 3000 和 8081

### Q2: 浏览器连不上后端？

**检查：**
- [ ] 后端是否在运行？
- [ ] 访问 `http://localhost:3000/api` 是否有响应？
- [ ] 浏览器控制台是否有 CORS 错误？

### Q3: 如何切换不同的 IP？

只需修改 `api.js` 中的 `MANUAL_DEV_IP`，保存后应用会自动重新加载。

### Q4: 生产环境如何配置？

修改 `api.js`：

```javascript
const PRODUCTION_API_URL = 'https://your-api-domain.com/api';
```

## 调试技巧

### 查看当前使用的 API 地址

打开应用后，查看控制台日志：

```
📡 API URL: http://xxx/api
```

### 测试网络连接

在浏览器中访问：
```
http://localhost:3000/api          （电脑测试）
http://172.20.10.2:3000/api        （手机测试）
```

应该看到后端响应或 404 页面（说明连接成功）。

## 配置文件位置

- **API 配置**：`frontend-js/services/api.js`
- **后端入口**：`backend/app.js`

---

📝 **提示**：每次更改 IP 地址后，Expo 会自动重新加载应用。如果没有，手动在 Expo 界面按 `r` 重新加载。

