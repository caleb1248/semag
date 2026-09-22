(() => {
  // downloader/untar-worker.ts
  function decodeUTF8(bytes) {
    var s = "";
    var i = 0;
    while (i < bytes.length) {
      var c = bytes[i++];
      if (c > 127) {
        if (c > 191 && c < 224) {
          if (i >= bytes.length)
            throw "UTF-8 decode: incomplete 2-byte sequence";
          c = (c & 31) << 6 | bytes[i] & 63;
        } else if (c > 223 && c < 240) {
          if (i + 1 >= bytes.length)
            throw "UTF-8 decode: incomplete 3-byte sequence";
          c = (c & 15) << 12 | (bytes[i] & 63) << 6 | bytes[++i] & 63;
        } else if (c > 239 && c < 248) {
          if (i + 2 >= bytes.length)
            throw "UTF-8 decode: incomplete 4-byte sequence";
          c = (c & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[++i] & 63) << 6 | bytes[++i] & 63;
        } else
          throw "UTF-8 decode: unknown multibyte start 0x" + c.toString(16) + " at index " + (i - 1);
        ++i;
      }
      if (c <= 65535)
        s += String.fromCharCode(c);
      else if (c <= 1114111) {
        c -= 65536;
        s += String.fromCharCode(c >> 10 | 55296);
        s += String.fromCharCode(c & 1023 | 56320);
      } else
        throw "UTF-8 decode: code point 0x" + c.toString(16) + " exceeds UTF-16 reach";
    }
    return s;
  }

  class PaxHeader {
    _fields;
    constructor(fields) {
      this._fields = fields;
    }
    static parse(buffer) {
      var bytes = new Uint8Array(buffer);
      var fields = [];
      while (bytes.length > 0) {
        var fieldLength = parseInt(decodeUTF8(bytes.subarray(0, bytes.indexOf(32))));
        var fieldText = decodeUTF8(bytes.subarray(0, fieldLength));
        var fieldMatch = fieldText.match(/^\d+ ([^=]+)=(.*)\n$/);
        if (fieldMatch === null) {
          throw new Error("Invalid PAX header data format.");
        }
        var fieldName = fieldMatch[1];
        var fieldValue = fieldMatch[2];
        if (fieldValue.length === 0) {
          fieldValue = null;
        } else if (fieldValue.match(/^\d+$/) !== null) {
          fieldValue = parseInt(fieldValue);
        }
        var field = {
          name: fieldName,
          value: fieldValue
        };
        fields.push(field);
        bytes = bytes.subarray(fieldLength);
      }
      return new PaxHeader(fields);
    }
    applyHeader(file) {
      this._fields.forEach(function(field) {
        var fieldName = field.name;
        var fieldValue = field.value;
        if (fieldName === "path") {
          fieldName = "name";
          if (file.prefix !== undefined) {
            delete file.prefix;
          }
        } else if (fieldName === "linkpath") {
          fieldName = "linkname";
        }
        if (fieldValue === null) {
          delete file[fieldName];
        } else {
          file[fieldName] = fieldValue;
        }
      });
    }
  }

  class TarFile {
    name;
    mode;
    uid;
    gid;
    size;
    mtime;
    checksum;
    type;
    linkname;
    ustarFormat;
    version;
    uname;
    gname;
    devmajor;
    devminor;
    namePrefix;
    buffer;
  }

  class UntarStream {
    _bufferView;
    _position;
    constructor(arrayBuffer) {
      this._bufferView = new DataView(arrayBuffer);
      this._position = 0;
    }
    readString(charCount) {
      var charSize = 1;
      var byteCount = charCount * charSize;
      var charCodes = [];
      for (var i = 0;i < charCount; ++i) {
        var charCode = this._bufferView.getUint8(this.position() + i * charSize);
        if (charCode !== 0) {
          charCodes.push(charCode);
        } else {
          break;
        }
      }
      this.seek(byteCount);
      return String.fromCharCode.apply(null, charCodes);
    }
    readBuffer(byteCount) {
      var buf;
      if (typeof ArrayBuffer.prototype.slice === "function") {
        buf = this._bufferView.buffer.slice(this.position(), this.position() + byteCount);
      } else {
        buf = new ArrayBuffer(byteCount);
        var target = new Uint8Array(buf);
        var src = new Uint8Array(this._bufferView.buffer, this.position(), byteCount);
        target.set(src);
      }
      this.seek(byteCount);
      return buf;
    }
    seek(byteCount) {
      this._position += byteCount;
    }
    peekUint32() {
      return this._bufferView.getUint32(this.position(), true);
    }
    position(newpos) {
      if (newpos === undefined) {
        return this._position;
      } else {
        this._position = newpos;
      }
    }
    size() {
      return this._bufferView.byteLength;
    }
  }

  class UntarFileStream {
    _stream;
    _globalPaxHeader;
    constructor(arrayBuffer) {
      this._stream = new UntarStream(arrayBuffer);
      this._globalPaxHeader = null;
    }
    hasNext() {
      return this._stream.position() + 4 < this._stream.size() && this._stream.peekUint32() !== 0;
    }
    next() {
      return this._readNextFile();
    }
    _readNextFile() {
      var stream = this._stream;
      var file = new TarFile;
      var isHeaderFile = false;
      var paxHeader = null;
      var headerBeginPos = stream.position();
      var dataBeginPos = headerBeginPos + 512;
      file.name = stream.readString(100);
      file.mode = stream.readString(8);
      file.uid = parseInt(stream.readString(8));
      file.gid = parseInt(stream.readString(8));
      file.size = parseInt(stream.readString(12), 8);
      file.mtime = parseInt(stream.readString(12), 8);
      file.checksum = parseInt(stream.readString(8));
      file.type = stream.readString(1);
      file.linkname = stream.readString(100);
      file.ustarFormat = stream.readString(6);
      if (file.ustarFormat.indexOf("ustar") > -1) {
        file.version = stream.readString(2);
        file.uname = stream.readString(32);
        file.gname = stream.readString(32);
        file.devmajor = parseInt(stream.readString(8));
        file.devminor = parseInt(stream.readString(8));
        file.namePrefix = stream.readString(155);
        if (file.namePrefix.length > 0) {
          file.name = file.namePrefix + "/" + file.name;
        }
      }
      stream.position(dataBeginPos);
      switch (file.type) {
        case "0":
        case "":
          file.buffer = stream.readBuffer(file.size);
          break;
        case "1":
          break;
        case "2":
          break;
        case "3":
          break;
        case "4":
          break;
        case "5":
          break;
        case "6":
          break;
        case "7":
          break;
        case "g":
          isHeaderFile = true;
          this._globalPaxHeader = PaxHeader.parse(stream.readBuffer(file.size));
          break;
        case "x":
          isHeaderFile = true;
          paxHeader = PaxHeader.parse(stream.readBuffer(file.size));
          break;
        default:
          break;
      }
      if (file.buffer === undefined) {
        file.buffer = new ArrayBuffer(0);
      }
      var dataEndPos = dataBeginPos + file.size;
      if (file.size % 512 !== 0) {
        dataEndPos += 512 - file.size % 512;
      }
      stream.position(dataEndPos);
      if (isHeaderFile) {
        file = this._readNextFile();
      }
      if (this._globalPaxHeader !== null) {
        this._globalPaxHeader.applyHeader(file);
      }
      if (paxHeader !== null) {
        paxHeader.applyHeader(file);
      }
      return file;
    }
  }
  function* untarBuffer(arrayBuffer) {
    const stream = new UntarFileStream(arrayBuffer);
    while (stream.hasNext()) {
      yield stream.next();
    }
  }

  // downloader/download-worker.ts
  var objectUrls = {};
  var contentTypes = {
    ".js": "application/javascript",
    ".json": "application/json",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ogg": "audio/ogg",
    ".ico": "image/x-icon",
    ".wasm": "application/wasm",
    ".glb": "model/gltf-binary",
    ".track": "text/plain",
    ".woff2": "font/woff2"
  };
  function normalizePath(path) {
    return path.replace(/^\.?\//, "");
  }
  function contentType(path) {
    const dot = path.lastIndexOf(".");
    return (dot === -1 ? undefined : contentTypes[path.substring(dot)]) ?? "application/octet-stream";
  }
  async function loadArchive(tgz) {
    const decompressor = new DecompressionStream("gzip");
    const decompressed = new Response(tgz).body.pipeThrough(decompressor);
    const tar = await new Response(decompressed).arrayBuffer();
    console.log("tar bytelength:", tar.byteLength);
    for (const url of Object.values(objectUrls))
      URL.revokeObjectURL(url);
    objectUrls = {};
    for await (const f of untarBuffer(tar)) {
      if (f.type !== "0" && f.type !== "")
        continue;
      const path = normalizePath(f.name);
      objectUrls[path] = URL.createObjectURL(new Blob([f.buffer], { type: contentType(path) }));
    }
    return objectUrls;
  }
  self.addEventListener("message", async (e) => {
    const message = e.data;
    switch (message.type) {
      case "load": {
        try {
          const urls = await loadArchive(message.buffer);
          const count = Object.keys(urls).length;
          console.log("done extracting", count, "files");
          self.postMessage({ type: "loaded", count, urls });
        } catch (err) {
          console.error("Error during extraction:", err);
          for (const url of Object.values(objectUrls))
            URL.revokeObjectURL(url);
          objectUrls = {};
          self.postMessage({ type: "error", message: String(err) });
        }
        break;
      }
    }
  });
})();
