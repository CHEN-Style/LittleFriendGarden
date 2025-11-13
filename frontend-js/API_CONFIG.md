# API 配置指南

## 问题说明

在使用 Expo Go 进行开发时，`localhost` 无法正常工作，因为：
- 真机上的 `localhost` 指向的是手机本身，而不是你的开发电脑
- 需要使用你电脑在局域网中的 IP 地址

## 当前情况分析

你的 Expo 使用了**隧道模式**（Tunnel），显示的地址是：
```
yqnakhu-anonymous-8081.exp.direct
```

这是 Expo 的远程隧道服务，但你的后端服务器在本地运行，所以无法通过这个地址访问。

**解决方案：使用手动配置**

## 手动配置步骤（必需）

### 步骤 1：获取你的电脑 IP 地址

**Windows:**
```bash
ipconfig
```
查找 "无线局域网适配器 WLAN" 或 "以太网适配器" 下的 IPv4 地址

**macOS/Linux:**
```bash
ifconfig | grep "inet "
# 或
ip addr show
```

示例 IP：`192.168.1.100`

### 步骤 2：修改配置

打开 `frontend-js/services/api.js`，修改第 19 行：

```javascript
// 修改前
const MANUAL_DEV_IP = null;

// 修改后（填入你的电脑 IP）
const MANUAL_DEV_IP = '192.168.1.100';
```

### 步骤 3：重启应用

保存文件后，在 Expo Go 中重新加载应用（摇动手机 → Reload）

## 确保后端正在运行

在修改前端配置之前，请确保后端服务器正在运行：

```bash
cd backend
npm start
```

应该看到：
```
Server is running on port 3000
Database connected successfully
```

## 网络要求

- 手机和电脑必须连接到**同一个 WiFi 网络**
- 确保防火墙允许端口 3000 的入站连接

**Windows 防火墙设置：**
1. 打开"Windows Defender 防火墙"
2. 点击"高级设置"
3. 点击"入站规则" → "新建规则"
4. 选择"端口" → TCP → 特定本地端口：3000
5. 允许连接

## 测试连接

### 方法 1：使用浏览器测试

在手机浏览器中访问：
```
http://你的电脑IP:3000/api/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "API is running"
}
```

### 方法 2：查看应用日志

在 Expo Go 中，查看控制台输出：
```
📡 API Base URL: http://192.168.x.x:3000/api
🌐 API Request: http://192.168.x.x:3000/api/auth/register POST
✅ API Response: {...}
```

## 常见问题

### 1. 仍然显示 "Network request failed"

**原因：**
- 后端未运行
- IP 地址不正确
- 手机和电脑不在同一 WiFi
- 防火墙阻止连接

**解决方法：**
1. 检查后端是否运行
2. 验证 IP 地址
3. 检查 WiFi 连接
4. 临时关闭防火墙测试

### 2. 自动检测的 IP 不正确

**解决方法：**
使用手动配置，在 `api.js` 中设置 `MANUAL_DEV_IP`

### 3. Android 模拟器连接失败

**解决方法：**
Android 模拟器会自动使用 `10.0.2.2`，这是正确的配置。如果还是失败：
- 确保后端在 `0.0.0.0:3000` 而不是 `localhost:3000` 上监听
- 检查模拟器的网络设置

## 生产环境配置

部署到生产环境时，修改 `api.js` 中的 `PRODUCTION_API_URL`：

```javascript
const PRODUCTION_API_URL = 'https://your-api-domain.com/api';
```

## 调试技巧

### 启用详细日志

所有 API 请求都会在控制台输出：
- 🌐 请求信息
- ✅ 成功响应
- ❌ 错误信息

### 检查网络面板

在 Expo Dev Tools 中可以查看网络请求详情。

### 使用 Postman 测试

先用 Postman 测试 API 端点：
```
POST http://你的电脑IP:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

## 快速检查清单

- [ ] 后端正在运行（`npm start` 在 backend 目录）
- [ ] 手机和电脑在同一 WiFi
- [ ] 防火墙允许端口 3000
- [ ] IP 地址配置正确
- [ ] 应用已重新加载
- [ ] 控制台显示正确的 API URL

