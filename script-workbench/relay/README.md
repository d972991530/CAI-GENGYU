# AI 中转服务：部署到阿里云函数计算

App 和网页版的「自建中转」服务商指向这里。中转带着**你自己的** API Key 去调用上游 AI（默认豆包·火山方舟），用户只拿到你发的**访问口令**：

- Key 只存在阿里云的环境变量里，不会出现在 App、网页或用户手机上；
- 网页版没有跨域问题，国内访问稳定；
- 每个口令每天有次数上限，口令泄露了删掉即可。

> 费用：每次调用都从你的上游账户（火山方舟等）扣费；函数计算按调用量计费，量小时很便宜，以阿里云控制台显示为准。
> 合规：如果面向不特定公众提供、由你承担调用的 AI 服务，请先了解《生成式人工智能服务管理暂行办法》的备案要求；只给自己和少数熟人使用通常不涉及。

## 一、准备上游 Key（以豆包为例）

1. 打开 火山引擎 → 火山方舟控制台（console.volcengine.com/ark），实名认证。
2. 在「开通管理」里开通要用的豆包模型，记下**模型 ID**（形如 `doubao-seed-…`，以控制台为准）。
3. 在「API Key 管理」创建一个 Key。

用 DeepSeek 也可以：Key 在 platform.deepseek.com 创建，后面的 `UPSTREAM_BASE` 改成 `https://api.deepseek.com`，`MODEL` 填 `deepseek-v4-flash`。

## 二、创建函数（阿里云控制台，约 10 分钟）

1. 打开 阿里云 → **函数计算 FC**（fcnext.console.aliyun.com），完成实名认证并开通服务。地域选离用户近的，例如「华东1（杭州）」。
2. 点「创建函数」→ 选 **Web 函数**：
   - 运行环境：**Node.js 20**（18 以上都行）
   - 代码上传方式：**通过 ZIP 包上传代码**，上传 `relay.zip`（就是本目录的 `server.js` 和 `package.json` 打包，**文件直接在压缩包根目录，不要套文件夹**）
   - 启动命令：`node server.js`
   - 监听端口：`9000`
   - 规格：0.5 vCPU / 512 MB 足够
3. 「高级配置」里：
   - 执行超时时间：`300` 秒（长剧本分析一次可能要一两分钟）
   - **环境变量**（重点，逐个添加）：

     | 变量名 | 填什么 |
     |--------|--------|
     | `UPSTREAM_KEY` | 第一步创建的上游 API Key |
     | `UPSTREAM_BASE` | 豆包：`https://ark.cn-beijing.volces.com/api/v3`（DeepSeek 换成 `https://api.deepseek.com`） |
     | `MODEL` | 第一步记下的模型 ID |
     | `ACCESS_CODES` | 自己编几个访问口令，英文逗号隔开，例如 `qiu2026,lao-zhou-x7` |
     | `DAILY_LIMIT` | 每个口令每天最多次数，例如 `200` |
     | `MAX_TOKENS` | 单次最多输出，默认 `8000` 即可 |

4. 「弹性配置 / 实例配置」里把**实例数上限设为 1**（次数限额记在内存里，只有一个实例时才准确；个人和小范围使用完全够）。
5. 「触发器」：Web 函数会自动带一个 **HTTP 触发器**，认证方式选「**无需认证**」（访问控制由口令负责），请求方法勾选 GET、POST、OPTIONS。
6. 创建完成后，在「触发器」页复制**公网访问地址**，形如 `https://xxxx.cn-hangzhou.fcapp.run`。

验证：手机浏览器打开这个地址，看到 `{"ok":true,"service":"script-workbench relay"}` 就说明跑起来了。

> 默认的 `fcapp.run` 地址用于 API 调用没有问题。若要换成自己的域名，大陆地域需要先完成 ICP 备案。

## 三、在 App / 网页版里使用

设置 → AI 服务 → 当前使用选「**自建中转**」：

- 接口地址：上面复制的公网访问地址（只填域名也行，会自动补 `/v1`）
- 模型：`auto`
- API Key：你发给这位用户的**访问口令**

点「测试连接」，显示「连接成功」即可。

## 四、日常管理

- **加人 / 踢人**：改 `ACCESS_CODES` 环境变量并保存，函数会自动重启生效。
- **调整额度**：改 `DAILY_LIMIT`。
- **看用量**：函数「日志」里每次调用记一行：`[口令哈希前 6 位] 模型 -> 状态码 (今日第几次/上限)`，不记录口令本身和写作内容。
- **控制总花费**：在火山方舟（或 DeepSeek）控制台设置余额提醒；必要时直接删除口令或停用函数。

## 本地测试

```bash
UPSTREAM_KEY=你的key MODEL=模型ID ACCESS_CODES=test node server.js
curl -H "Authorization: Bearer test" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"只回复两个字：连通"}]}' \
  http://127.0.0.1:9000/v1/chat/completions
```
