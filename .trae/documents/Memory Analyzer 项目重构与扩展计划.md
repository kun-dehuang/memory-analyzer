# Memory Analyzer 项目重构与扩展计划

## 一、项目架构重构

### 1. 代码结构优化
- **创建模块化目录结构**：
  - `backend/` - 后端服务
    - `app/`
      - `api/` - API 路由
      - `services/` - 业务逻辑
      - `models/` - 数据模型
      - `schemas/` - 数据验证
      - `utils/` - 工具函数
      - `config/` - 配置管理
  - `frontend/` - 前端应用
    - `src/`
      - `components/` - 组件
      - `pages/` - 页面
      - `api/` - API 调用
      - `store/` - 状态管理
      - `utils/` - 工具函数
  - `common/` - 公共代码

### 2. 数据库迁移
- **MongoDB 集成**：
  - 使用 MongoDB Atlas (云服务) 作为数据库
  - 设计数据库 schema：
    - `users` - 用户信息
    - `prompts` - Prompt 模板
    - `prompt_groups` - Prompt 组
    - `memory_records` - 记忆分析记录
    - `photo_metadata` - 照片元数据

## 二、核心功能实现

### 1. 用户管理系统
- **用户注册**：
  - 收集 iCloud 账号、密码、昵称、参考照片
  - 调用 `extract_protagonist.py` 提取人物特征并存储
- **用户登录**：
  - 使用 iCloud 账号密码验证
  - 生成 JWT 令牌用于后续认证

### 2. iCloud 集成
- **照片获取**：
  - 使用 iCloud API 拉取用户照片
  - 实现逻辑：不足 1000 张拉取全量，超过 1000 张只拉取最近 1000 张
  - 过滤重复记录和保存图

### 3. Prompt 管理系统
- **Prompt 组管理**：
  - 支持通过前端页面新增、修改、删除 Prompt 组
  - 每组包含多个相关 Prompt（如 Phase 1、Phase 2、特征提取）
- **Prompt 配置**：
  - 将硬编码的 Prompt 迁移到数据库
  - 支持动态选择 Prompt 组进行分析

### 4. 记忆分析流程
- **分析执行**：
  - 选择 Prompt 组后执行分析
  - 调用 Phase 1 和 Phase 2 分析逻辑
  - 存储分析结果到 MongoDB
- **结果管理**：
  - 支持查看历史分析记录
  - 支持重新生成分析结果

## 三、前端开发

### 1. 页面结构
- **登录/注册页**：用户认证
- **Dashboard**：主控制台
  - 侧边栏：用户信息、Prompt 组、历史记录
  - 主内容区：分析结果展示
- **Prompt 管理页**：Prompt 组配置
- **结果详情页**：详细分析结果展示

### 2. 功能实现
- **用户认证**：登录/注册表单
- **照片管理**：iCloud 照片拉取状态展示
- **Prompt 管理**：Prompt 组的增删改查
- **分析执行**：选择 Prompt 组并执行分析
- **结果展示**：按 Prompt 组分类展示分析结果

## 四、技术栈选择

### 后端
- **语言**：Python 3.9+
- **Web 框架**：FastAPI（异步支持）
- **数据库**：MongoDB Atlas (云服务)
- **认证**：JWT
- **AI 集成**：Google Gemini API
- **iCloud 集成**：pyicloud 或类似库
- **部署**：
  - **GitHub Actions**：CI/CD 流水线
  - **Railway** 或 **Render**：与 GitHub 集成的后端托管服务

### 前端
- **框架**：React 18+
- **状态管理**：Redux Toolkit
- **UI 库**：Ant Design
- **API 调用**：Axios
- **样式**：Tailwind CSS
- **部署**：
  - **GitHub Pages**：静态网站托管
  - **GitHub Actions**：自动化部署流程

## 五、关键技术点

### 1. 异步处理
- 使用 FastAPI 和 motor 实现异步数据库操作
- 使用 asyncio 处理并发任务

### 2. 性能优化
- 照片处理批量化
- 分析结果缓存
- 前端懒加载

### 3. 安全性
- iCloud 密码加密存储
- API 接口认证
- 输入验证
- CORS 配置

### 4. 可扩展性
- 模块化设计
- 配置化 Prompt 管理
- 插件式分析流程

## 六、部署方案

### 1. 前端部署（GitHub Pages）
- **配置**：
  - 在 `package.json` 中添加 `homepage` 字段
  - 配置 GitHub Actions 工作流，在代码推送到 `main` 分支时自动构建和部署
- **步骤**：
  - 构建 React 应用：`npm run build`
  - 部署到 GitHub Pages：`gh-pages -d build`

### 2. 后端部署（与 GitHub 集成的服务）
- **选择**：
  - **Railway**：支持 GitHub 集成，一键部署
  - **Render**：提供免费计划，支持 GitHub 自动部署
- **配置**：
  - 连接 GitHub 仓库
  - 设置环境变量（MongoDB 连接字符串、API 密钥等）
  - 配置启动命令

### 3. 数据库部署（MongoDB Atlas）
- **配置**：
  - 创建 MongoDB Atlas 集群
  - 设置数据库用户和权限
  - 配置网络访问控制
  - 获取连接字符串并配置到后端环境变量

## 七、实施步骤

1. **搭建基础架构**：创建目录结构，配置依赖
2. **数据库集成**：创建 MongoDB Atlas 集群，实现连接和模型设计
3. **后端 API 开发**：实现用户管理、Prompt 管理、分析执行等 API
4. **前端框架搭建**：创建 React 应用，配置路由和状态管理
5. **前端页面开发**：实现登录、Dashboard、Prompt 管理等页面
6. **iCloud 集成**：实现照片拉取功能
7. **分析流程集成**：将现有分析逻辑迁移到新架构
8. **部署配置**：配置 GitHub Pages 和后端托管服务
9. **测试与优化**：进行功能测试和性能优化
10. **文档编写**：更新 README.md，添加部署和使用说明

## 八、预期成果

- **完整的 Web 应用**：支持用户注册、登录、管理 Prompt、执行分析、查看结果
- **GitHub 一站式部署**：前端通过 GitHub Pages，后端通过集成服务
- **可扩展架构**：模块化设计，易于添加新功能
- **用户友好界面**：直观的操作流程，美观的结果展示
- **高效的分析流程**：优化的照片处理和分析执行
- **安全可靠**：完善的认证和数据保护机制