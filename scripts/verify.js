'use strict';

/**
 * 自验脚本：真正执行 index.js，断言启动调用与两个按钮回调。
 * 使用 new Function + 最小桩，不依赖浏览器。
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const indexJs = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');

// ---- 最小 DOM 桩 ----
function createElement(tag) {
  const node = {
    tagName: String(tag).toUpperCase(),
    className: '',
    textContent: '',
    children: [],
    attributes: {},
    handlers: {},
    appendChild(child) {
      node.children.push(child);
      return child;
    },
    setAttribute(k, v) {
      node.attributes[k] = v;
    },
    get onclick() {
      return node.handlers.click && node.handlers.click[0];
    },
    set onclick(fn) {
      node.handlers.click = [fn];
    },
    click() {
      (node.handlers.click || []).forEach((fn) => fn());
    },
  };
  return node;
}

const document = {
  body: createElement('body'),
  head: createElement('head'),
  createElement,
};

// ---- stub window.__ruxiRequire('script.js') ----
const calls = [];
const setPanelMode = (mode) => {
  calls.push(mode);
  return Promise.resolve();
};
const getPanelMode = () => 'bubble';

const window = {
  __ruxiRequire(name) {
    if (name !== 'script.js') throw new Error('unexpected module: ' + name);
    return { setPanelMode, getPanelMode };
  },
};

// ---- stub extension_settings ----
const extension_settings = {};

// ---- 真正执行 index.js ----
const fn = new Function('window', 'document', 'extension_settings', indexJs);
fn(window, document, extension_settings);

// ---- 递归查找按钮 ----
function collectButtons(node, acc) {
  if (!node) return acc;
  if (node.tagName === 'BUTTON') acc.push(node);
  (node.children || []).forEach((c) => collectButtons(c, acc));
  return acc;
}

async function main() {
  // ① 启动即调用 setPanelMode('bubble')
  assert.strictEqual(calls[0], 'bubble', '启动应调用 setPanelMode("bubble")');
  assert.strictEqual(calls.length, 1, '启动阶段应只调用一次 setPanelMode');

  // extension_settings.enabled 被置位
  assert.strictEqual(extension_settings.enabled, true, 'extension_settings.enabled 应为 true');

  // 面板卡片渲染进 body，样式节点挂到 head
  assert.strictEqual(document.body.children.length, 1, 'body 应有卡片一个子节点');
  assert.strictEqual(document.head.children.length, 1, 'head 应有样式一个子节点');

  // ② 两个按钮回调
  const buttons = collectButtons(document.body, []);
  assert.strictEqual(buttons.length, 2, '应恰好渲染两个按钮');
  assert.strictEqual(buttons[0].textContent, '切换到悬浮球');
  assert.strictEqual(buttons[1].textContent, '切回默认面板');

  // 点第一个按钮 -> setPanelMode('bubble')
  buttons[0].click();
  assert.strictEqual(calls[calls.length - 1], 'bubble', '按钮1应调用 setPanelMode("bubble")');

  // 点第二个按钮 -> setPanelMode('default')
  buttons[1].click();
  assert.strictEqual(calls[calls.length - 1], 'default', '按钮2应调用 setPanelMode("default")');

  // 等 Promise 回调，验证结果提示文案
  await new Promise((r) => setTimeout(r, 10));
  const resultNode = collectByClass(document.body, 'result');
  assert.ok(resultNode, '应存在结果提示节点');
  assert.match(resultNode.textContent, /切回默认面板/, '结果提示应反映切回默认面板');

  console.log('PASS: 所有断言通过');
  console.log('  - 启动调用 setPanelMode("bubble")');
  console.log('  - 按钮1 -> setPanelMode("bubble")');
  console.log('  - 按钮2 -> setPanelMode("default")');
  console.log('  - 调用序列:', JSON.stringify(calls));
}

function collectByClass(node, className) {
  if (!node) return null;
  if (node.className && String(node.className).split(' ').includes(className)) return node;
  for (const c of node.children || []) {
    const hit = collectByClass(c, className);
    if (hit) return hit;
  }
  return null;
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
