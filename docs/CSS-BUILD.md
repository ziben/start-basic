# CSS 多环境构建说明

## 概述

项目使用 `postcss-preset-env` 为旧版浏览器编译兼容的 CSS 文件：
- **index.css** - 原始 CSS，直接用于现代浏览器（无需编译）
- **index.legacy.css** - 编译后的 CSS，兼容旧版浏览器

## 工作原理

### 1. PostCSS 配置

`postcss.config.js` 使用 `postcss-preset-env` 根据 `BROWSERSLIST_ENV` 环境变量编译不同版本的 CSS。

### 2. Browserslist 配置

`.browserslistrc` 定义了两个环境：
```
[modern]
last 2 Chrome versions
last 2 Firefox versions
last 2 Safari versions
last 2 Edge versions

[legacy]
defaults
> 0.5%
not dead
```

### 3. 构建脚本

```json
{
  "build": "pnpm run build:css:legacy && vite build",
  "build:css:legacy": "cross-env BROWSERSLIST_ENV=legacy postcss src/styles/index.css -o src/styles/index.legacy.css"
}
```

### 4. 运行时检测

`src/shared/utils/browser-detect.ts` 提供浏览器能力检测：
```typescript
export function isModernBrowser(): boolean
export function getCSSUrl(modernUrl: string, legacyUrl: string): string
```

### 5. 动态导入

`src/routes/__root.tsx` 根据浏览器能力动态选择 CSS 文件：
```typescript
import appCss from '~/styles/index.css?url'
import appCssLegacy from '~/styles/index.legacy.css?url'

// 现代浏览器用原始 CSS，旧浏览器用编译后的 legacy 版本
const cssUrl = getCSSUrl(appCss, appCssLegacy)
```

## 使用方法

### 开发环境

```bash
pnpm dev
```

开发时会自动使用源 CSS 文件。

### 构建生产版本

```bash
pnpm build
```

这会：
1. 先运行 `build:css` 生成 modern 和 legacy 两个 CSS 文件
2. 然后运行 `vite build` 构建应用

### 单独构建 CSS

```bash
# 构建 legacy 版本
pnpm run build:css:legacy
```

## 特性差异

### 原始 CSS（现代浏览器）
- 直接使用源文件，无需编译
- CSS Nesting
- CSS Custom Properties
- Modern selectors (`:is()`, `:where()`)
- 最小的文件体积（~2KB 源文件）

### Legacy CSS（旧版浏览器）
- 转换后的嵌套规则
- Polyfill 的自定义属性
- 兼容旧版浏览器的选择器
- 较大的文件体积（~267KB 编译后）

## 浏览器检测逻辑

运行时检测以下特性来判断是否为现代浏览器：
1. CSS `:is()` 选择器支持
2. CSS 自定义属性支持
3. CSS Grid 支持

如果所有检测通过，使用 modern CSS，否则使用 legacy CSS。

## 注意事项

1. **源文件**: 只需要维护 `src/styles/index.css`，`index.legacy.css` 由构建脚本生成
2. **Git 忽略**: `index.legacy.css` 已添加到 `.gitignore`
3. **构建顺序**: 确保在 `vite build` 之前运行 `build:css:legacy`
4. **SSR**: 服务端渲染时默认使用原始 CSS（现代浏览器）
5. **性能优势**: 现代浏览器直接加载原始 CSS，无需额外编译，体积更小
