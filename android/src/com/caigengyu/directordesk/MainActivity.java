package com.caigengyu.directordesk;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * 导演工作台 Android 外壳：内置网页（assets/www）全部离线运行。
 * 补齐 WebView 默认不具备的三件事：文件选择（导入视频/图片/剧本）、文件保存（导出到“下载/DirectorDesk”）、返回键。
 */
public class MainActivity extends Activity {
    private static final int REQ_FILE = 1;
    private static final int REQ_PERM = 2;
    private static final String START_URL = "file:///android_asset/www/index.html";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(0xFF0D1520);
        getWindow().setNavigationBarColor(0xFF0D1520);

        web = new WebView(this);
        web.setBackgroundColor(0xFF0D1520);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(true);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            // API 24+ 的 WebResourceRequest 版本默认会转调这个旧版本
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternal(Uri.parse(url));
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(i, "选择文件"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    toast("没有可用的文件管理器");
                    return false;
                }
                return true;
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                android.util.Log.d("DirectorDesk", m.message() + " @" + m.sourceId() + ":" + m.lineNumber());
                return true;
            }
        });

        if (Build.VERSION.SDK_INT < 29 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_PERM);
        }

        if (state != null) web.restoreState(state);
        else web.loadUrl(START_URL);
    }

    /** 站内 file:// 页面在 WebView 内打开，其它链接交给系统浏览器 */
    private boolean openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if ("file".equals(scheme) || "blob".equals(scheme) || "data".equals(scheme)) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
        }
        return true;
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        if (req != REQ_FILE || fileCallback == null) {
            super.onActivityResult(req, result, data);
            return;
        }
        Uri[] uris = null;
        if (result == RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                uris = new Uri[clip.getItemCount()];
                for (int k = 0; k < clip.getItemCount(); k++) uris[k] = clip.getItemAt(k).getUri();
            } else if (data.getData() != null) {
                uris = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(uris);
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    /**
     * 网页侧的下载（&lt;a download&gt;）被 js/android-bridge.js 拦截后分块传到这里，
     * 保存到 下载/DirectorDesk/。Android 10+ 用 MediaStore（无需权限），更早版本写公共下载目录。
     */
    private class Bridge {
        private final Map<String, OutputStream> streams = new HashMap<String, OutputStream>();
        private final Map<String, String> names = new HashMap<String, String>();
        private int seq = 0;

        @JavascriptInterface
        public String begin(String name, String mime) {
            String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
            try {
                OutputStream os;
                String where;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentResolver cr = getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put("_display_name", safe);
                    v.put("mime_type", mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                    v.put("relative_path", Environment.DIRECTORY_DOWNLOADS + "/DirectorDesk");
                    Uri u = cr.insert(Uri.parse("content://media/external/downloads"), v);
                    if (u == null) throw new Exception("无法创建文件");
                    os = cr.openOutputStream(u);
                    where = "下载/DirectorDesk/" + safe;
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "DirectorDesk");
                    if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                        dir = new File(getExternalFilesDir(null), "DirectorDesk");
                    }
                    if (!dir.exists() && !dir.mkdirs()) throw new Exception("无法创建目录");
                    File f = new File(dir, safe);
                    os = new FileOutputStream(f);
                    where = f.getAbsolutePath();
                }
                String id = "f" + (++seq);
                synchronized (streams) {
                    streams.put(id, os);
                    names.put(id, where);
                }
                return id;
            } catch (Exception e) {
                toast("保存失败：" + e.getMessage());
                return "";
            }
        }

        @JavascriptInterface
        public boolean append(String id, String base64) {
            OutputStream os;
            synchronized (streams) {
                os = streams.get(id);
            }
            if (os == null) return false;
            try {
                os.write(Base64.decode(base64, Base64.DEFAULT));
                return true;
            } catch (Exception e) {
                toast("写入失败：" + e.getMessage());
                return false;
            }
        }

        @JavascriptInterface
        public String end(String id) {
            OutputStream os;
            String where;
            synchronized (streams) {
                os = streams.remove(id);
                where = names.remove(id);
            }
            if (os == null) return "";
            try {
                os.close();
                toast("已保存到 " + where);
                return where;
            } catch (Exception e) {
                toast("保存失败：" + e.getMessage());
                return "";
            }
        }

        @JavascriptInterface
        public boolean isAndroid() {
            return true;
        }
    }
}
