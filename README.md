# tools-page

基于 local-bill 项目复制改造的单页工具入口。

## 功能

- 默认入口为空，由用户点击添加创建
- 点击卡片打开链接
- 长按卡片编辑名称和链接
- 点击加号添加工具
- 右上角齿轮切换编辑模式
- 数据保存在浏览器 localStorage

## 开发

```bash
pnpm install
pnpm run dev
```

## 打包

```bash
pnpm run build
```

构建产物输出到 `docs/`，可用于 GitHub Pages。
