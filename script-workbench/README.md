# 剧本结构台 · 台词工坊（安卓）

按人物卡和男频/女频短剧赛道规则写台词、分析剧本结构的安卓应用（Capacitor 外壳 + 网页代码）。

- 下载页：https://d972991530.github.io/CAI-GENGYU/
- 所有版本：https://github.com/d972991530/CAI-GENGYU/releases

## 目录

| 路径 | 内容 |
|------|------|
| `www/` | 应用的全部网页代码，改功能就改这里 |
| `www/js/i18n/` | 8 种界面语言的文案 |
| `www/skill/` | 内置的「女频男频短剧编剧」规则库 |
| `android/base.apk` | 安卓外壳（原生部分），打包时把 `www/` 替换进去 |
| `tools/repack.py` | 把 `www/` 打进外壳 APK 的脚本 |
| `site/` | 产品介绍与下载页（GitHub Pages） |
| `version.json` | 当前版本号、更新说明、下载地址；App 启动时读取它判断是否有新版 |

## 自动发布是怎么工作的

改动合并到 `main` 后，`.github/workflows/script-workbench-release.yml` 会自动：

1. 检查 `version.json` 与 `www/js/update.js` 里的版本号一致；
2. 把 `www/` 打进外壳 APK，用仓库 Secrets 里的密钥签名；
3. 创建 GitHub Release `v版本号` 并上传安装包；
4. 发布下载页到 GitHub Pages，`download/script-workbench.apk` 永远指向最新版。

App 每次打开（最多每 12 小时一次）会读取下载页上的 `version.json`，发现新版本就在顶部提示「下载安装」。

## 第一次使用前的设置（只需一次）

1. **添加签名密钥 Secrets**：仓库 Settings → Secrets and variables → Actions → New repository secret，添加 4 个：

   | 名称 | 值 |
   |------|------|
   | `KEYSTORE_BASE64` | 签名密钥文件（.jks）的 base64 文本 |
   | `KEYSTORE_PASSWORD` | 密钥库密码 |
   | `KEY_ALIAS` | 密钥别名 |
   | `KEY_PASSWORD` | 密钥密码 |

   必须一直用同一个密钥，否则用户无法覆盖安装更新。密钥文件和密码不要提交到仓库。

2. **开启 GitHub Pages**：Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。

3. 把包含这些文件的分支合并到 `main`，或在 Actions 页面手动运行一次 `script-workbench release`。

## 发布新版本

1. 修改 `www/` 里的代码；
2. 把 `www/js/update.js` 里的 `VERSION` 和 `version.json` 里的 `version`、`release`、`notes`、`date` 改成新版本；
3. 推送到 `main`，等 Actions 跑完即可。

本地打包测试：

```bash
python3 tools/repack.py android/base.apk www /tmp/unsigned.apk
# 再用 zipalign + apksigner（或 uber-apk-signer）签名
```

## 注意

- 安卓系统里显示的版本号来自外壳（仍为 1.0），以 App「设置 → 关于」里的版本为准。
- 最早的 1.0 原版签名不同，装过原版的用户需要先卸载再安装。
- GitHub 在中国大陆访问可能较慢或不稳定；App 的更新检查会依次尝试 GitHub Pages 和仓库原始文件。
