# 分镜预览台 · 桌面版与安卓版

把 `tools/storyboard-previewer/index.html` 打包成可安装的应用：

| 平台 | 安装包 | 外壳 |
| --- | --- | --- |
| Windows 10/11（64 位） | `StoryboardPreviewer-Setup-<版本>.exe` | Electron |
| 安卓 8.0 及以上 | `StoryboardPreviewer-android.apk` | Capacitor |

两个版本功能相同：导入剧本（PDF / Word / TXT / Markdown / Fountain）、按场次快速拆镜、竖屏 9:16、上传角色资产、俯视走位与越轴检查、导出提示词。解析 PDF 与 Word 的组件已打包进应用，**离线也能用**；只有「Claude 拆镜」需要联网。

## 下载安装包

每次修改预览台或本目录并推送后，GitHub Actions 的「分镜预览台安装包」工作流会自动构建，构建结果在该次运行页面底部的 **Artifacts** 里下载（需要登录 GitHub）。也可以在 Actions 页面手动点 **Run workflow**。

- **Windows**：安装包没有代码签名，首次运行时 SmartScreen 会提示「已保护你的电脑」，点「更多信息 → 仍要运行」。
- **安卓**：这是调试签名的 APK，适合自用和内部分发。安装时需允许「安装未知来源应用」。要上架应用商店，需要另配正式签名。

## Claude 拆镜

应用不在 claude.ai 里运行，所以「Claude 拆镜」改用你自己的 Claude API 密钥：在「剧本 → 分镜」里点 **Claude 设置**，填入在 console.anthropic.com 创建的 API 密钥，并选择模型和思考深度。费用记在你的 Anthropic 账户上；密钥只保存在本机。

默认模型 Claude Opus 5.5，镜头设计最细；Sonnet 5.5 更快更省，Haiku 5.5 最省。

## 本地构建

```bash
cd apps/storyboard-app
npm ci
npm run desktop        # 本机直接运行桌面版
npm run dist:win       # 生成 Windows 安装包（在 Linux 上需要 wine 与 wine32）
npm run android:prepare && cd android && ./gradlew assembleDebug   # 需要 Android SDK 与 JDK 21
```

`npm run build:web` 会生成 `www/`：补全页面骨架、去掉在线字体、把 JSZip 与 pdf.js 换成本地文件，并注入 `src/claude-bridge.js`（用 Anthropic SDK 调用 Claude API）。预览台本身只改 `tools/storyboard-previewer/index.html`，应用会跟着更新。
