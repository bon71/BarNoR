#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID; // 推奨
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // 代替（"Name" タイトルプロパティ前提）
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

async function createPageUnderPage({ title, markdown }) {
  const body = {
    parent: { page_id: NOTION_PARENT_PAGE_ID },
    properties: {
      title: {
        title: [ { type: 'text', text: { content: title } } ]
      }
    },
    children: [
      {
        object: 'block',
        type: 'code',
        code: {
          language: 'markdown',
          rich_text: [ { type: 'text', text: { content: markdown } } ]
        }
      }
    ]
  };
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion error (${res.status}): ${err}`);
  }
  return res.json();
}

async function createPageInDatabase({ title, markdown }) {
  const body = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      Name: { title: [ { type: 'text', text: { content: title } } ] },
      Content: { rich_text: [ { type: 'text', text: { content: 'See code block below' } } ] }
    },
    children: [
      {
        object: 'block',
        type: 'code',
        code: {
          language: 'markdown',
          rich_text: [ { type: 'text', text: { content: markdown } } ]
        }
      }
    ]
  };
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion error (${res.status}): ${err}`);
  }
  return res.json();
}

async function main() {
  if (!NOTION_TOKEN) {
    console.error('ERROR: NOTION_TOKEN is not set.');
    console.error('Usage: NOTION_TOKEN=*** NOTION_PARENT_PAGE_ID=*** npm run publish:notion');
    process.exit(1);
  }
  if (!NOTION_PARENT_PAGE_ID && !NOTION_DATABASE_ID) {
    console.error('ERROR: NOTION_PARENT_PAGE_ID or NOTION_DATABASE_ID must be set.');
    process.exit(1);
  }

  const mdPath = path.resolve(__dirname, '..', 'docs', 'architecture-summary.md');
  const markdown = fs.readFileSync(mdPath, 'utf8');
  const title = `技術構成まとめ (${new Date().toLocaleString('ja-JP')})`;

  const result = NOTION_PARENT_PAGE_ID
    ? await createPageUnderPage({ title, markdown })
    : await createPageInDatabase({ title, markdown });

  const pageId = result.id;
  const url = `https://www.notion.so/${pageId.replace(/-/g, '')}`;
  console.log('Created Notion page:', url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});









