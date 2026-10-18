#!/usr/bin/env bash
# 构建导演工作台 APK（不依赖 Gradle / Android Studio）
# 需要：aapt、dalvik-exchange(dx)、zipalign、apksigner、android-23 平台 android.jar、JDK
#   Ubuntu: sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
set -euo pipefail
cd "$(dirname "$0")"
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=build
APK_NAME=${APK_NAME:-DirectorDesk.apk}
KS=${KS:-keystore/directordesk.jks}
KS_PASS=${KS_PASS:-directordesk}

rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/obj" "$OUT/assets/www"

# 1) 网页资源：两个工作台（不含测试、工具与 node 配置）
SRC=../director-desk
cp "$SRC/index.html" "$SRC/recast.html" "$OUT/assets/www/"
cp -r "$SRC/css" "$SRC/js" "$OUT/assets/www/"

# 2) 资源 → R.java
aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

# 3) 编译 Java（dx 只认 Java 8 字节码）
javac -nowarn -Xlint:-options --release 8 -encoding UTF-8 -cp "$ANDROID_JAR" -d "$OUT/obj" \
  $(find src "$OUT/gen" -name '*.java')

# 4) 转 dex
dalvik-exchange --dex --min-sdk-version=21 --output="$OUT/classes.dex" "$OUT/obj"

# 5) 打包（资源 + assets + dex）
aapt package -f -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$ANDROID_JAR" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add -k unsigned.apk classes.dex >/dev/null)

# 6) 对齐 + 签名（v1/v2/v3）
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
if [ ! -f "$KS" ]; then
  mkdir -p "$(dirname "$KS")"
  keytool -genkeypair -keystore "$KS" -storepass "$KS_PASS" -keypass "$KS_PASS" -alias directordesk \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Director Desk, O=CAI-GENGYU, C=CN" >/dev/null 2>&1
fi
apksigner sign --ks "$KS" --ks-pass "pass:$KS_PASS" --ks-key-alias directordesk --min-sdk-version 21 \
  --out "$OUT/$APK_NAME" "$OUT/aligned.apk"
apksigner verify --min-sdk-version 21 "$OUT/$APK_NAME"
ls -lh "$OUT/$APK_NAME"
