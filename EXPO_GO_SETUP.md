# 📱 Expo Go 连接后端指南

> **🎯 快速开始：** 运行 `.\get-local-ip.ps1` 自动配置网络！

## 🌐 网络连接方式

### 方式 1️⃣：WiFi 热点模式（推荐用于开发）

**设置步骤：**
1. 在 Windows 电脑上开启移动热点
2. 手机连接电脑的热点
3. 电脑的 IP 固定为 `172.20.10.1`（热点网关地址）

**优点：**
- ✅ IP 地址固定，永远是 `172.20.10.1`
- ✅ 不需要每次查 IP
- ✅ 配置一次就够了

**缺点：**
- ❌ 手机无法同时上网（除非电脑本身联网并开启共享）

**配置示例：**
```javascript
const MANUAL_DEV_IP = '172.20.10.1';  // 固定地址
```

---

### 方式 2️⃣：WiFi 路由器模式（推荐用于日常使用）

**设置步骤：**
1. 电脑连接 WiFi 路由器
2. 手机也连接**同一个** WiFi 路由器
3. 查看电脑的 IP 地址（通常是 `192.168.x.x`）

**优点：**
- ✅ 手机可以正常上网
- ✅ 不影响日常使用

**缺点：**
- ⚠️ IP 地址可能会变化（路由器重启/DHCP 租约过期）
- ⚠️ 每次变化后需要重新配置

**配置示例：**
```javascript
const MANUAL_DEV_IP = '192.168.1.100';  // 你的电脑 IP
```

---

## 🔍 如何获取并配置正确的 IP 地址

### ⭐ 方法 A：使用自动配置脚本（强烈推荐）

```powershell
# 在项目根目录运行
.\get-local-ip.ps1
```

**这个脚本会自动完成所有配置：**
- 🔍 检测所有可用的网络接口
- 📋 区分热点 IP、WiFi IP、虚拟网卡
- ✅ 智能推荐最合适的 IP
- 🔧 **自动修改 `api.js` 配置文件**
- 📋 复制 IP 到剪贴板

**使用后无需手动修改任何文件！**

### 方法 B：手动查看

**Windows:**
```powershell
ipconfig
```

**常见 IP 地址类型识别：**

| IP 地址段 | 类型 | 使用场景 |
|-----------|------|----------|
| `172.20.10.x` | WiFi 热点 | 手机连接电脑的热点 ✅ |
| `192.168.1.x` | WiFi 路由器 | 连接家庭/办公室 WiFi ✅ |
| `192.168.0.x` | WiFi 路由器 | 连接家庭/办公室 WiFi ✅ |
| `172.28.x.x` | 虚拟网卡 | WSL/虚拟机，手机无法访问 ❌ |
| `10.x.x.x` | 企业网络 | 大型局域网 ⚠️ |

---

## ✅ 配置步骤

### 3️⃣ 配置前端

修改 `frontend-js/services/api.js`:

```javascript
// 将你的 IP 填入这里
const MANUAL_DEV_IP = '172.20.10.2';  // 替换为你的 IP
```

### 4️⃣ 配置后端

确保后端监听所有网络接口（已配置 ✅）:

```javascript
// backend/app.js
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

### 5️⃣ 启动服务

**后端:**
```bash
cd backend
npm run dev
```

**前端:**
```bash
cd frontend-js
npx expo start
```

用手机扫描二维码即可！

## 🔧 故障排查

### 问题：Network request failed

**解决方案：**
1. 检查手机和电脑是否在同一网络
2. 确认 IP 地址是否正确（重新运行 `ipconfig`）
3. 确认后端正在运行
4. Windows 防火墙可能阻止连接：
   ```powershell
   # 允许 Node.js 通过防火墙
   netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe"
   ```

### 问题：后端启动失败

**解决方案：**
```bash
# 确保所有依赖已安装
cd backend
npm install

# 检查 MongoDB 是否运行
mongod --version
```

## 📝 快速检查清单

- [ ] 手机和电脑在同一网络
- [ ] `MANUAL_DEV_IP` 已设置为正确的 IP
- [ ] 后端正在运行（`npm run dev`）
- [ ] MongoDB 正在运行
- [ ] 防火墙允许 Node.js 连接
- [ ] 用 Expo Go 扫描二维码

## 🎉 成功标志

当你看到这些日志时，说明连接成功：

```
📡 API URL: http://172.20.10.2:3000/api
✅ 注册成功
```

---

**提示：** 每次电脑重新连接网络后，IP 地址可能会变化，记得重新检查！

