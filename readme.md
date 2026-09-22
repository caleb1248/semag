## build the download worker

```bash
cd downloader
bun build --outfile=./download-worker.js --format=iife ./download-worker.ts
cp ./download-worker.js ../main/
cd ..
```

## build the archive

```bash
tar --exclude=./archive.tgz -czf archive.tgz -C main .
```
