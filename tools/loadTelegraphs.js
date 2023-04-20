const fs = require('fs');
const url = require('url');
const https = require('https');
const config = require('../external-content.json');

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

const generateMetaMarkdown = (title, url, meta) => {
  const obj = {
    title,
    date: formatDate(new Date()),
    ...meta,
    source: meta?.source || url,
  };

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

const fixWhiteSpaces = (str, wrapWith) =>
  str.replace(/^(\s*)(.*?)(\s*)$/gm, ['$1', '$2', '$3'].join(wrapWith));

const getFilePath = (src) => src.replace('file', 'telegraph');

const loadFile = (src) => {
  const filePath = 'static' + getFilePath(src);
  const file = fs.createWriteStream(filePath);

  https
    .get(`https://telegra.ph${src}`, (res) => {
      res.pipe(file);
      file.on('finish', file.close);
    })
    .on('error', (err) => {
      fs.unlink(file, (err) => err && console.error(err));
      console.error(err);
    });
};

const convertTagToMarkdown = (prevRes, node, parentTag, idx) => {
  switch (node.tag) {
    case 'p':
    case 'figure':
    case 'aside':
      return `${prevRes}\n\n`;
    case 'a':
      return `[${prevRes}](${node.attrs.href})`;
    case 'b':
    case 'strong':
      return fixWhiteSpaces(prevRes, '**');
    case 'blockquote':
      return `> ${prevRes}\n\n`;
    case 'code':
      return fixWhiteSpaces(prevRes, '`');
    case 'em':
    case 'i':
      return fixWhiteSpaces(prevRes, '*');
    case 'figcaption':
      return prevRes ? `\n\n${prevRes}` : '';
    case 'img':
      loadFile(node.attrs.src);
      return `![картинка](${getFilePath(node.attrs.src)})`;
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
      return parentTag === 'ul' ? `- ${prevRes}\n` : `${idx + 1}. ${prevRes}\n`;
    case 'pre':
      return '```\n' + prevRes + '```' + '\n\n';
    case 's':
      return fixWhiteSpaces(prevRes, '~~');
    case 'u':
      return prevRes;
    default:
      return '';
  }
};

const convertNodeToMarkdown = (node, parentTag, idx) => {
  let res = '';

  if (typeof node === 'object' && node.children) {
    res += node.children.map((v, i) => convertNodeToMarkdown(v, node.tag, i)).join('');
  }

  if (typeof node === 'string') {
    res += node;
  } else {
    res = convertTagToMarkdown(res, node, parentTag, idx);
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
      const filePath = `content/${dir}/${configItem.slug || telegraphPagePath}.md`;

      if (!fs.existsSync(filePath)) {
        const telegraphPage = await getTelegraphPage(telegraphPagePath);

        const md =
          generateMetaMarkdown(telegraphPage.title, configItem.url, configItem.meta) +
          generateContentMarkdown(telegraphPage.content);

        fs.writeFileSync(filePath, md);

        console.log(`File ${filePath} generated!`);
      }
    } catch (err) {
      console.error(err);
    }
  });
});
