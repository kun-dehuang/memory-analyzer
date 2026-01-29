# 部署指南

## 前端部署（GitHub Pages）

### 步骤1：配置GitHub仓库
1. 确保你的代码已经推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
   - 进入仓库 → Settings → Pages
   - Source 选择 `gh-pages` 分支
   - 保存设置

### 步骤2：配置环境变量
1. 在GitHub仓库中设置以下环境变量（Settings → Secrets and variables → Actions）
   - `GITHUB_TOKEN`：自动生成，无需手动设置

### 步骤3：触发部署
1. 推送代码到 `main` 分支，GitHub Actions 会自动触发部署
2. 或在Actions标签页中手动触发 `Frontend Deploy to GitHub Pages` 工作流

### 步骤4：访问前端
部署完成后，前端会通过 `https://<username>.github.io/<repository>` 访问

## 后端部署（Railway）

### 步骤1：创建Railway项目
1. 访问 [Railway](https://railway.app/) 并登录
2. 创建一个新的项目
3. 记录项目ID和服务ID

### 步骤2：配置环境变量
1. 在Railway项目中设置以下环境变量
   - `GEMINI_API_KEY`：Google Gemini API密钥
   - `MONGODB_URI`：MongoDB Atlas连接字符串
   - `DB_NAME`：数据库名称
   - `SECRET_KEY`：JWT密钥

### 步骤3：配置GitHub环境变量
1. 在GitHub仓库中设置以下环境变量（Settings → Secrets and variables → Actions）
   - `RAILWAY_API_TOKEN`：Railway API令牌
   - `RAILWAY_PROJECT_ID`：Railway项目ID
   - `RAILWAY_SERVICE_ID`：Railway服务ID

### 步骤4：触发部署
1. 推送代码到 `main` 分支，GitHub Actions 会自动触发部署
2. 或在Actions标签页中手动触发 `Backend Deploy` 工作流

### 步骤5：访问后端
部署完成后，Railway会为后端生成一个URL

## MongoDB Atlas配置

### 步骤1：创建MongoDB Atlas集群
1. 访问 [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. 创建一个新的集群
3. 配置网络访问（允许所有IP或特定IP）
4. 创建数据库用户并设置密码

### 步骤2：获取连接字符串
1. 在集群页面中点击 "Connect"
2. 选择 "Connect your application"
3. 复制连接字符串，替换 `<password>` 为实际密码

### 步骤3：配置到环境变量
将连接字符串设置为 `MONGODB_URI` 环境变量

## 注意事项

1. **安全性**：不要在代码中硬编码API密钥和密码，使用环境变量管理
2. **性能**：对于大型相册，可能需要调整内存限制和超时设置
3. **可靠性**：建议启用数据库备份和监控
4. **扩展**：随着用户增加，可能需要升级数据库和服务器资源

## 故障排查

### 前端部署失败
- 检查GitHub Actions日志
- 确保 `package.json` 中的 `homepage` 字段正确配置
- 确保构建过程没有错误

### 后端部署失败
- 检查GitHub Actions日志
- 确保所有环境变量都已正确设置
- 确保依赖项安装成功
- 检查Railway服务日志

### 数据库连接失败
- 检查MongoDB Atlas连接字符串
- 确保网络访问配置正确
- 确保数据库用户权限正确

### iCloud照片拉取失败
- 检查iCloud账号密码是否正确
- 确保iCloud账号已启用照片库
- 检查网络连接
