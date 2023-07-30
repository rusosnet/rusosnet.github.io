```
hugo server -D
```

```bash
yarn && yarn build-tw --watch
```

Latin:
```
docker run --rm -it -v `pwd`:/site \
  --workdir /site/content \
  alexes/latin \
  bash -c 'find . | grep \.md | grep -v lat.md | /root/process'
```
