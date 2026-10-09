(function () {
  'use strict';

  // 通过宿主扩展运行时获取 API（对应主项目 extension-runtime.ts buildScript() 的返回值）
  var API = null;
  try {
    if (window.__ruxiRequire) {
      API = window.__ruxiRequire('script.js');
    }
  } catch (err) {
    API = null;
  }

  // 非入戏环境或无 setPanelMode 契约时直接退出
  if (!API || typeof API.setPanelMode !== 'function') {
    return;
  }

  // 启动即声明为悬浮窗形态；失败静默，不阻断面板渲染
  try {
    API.setPanelMode('floating');
  } catch (err) {
    /* 静默 */
  }

  // 可选：记录 enabled 标志（形态本身由主项目决定，这里仅做声明 + 提供切换入口）
  try {
    if (extension_settings && typeof extension_settings === 'object') {
      extension_settings.enabled = true;
      if (typeof API.saveSettingsDebounced === 'function') {
        API.saveSettingsDebounced();
      }
    }
  } catch (err) {
    /* 静默 */
  }

  // ---- 面板 UI（渲染进 iframe document.body）----

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function showResult(text, ok) {
    result.textContent = text;
    result.className = 'result ' + (ok ? 'ok' : 'err');
  }

  function applyMode(mode, okText, failText) {
    try {
      var p = API.setPanelMode(mode);
      if (p && typeof p.then === 'function') {
        p.then(
          function () { showResult(okText, true); },
          function () { showResult(failText, false); }
        );
      } else {
        showResult(okText, true);
      }
    } catch (err) {
      showResult(failText + '：' + (err && err.message ? err.message : err), false);
    }
  }

  var card = el('div', 'floating-panel-card');
  var title = el('h3', null, '悬浮窗面板已启用');
  var desc = el('p', null, '扩展面板将以悬浮窗浮在对话界面，可在标题栏拖动、位置自动记忆。');
  var btnFloating = el('button', 'btn', '切换到悬浮窗');
  var btnDefault = el('button', 'btn', '切回默认面板');
  var result = el('p', 'result', '');

  btnFloating.onclick = function () {
    applyMode('floating', '已切换到悬浮窗', '切换到悬浮窗失败');
  };

  btnDefault.onclick = function () {
    applyMode('default', '已切回默认面板', '切回默认面板失败');
  };

  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(btnFloating);
  card.appendChild(btnDefault);
  card.appendChild(result);
  document.body.appendChild(card);

  // 极简内联样式
  try {
    var style = document.createElement('style');
    style.textContent = [
      '.floating-panel-card{font-family:system-ui,-apple-system,sans-serif;padding:16px;max-width:320px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;color:#222;line-height:1.5;box-sizing:border-box}',
      '.floating-panel-card h3{margin:0 0 8px;font-size:16px}',
      '.floating-panel-card p{margin:0 0 8px;font-size:13px;color:#555}',
      '.floating-panel-card .btn{display:inline-block;margin:4px 8px 4px 0;padding:6px 12px;font-size:13px;border:1px solid #ccc;border-radius:4px;background:#f5f5f5;cursor:pointer}',
      '.floating-panel-card .btn:hover{background:#eee}',
      '.floating-panel-card .result{font-size:12px;color:#333;min-height:1em}',
      '.floating-panel-card .result.ok{color:#0a7d32}',
      '.floating-panel-card .result.err{color:#c0392b}'
    ].join('');
    document.head.appendChild(style);
  } catch (err) {
    /* 静默 */
  }
})();
