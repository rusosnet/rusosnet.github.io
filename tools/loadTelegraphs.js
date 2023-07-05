const fs = require('fs');
const path = require('path');
const https = require('https');
const { getApiUrl, getMarkdown } = require('telegraph2md');
const config = require('../external-content.json');

const getUrlPath = (url) => new URL(url).pathname.slice(1);

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

const getMetaYAML = ({ url, ...meta }) => {
  const data = {
    ...meta,
    date: formatDate(new Date()),
    source: meta.source || url,
  };

  return '---\n' + JSON.stringify(data, null, 2) + '\n---\n\n';
};

const downloadAsset = (url, name) => {
  const dest = path.join('static', 'telegraph', name);

  const file = fs.createWriteStream(dest);

  https.get(url, (res) => {
    res.pipe(file);

    file.on('finish', () => {
      file.close();

      console.log(`Download asset: ${dest.replace(/\\/g, '/')}`);
    });
  });
};

Object.keys(config).forEach((dir) => {
  config[dir].forEach(async (configItem) => {
    try {
      const filename = `content/${dir}/${configItem.slug || getUrlPath(configItem.url)}.md`;

      if (!fs.existsSync(filename)) {
        const resp = await fetch(getApiUrl(configItem.url));

        const apiData = await resp.json();

        const { markdown, meta, assets } = getMarkdown(apiData, { assetsDir: 'telegraph' });

        const metaYAML = getMetaYAML({
          title: meta.title,
          url: configItem.url,
          ...configItem.meta,
        });

        fs.writeFileSync(filename, metaYAML + markdown);

        console.log(`Write markdown to ${filename}`);

        assets.forEach((a) => downloadAsset(a.url, a.name));
      }
    } catch (err) {
      console.error(err);
    }
  });
});
