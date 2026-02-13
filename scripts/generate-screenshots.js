#!/usr/bin/env node
/**
 * サムネイル・スクリーンショットを生成し、thumbnails/ に保存する
 * 実行: npm run screenshots
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const THUMBNAILS_DIR = path.join(ROOT, 'thumbnails');
const PREVIEW_HTML = path.join(ROOT, 'scripts', 'doc-preview.html');

/** キャプチャ対象のHTMLページ一覧 */
const HTML_PAGES = [
  { url: 'lp/pattern_a.html', out: 'lp-pattern_a.png' },
  { url: 'lp/pattern_a_v2.html', out: 'lp-pattern_a_v2.png' },
  { url: 'lp/pattern_a_v3.html', out: 'lp-pattern_a_v3.png' },
  { url: 'lp/pattern_a_v4.html', out: 'lp-pattern_a_v4.png' },
  { url: 'lp/pattern_b.html', out: 'lp-pattern_b.png' },
  { url: 'lp/pattern_c.html', out: 'lp-pattern_c.png' },
  { url: 'mock/index.html', out: 'mock-index.png', viewport: { width: 800, height: 900 } },
];

/** ドキュメント用プレビュー（タイトル＋サブタイトル） */
const DOC_PREVIEWS = [
  { title: 'エグゼクティブサマリー', subtitle: '全体概要・背景・提案内容・期待効果', out: 'doc-executive_summary.png' },
  { title: 'サービスの概要', subtitle: 'サービスコンセプト・ターゲット・主要機能', out: 'doc-service_overview.png' },
  { title: 'ビジネスモデル', subtitle: '収益モデル・オプション比較', out: 'doc-business_model.png' },
  { title: '技術仕様・実装計画', subtitle: '技術スタック・モック画面・成果物', out: 'doc-technical_specification.png' },
  { title: 'プロジェクトスケジュール', subtitle: 'フェーズ・タスク・目安期間', out: 'doc-project_schedule.png' },
  { title: 'ドキュメント README', subtitle: '資料一覧・推奨読了順序', out: 'doc-readme.png' },
];

/** NotebookLM用プレビュー（PDF・オーディオ） */
const NOTEBOOK_PREVIEWS = [
  { title: 'GMAP App Development Strategy', subtitle: 'アプリ開発戦略 PDF', out: 'notebook-app_strategy.png', icon: '📕' },
  { title: 'GMAP Prep - The New Standard', subtitle: '新しい標準のGMAP対策 PDF', out: 'notebook-prep_standard.png', icon: '📕' },
  { title: 'GMAPアプリ開発をモックから始める理由', subtitle: 'NotebookLM オーディオ', out: 'notebook-m4a.png', icon: '🎧' },
];

const WIDTH = 640;
const HEIGHT = 400;

async function captureHtmlPage(browser, { url, out, viewport = { width: WIDTH, height: HEIGHT } }) {
  const filePath = path.join(ROOT, url);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (not found): ${url}`);
    return;
  }

  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(`file://${filePath}`, {
    waitUntil: 'networkidle0',
    timeout: 15000,
  });

  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));

  const outPath = path.join(THUMBNAILS_DIR, out);
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`Saved: ${out}`);
  await page.close();
}

async function captureDocPreview(browser, { title, subtitle, out }) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  await page.goto(`file://${PREVIEW_HTML}?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`, {
    waitUntil: 'networkidle0',
    timeout: 5000,
  });
  await new Promise((r) => setTimeout(r, 200));

  const outPath = path.join(THUMBNAILS_DIR, out);
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`Saved: ${out}`);
  await page.close();
}

async function captureNotebookPreview(browser, { title, subtitle, out, icon = '📕' }) {
  const previewPath = path.join(ROOT, 'scripts', 'notebook-preview.html');
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  await page.goto(`file://${previewPath}?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&icon=${encodeURIComponent(icon)}`, {
    waitUntil: 'networkidle0',
    timeout: 5000,
  });
  await new Promise((r) => setTimeout(r, 200));

  const outPath = path.join(THUMBNAILS_DIR, out);
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`Saved: ${out}`);
  await page.close();
}

async function main() {
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: 'new' });

  for (const p of HTML_PAGES) {
    await captureHtmlPage(browser, p);
  }

  for (const p of DOC_PREVIEWS) {
    await captureDocPreview(browser, p);
  }

  for (const p of NOTEBOOK_PREVIEWS) {
    await captureNotebookPreview(browser, p);
  }

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
