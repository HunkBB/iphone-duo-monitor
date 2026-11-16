# Duo Radar · 全国 Apple Store 库存监控

监控 **iPhone Duo 星光白色 256GB（MK2M4CH/A）和 512GB（MK2P4CH/A）**。按 Apple 中国大陆官方目录覆盖 **25 城市、49 门店**。SKU、门店编号和目录均经官方来源核实；不收集 Apple ID，不下单。

- [GitHub 网站](https://hunkbb.github.io/iphone-duo-monitor/)
- [实时服务与网站](https://duo-stock-hangzhou-shanghai-hunkbb.drawnfeast3.chatgpt.site/)

## 查询行为

- 打开页面、切换城市、点击“刷新库存”：向实时后台发出 POST 请求，后台当场查询所选城市的 Apple 官网库存，不读取旧快照。响应明确禁止缓存。
- 网页打开期间每 60 秒自动查询当前城市。浏览器进入后台、休眠或断网时计时器可能暂停，重新显示页面会查询。
- 独立云端任务每小时更新全国快照，关闭页面后仍运行。当前托管平台的任务上限为每小时一次，因此不承诺后台分钟级扫描。该任务独立于 GitHub Actions；创建状态不代表每次执行必然成功，快照时间为准。
- GitHub Actions 只负责代码校验和发布页面，已移除库存定时采集与快照提交。
- 单次查询只覆盖所选城市，避免每次点击遍历全国。全国后台更新最多同时查询3个城市。

## 状态与提醒

有效实时库存超过3分钟标为过期，查询失败显示未知，不回退到旧快照冒充最新结果。后台快照用于记录，网页刷新始终直接查询。状态仅表示门店自提可用性，不代表库存件数，请以 Apple 下单页面为准。

开启到货提醒后需保持网页打开；浏览器允许时发出系统通知，否则页面内提醒。首次有效查询后观察到无货转有货才提醒，关闭页面不发送到货推送。

## 本地开发

Node.js 22+，无需第三方依赖：

```sh
npm test
npm start
# http://127.0.0.1:8787
npm run build
```

## 实时 API

- `GET /api/cities`：官方城市目录与门店数。
- `POST /api/refresh?city=杭州`：当场查询并保存最新库存；返回 `mode: live` 和 `checkedAt`。
- `GET /api/stock?city=杭州`：读取持久化快照；首次无记录时执行查询。

接口只接受内置城市，不支持任意外部URL；浏览器访问允许本站及 `https://hunkbb.github.io`。公开端点无账号凭据，`public/runtime-config.js` 只保存服务地址。相同城市的同时在途查询会合并，连续点击完成后的新请求会重新查询Apple。

存储使用托管平台提供的 R2，按城市保存，条件写入防止旧结果覆盖新结果。`backend.mjs` 同时提供标准 `scheduled` 入口，现有平台由云端任务调用公开实时接口完成后台更新。

Apple 接口非公开承诺稳定的API。成都邮编被拒绝时按官方门店编号回退；失败、字段缺失、机型或颜色不匹配均保持未知。官方目录来源：https://www.apple.com.cn/retail/storelist/ ，目录更新需重新核对门店清单。

## 文件

`store-directory.mjs` 官方城市与门店目录；`stock.mjs` Apple 查询与解析；`backend.mjs` 实时API与存储；`public/index.html` 前端；`scripts/build.mjs` 构建嵌入式Worker及前端目录。`scripts/collect.mjs` 保留为手动诊断工具，不再由 GitHub 定时调用。

## 界面设计

界面精修参考 [unslop](https://heydamir.design/unslop)，作者 Damir Sokolovsky（[@heydamir](https://x.com/heydamir)），CC BY 4.0。设计方向为“准确、安静、利落的库存值守台”。

本项目与 Apple 无关联。
