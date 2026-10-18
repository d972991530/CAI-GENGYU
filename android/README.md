# 导演工作台 · Android 安装包

`release/DirectorDesk-0.2.0.apk`：Android 5.0 及以上，安装后桌面图标为“导演工作台”，**完全离线**（网页全部打包在安装包内）。

- 打开后是导演工作台；工具栏“换角预览台 →”进入换角预览台，系统返回键回到上一页。
- “导入素材 / 打开原片 / 导入剧本”等按钮会调起系统文件选择器（可多选）。
- 所有导出（FCPXML、EDL、渲染脚本、分镜板 PNG、整片替换预演视频、工程文件）保存到 **下载/DirectorDesk/**，保存成功会弹出提示。
- 界面为横屏，建议平板或大屏手机使用，可双指缩放。

## 安装
把 APK 传到手机 → 点击安装 → 按提示允许“安装未知来源应用”。这是自签名安装包，没有经过应用商店，系统可能会提示风险，确认即可。

## 自行构建
不需要 Android Studio / Gradle：

```bash
sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23   # Ubuntu
./build.sh          # 产物 build/DirectorDesk.apk
```

`MainActivity.java` 是 WebView 外壳，补上了文件选择、保存到下载目录（Android 10+ 走 MediaStore，无需权限）和返回键三项功能；网页侧的 `director-desk/js/android-bridge.js` 负责拦截下载并分块交给原生层。
`keystore/directordesk.jks` 是自签名的调试级密钥（密码 `directordesk`），升级安装需要用同一把密钥签名。正式上架请换成你自己的密钥。
