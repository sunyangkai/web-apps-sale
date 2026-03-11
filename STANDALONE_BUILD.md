# Sale 独立页面构建说明

## 项目结构

```
packages/sale/
├── src/
│   ├── App.jsx                    # 主应用（在 Host 中使用）
│   ├── index.js                   # 主应用入口
│   ├── components/                # 共享组件
│   │   ├── CampaignList.jsx
│   │   └── CampaignDetail.jsx
│   └── standalone/                # 独立页面
│       └── campaign/
│           ├── index.js           # 独立页面入口
│           ├── bootstrap.js
│           ├── App.jsx            # 独立页面应用
│           └── App.css
├── public/
│   ├── index.html                 # 主应用 HTML
│   └── standalone.html            # 独立页面 HTML
└── webpack.config.js              # 统一配置（通过 BUILD_MODE 环境变量控制）
```

## 开发模式

### 主应用开发

```bash
# 主应用模式（默认）
pnpm dev
# 访问 http://localhost:3002
# 或在 Host 中访问 http://localhost:3100/sale
```

### 独立页面开发

```bash
# 独立页面模式（BUILD_MODE=standalone）
pnpm dev:h5
# 访问 http://localhost:3003?id=123
```

**原理：** 通过 `BUILD_MODE` 环境变量控制 webpack.config.js 的行为

## 构建部署

### 主应用构建

```bash
# 默认模式（BUILD_MODE=main）
pnpm build

# 产物在 dist/ 目录
dist/
├── index.html
├── remoteEntry.js  # Module Federation 入口
└── ...
```

### 独立页面构建

```bash
# 独立页面模式（BUILD_MODE=standalone）
pnpm build:h5

# 产物在 dist-standalone/campaign/ 目录
dist-standalone/campaign/
├── index.html
├── main.[hash].js
├── vendors.[hash].js
└── common.[hash].js
```

**注意：** 独立页面**不包含** remoteEntry.js，因为不需要 Module Federation

## 部署示例

### 主应用部署

```bash
# 部署到 CDN（被 Host 加载）
rsync -avz dist/ user@cdn:/var/www/sale/

# 访问地址（通过 Host）
https://cdn.example.com/host/  → 主应用入口
https://cdn.example.com/host/sale → sale 模块
```

### 独立页面部署

```bash
# 部署到 H5 服务器（独立访问）
rsync -avz dist-standalone/campaign/ user@h5:/var/www/campaign/

# 访问地址（独立访问）
https://h5.example.com/campaign/?id=123
```

## 使用场景

### 场景1：微信分享活动页

```
用户点击微信分享链接
  ↓
https://h5.example.com/campaign/?id=123
  ↓
直接打开独立活动页，无需加载主应用
```

**优势：**
- 加载更快（无主应用框架）
- 包体积更小
- 适合移动端

### 场景2：短链跳转落地页

```
短链: https://short.link/abc
  ↓ 302 跳转
https://h5.example.com/campaign/?id=123&utm_source=wechat
```

### 场景3：广告落地页

```
广告平台投放
  ↓
https://h5.example.com/campaign/?id=special-offer&from=ad
  ↓
独立页面，无干扰，转化率更高
```

## 配置对比

| 项目 | 端口 | 配置文件 | 产物目录 | 访问方式 |
|------|------|---------|---------|---------|
| 主应用 | 3002 | webpack.config.js | dist/ | 通过 Host 访问 |
| 独立页 | 3003 | webpack.standalone.js | dist-standalone/ | 直接访问 |

## 代码复用

独立页面可以复用主应用的组件：

```javascript
// packages/sale/src/standalone/campaign/App.jsx
import CampaignDetail from '../../components/CampaignDetail';  // 复用组件

function StandaloneCampaign() {
  return (
    <div className="standalone-campaign">
      <CampaignDetail campaignId={campaignId} />
    </div>
  );
}
```

**优势：**
- 组件逻辑只写一次
- 主应用和独立页保持一致
- 减少维护成本

## 环境配置

### 开发环境

```bash
pnpm dev:h5
# http://localhost:3003?id=123
```

### 生产环境

```bash
NODE_ENV=production pnpm build:h5
# 产物 publicPath: https://h5.example.com/campaign/
```

修改 publicPath：

```javascript
// webpack.standalone.js
output: {
  publicPath: ENV === 'production'
    ? 'https://h5.example.com/campaign/'
    : 'http://localhost:3003/',
}
```

## 性能优化

### 1. 代码分割

```javascript
// 自动分割 vendors 和 common
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
      },
    },
  },
}
```

### 2. 资源压缩

```javascript
// webpack.standalone.js
optimization: {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true, // 移除 console
        },
      },
    }),
  ],
}
```

### 3. CDN 加速

将静态资源部署到 CDN：

```javascript
output: {
  publicPath: 'https://cdn.example.com/h5/campaign/',
}
```

## 添加新的独立页面

### 1. 创建页面目录

```
src/standalone/
├── campaign/      # 已有：活动页
└── landing/       # 新增：落地页
    ├── index.js
    ├── bootstrap.js
    ├── App.jsx
    └── App.css
```

### 2. 更新 webpack.standalone.js

```javascript
module.exports = {
  entry: {
    campaign: './src/standalone/campaign/index.js',
    landing: './src/standalone/landing/index.js',  // 新增
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/standalone.html',
      filename: 'campaign/index.html',
      chunks: ['campaign'],
    }),
    new HtmlWebpackPlugin({
      template: './public/landing.html',
      filename: 'landing/index.html',
      chunks: ['landing'],  // 新增
    }),
  ],
};
```

### 3. 构建

```bash
pnpm build:h5

# 产物
dist-standalone/
├── campaign/
│   └── index.html
└── landing/
    └── index.html
```

## 总结

**独立页面的本质：**
- ✅ 独立的入口文件（`standalone/*/index.js`）
- ✅ 独立的 webpack 配置（`webpack.standalone.js`）
- ✅ 独立的构建产物（`dist-standalone/`）
- ✅ 可以复用主应用的组件和逻辑

**适用场景：**
- 营销活动 H5 页面
- 分享落地页
- 独立的报表页
- 移动端专属页面

**命令速查：**
```bash
pnpm dev:h5       # 开发独立页面
pnpm build:h5     # 构建独立页面
pnpm dev          # 开发主应用
pnpm build        # 构建主应用
```
