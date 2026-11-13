# Duo Radar · 杭州 / 上海 Apple 库存监控

监控 **iPhone Duo 星光白色 256GB（MK2M4CH/A）和 512GB（MK2P4CH/A）**，覆盖杭州 2 家、上海 8 家 Apple Store。直接请求 Apple 官网门店自提接口，无需 Apple ID、不下单。

- [实时网站](https://duo-stock-hangzhou-shanghai-hunkbb.drawnfeast3.chatgpt.site)：需站点所有者登录；打开时每 60 秒刷新，服务端缓存最长 60 秒。
- [GitHub Pages 备用网站](https://hunkbb.github.io/iphone-duo-monitor/)：GitHub Actions 每 5 分钟计划查询，网页每 60 秒读取快照。调度、构建和发布可能延迟，不能保证秒级。
- [后台运行记录](https://github.com/HunkBB/iphone-duo-monitor/actions)

## 使用

按城市、容量筛选，或只看有货。开启到货提醒后，保持网页打开；浏览器允许通知时会发出系统通知，否则在页面内提醒。仅对首次有效查询之后观察到的“无货→有货”变化提醒；关闭网页不推送通知。GitHub 定时查询仍继续并记录状态变化在 `public/history.json`。

“可取货”只表示官网当次自提状态，不表示库存件数或锁定库存。实时版 3 分钟、备用版 15 分钟以上的数据标记为过期，不计入有货门店。请求失败、商品名称不匹配、响应结构变动、缺失门店均显示未知，不伪装成无货。只显示目标城市，不混入周边城市。

## 本地运行

需要 Node.js 22 或更新版本，无第三方依赖。

```sh
npm test
npm start
# 访问 http://127.0.0.1:8787
npm run collect   # 一次查询，保存库存快照和最近 200 条变化
npm run build     # 构建 Cloudflare Worker 部署文件
```

## GitHub 托管

仓库 Settings → Pages 的 Source 设为 GitHub Actions。`Monitor Apple stock` 工作流支持手动运行，默认每 5 分钟运行。公共仓库长时间没有活动可能被 GitHub 暂停定时工作流；请检查 Actions 状态。GitHub runner 或托管服务到 Apple 的网络可能受到限制；此时网站会显示未知并自动重试，不尝试绕过访问限制。

默认门店清单位于 `stock.mjs`，官方门店新增或关闭时需更新。门店名单来源：https://www.apple.com.cn/retail/storelist/ 。SKU 经 Apple 购买页面核实。Apple 库存接口不是公开承诺稳定的 API，结构变化需要维护解析器。

## 部署结构

`public/index.html` 为完整响应式网页；`stock.mjs` 统一解析官方库存；`worker.mjs` 为实时版请求处理器；`scripts/collect.mjs` 为 GitHub 定时采集器。`npm run build` 将网页与解析器嵌入 `dist/server/index.js`。后台静态快照与实时版按需查询独立运行。

本项目与 Apple 无关联，不收集账号或支付信息。

## 界面设计

本轮界面精修参考 [unslop](https://heydamir.design/unslop)，作者 Damir Sokolovsky（[@heydamir](https://x.com/heydamir)），遵循 CC BY 4.0 署名要求。设计方向为“准确、安静、利落的库存值守台”，保留原有浅色与深绿配色、商品展示及功能顺序，统一文字层级、4px 间距、状态点和键盘焦点。未生成或引入营销图片。
