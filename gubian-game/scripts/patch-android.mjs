// Locks the generated Android project to landscape and fullscreen.
import { readFileSync, writeFileSync } from 'node:fs';

const manifest = 'android/app/src/main/AndroidManifest.xml';
let xml = readFileSync(manifest, 'utf8');
if (!xml.includes('screenOrientation')) {
  xml = xml.replace(
    'android:name=".MainActivity"',
    'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"',
  );
  writeFileSync(manifest, xml);
}

const styles = 'android/app/src/main/res/values/styles.xml';
let s = readFileSync(styles, 'utf8');
if (!s.includes('android:windowFullscreen')) {
  s = s.replace(
    /(<style name="AppTheme.NoActionBar"[^>]*>)/,
    '$1\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>',
  );
  writeFileSync(styles, s);
}
console.log('Android project patched: landscape + fullscreen');
