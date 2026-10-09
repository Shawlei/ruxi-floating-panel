# 悬浮窗面板（ruxi-floating-panel）

为「入戏（ai-rp-chat）」扩展运行时提供的插件：启用后把扩展面板切换为**可拖动悬浮窗**形态，卸载/禁用后主项目会自动回退默认形态。

## 作用

- 入口脚本启动即调用 `API.setPanelMode('floating')`，声明悬浮窗形态（失败静默，不阻断）。
- 面板 UI 极简：一张说明卡片 + 两个切换按钮（「切换到悬浮窗」/「切回默认面板」），切换后展示结果提示。
- 可选地用 `extension_settings` 记录 `enabled` 标志（形态本身由主项目决定，本插件不做多余设计）。

## 契约

入口脚本通过 `window.__ruxiRequire('script.js')` 获取宿主 API（对应主项目 `client/src/lib/extension-runtime.ts` 的 `buildScript()` 返回对象），其中新增：

- `API.setPanelMode(mode)`：`mode` 为 `'floating'` 或 `'default'`，返回 Promise。
- `API.getPanelMode()`：返回当前形态字符串。
- `API.saveSettingsDebounced()`：落盘扩展设置。

扩展设置通过全局 `extension_settings` 读写（自动持久化）。面板 UI = 入口脚本渲染进 iframe `document.body` 的 DOM。

## 文件结构

```
ruxi-floating-panel/
├── manifest.json      # {"name":"悬浮窗面板","version":"1.0.0","js":"index.js",...}
├── index.js           # 入口（IIFE，无 import/export/import.meta）
├── README.md
└── scripts/
    └── verify.js      # 自验脚本（new Function + 最小桩真正执行 index.js）
```

## 用法

1. 将本目录作为扩展安装/启用。
2. 启用后，扩展面板自动切换为悬浮窗，可拖动、位置自动记忆。
3. 在面板卡片中可随时在「悬浮窗」与「默认面板」之间切换。

## 自验

```bash
node --check index.js   # 语法检查
node scripts/verify.js  # 行为断言（启动调用 + 两个按钮回调）
```

自验脚本用 `new Function` + 最小桩（stub `window.__ruxiRequire('script.js')` 返回 `{ setPanelMode, getPanelMode }`，stub `extension_settings` 与最小 DOM），真正执行 `index.js`，断言：

1. 启动即调用 `setPanelMode('floating')`；
2. 两个按钮回调分别调用 `setPanelMode('floating')` / `setPanelMode('default')`。
