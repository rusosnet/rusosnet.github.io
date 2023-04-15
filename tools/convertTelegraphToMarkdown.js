const config = require('../external-content.json');
const fs = require('fs');
const url = require('url');

// slice(1) for remove "/" at the start of pathname for convenience
const getPathFromUrl = (href) => url.parse(href).pathname.slice(1);

const getTelegraphPage = async (path) => {
  const res = await fetch(`https://api.telegra.ph/getPage/${path}?return_content=true`);
  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error);
  }

  return data.result;
};

const formatDate = (date) => {
  const tzo = -date.getTimezoneOffset();
  const diff = tzo >= 0 ? '+' : '-';
  const pad = (num) => (num < 10 ? '0' : '') + num;

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    diff +
    pad(Math.floor(Math.abs(tzo) / 60)) +
    ':' +
    pad(Math.abs(tzo) % 60)
  );
};

const generateMetaMarkdown = (title, meta, filePath) => {
  const obj = {
    title,
    ...meta,
    date: formatDate(new Date()),
  };

  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath, 'utf-8');
    obj.date = file.match(/date: (.*)/)[1];
  } else {
    obj.date = formatDate(new Date());
  }

  let res = '---\n';

  Object.keys(obj).forEach((key) => {
    const val = obj[key];

    if (key === 'coords') {
      res += `coords: ${JSON.stringify(val)}\n`;
    } else if (Array.isArray(val)) {
      res += 'tags:\n' + val.map((v) => ` - ${v}\n`).join('');
    } else {
      res += `${key}: ${val}\n`;
    }
  });

  return res + '---\n\n';
};

const convertTagToMarkdown = (prevRes, node, parentTag) => {
  switch (node.tag) {
    case 'p':
    case 'figure':
    case 'aside':
      return `${prevRes}\n\n`;
    case 'a':
      return `[${prevRes}](${node.attrs.href})`;
    case 'b':
    case 'strong':
      return `**${prevRes}**`;
    case 'blockquote':
      return `> ${prevRes}\n\n`;
    case 'code':
      return '`' + prevRes + '`';
    case 'em':
    case 'i':
      return `*${prevRes}*`;
    case 'figcaption':
      return `\n\n${prevRes}`;
    case 'img':
      return `![картинка](https://telegra.ph${node.attrs.src})`;
    case 'h3':
      return `### ${prevRes}\n\n`;
    case 'h4':
      return `#### ${prevRes}\n\n`;
    case 'hr':
      return `---\n\n`;
    case 'ul':
    case 'ol':
      return `${prevRes}\n`;
    case 'li':
      return parentTag === 'ul' ? `- ${prevRes}\n` : `1. ${prevRes}\n`;
    case 'pre':
      return '```\n' + prevRes + '```' + '\n\n';
    case 's':
      return `~~${prevRes}~~`;
    case 'u':
      return prevRes;
    default:
      return '';
  }
};

const convertNodeToMarkdown = (node, parentTag) => {
  let res = '';

  if (typeof node === 'object' && node.children) {
    res += node.children.map((v) => convertNodeToMarkdown(v, node.tag)).join('');
  }

  if (typeof node === 'string') {
    res += node;
  } else {
    res = convertTagToMarkdown(res, node, parentTag);
  }

  return res;
};

const generateContentMarkdown = (content) =>
  content
    .map((v) => convertNodeToMarkdown(v))
    .join('')
    .trim();

Object.keys(config).forEach((dir) => {
  config[dir].forEach(async (configItem) => {
    try {
      const telegraphPagePath = getPathFromUrl(configItem.url);
      const telegraphPage = await getTelegraphPage(telegraphPagePath);
      const filePath = `content/${dir}/${telegraphPagePath}.md`;

      const md =
        generateMetaMarkdown(telegraphPage.title, configItem.meta, filePath) +
        generateContentMarkdown(telegraphPage.content);

      fs.writeFileSync(filePath, md);
    } catch (err) {
      console.error(err);
    }
  });
});
