/* ============================================================
   Bloxd Terrain Editor — terrain_editor_jszip.min.js
   Librairie JSZip v3.10.1 (génération des archives ZIP d'export).
   Chargement : 2/8 — indépendante (voir <script> dans terrain_editor.html)
   ============================================================ */

if (typeof window.JSZip === 'undefined') {
            /*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=e()}}(function(){return function s(a,o,h){function u(r,e){if(!o[r]){if(!a[r]){var t="function"==typeof require&&require;if(!e&&t)return t(r,!0);if(l)return l(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=o[r]={exports:{}};a[r][0].call(i.exports,function(e){var t=a[r][1][e];return u(t||e)},i,i.exports,s,a,o,h)}return o[r].exports}for(var l="function"==typeof require&&require,e=0;e<h.length;e++)u(h[e]);return u}({1:[function(e,t,r){"use strict";var d=e("./utils"),c=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,a,o,h=[],u=0,l=e.length,f=l,c="string"!==d.getTypeOf(e);u<e.length;)f=l-u,n=c?(t=e[u++],r=u<l?e[u++]:0,u<l?e[u++]:0):(t=e.charCodeAt(u++),r=u<l?e.charCodeAt(u++):0,u<l?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,a=1<f?(15&r)<<2|n>>6:64,o=2<f?63&n:64,h.push(p.charAt(i)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(e){var t,r,n,i,s,a,o=0,h=0,u="data:";if(e.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&f--,e.charAt(e.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=c.uint8array?new Uint8Array(0|f):new Array(0|f);o<e.length;)t=p.indexOf(e.charAt(o++))<<2|(i=p.indexOf(e.charAt(o++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(o++)))>>2,n=(3&s)<<6|(a=p.indexOf(e.charAt(o++))),l[h++]=t,64!==s&&(l[h++]=r),64!==a&&(l[h++]=n);return l}},{"./support":30,"./utils":32}],2:[function(e,t,r){"use strict";var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),a=e("./stream/DataLengthProbe");function o(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i}o.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new a("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",t)},t.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){"use strict";var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){"use strict";var n=e("./utils");var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}(0|t,e,e.length,0):function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t.charCodeAt(a))];return-1^e}(0|t,e,e.length,0):0}},{"./utils":32}],5:[function(e,t,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,t,r){"use strict";var n=null;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n}},{lie:37}],7:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),a=e("./stream/GenericWorker"),o=n?"uint8array":"array";function h(e,t){a.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,e.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta})}},r.compressWorker=function(e){return new h("Deflate",e)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){"use strict";function A(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function n(e,t,r,n,i,s){var a,o,h=e.file,u=e.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),c=I.transformTo("string",O.utf8encode(h.name)),d=h.comment,p=I.transformTo("string",s(d)),m=I.transformTo("string",O.utf8encode(d)),_=c.length!==h.name.length,g=m.length!==d.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===i?(C=798,z|=function(e,t){var r=e;return e||(r=t?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(e){return 63&(e||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+c,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(n,4)+f+b+p}}var I=e("../utils"),i=e("../stream/GenericWorker"),O=e("../utf8"),B=e("../crc32"),R=e("../signature");function s(e,t,r,n){i.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,i),s.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,i.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}))},s.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=n(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(e){this.accumulate=!1;var t=this.streamFiles&&!e.file.dir,r=n(e,t,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),t)this.push({data:function(e){return R.DATA_DESCRIPTOR+A(e.crc32,4)+A(e.compressedSize,4)+A(e.uncompressedSize,4)}(e),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r=this.bytesWritten-e,n=function(e,t,r,n,i){var s=I.transformTo("string",i(n));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(e,2)+A(e,2)+A(t,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,e,this.zipComment,this.encodeFileName);this.push({data:n,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on("error",function(e){t.error(e)}),this},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(e){var t=this._sources;if(!i.prototype.error.call(this,e))return!1;for(var r=0;r<t.length;r++)try{t[r].error(e)}catch(e){}return!0},s.prototype.lock=function(){i.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){"use strict";var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,a,t){var o=new n(a.streamFiles,t,a.platform,a.encodeFileName),h=0;try{e.forEach(function(e,t){h++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,a.compression),n=t.options.compressionOptions||a.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(e){o.error(e)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){"use strict";function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.10.1",n.loadAsync=function(e,t){return(new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){"use strict";var u=e("./utils"),i=e("./external"),n=e("./utf8"),s=e("./zipEntries"),a=e("./stream/Crc32Probe"),l=e("./nodejsUtils");function f(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new a);r.on("error",function(e){t(e)}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e()}).resume()})}t.exports=function(e,o){var h=this;return o=u.extend(o||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),l.isNode&&l.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):u.prepareContent("the loaded zip file",e,!0,o.optimizedBinaryString,o.base64).then(function(e){var t=new s(o);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(o.checkCRC32)for(var n=0;n<r.length;n++)t.push(f(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n],s=i.fileNameStr,a=u.resolve(i.fileNameStr);h.file(a,i.decompressed,{binary:!0,optimizedBinaryString:!0,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:o.createFolders}),i.dir||(h.file(a).unsafeOriginalName=s)}return t.zipComment.length&&(h.comment=t.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=!1,this._bindStream(t)}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}})}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e)}).on("end",function(){t.isPaused?t._upstreamEnded=!0:t.end()})},s.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){"use strict";var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t)}).on("error",function(e){n.emit("error",e)}).on("end",function(){n.push(null)})}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume()},t.exports=n},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){"use strict";t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}}},{}],15:[function(e,t,r){"use strict";function s(e,t,r){var n,i=u.getTypeOf(t),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=g(e)),s.createFolders&&(n=_(e))&&b.call(this,n,!0);var a="string"===i&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=!1,s.binary=!0,t="",s.compression="STORE",i="string");var o=null;o=t instanceof c||t instanceof l?t:p.isNode&&p.isStream(t)?new m(e,t):u.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var h=new d(e,o,s);this.files[e]=h}var i=e("./utf8"),u=e("./utils"),l=e("./stream/GenericWorker"),a=e("./stream/StreamHelper"),f=e("./defaults"),c=e("./compressedObject"),d=e("./zipObject"),o=e("./generate"),p=e("./nodejsUtils"),m=e("./nodejs/NodejsStreamInputAdapter"),_=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""},g=function(e){return"/"!==e.slice(-1)&&(e+="/"),e},b=function(e,t){return t=void 0!==t?t:f.createFolders,e=g(e),this.files[e]||s.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function h(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n)},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t)}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(h(e)){var n=e;return this.filter(function(e,t){return!t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=b.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=u.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=o.generateWorker(this,r,n)}catch(e){(t=new l("error")).error(e)}return new a(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){"use strict";t.exports=e("stream")},{stream:void 0}],17:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){"use strict";var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,r){"use strict";var n=e("./Uint8ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){"use strict";var n=e("./ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),a=e("./StringReader"),o=e("./NodeBufferReader"),h=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new o(e):i.uint8array?new h(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new a(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0)}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,n.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":e=this.data.substring(this.index,t);break;case"uint8array":e=this.data.subarray(this.index,t);break;case"array":case"nodebuffer":e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){"use strict";function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}n.prototype={push:function(e){this.emit("data",e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(e){this.emit("error",e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.end()}),e.on("error",function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n},{}],29:[function(e,t,r){"use strict";var h=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),u=e("../base64"),n=e("../support"),a=e("../external"),o=null;if(n.nodestream)try{o=e("../nodejs/NodejsStreamOutputAdapter")}catch(e){}function l(e,o){return new a.Promise(function(t,r){var n=[],i=e._internalType,s=e._outputType,a=e._mimeType;e.on("data",function(e,t){n.push(e),o&&o(t)}).on("error",function(e){n=[],r(e)}).on("end",function(){try{var e=function(e,t,r){switch(e){case"blob":return h.newBlob(h.transformTo("arraybuffer",t),r);case"base64":return u.encode(t);default:return h.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case"string":return t.join("");case"array":return Array.prototype.concat.apply([],t);case"uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case"nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),a);t(e)}catch(e){r(e)}n=[]}).resume()})}function f(e,t,r){var n=t;switch(t){case"blob":case"arraybuffer":n="uint8array";break;case"base64":n="string"}try{this._internalType=n,this._outputType=t,this._mimeType=r,h.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock()}catch(e){this._worker=new s("error"),this._worker.error(e)}}f.prototype={accumulate:function(e){return l(this,e)},on:function(e,t){var r=this;return"data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta)}):this._worker.on(e,function(){h.delay(t,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size}catch(e){r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch(e){r.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,s){"use strict";for(var o=e("./utils"),h=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;u[254]=u[254]=1;function a(){n.call(this,"utf-8 decode"),this.leftOver=null}function l(){n.call(this,"utf-8 encode")}s.utf8encode=function(e){return h.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=h.uint8array?new Uint8Array(o):new Array(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return h.nodebuffer?o.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,a=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)a[r++]=n;else if(4<(i=u[n]))a[r++]=65533,t+=i-1;else{for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?a[r++]=65533:n<65536?a[r++]=n:(n-=65536,a[r++]=55296|n>>10&1023,a[r++]=56320|1023&n)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(e=o.transformTo(h.uint8array?"uint8array":"array",e))},o.inherits(a,n),a.prototype.processChunk=function(e){var t=o.transformTo(h.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(h.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,n),l.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){"use strict";var o=e("./support"),h=e("./base64"),r=e("./nodejsUtils"),u=e("./external");function n(e){return e}function l(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}e("setimmediate"),a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var i={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return!1}}()}};function s(e){var t=65536,r=a.getTypeOf(e),n=!0;if("uint8array"===r?n=i.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=i.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return i.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2)}return i.stringifyByChar(e)}function f(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=s;var c={};c.string={string:n,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:function(e){return l(e,r.allocBuffer(e.length))}},c.array={string:s,array:n,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return s(new Uint8Array(e))},array:function(e){return f(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:n,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:n,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return f(e,new Uint8Array(e.length))},nodebuffer:n},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.resolve=function(e){for(var t=e.split("/"),r=[],n=0;n<t.length;n++){var i=t[n];"."===i||""===i&&0!==n&&n!==t.length-1||(".."===i?r.pop():r.push(i))}return r.join("/")},a.getTypeOf=function(e){return"string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":o.nodebuffer&&r.isBuffer(e)?"nodebuffer":o.uint8array&&e instanceof Uint8Array?"uint8array":o.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!o[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){setImmediate(function(){e.apply(r||null,t||[])})},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(r,e,n,i,s){return u.Promise.resolve(e).then(function(n){return o.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new u.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result)},e.onerror=function(e){r(e.target.error)},e.readAsArrayBuffer(n)}):n}).then(function(e){var t=a.getTypeOf(e);return t?("arraybuffer"===t?e=a.transformTo("uint8array",e):"string"===t&&(s?e=h.decode(e):n&&!0!==i&&(e=function(e){return l(e,o.uint8array?new Uint8Array(e.length):new Array(e.length))}(e))),e):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),a=e("./zipEntry"),o=e("./support");function h(e){this.files=[],this.loadOptions=e}h.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=o.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),a=e("./crc32"),o=e("./utf8"),h=e("./compressions"),u=e("./support");function l(e,t){this.options=e,this.loadOptions=t}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in h)if(Object.prototype.hasOwnProperty.call(h,t)&&h[t].magic===e)return h[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i)},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else{var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else{var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileName)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileComment)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null}},t.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){"use strict";function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),a=e("./utf8"),o=e("./compressedObject"),h=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new a.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new a.Utf8DecodeWorker))}catch(e){(t=new h("error")).error(e)}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof o&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)n.prototype[u[f]]=l;t.exports=n},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,l,t){(function(t){"use strict";var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),a=t.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=i=++i%2}}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null},t.document.documentElement.appendChild(e)}:function(){setTimeout(u,0)};else{var o=new t.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var e,t;n=!0;for(var r=h.length;r;){for(t=h,h=[],e=-1;++e<r;)t[e]();r=h.length}n=!1}l.exports=function(e){1!==h.push(e)||n||r()}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(e,t,r){"use strict";var i=e("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],n=["PENDING"];function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&d(this,e)}function h(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(t,r,n){i(function(){var e;try{e=r(n)}catch(e){return l.reject(t,e)}e===t?l.reject(t,new TypeError("Cannot resolve promise with itself")):l.resolve(t,e)})}function c(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments)}}function d(t,e){var r=!1;function n(e){r||(r=!0,l.reject(t,e))}function i(e){r||(r=!0,l.resolve(t,e))}var s=p(function(){e(i,n)});"error"===s.status&&n(s.value)}function p(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}(t.exports=o).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===a||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);this.state!==n?f(r,this.state===a?e:t,this.outcome):this.queue.push(new h(r,e,t));return r},h.prototype.callFulfilled=function(e){l.resolve(this.promise,e)},h.prototype.otherCallFulfilled=function(e){f(this.promise,this.onFulfilled,e)},h.prototype.callRejected=function(e){l.reject(this.promise,e)},h.prototype.otherCallRejected=function(e){f(this.promise,this.onRejected,e)},l.resolve=function(e,t){var r=p(c,t);if("error"===r.status)return l.reject(e,r.value);var n=r.value;if(n)d(e,n);else{e.state=a,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t)}return e},l.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},o.resolve=function(e){if(e instanceof this)return e;return l.resolve(new this(u),e)},o.reject=function(e){var t=new this(u);return l.reject(t,e)},o.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=!1;if(!n)return this.resolve([]);var s=new Array(n),a=0,t=-1,o=new this(u);for(;++t<n;)h(e[t],t);return o;function h(e,t){r.resolve(e).then(function(e){s[t]=e,++a!==n||i||(i=!0,l.resolve(o,s))},function(e){i||(i=!0,l.reject(o,e))})}},o.race=function(e){var t=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var r=e.length,n=!1;if(!r)return this.resolve([]);var i=-1,s=new this(u);for(;++i<r;)a=e[i],t.resolve(a).then(function(e){n||(n=!0,l.resolve(s,e))},function(e){n||(n=!0,l.reject(s,e))});var a;return s}},{immediate:36}],38:[function(e,t,r){"use strict";var n={};(0,e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){"use strict";var a=e("./zlib/deflate"),o=e("./utils/common"),h=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,c=0,d=8;function p(e){if(!(this instanceof p))return new p(e);this.options=o.assign({level:f,method:d,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==l)throw new Error(i[r]);if(t.header&&a.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?h.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=a.deflateSetDictionary(this.strm,n))!==l)throw new Error(i[r]);this._dict_set=!0}}function n(e,t){var r=new p(t);if(r.push(e,!0),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return!1;n=t===~~t?t:!0===t?4:0,"string"==typeof e?i.input=h.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new o.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=a.deflate(i,n))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(i.output,i.next_out))):this.onData(o.shrinkBuf(i.output,i.next_out)))}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==n||(this.onEnd(l),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return(t=t||{}).raw=!0,n(e,t)},r.gzip=function(e,t){return(t=t||{}).gzip=!0,n(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){"use strict";var c=e("./zlib/inflate"),d=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function a(e){if(!(this instanceof a))return new a(e);this.options=d.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=c.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,c.inflateGetHeader(this.strm,this.header)}function o(e,t){var r=new a(t);if(r.push(e,!0),r.err)throw r.msg||n[r.err];return r.result}a.prototype.push=function(e,t){var r,n,i,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;n=t===~~t?t:!0===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?h.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?h.input=new Uint8Array(e):h.input=e,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new d.Buf8(u),h.next_out=0,h.avail_out=u),(r=c.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=c.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(h.output,h.next_out),s=h.next_out-i,a=p.buf2string(h.output,i),h.next_out=s,h.avail_out=u-s,s&&d.arraySet(h.output,h.output,i,s,0),this.onData(a)):this.onData(d.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=c.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(e){this.chunks.push(e)},a.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=d.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(e,t){return(t=t||{}).raw=!0,o(e,t)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){var t,r,n,i,s,a;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(a=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],a.set(s,i),i+=s.length;return a}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){return[].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(n)},{}],42:[function(e,t,r){"use strict";var h=e("./common"),i=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(e){i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){s=!1}for(var u=new h.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function l(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,h.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=new h.Buf8(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return l(e,e.length)},r.binstring2buf=function(e){for(var t=new h.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,a=t||e.length,o=new Array(2*a);for(r=n=0;r<a;)if((i=e[r++])<128)o[n++]=i;else if(4<(s=u[i]))o[n++]=65533,r+=s-1;else{for(i&=2===s?31:3===s?15:7;1<s&&r<a;)i=i<<6|63&e[r++],s--;1<s?o[n++]=65533:i<65536?o[n++]=i:(i-=65536,o[n++]=55296|i>>10&1023,o[n++]=56320|1023&i)}return l(o,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}},{"./common":41}],43:[function(e,t,r){"use strict";t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--a;);i%=65521,s%=65521}return i|s<<16|0}},{}],44:[function(e,t,r){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,r){"use strict";var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}},{}],46:[function(e,t,r){"use strict";var h,c=e("../utils/common"),u=e("./trees"),d=e("./adler32"),p=e("./crc32"),n=e("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,i=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(e,t){return e.msg=n[t],t}function T(e){return(e<<1)-(4<e?9:0)}function D(e){for(var t=e.length;0<=--t;)e[t]=0}function F(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(c.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0))}function N(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,F(e.strm)}function U(e,t){e.pending_buf[e.pending++]=t}function P(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function L(e,t){var r,n,i=e.max_chain_length,s=e.strstart,a=e.prev_length,o=e.nice_match,h=e.strstart>e.w_size-z?e.strstart-(e.w_size-z):0,u=e.window,l=e.w_mask,f=e.prev,c=e.strstart+S,d=u[s+a-1],p=u[s+a];e.prev_length>=e.good_match&&(i>>=2),o>e.lookahead&&(o=e.lookahead);do{if(u[(r=t)+a]===p&&u[r+a-1]===d&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<c);if(n=S-(c-s),s=c-S,a<n){if(e.match_start=t,o<=(a=n))break;d=u[s+a-1],p=u[s+a]}}}while((t=f[t&l])>h&&0!=--i);return a<=e.lookahead?a:e.lookahead}function j(e){var t,r,n,i,s,a,o,h,u,l,f=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=f+(f-z)){for(c.arraySet(e.window,e.window,f,f,0),e.match_start-=f,e.strstart-=f,e.block_start-=f,t=r=e.hash_size;n=e.head[--t],e.head[t]=f<=n?n-f:0,--r;);for(t=r=f;n=e.prev[--t],e.prev[t]=f<=n?n-f:0,--r;);i+=f}if(0===e.strm.avail_in)break;if(a=e.strm,o=e.window,h=e.strstart+e.lookahead,u=i,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,c.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=d(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),e.lookahead+=r,e.lookahead+e.insert>=x)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+x-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<x)););}while(e.lookahead<z&&0!==e.strm.avail_in)}function Z(e,t){for(var r,n;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r)),e.match_length>=x)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-x),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=x){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function W(e,t){for(var r,n,i;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=x-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===x&&4096<e.strstart-e.match_start)&&(e.match_length=x-1)),e.prev_length>=x&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-x,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-x),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=x-1,e.strstart++,n&&(N(e,!1),0===e.strm.avail_out))return A}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&N(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return A}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function M(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new c.Buf16(2*w),this.dyn_dtree=new c.Buf16(2*(2*a+1)),this.bl_tree=new c.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new c.Buf16(k+1),this.heap=new c.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new c.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?C:E,e.adler=2===t.wrap?0:1,t.last_flush=l,u._tr_init(t),m):R(e,_)}function K(e){var t=G(e);return t===m&&function(e){e.window_size=2*e.w_size,D(e.head),e.max_lazy_match=h[e.level].max_lazy,e.good_match=h[e.level].good_length,e.nice_match=h[e.level].nice_length,e.max_chain_length=h[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0}(e.state),t}function Y(e,t,r,n,i,s){if(!e)return _;var a=1;if(t===g&&(t=6),n<0?(a=0,n=-n):15<n&&(a=2,n-=16),i<1||y<i||r!==v||n<8||15<n||t<0||9<t||s<0||b<s)return R(e,_);8===n&&(n=9);var o=new H;return(e.state=o).strm=e,o.wrap=a,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new c.Buf8(2*o.w_size),o.head=new c.Buf16(o.hash_size),o.prev=new c.Buf16(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new c.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=r,K(e)}h=[new M(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(j(e),0===e.lookahead&&t===l)return A;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,N(e,!1),0===e.strm.avail_out))return A;if(e.strstart-e.block_start>=e.w_size-z&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):(e.strstart>e.block_start&&(N(e,!1),e.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(e,t){return Y(e,t,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?_:(e.state.gzhead=t,m):_},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?R(e,_):_;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&t!==f)return R(e,0===e.avail_out?-5:_);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===C)if(2===n.wrap)e.adler=0,U(n,31),U(n,139),U(n,8),n.gzhead?(U(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),U(n,255&n.gzhead.time),U(n,n.gzhead.time>>8&255),U(n,n.gzhead.time>>16&255),U(n,n.gzhead.time>>24&255),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(U(n,255&n.gzhead.extra.length),U(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(U(n,0),U(n,0),U(n,0),U(n,0),U(n,0),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,3),n.status=E);else{var a=v+(n.w_bits-8<<4)<<8;a|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(a|=32),a+=31-a%31,n.status=E,P(n,a),0!==n.strstart&&(P(n,e.adler>>>16),P(n,65535&e.adler)),e.adler=1}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending!==n.pending_buf_size));)U(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73)}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91)}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103)}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&F(e),n.pending+2<=n.pending_buf_size&&(U(n,255&e.adler),U(n,e.adler>>8&255),e.adler=0,n.status=E)):n.status=E),0!==n.pending){if(F(e),0===e.avail_out)return n.last_flush=-1,m}else if(0===e.avail_in&&T(t)<=T(r)&&t!==f)return R(e,-5);if(666===n.status&&0!==e.avail_in)return R(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==l&&666!==n.status){var o=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(j(e),0===e.lookahead)){if(t===l)return A;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,a=e.window;;){if(e.lookahead<=S){if(j(e),e.lookahead<=S&&t===l)return A;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=x&&0<e.strstart&&(n=a[i=e.strstart-1])===a[++i]&&n===a[++i]&&n===a[++i]){s=e.strstart+S;do{}while(n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&i<s);e.match_length=S-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=x?(r=u._tr_tally(e,1,e.match_length-x),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):h[n.level].func(n,t);if(o!==O&&o!==B||(n.status=666),o===A||o===O)return 0===e.avail_out&&(n.last_flush=-1),m;if(o===I&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,!1),3===t&&(D(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),F(e),0===e.avail_out))return n.last_flush=-1,m}return t!==f?m:n.wrap<=0?1:(2===n.wrap?(U(n,255&e.adler),U(n,e.adler>>8&255),U(n,e.adler>>16&255),U(n,e.adler>>24&255),U(n,255&e.total_in),U(n,e.total_in>>8&255),U(n,e.total_in>>16&255),U(n,e.total_in>>24&255)):(P(n,e.adler>>>16),P(n,65535&e.adler)),F(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?m:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==C&&69!==t&&73!==t&&91!==t&&103!==t&&t!==E&&666!==t?R(e,_):(e.state=null,t===E?R(e,-3):m):_},r.deflateSetDictionary=function(e,t){var r,n,i,s,a,o,h,u,l=t.length;if(!e||!e.state)return _;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(e.adler=d(e.adler,t,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new c.Buf8(r.w_size),c.arraySet(u,t,l-r.w_size,r.w_size,0),t=u,l=r.w_size),a=e.avail_in,o=e.next_in,h=e.input,e.avail_in=l,e.next_in=0,e.input=t,j(r);r.lookahead>=x;){for(n=r.strstart,i=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+x-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,e.next_in=o,e.input=h,e.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){"use strict";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,t,r){"use strict";t.exports=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C;r=e.state,n=e.next_in,z=e.input,i=n+(e.avail_in-5),s=e.next_out,C=e.output,a=s-(t-e.avail_out),o=s+(e.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,c=r.window,d=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;e:do{p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=m[d&g];t:for(;;){if(d>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(d&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}w=65535&v,(y&=15)&&(p<y&&(d+=z[n++]<<p,p+=8),w+=d&(1<<y)-1,d>>>=y,p-=y),p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=_[d&b];r:for(;;){if(d>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(d&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&v,p<(y&=15)&&(d+=z[n++]<<p,(p+=8)<y&&(d+=z[n++]<<p,p+=8)),h<(k+=d&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(d>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=c,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=c[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=c[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(n<i&&s<o);n-=w=p>>3,d&=(1<<(p-=w<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<o?o-s+257:257-(s-o),r.hold=d,r.bits=p}},{}],49:[function(e,t,r){"use strict";var I=e("../utils/common"),O=e("./adler32"),B=e("./crc32"),R=e("./inffast"),T=e("./inftrees"),D=1,F=2,N=0,U=-2,P=1,n=852,i=592;function L(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=P,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new I.Buf32(n),t.distcode=t.distdyn=new I.Buf32(i),t.sane=1,t.back=-1,N):U}function o(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,a(e)):U}function h(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,o(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=h(e,t))!==N&&(e.state=null),r):U}var l,f,c=!0;function j(e){if(c){var t;for(l=new I.Buf32(512),f=new I.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(D,e.lens,0,288,l,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,f,0,e.work,{bits:5}),c=!1}e.lencode=l,e.lenbits=9,e.distcode=f,e.distbits=5}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),n>=s.wsize?(I.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),I.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(I.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,f=o,c=h,x=N;e:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(d=r.length)&&(d=o),d&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,n,s,d,k)),512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,r.length-=d),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}e.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,l-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(d=r.length){if(o<d&&(d=o),h<d&&(d=h),0===d)break e;I.arraySet(i,n,s,d,a),o-=d,s+=d,h-=d,a+=d,r.length-=d;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],d=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+d>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;d--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=o&&258<=h){e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,R(e,c),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){e.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break e;if(d=c-h,r.offset>d){if((d=r.offset-d)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=d>r.wnext?(d-=r.wnext,r.wsize-d):r.wnext-d,d>r.length&&(d=r.length),m=r.window}else m=i,p=a-r.offset,d=r.length;for(h<d&&(d=h),h-=d,r.length-=d;i[a++]=m[p++],--d;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break e;i[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break e;o--,u|=n[s++]<<l,l+=8}if(c-=h,e.total_out+=c,r.total+=c,c&&(e.adler=r.check=r.flags?B(r.check,i,c,a-c):O(r.check,i,c,a-c)),c=h,(r.flags?u:L(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return-4;case 32:default:return U}return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,(r.wsize||c!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,c-e.avail_out)?(r.mode=31,-4):(f-=e.avail_in,c-=e.avail_out,e.total_in+=f,e.total_out+=c,r.total+=c,r.wrap&&c&&(e.adler=r.check=r.flags?B(r.check,i,c,e.next_out-c):O(r.check,i,c,e.next_out-c)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===c||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=!1,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){"use strict";var D=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,a,o){var h,u,l,f,c,d,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<n;v++)O[t[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return i[s++]=20971520,i[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===e||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<n;v++)0!==t[r+v]&&(a[B[t[r+v]]++]=v);if(d=0===e?(A=R=a,19):1===e?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,c=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===e&&852<C||2===e&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<d?(m=0,a[v]):a[v]>d?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;i[c+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=t[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),c+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===e&&852<C||2===e&&592<C)return 1;i[l=E&f]=k<<24|x<<16|c-s|0}}return 0!==E&&(i[c+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(e,t,r){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,t,r){"use strict";var i=e("../utils/common"),o=0,h=1;function n(e){for(var t=e.length;0<=--t;)e[t]=0}var s=0,a=29,u=256,l=u+1+a,f=30,c=19,_=2*l+1,g=15,d=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));n(z);var C=new Array(2*f);n(C);var E=new Array(512);n(E);var A=new Array(256);n(A);var I=new Array(a);n(I);var O,B,R,T=new Array(f);function D(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function F(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function N(e){return e<256?E[e]:E[256+(e>>>7)]}function U(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function P(e,t,r){e.bi_valid>d-r?(e.bi_buf|=t<<e.bi_valid&65535,U(e,e.bi_buf),e.bi_buf=t>>d-e.bi_valid,e.bi_valid+=r-d):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r)}function L(e,t,r){P(e,r[2*t],r[2*t+1])}function j(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function Z(e,t,r){var n,i,s=new Array(g+1),a=0;for(n=1;n<=g;n++)s[n]=a=a+r[n-1]<<1;for(i=0;i<=t;i++){var o=e[2*i+1];0!==o&&(e[2*i]=j(s[o]++,o))}}function W(e){var t;for(t=0;t<l;t++)e.dyn_ltree[2*t]=0;for(t=0;t<f;t++)e.dyn_dtree[2*t]=0;for(t=0;t<c;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*m]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function M(e){8<e.bi_valid?U(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function H(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function G(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&H(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!H(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n}function K(e,t,r){var n,i,s,a,o=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*o]<<8|e.pending_buf[e.d_buf+2*o+1],i=e.pending_buf[e.l_buf+o],o++,0===n?L(e,i,t):(L(e,(s=A[i])+u+1,t),0!==(a=w[s])&&P(e,i-=I[s],a),L(e,s=N(--n),r),0!==(a=k[s])&&P(e,n-=T[s],a)),o<e.last_lit;);L(e,m,t)}function Y(e,t){var r,n,i,s=t.dyn_tree,a=t.stat_desc.static_tree,o=t.stat_desc.has_stree,h=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,o&&(e.static_len-=a[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)G(e,s,r);for(i=h;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],G(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,G(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,a,o,h=t.dyn_tree,u=t.max_code,l=t.stat_desc.static_tree,f=t.stat_desc.has_stree,c=t.stat_desc.extra_bits,d=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=g;s++)e.bl_count[s]=0;for(h[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<_;r++)p<(s=h[2*h[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),h[2*n+1]=s,u<n||(e.bl_count[s]++,a=0,d<=n&&(a=c[n-d]),o=h[2*n],e.opt_len+=o*(s+a),f&&(e.static_len+=o*(l[2*n+1]+a)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(h[2*i+1]!==s&&(e.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--)}}(e,t),Z(s,u,e.bl_count)}function X(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=a,a=t[2*(n+1)+1],++o<h&&i===a||(o<u?e.bl_tree[2*i]+=o:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[2*b]++):o<=10?e.bl_tree[2*v]++:e.bl_tree[2*y]++,s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4))}function V(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),n=0;n<=r;n++)if(i=a,a=t[2*(n+1)+1],!(++o<h&&i===a)){if(o<u)for(;L(e,i,e.bl_tree),0!=--o;);else 0!==i?(i!==s&&(L(e,i,e.bl_tree),o--),L(e,b,e.bl_tree),P(e,o-3,2)):o<=10?(L(e,v,e.bl_tree),P(e,o-3,3)):(L(e,y,e.bl_tree),P(e,o-11,7));s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4)}}n(T);var q=!1;function J(e,t,r,n){P(e,(s<<1)+(n?1:0),3),function(e,t,r,n){M(e),n&&(U(e,r),U(e,~r)),i.arraySet(e.pending_buf,e.window,t,r,e.pending),e.pending+=r}(e,t,r,!0)}r._tr_init=function(e){q||(function(){var e,t,r,n,i,s=new Array(g+1);for(n=r=0;n<a-1;n++)for(I[n]=r,e=0;e<1<<w[n];e++)A[r++]=n;for(A[r-1]=n,n=i=0;n<16;n++)for(T[n]=i,e=0;e<1<<k[n];e++)E[i++]=n;for(i>>=7;n<f;n++)for(T[n]=i<<7,e=0;e<1<<k[n]-7;e++)E[256+i++]=n;for(t=0;t<=g;t++)s[t]=0;for(e=0;e<=143;)z[2*e+1]=8,e++,s[8]++;for(;e<=255;)z[2*e+1]=9,e++,s[9]++;for(;e<=279;)z[2*e+1]=7,e++,s[7]++;for(;e<=287;)z[2*e+1]=8,e++,s[8]++;for(Z(z,l+1,s),e=0;e<f;e++)C[2*e+1]=5,C[2*e]=j(e,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,c,p)}(),q=!0),e.l_desc=new F(e.dyn_ltree,O),e.d_desc=new F(e.dyn_dtree,B),e.bl_desc=new F(e.bl_tree,R),e.bi_buf=0,e.bi_valid=0,W(e)},r._tr_stored_block=J,r._tr_flush_block=function(e,t,r,n){var i,s,a=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return o;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return h;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return h;return o}(e)),Y(e,e.l_desc),Y(e,e.d_desc),a=function(e){var t;for(X(e,e.dyn_ltree,e.l_desc.max_code),X(e,e.dyn_dtree,e.d_desc.max_code),Y(e,e.bl_desc),t=c-1;3<=t&&0===e.bl_tree[2*S[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?J(e,t,r,n):4===e.strategy||s===i?(P(e,2+(n?1:0),3),K(e,z,C)):(P(e,4+(n?1:0),3),function(e,t,r,n){var i;for(P(e,t-257,5),P(e,r-1,5),P(e,n-4,4),i=0;i<n;i++)P(e,e.bl_tree[2*S[i]+1],3);V(e,e.dyn_ltree,t-1),V(e,e.dyn_dtree,r-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,a+1),K(e,e.dyn_ltree,e.dyn_dtree)),W(e),n&&M(e)},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(A[r]+u+1)]++,e.dyn_dtree[2*N(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){P(e,2,3),L(e,m,z),function(e){16===e.bi_valid?(U(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},{"../utils/common":41}],53:[function(e,t,r){"use strict";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,r){(function(e){!function(r,n){"use strict";if(!r.setImmediate){var i,s,t,a,o=1,h={},u=!1,l=r.document,e=Object.getPrototypeOf&&Object.getPrototypeOf(r);e=e&&e.setTimeout?e:r,i="[object process]"==={}.toString.call(r.process)?function(e){process.nextTick(function(){c(e)})}:function(){if(r.postMessage&&!r.importScripts){var e=!0,t=r.onmessage;return r.onmessage=function(){e=!1},r.postMessage("","*"),r.onmessage=t,e}}()?(a="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",d,!1):r.attachEvent("onmessage",d),function(e){r.postMessage(a+e,"*")}):r.MessageChannel?((t=new MessageChannel).port1.onmessage=function(e){c(e.data)},function(e){t.port2.postMessage(e)}):l&&"onreadystatechange"in l.createElement("script")?(s=l.documentElement,function(e){var t=l.createElement("script");t.onreadystatechange=function(){c(e),t.onreadystatechange=null,s.removeChild(t),t=null},s.appendChild(t)}):function(e){setTimeout(c,0,e)},e.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return h[o]=n,i(o),o++},e.clearImmediate=f}function f(e){delete h[e]}function c(e){if(u)setTimeout(c,0,e);else{var t=h[e];if(t){u=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r)}}(t)}finally{f(e),u=!1}}}}function d(e){e.source===r&&"string"==typeof e.data&&0===e.data.indexOf(a)&&c(+e.data.slice(a.length))}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[10])(10)});
}

/* ═══ code propre terrain editor (fusionné) ═══ */

/**
 * terrain_editor.js — CODE PROPRE COMPLET (fusionné)
 * Contient: i18n, generator, map2d, map3d, ui, main
 */

/* ──── core ──── */

/**
 * terrain_editor_core.js — DONNÉES & GÉNÉRATION (fusionné)
 * Contient: i18n, generator
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  i18n  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_i18n.js
   Internationalisation FR/EN (dictionnaires, window.t, applyLanguage, toggleLanguage).
   Chargement : 3/8 — avant l'UI et le générateur (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_i18n.js
 * Rôle : Système de traduction en direct (Français <-> Anglais)
 */

window.I18N = {
    lang: window.safeStorage.getItem('bloxdTools.lang') || window.safeStorage.getItem('bloxd_lang') || 'en',
    dict: {
        fr: {
            appTitle: "Bloxd Terrain Editor",
            langToggleTitle: "Switch to English / Changer en Anglais",
            langToggleFlag: "🇬🇧",
            langToggleText: "EN",
            loadingTitle: "Génération de l'univers Bloxd...",
            loadingSub: "Initialisation des moteurs 2D & 3D Voxel",
            errLoadingTitle: "Erreur de chargement",
            
            tabSettings: "<i class=\"fas fa-sliders-h\"></i> Paramètres",
            tabEditor: "<i class=\"fas fa-paint-brush\"></i> Éditeur",
            
            secDimensions: "Dimensions du Monde",
            labelWidthX: "Largeur X",
            labelLengthZ: "Longueur Z",
            labelSeed: "Graine (Seed)",
            labelGroundDetail: "Détail du sol",
            labelFlatTerrain: "🏜️ Terrain 100% plat (ignorer la graine)",
            titleFlatTerrain: "Le terrain de base est entièrement plat (la graine n'a plus d'effet sur le relief). Astuce : mets aussi 'Détail du sol' sur Lisse pour un sol parfaitement plan.",
            labelIslandMode: "🏝️ Mode île (entouré d'eau)",
            titleIslandMode: "Le terrain plonge sous l'eau aux bords pour créer une île entourée d'océan.",
            labelFlattenExact: "Aplatir à 100% (niveau exact)",
            titleFlattenExact: "Tout le cercle est mis exactement au niveau du premier clic (pas de fondu sur les bords).",
            titleGroundDetail: "Micro-relief ajouté au sol en vue rapprochée et à l'export (bosses de ±1 bloc). 0 = sol lisse.",
            optGdNone: "⬜ Lisse (aucun)",
            optGdLight: "🌿 Léger",
            optGdNormal: "🌾 Normal",
            optGdRough: "🪨 Accidenté",
            titleRandomSeed: "Graine aléatoire",
            
            
            labelBaseY: "Base Y",
            labelSeaLevel: "Niveau Eau",
            
            secRelief: "Relief Procédural",
            labelMinH: "Hauteur Min",
            labelMaxH: "Hauteur Max",
            labelNoiseScale: "Échelle Bruit",
            labelIntensity: "Intensité",
            labelRoughness: "Rugosité Crêtes",
            
            secPresets: "Presets & Actions",
            presetDefault: "-- Choisir un Preset --",
            btnUndo: "Annuler",
            btnRedo: "Rétablir",
            toastUndo: "↩️ Action annulée (Ctrl+Z)",
            toastRedo: "↪️ Action rétablie (Ctrl+Y)",
            btnReset: "<i class=\"fas fa-trash-alt\"></i> Reset",
            btnSavePreset: "<i class=\"fas fa-save\"></i> Sauver Preset",
            
            secBiomes: "Biomes (cliquer pour défaut)",
            
            secPalette: "Palette Biomes (Peinture)",
            secTools: "Outils Peinture & Sculpture",
            toolBiome: "<i class=\"fas fa-paint-brush\"></i><span>Brush Biome</span>",
            toolBiomeTitle: "Peindre le biome",
            toolRaise: "<i class=\"fas fa-chevron-up\"></i><span>Élever (+)</span>",
            toolRaiseTitle: "Élever",
            toolLower: "<i class=\"fas fa-chevron-down\"></i><span>Creuser (-)</span>",
            toolLowerTitle: "Creuser",
            toolSmooth: "<i class=\"fas fa-water\"></i><span>Lisser</span>",
            toolSmoothTitle: "Lisser",
            toolFlatten: "<i class=\"fas fa-layer-group\"></i><span>Aplatir</span>",
            toolFlattenTitle: "Aplatir",
            toolEraser: "<i class=\"fas fa-eraser\"></i><span>Gomme</span>",
            toolEraserTitle: "Gomme",
            
            secBrushParams: "Paramètres du Brush",
            labelBrushSize: "Taille Pinceau",
            brushSizeVal: " cases",
            labelBrushIntensity: "Intensité",
            
            btnDownloadZip: "<i class=\"fas fa-file-export\"></i> 👉 Télécharger le projet (ZIP)",
            
            statMin: "Min: ",
            statAvg: "Moy: ",
            statMax: "Max: ",
            
            title2D: "Carte 2D Éditable",
            btn2dReset: "<i class=\"fas fa-compress-arrows-alt\"></i> Recadrer",
            btn2dRelief: "<i class=\"fas fa-mountain\"></i> Relief",
            btn2dGrid: "<i class=\"fas fa-th\"></i> Grille",
            infoHover: "Survolez la carte pour voir les coordonnées",
            outOfBounds: "Hors carte",
            
            title3D: "Visualisation 3D",
            btn3dReset: "<i class=\"fas fa-video\"></i> Caméra",
            btn3dMeshVoxel: "🧱 Voxel",
            btn3dMeshSmooth: "🟢 Lisse",
            btn3dWater: "<i class=\"fas fa-water\"></i> Eau",
            flyHint: "🎮 ZQSD/WASD + Espace/Ctrl pour voler",
            secShape: "Forme de la carte",
            shapeSquare: "⬜ Rectangle",
            shapeCircle: "⭕ Cercle / Ovale",
            shapeCustom: "✏️ Personnalisé (dessiner)",
        shapeHexagon: "⬡ Hexagon",
        shapePentagon: "⬠ Pentagon",
        shapeTriangle: "▲ Triangle",
        shapeOctagon: "⬣ Octagon",
            toolShape: "<i class=\"fas fa-shapes\"></i><span>Forme</span>",
            toolShapeTitle: "Peindre la forme (mode Custom)",
            
            modalTitle: "Exportation du Projet Bloxd",
            modalDesc: "Téléchargez directement votre <strong>schématique (.bloxdschem)</strong> généré en temps réel sans avoir besoin de Python ni de ligne de commande ! Si le monde est trop grand, il sera automatiquement découpé en plusieurs fichiers regroupés dans un dossier ZIP.",
            modalFilenameLabel: "Nom du fichier <span style=\"color: var(--text-muted); font-weight: 400;\">(si un seul schéma)</span>",
            modalFoldernameLabel: "Nom du dossier <span style=\"color: var(--text-muted); font-weight: 400;\">(si plusieurs schémas)</span>",
            modalFolderDesc: "Chaque schéma du dossier sera nommé <code>numéro_[posX,posY,posZ]</code> (ex : <code>1_[0,0,0]</code>).",
            modalAnchorLabel: "Position de l'angle de collage <span style=\"color: var(--text-muted); font-weight: 400;\">(coin où vous poserez le 1er schéma en jeu)</span>",
            modalDownloadBtn: "<i class=\"fas fa-download\"></i> Télécharger le fichier .bloxdschem",
            modalGenerating: "<i class=\"fas fa-cog fa-spin\"></i> Génération directe du schématique...",
            
            biomePlain: "Plaines (Plain)",
            biomeForest: "Forêt (Forest)",
            biomeSand: "Sable / Plage (Sand)",
            biomeMountain: "Montagne (Mountain)",
            biomeSnow: "Neige (Snow)",
            biomeDesert: "Mesa (Mesa)",
            biomeVolcano: "Volcan (Volcano)",
            ruleActive: "Actif (règle de hauteur)",
            ruleYMinTip: "Couche basse : altitude minimale où ce biome apparaît toujours",
            ruleYMaxTip: "Couche haute : altitude maximale où ce biome apparaît toujours",
            ruleLocked: "Prioritaire (bloque la peinture)",
            maxHWarning: "⚠️ Au-delà de 400, l'export sera plus lourd et plus lent en jeu (déconseillé).",
            modalSingleFile: "📄 Forcer un seul fichier .bloxdschem",
            modalSingleFileDesc: "Exporte tout le monde en un unique schématique, sans découpage. Idéal pour les outils externes (autres sites web). ⚠️ Bloxd.io refusera ce fichier s'il dépasse ~200 chunks : garde la case décochée pour importer en jeu.",
            toolSphere: "<i class=\"fas fa-globe\"></i><span>Sphère</span>",
            toolSphereTitle: "Poser une sphère (dôme) de terrain — taille réglable ci-dessous",
            toolBox: "<i class=\"fas fa-cube\"></i><span>Pavé</span>",
            toolBoxTitle: "Poser un pavé (plateau) de terrain — taille réglable ci-dessous",
            secStampParams: "Taille de la Forme",
            labelStampW: "Largeur (X, en blocs)",
            labelStampD: "Profondeur (Z, en blocs)",
            labelStampH: "Hauteur (+bosse / -creux)",
            labelStampBiome: "Appliquer aussi le biome sélectionné",
            btnAddPalette: "➕ Ajouter ma palette de couleurs",
            secPaletteForm: "Ma Palette Personnalisée",
            labelPaletteName: "Nom de la palette",
            labelPaletteColor: "Couleur (aperçu carte)",
            labelPaletteBlocks: "Blocs Bloxd (séparés par des virgules)",
            paletteBlocksHint: "Noms exacts des blocs (ex : Grass Block, Red Sand, Magma). Un bloc inconnu devient Grass Block à l'export.",
            btnSavePalette: "💾 Enregistrer",
            btnCancelPalette: "Annuler",
            errPaletteName: "Donne un nom à ta palette !",
            errPaletteExists: "Une palette porte déjà ce nom.",
            delPaletteTip: "Supprimer cette palette",
            confirmDelPalette: "Supprimer cette palette ? Les zones peintes reviendront au biome par défaut.",
            modalPixelated: "🧊 Style pixelisé (gros blocs texturés)",
            modalPixelatedDesc: "Conserve l'effet \"marches géantes\" : le terrain est exporté en gros plateaux cubiques stylés. Décoché = pentes lissées (interpolation).",
            
            presetClassic: "🟢 Plaines Bloxd Classique",
            presetArchipelago: "🏝️ Archipel Tropical & Plages",
            presetAlpine: "🏔️ Hauts Sommets Glacés",
            
            promptPresetName: "Nom du Preset personnalisé :",
            defaultPresetVal: "Mon Univers Bloxd",
            presetSaved: "Preset sauvegardé avec succès : ",
            errSchemGen: "Erreur lors de la création du fichier .bloxdschem.",
            
            guideSplitHeader: "============================================================\n📦 MONDE DÉCOUPÉ EN PARTIES (<200 CHUNKS/FICHIER)\n============================================================\n\nCe monde étant volumineux, il a été découpé en plusieurs fichiers pour respecter\nla limite technique de Bloxd.io (~200 chunks maximum par commande //schematic load).\n\n⚠️ IMPORTANT : Bloxd.io ne repositionne PAS automatiquement chaque partie à sa\nplace dans le monde (comme le fait aussi l'outil officiel M2B pour ses schematics\ndécoupés) : c'est à VOUS de vous déplacer entre deux chargements, sinon toutes\nles parties se superposent au même endroit.\n\nINSTRUCTIONS D'IMPORTATION :\n1. Placez tous les fichiers .bloxdschem du dossier dans le répertoire schématiques de Bloxd.\n2. En jeu, rendez-vous à la position de l'angle de collage indiquée dans le nom du 1er fichier.\n3. Pour chaque fichier ci-dessous, déplacez-vous à la position [posX,posY,posZ] indiquée dans\n   son nom, PUIS chargez-le :\n\n",
            readmeHeader: "# 📦 Projet Terrain Bloxd.io Personnalisé\nGénéré depuis l'application **Bloxd Terrain Editor**\n\n## 🚀 Contenu de l'archive\n- `generate_terrain.py` : Script de génération configuré avec vos paramètres exacts et biomes.\n- `bloxd_format.py` : Moteur d'écriture binaire Avro (.bloxdschem).\n- `nameToId.json` : Table de mapping des ID de blocs Bloxd.io.\n\n## 🛠️ Comment générer votre carte sur votre ordinateur\n1. Assurez-vous d'avoir Python 3 installé avec `numpy` :\n   ```bash\n   pip install numpy\n   ```\n2. Exécutez le générateur :\n   ```bash\n   python generate_terrain.py\n   ```\n3. Un fichier **`custom_terrain.bloxdschem`** sera généré en quelques secondes.\n\n## 🎮 Comment importer dans Bloxd.io\n1. Lancez Bloxd.io dans votre navigateur (mode Créatif ou serveur Worlds avec permissions).\n2. Placez le fichier `custom_terrain.bloxdschem` dans vos schématiques.\n3. Chargez le schématique en jeu via la commande :\n   `//schematic load custom_terrain`\n\nProfitez de votre nouveau monde Bloxd ! 🌟\n",
            directGuideContent: "============================================================\n📦 GUIDE D'IMPORTATION DIRECTE DANS BLOXD.IO\n============================================================\n\nFélicitations ! Votre monde a été généré en direct par Bloxd Terrain Editor sans avoir besoin de code Python.\nLe fichier schématique prêt à l'emploi est situé dans le dossier \"schematics\" :\n👉 monde_personnalise.bloxdschem\n\nMODE D'EMPLOI EN 3 ÉTAPES SIMPLES :\n1. Lancez Bloxd.io dans votre navigateur internet.\n2. Placez le fichier \"monde_personnalise.bloxdschem\" dans votre dossier de schématiques Bloxd (ou utilisez un proxy/mod compatible).\n3. Ouvrez le tchat en jeu et tapez la commande :\n   //schematic load monde_personnalise\n\nEt voilà ! Votre terrain apparaîtra instantanément dans le jeu.\n============================================================\nNote pour les développeurs : Si vous préférez exécuter les scripts manuellement, \nils sont conservés dans le dossier \"options_avancees_python/\".\n"
        },
        en: {
            appTitle: "Bloxd Terrain Editor",
            langToggleTitle: "Passer en Français / Switch to French",
            langToggleFlag: "🇫🇷",
            langToggleText: "FR",
            loadingTitle: "Generating Bloxd world...",
            loadingSub: "Initializing 2D & 3D Voxel engines",
            errLoadingTitle: "Loading Error",
            
            tabSettings: "<i class=\"fas fa-sliders-h\"></i> Settings",
            tabEditor: "<i class=\"fas fa-paint-brush\"></i> Editor",
            
            secDimensions: "World Dimensions",
            labelWidthX: "Width X",
            labelLengthZ: "Length Z",
            labelSeed: "Seed",
            labelGroundDetail: "Ground detail",
            labelFlatTerrain: "🏜️ 100% flat terrain (ignore seed)",
            titleFlatTerrain: "The base terrain is fully flat (the seed no longer affects the relief). Tip: also set 'Ground detail' to Smooth for a perfectly level floor.",
            labelIslandMode: "🏝️ Island mode (surrounded by water)",
            titleIslandMode: "Terrain dips below water at the edges to create an island surrounded by ocean.",
            labelFlattenExact: "Flatten to 100% (exact level)",
            titleFlattenExact: "The whole circle is set to the exact level of the first click (no edge falloff).",
            titleGroundDetail: "Micro-relief added to the ground up close and at export (±1 block bumps). 0 = smooth ground.",
            optGdNone: "⬜ Smooth (none)",
            optGdLight: "🌿 Light",
            optGdNormal: "🌾 Normal",
            optGdRough: "🪨 Rugged",
            titleRandomSeed: "Random seed",
            
            
            labelBaseY: "Base Y",
            labelSeaLevel: "Sea Level",
            
            secRelief: "Procedural Relief",
            labelMinH: "Min Height",
            labelMaxH: "Max Height",
            labelNoiseScale: "Noise Scale",
            labelIntensity: "Intensity",
            labelRoughness: "Ridge Roughness",
            
            secPresets: "Presets & Actions",
            presetDefault: "-- Choose a Preset --",
            btnUndo: "Undo",
            btnRedo: "Redo",
            toastUndo: "↩️ Action undone (Ctrl+Z)",
            toastRedo: "↪️ Action redone (Ctrl+Y)",
            btnReset: "<i class=\"fas fa-trash-alt\"></i> Reset",
            btnSavePreset: "<i class=\"fas fa-save\"></i> Save Preset",
            
            secBiomes: "Biomes (click for default)",
            
            secPalette: "Biome Palette (Painting)",
            secTools: "Painting & Sculpting Tools",
            toolBiome: "<i class=\"fas fa-paint-brush\"></i><span>Biome Brush</span>",
            toolBiomeTitle: "Paint biome",
            toolRaise: "<i class=\"fas fa-chevron-up\"></i><span>Raise (+)</span>",
            toolRaiseTitle: "Raise height",
            toolLower: "<i class=\"fas fa-chevron-down\"></i><span>Lower (-)</span>",
            toolLowerTitle: "Lower height",
            toolSmooth: "<i class=\"fas fa-water\"></i><span>Smooth</span>",
            toolSmoothTitle: "Smooth terrain",
            toolFlatten: "<i class=\"fas fa-layer-group\"></i><span>Flatten</span>",
            toolFlattenTitle: "Flatten terrain",
            toolEraser: "<i class=\"fas fa-eraser\"></i><span>Eraser</span>",
            toolEraserTitle: "Eraser tool",
            
            secBrushParams: "Brush Settings",
            labelBrushSize: "Brush Size",
            brushSizeVal: " blocks",
            labelBrushIntensity: "Intensity",
            
            btnDownloadZip: "<i class=\"fas fa-file-export\"></i> 👉 Download Project (ZIP)",
            
            statMin: "Min: ",
            statAvg: "Avg: ",
            statMax: "Max: ",
            
            title2D: "Editable 2D Map",
            btn2dReset: "<i class=\"fas fa-compress-arrows-alt\"></i> Center View",
            btn2dRelief: "<i class=\"fas fa-mountain\"></i> Relief",
            btn2dGrid: "<i class=\"fas fa-th\"></i> Grid",
            infoHover: "Hover over map to view coordinates",
            outOfBounds: "Out of bounds",
            
            title3D: "3D Visualization",
            btn3dReset: "<i class=\"fas fa-video\"></i> Camera",
            btn3dMeshVoxel: "🧱 Voxel",
            btn3dMeshSmooth: "🟢 Smooth",
            btn3dWater: "<i class=\"fas fa-water\"></i> Water",
            flyHint: "🎮 WASD/ZQSD + Space/Ctrl to fly",
            secShape: "Map shape",
            toolShape: "<i class=\"fas fa-shapes\"></i><span>Shape</span>",
            toolShapeTitle: "Paint shape (Custom mode)",
            
            modalTitle: "Export Bloxd Project",
            modalDesc: "Download your generated <strong>schematic (.bloxdschem)</strong> directly in real time without needing Python or command line tools! If the world exceeds size limits, it will automatically be split into multiple schematic files packaged inside a ZIP archive.",
            modalFilenameLabel: "File name <span style=\"color: var(--text-muted); font-weight: 400;\">(if single schematic)</span>",
            modalFoldernameLabel: "Folder name <span style=\"color: var(--text-muted); font-weight: 400;\">(if multiple schematics)</span>",
            modalFolderDesc: "Each schematic in the archive will be named <code>number_[posX,posY,posZ]</code> (e.g. <code>1_[0,0,0]</code>).",
            modalAnchorLabel: "Paste Anchor Position <span style=\"color: var(--text-muted); font-weight: 400;\">(corner where you paste the 1st schematic in game)</span>",
            modalDownloadBtn: "<i class=\"fas fa-download\"></i> Download .bloxdschem file",
            modalGenerating: "<i class=\"fas fa-cog fa-spin\"></i> Generating schematic directly...",
            
            biomePlain: "Plains",
            biomeForest: "Forest",
            biomeSand: "Sand / Beach",
            biomeMountain: "Mountain",
            biomeSnow: "Snow",
            biomeDesert: "Mesa",
            biomeVolcano: "Volcano",
            ruleActive: "Active (height rule)",
            ruleYMinTip: "Lower layer: minimum altitude where this biome always appears",
            ruleYMaxTip: "Upper layer: maximum altitude where this biome always appears",
            ruleLocked: "Priority (blocks painting)",
            maxHWarning: "⚠️ Above 400, the export gets heavier and slower in game (not recommended).",
            modalSingleFile: "📄 Force a single .bloxdschem file",
            modalSingleFileDesc: "Exports the whole world as one schematic, without splitting. Ideal for external tools (other websites). ⚠️ Bloxd.io will reject the file if it exceeds ~200 chunks: keep unchecked for in-game import.",
            toolSphere: "<i class=\"fas fa-globe\"></i><span>Sphere</span>",
            toolSphereTitle: "Place a terrain sphere (dome) — size adjustable below",
            toolBox: "<i class=\"fas fa-cube\"></i><span>Box</span>",
            toolBoxTitle: "Place a terrain box (plateau) — size adjustable below",
            secStampParams: "Shape Size",
            labelStampW: "Width (X, in blocks)",
            labelStampD: "Depth (Z, in blocks)",
            labelStampH: "Height (+bump / -hole)",
            labelStampBiome: "Also apply the selected biome",
            btnAddPalette: "➕ Add my color palette",
            secPaletteForm: "My Custom Palette",
            labelPaletteName: "Palette name",
            labelPaletteColor: "Color (map preview)",
            labelPaletteBlocks: "Bloxd blocks (comma separated)",
            paletteBlocksHint: "Exact block names (e.g. Grass Block, Red Sand, Magma). Unknown blocks fall back to Grass Block on export.",
            btnSavePalette: "💾 Save",
            btnCancelPalette: "Cancel",
            errPaletteName: "Give your palette a name!",
            errPaletteExists: "A palette with this name already exists.",
            delPaletteTip: "Delete this palette",
            confirmDelPalette: "Delete this palette? Painted areas will revert to the default biome.",
            modalPixelated: "🧊 Pixelated style (big textured blocks)",
            modalPixelatedDesc: "Keeps the \"giant steps\" effect: terrain is exported as big stylish cubic plateaus. Unchecked = smooth slopes (interpolation).",
            
            presetClassic: "🟢 Classic Bloxd Plains",
            presetArchipelago: "🏝️ Tropical Archipelago & Beaches",
            presetAlpine: "🏔️ Icy Alpine Peaks",
            
            promptPresetName: "Custom Preset Name:",
            defaultPresetVal: "My Bloxd World",
            presetSaved: "Preset saved successfully: ",
            errSchemGen: "Error generating .bloxdschem file.",
            
            guideSplitHeader: "============================================================\n📦 SPLIT WORLD SCHEMATICS (<200 CHUNKS/FILE)\n============================================================\n\nBecause this world is large, it was split into multiple files to comply with\nBloxd.io technical limits (~200 chunks maximum per //schematic load command).\n\n⚠️ IMPORTANT: Bloxd.io does NOT automatically reposition each schematic file\nto its coordinates in the world: YOU must move your character between loads,\notherwise all parts will overlap at the same location.\n\nIMPORT INSTRUCTIONS:\n1. Place all .bloxdschem files from the folder into Bloxd schematic directory.\n2. In game, go to the paste anchor position indicated in the name of file #1.\n3. For each file below, move your character to the [posX,posY,posZ] indicated in\n   its name, THEN load it:\n\n🚨 GOLDEN RULE — CONSTANT Y ALTITUDE:\nBloxd pastes each schematic RELATIVE TO YOUR POSITION, INCLUDING YOUR HEIGHT!\nLoad ALL parts from EXACTLY the same Y altitude.\nIf you walk on already-generated terrain (dunes, hills...), your Y changes and\nthe next part will be VERTICALLY SHIFTED (stone cliffs, raised sand level).\n👉 Tip: use fly mode, position yourself at the exact Y shown on screen,\n   and check that Y before EVERY //schematic load.\n\n",
            readmeHeader: "# 📦 Custom Bloxd.io Terrain Project\nGenerated from **Bloxd Terrain Editor**\n\n## 🚀 Archive Contents\n- `generate_terrain.py`: Generation script configured with your exact parameters and biomes.\n- `bloxd_format.py`: Avro (.bloxdschem) binary schematic writer.\n- `nameToId.json`: Block mapping table for Bloxd.io block IDs.\n\n## 🛠️ How to generate the map locally on your computer\n1. Make sure Python 3 is installed along with `numpy`:\n   ```bash\n   pip install numpy\n   ```\n2. Run the generator script:\n   ```bash\n   python generate_terrain.py\n   ```\n3. A **`custom_terrain.bloxdschem`** file will be generated in seconds.\n\n## 🎮 How to import into Bloxd.io\n1. Launch Bloxd.io in your web browser (Creative mode or Worlds with build permissions).\n2. Place `custom_terrain.bloxdschem` into your schematic folder.\n3. Load the schematic in game using the chat command:\n   `//schematic load custom_terrain`\n\nEnjoy your new Bloxd world! 🌟\n",
            directGuideContent: "============================================================\n📦 DIRECT BLOXD.IO IMPORT GUIDE\n============================================================\n\nCongratulations! Your world was generated live by Bloxd Terrain Editor without needing Python code.\nThe ready-to-use schematic file is located inside the \"schematics\" folder:\n👉 monde_personnalise.bloxdschem\n\nSIMPLE 3-STEP USER GUIDE:\n1. Launch Bloxd.io in your web browser.\n2. Place the file \"monde_personnalise.bloxdschem\" into your Bloxd schematics folder (or use a compatible proxy/mod).\n3. Open chat in game and type the command:\n   //schematic load monde_personnalise\n\nThat's it! Your terrain will appear immediately in game.\n============================================================\nNote for developers: If you prefer running Python scripts manually,\nthey are preserved inside the \"options_avancees_python/\" folder.\n"
        },
        ja: {
            appTitle:"Bloxd Terrain Editor",langToggleTitle:"言語切替",langToggleFlag:"🌐",langToggleText:"LANG",
            loadingTitle:"Bloxdワールド生成中...",loadingSub:"2D・3D Voxelエンジン初期化",errLoadingTitle:"読込エラー",
            tabSettings:"<i class=\"fas fa-sliders-h\"></i> 設定",tabEditor:"<i class=\"fas fa-paint-brush\"></i> エディタ",
            secDimensions:"ワールド寸法",labelWidthX:"幅 X",labelLengthZ:"奥行 Z",labelSeed:"シード",
            labelGroundDetail:"地面ディテール",labelFlatTerrain:"🏜️ 完全に平らな地形",titleFlatTerrain:"地形が完全に平らになります。",
            labelIslandMode:"🏝️ 島モード（周囲が水）",titleIslandMode:"縁が水中に沈んで島を作ります。",
            labelFlattenExact:"100%平坦化（正確なレベル）",titleFlattenExact:"円全体が最初のクリック位置と同じ高さになります。",
            titleGroundDetail:"近距離とエクスポート時の微地形（±1ブロック）。0=滑らか。",
            optGdNone:"⬜ スムーズ（なし）",optGdLight:"🌿 軽い",optGdNormal:"🌾 標準",optGdRough:"🪨 荒い",titleRandomSeed:"ランダムシード",
            labelBaseY:"ベース Y",labelSeaLevel:"海面",
            secRelief:"プロシージャル地形",labelMinH:"最低高度",labelMaxH:"最高高度",labelNoiseScale:"ノイズスケール",labelIntensity:"強度",labelRoughness:"尾根の粗さ",
            secPresets:"プリセット & アクション",presetDefault:"-- プリセット選択 --",
            btnUndo:"元に戻す",btnRedo:"やり直し",toastUndo:"↩️ 操作を元に戻しました (Ctrl+Z)",toastRedo:"↪️ 操作をやり直しました (Ctrl+Y)",
            btnReset:"<i class=\"fas fa-trash-alt\"></i> リセット",btnSavePreset:"<i class=\"fas fa-save\"></i> プリセット保存",
            secBiomes:"バイオーム（クリックでデフォルト）",secPalette:"バイオームパレット（ペイント）",
            secTools:"ペイント & 彫刻ツール",
            toolBiome:"<i class=\"fas fa-paint-brush\"></i><span>バイオームブラシ</span>",toolBiomeTitle:"バイオームをペイント",
            toolRaise:"<i class=\"fas fa-chevron-up\"></i><span>隆起 (+)</span>",toolRaiseTitle:"隆起",
            toolLower:"<i class=\"fas fa-chevron-down\"></i><span>掘削 (-)</span>",toolLowerTitle:"掘削",
            toolSmooth:"<i class=\"fas fa-water\"></i><span>平滑化</span>",toolSmoothTitle:"平滑化",
            toolFlatten:"<i class=\"fas fa-layer-group\"></i><span>平坦化</span>",toolFlattenTitle:"平坦化",
            toolEraser:"<i class=\"fas fa-eraser\"></i><span>消去</span>",toolEraserTitle:"消去ツール",
            secBrushParams:"ブラシ設定",labelBrushSize:"ブラシサイズ",brushSizeVal:" ブロック",labelBrushIntensity:"強度",
            btnDownloadZip:"<i class=\"fas fa-file-export\"></i> 👉 プロジェクトダウンロード (ZIP)",
            statMin:"最小: ",statAvg:"平均: ",statMax:"最大: ",
            title2D:"編集可能な2Dマップ",btn2dReset:"<i class=\"fas fa-compress-arrows-alt\"></i> 中央表示",
            btn2dRelief:"<i class=\"fas fa-mountain\"></i> 地形",btn2dGrid:"<i class=\"fas fa-th\"></i> グリッド",
            infoHover:"マップ上にカーソルを合わせて座標を確認",outOfBounds:"マップ外",
            title3D:"3Dビジュアル",btn3dReset:"<i class=\"fas fa-video\"></i> カメラ",
            btn3dMeshVoxel:"🧱 ボクセル",btn3dMeshSmooth:"🟢 スムーズ",btn3dWater:"<i class=\"fas fa-water\"></i> 水",
            flyHint:"🎮 WASD/ZQSD + Space/Ctrl で飛行",secShape:"マップ形状",
            shapeSquare:"⬜ 長方形",shapeCircle:"⭕ 円/楕円",shapeCustom:"✏️ カスタム（描画）",
            shapeHexagon:"⬡ 六角形",shapePentagon:"⬠ 五角形",shapeTriangle:"▲ 三角形",shapeOctagon:"⬣ 八角形",
            toolShape:"<i class=\"fas fa-shapes\"></i><span>形状</span>",toolShapeTitle:"形状をペイント",
            modalTitle:"Bloxdプロジェクト エクスポート",
            modalDesc:"<strong>スケマティック(.bloxdschem)</strong>をPythonなしでリアルタイム生成・ダウンロード！",
            modalFilenameLabel:"ファイル名",modalFoldernameLabel:"フォルダ名",modalFolderDesc:"各ファイルは <code>番号_[posX,posY,posZ]</code> と命名されます。",
            modalAnchorLabel:"貼り付け位置",modalDownloadBtn:"<i class=\"fas fa-download\"></i> .bloxdschemダウンロード",
            modalGenerating:"<i class=\"fas fa-cog fa-spin\"></i> スケマティック生成中...",
            biomePlain:"平原",biomeForest:"森林",biomeSand:"砂浜",biomeMountain:"山地",biomeSnow:"雪",biomeDesert:"メサ",biomeVolcano:"火山",
            ruleActive:"有効（高度ルール）",ruleYMinTip:"下層：最低高度",ruleYMaxTip:"上層：最高高度",ruleLocked:"優先（ペイント禁止）",
            maxHWarning:"⚠️ 400を超えるとエクスポートが重く遅くなります。",
            modalSingleFile:"📄 単一ファイルに強制",modalSingleFileDesc:"全ワールドを1ファイルで出力。",
            toolSphere:"<i class=\"fas fa-globe\"></i><span>球</span>",toolSphereTitle:"地形の球を配置",
            toolBox:"<i class=\"fas fa-cube\"></i><span>箱</span>",toolBoxTitle:"地形の箱を配置",
            secStampParams:"形状サイズ",labelStampW:"幅 (X)",labelStampD:"奥行 (Z)",labelStampH:"高さ (+/-)",
            labelStampBiome:"選択中のバイオームも適用",btnAddPalette:"➕ カラーパレット追加",
            secPaletteForm:"カスタムパレット",labelPaletteName:"パレット名",labelPaletteColor:"色",
            labelPaletteBlocks:"Bloxdブロック（カンマ区切り）",paletteBlocksHint:"正確なブロック名を入力。",
            btnSavePalette:"💾 保存",btnCancelPalette:"キャンセル",errPaletteName:"パレット名を入力！",errPaletteExists:"同名のパレットが存在します。",
            delPaletteTip:"パレットを削除",confirmDelPalette:"パレットを削除？",
            modalPixelated:"🧊 ピクセルアート風",modalPixelatedDesc:"「巨大階段」効果を維持。",
            presetClassic:"🟢 クラシック平原",presetArchipelago:"🏝️ 熱帯群島",presetAlpine:"🏔️ 氷河アルプス",
            promptPresetName:"プリセット名：",defaultPresetVal:"Bloxdワールド",presetSaved:"プリセット保存成功： ",errSchemGen:".bloxdschem生成エラー。"
        },
        ko: {
            appTitle:"Bloxd Terrain Editor",langToggleTitle:"언어 전환",langToggleFlag:"🌐",langToggleText:"언어",
            loadingTitle:"Bloxd 월드 생성 중...",loadingSub:"2D·3D Voxel 엔진 초기화",errLoadingTitle:"로딩 오류",
            tabSettings:"<i class=\"fas fa-sliders-h\"></i> 설정",tabEditor:"<i class=\"fas fa-paint-brush\"></i> 에디터",
            secDimensions:"월드 크기",labelWidthX:"너비 X",labelLengthZ:"길이 Z",labelSeed:"시드",
            labelGroundDetail:"지면 디테일",labelFlatTerrain:"🏜️ 100% 평평한 지형",titleFlatTerrain:"지형이 완전히 평평해집니다.",
            labelIslandMode:"🏝️ 섬 모드 (물로 둘러싸임)",titleIslandMode:"가장자리가 물 아래로 가라앉아 섬을 만듭니다.",
            labelFlattenExact:"100% 평탄화 (정확한 레벨)",titleFlattenExact:"전체 원이 첫 클릭 높이로 설정됩니다.",
            titleGroundDetail:"근거리 및 내보내기 시 미세 지형 (±1블록). 0=평활.",
            optGdNone:"⬜ 평활 (없음)",optGdLight:"🌿 약간",optGdNormal:"🌾 보통",optGdRough:"🪨 험준",titleRandomSeed:"랜덤 시드",
            labelBaseY:"기준 Y",labelSeaLevel:"해수면",
            secRelief:"프로시저럴 지형",labelMinH:"최소 높이",labelMaxH:"최대 높이",labelNoiseScale:"노이즈 스케일",labelIntensity:"강도",labelRoughness:"능선 거칠기",
            secPresets:"프리셋 & 액션",presetDefault:"-- 프리셋 선택 --",
            btnUndo:"실행 취소",btnRedo:"다시 실행",toastUndo:"↩️ 실행 취소 (Ctrl+Z)",toastRedo:"↪️ 다시 실행 (Ctrl+Y)",
            btnReset:"<i class=\"fas fa-trash-alt\"></i> 리셋",btnSavePreset:"<i class=\"fas fa-save\"></i> 프리셋 저장",
            secBiomes:"바이옴 (클릭하여 기본 설정)",secPalette:"바이옴 팔레트 (페인트)",
            secTools:"페인트 & 조각 도구",
            toolBiome:"<i class=\"fas fa-paint-brush\"></i><span>바이옴 브러시</span>",toolBiomeTitle:"바이옴 페인트",
            toolRaise:"<i class=\"fas fa-chevron-up\"></i><span>올리기 (+)</span>",toolRaiseTitle:"높이 올리기",
            toolLower:"<i class=\"fas fa-chevron-down\"></i><span>내리기 (-)</span>",toolLowerTitle:"높이 내리기",
            toolSmooth:"<i class=\"fas fa-water\"></i><span>평탄화</span>",toolSmoothTitle:"지형 평탄화",
            toolFlatten:"<i class=\"fas fa-layer-group\"></i><span>고르게</span>",toolFlattenTitle:"지형 고르게",
            toolEraser:"<i class=\"fas fa-eraser\"></i><span>지우개</span>",toolEraserTitle:"지우개 도구",
            secBrushParams:"브러시 설정",labelBrushSize:"브러시 크기",brushSizeVal:" 블록",labelBrushIntensity:"강도",
            btnDownloadZip:"<i class=\"fas fa-file-export\"></i> 👉 프로젝트 다운로드 (ZIP)",
            statMin:"최소: ",statAvg:"평균: ",statMax:"최대: ",
            title2D:"편집 가능 2D 지도",btn2dReset:"<i class=\"fas fa-compress-arrows-alt\"></i> 중앙 보기",
            btn2dRelief:"<i class=\"fas fa-mountain\"></i> 지형",btn2dGrid:"<i class=\"fas fa-th\"></i> 격자",
            infoHover:"지도 위에 커서를 올려 좌표 확인",outOfBounds:"지도 영역 밖",
            title3D:"3D 시각화",btn3dReset:"<i class=\"fas fa-video\"></i> 카메라",
            btn3dMeshVoxel:"🧱 복셀",btn3dMeshSmooth:"🟢 부드럽게",btn3dWater:"<i class=\"fas fa-water\"></i> 물",
            flyHint:"🎮 WASD/ZQSD + Space/Ctrl 비행",secShape:"지도 모양",
            shapeSquare:"⬜ 사각형",shapeCircle:"⭕ 원/타원",shapeCustom:"✏️ 사용자 정의 (그리기)",
            shapeHexagon:"⬡ 육각형",shapePentagon:"⬠ 오각형",shapeTriangle:"▲ 삼각형",shapeOctagon:"⬣ 팔각형",
            toolShape:"<i class=\"fas fa-shapes\"></i><span>모양</span>",toolShapeTitle:"모양 페인트",
            modalTitle:"Bloxd 프로젝트 내보내기",
            modalDesc:"<strong>스케매틱(.bloxdschem)</strong>을 Python 없이 실시간 생성·다운로드!",
            modalFilenameLabel:"파일명",modalFoldernameLabel:"폴더명",modalFolderDesc:"각 파일은 <code>번호_[posX,posY,posZ]</code>로 명명됩니다.",
            modalAnchorLabel:"붙여넣기 위치",modalDownloadBtn:"<i class=\"fas fa-download\"></i> .bloxdschem 다운로드",
            modalGenerating:"<i class=\"fas fa-cog fa-spin\"></i> 스케매틱 생성 중...",
            biomePlain:"평원",biomeForest:"숲",biomeSand:"모래/해변",biomeMountain:"산악",biomeSnow:"눈",biomeDesert:"메사",biomeVolcano:"화산",
            ruleActive:"활성 (높이 규칙)",ruleYMinTip:"하층: 최소 고도",ruleYMaxTip:"상층: 최대 고도",ruleLocked:"우선 (페인트 차단)",
            maxHWarning:"⚠️ 400 초과 시 내보내기가 느려집니다.",
            modalSingleFile:"📄 단일 파일 강제",modalSingleFileDesc:"전체 월드를 1개 파일로 내보냅니다.",
            toolSphere:"<i class=\"fas fa-globe\"></i><span>구</span>",toolSphereTitle:"지형 구 배치",
            toolBox:"<i class=\"fas fa-cube\"></i><span>상자</span>",toolBoxTitle:"지형 상자 배치",
            secStampParams:"모양 크기",labelStampW:"너비 (X)",labelStampD:"깊이 (Z)",labelStampH:"높이 (+/-)",
            labelStampBiome:"선택된 바이옴도 적용",btnAddPalette:"➕ 색상 팔레트 추가",
            secPaletteForm:"내 커스텀 팔레트",labelPaletteName:"팔레트 이름",labelPaletteColor:"색상",
            labelPaletteBlocks:"Bloxd 블록 (쉼표로 구분)",paletteBlocksHint:"정확한 블록 이름 입력.",
            btnSavePalette:"💾 저장",btnCancelPalette:"취소",errPaletteName:"팔레트 이름 입력!",errPaletteExists:"같은 이름이 이미 존재합니다.",
            delPaletteTip:"팔레트 삭제",confirmDelPalette:"팔레트 삭제?",
            modalPixelated:"🧊 픽셀 아트 스타일",modalPixelatedDesc:"\"거대 계단\" 효과 유지.",
            presetClassic:"🟢 클래식 평원",presetArchipelago:"🏝️ 열대 군도",presetAlpine:"🏔️ 빙하 알프스",
            promptPresetName:"프리셋 이름:",defaultPresetVal:"Bloxd 월드",presetSaved:"프리셋 저장 성공: ",errSchemGen:".bloxdschem 생성 오류."
        },
        th: {
            appTitle:"Bloxd Terrain Editor",langToggleTitle:"เปลี่ยนภาษา",langToggleFlag:"🌐",langToggleText:"ภาษา",
            loadingTitle:"กำลังสร้างโลก Bloxd...",loadingSub:"กำลังเริ่มต้นเอนจิ้น 2D & 3D Voxel",errLoadingTitle:"ข้อผิดพลาดในการโหลด",
            tabSettings:"<i class=\"fas fa-sliders-h\"></i> ตั้งค่า",tabEditor:"<i class=\"fas fa-paint-brush\"></i> แก้ไข",
            secDimensions:"ขนาดโลก",labelWidthX:"ความกว้าง X",labelLengthZ:"ความยาว Z",labelSeed:"ซีด",
            labelGroundDetail:"รายละเอียดพื้นดิน",labelFlatTerrain:"🏜️ พื้นที่ราบ 100%",titleFlatTerrain:"พื้นที่จะราบเรียบทั้งหมด",
            labelIslandMode:"🏝️ โหมดเกาะ (ล้อมรอบด้วยน้ำ)",titleIslandMode:"ขอบต่างจมลงใต้น้ำเป็นเกาะ",
            labelFlattenExact:"ทำให้ราบ 100% (ระดับเที่ยงตรง)",titleFlattenExact:"ทั้งวงจะตั้งเป็นระดับเดียวกับคลิกแรก",
            titleGroundDetail:"พื้นผิวดินละเอียด ±1 บล็อก 0=เรียบ",
            optGdNone:"⬜ เรียบ (ไม่มี)",optGdLight:"🌿 เบา",optGdNormal:"🌾 ปกติ",optGdRough:"🪨 ขรุขระ",titleRandomSeed:"สุ่มซีด",
            labelBaseY:"ฐาน Y",labelSeaLevel:"ระดับน้ำทะเล",
            secRelief:"ภูมิประเทศอัตโนมัติ",labelMinH:"ความสูงต่ำสุด",labelMaxH:"ความสูงสูงสุด",labelNoiseScale:"สเกลนอยส์",labelIntensity:"ความเข้ม",labelRoughness:"ความขรุขระ",
            secPresets:"พรีเซ็ต & การกระทำ",presetDefault:"-- เลือกพรีเซ็ต --",
            btnUndo:"ยกเลิก",btnRedo:"ทำซ้ำ",toastUndo:"↩️ ยกเลิกการกระทำ (Ctrl+Z)",toastRedo:"↪️ ทำซ้ำการกระทำ (Ctrl+Y)",
            btnReset:"<i class=\"fas fa-trash-alt\"></i> รีเซ็ต",btnSavePreset:"<i class=\"fas fa-save\"></i> บันทึกพรีเซ็ต",
            secBiomes:"ไบโอม (คลิกเพื่อตั้งค่าเริ่มต้น)",secPalette:"จานไบโอม (วาดสี)",
            secTools:"เครื่องมือวาด & แกะสลัก",
            toolBiome:"<i class=\"fas fa-paint-brush\"></i><span>แปรงไบโอม</span>",toolBiomeTitle:"วาดไบโอม",
            toolRaise:"<i class=\"fas fa-chevron-up\"></i><span>ยก (+)</span>",toolRaiseTitle:"ยกพื้นที่",
            toolLower:"<i class=\"fas fa-chevron-down\"></i><span>ลด (-)</span>",toolLowerTitle:"ลดพื้นที่",
            toolSmooth:"<i class=\"fas fa-water\"></i><span>เรียบ</span>",toolSmoothTitle:"ทำให้พื้นที่เรียบ",
            toolFlatten:"<i class=\"fas fa-layer-group\"></i><span>ราบ</span>",toolFlattenTitle:"ทำให้พื้นที่ราบ",
            toolEraser:"<i class=\"fas fa-eraser\"></i><span>ยางลบ</span>",toolEraserTitle:"เครื่องมือยางลบ",
            secBrushParams:"ตั้งค่าแปรง",labelBrushSize:"ขนาดแปรง",brushSizeVal:" บล็อก",labelBrushIntensity:"ความเข้ม",
            btnDownloadZip:"<i class=\"fas fa-file-export\"></i> 👉 ดาวน์โหลดโปรเจกต์ (ZIP)",
            statMin:"ต่ำสุด: ",statAvg:"เฉลี่ย: ",statMax:"สูงสุด: ",
            title2D:"แผนที่ 2D แก้ไขได้",btn2dReset:"<i class=\"fas fa-compress-arrows-alt\"></i> มุมกลาง",
            btn2dRelief:"<i class=\"fas fa-mountain\"></i> ภูมิประเทศ",btn2dGrid:"<i class=\"fas fa-th\"></i> ตาราง",
            infoHover:"เลื่อนเมาส์เหนือแผนที่เพื่อดูพิกัด",outOfBounds:"นอกขอบเขตแผนที่",
            title3D:"มุมมอง 3D",btn3dReset:"<i class=\"fas fa-video\"></i> กล้อง",
            btn3dMeshVoxel:"🧱 วอกเซล",btn3dMeshSmooth:"🟢 เรียบ",btn3dWater:"<i class=\"fas fa-water\"></i> น้ำ",
            flyHint:"🎮 WASD/ZQSD + Space/Ctrl เพื่อบิน",secShape:"รูปร่างแผนที่",
            shapeSquare:"⬜ สี่เหลี่ยม",shapeCircle:"⭕ วงกลม/รี",shapeCustom:"✏️ กำหนดเอง (วาด)",
            shapeHexagon:"⬡ หกเหลี่ยม",shapePentagon:"⬠ ห้าเหลี่ยม",shapeTriangle:"▲ สามเหลี่ยม",shapeOctagon:"⬣ แปดเหลี่ยม",
            toolShape:"<i class=\"fas fa-shapes\"></i><span>รูปร่าง</span>",toolShapeTitle:"วาดรูปร่าง",
            modalTitle:"ส่งออกโปรเจกต์ Bloxd",
            modalDesc:"ดาวน์โหลด<strong>สเคมาติก (.bloxdschem)</strong>แบบเรียลไทม์โดยไม่ต้องใช้ Python!",
            modalFilenameLabel:"ชื่อไฟล์",modalFoldernameLabel:"ชื่อโฟลเดอร์",modalFolderDesc:"แต่ละไฟล์จะชื่อ <code>หมายเลข_[posX,posY,posZ]</code>",
            modalAnchorLabel:"ตำแหน่งวาง",modalDownloadBtn:"<i class=\"fas fa-download\"></i> ดาวน์โหลด .bloxdschem",
            modalGenerating:"<i class=\"fas fa-cog fa-spin\"></i> กำลังสร้างสเคมาติก...",
            biomePlain:"ทุ่งราบ",biomeForest:"ป่า",biomeSand:"หาดทราย",biomeMountain:"ภูเขา",biomeSnow:"หิมะ",biomeDesert:"เมซา",biomeVolcano:"ภูเขาไฟ",
            ruleActive:"ใช้งาน (กฎความสูง)",ruleYMinTip:"ชั้นล่าง: ความสูงต่ำสุด",ruleYMaxTip:"ชั้นบน: ความสูงสูงสุด",ruleLocked:"ลำดับความสำคัญ (บล็อกการวาด)",
            maxHWarning:"⚠️ เกิน 400 จะทำให้การส่งออกช้าลง",
            modalSingleFile:"📄 บังคับไฟล์เดียว",modalSingleFileDesc:"ส่งออกทั้งโลกเป็น 1 ไฟล์",
            toolSphere:"<i class=\"fas fa-globe\"></i><span>ทรงกลม</span>",toolSphereTitle:"วางทรงกลมภูมิประเทศ",
            toolBox:"<i class=\"fas fa-cube\"></i><span>กล่อง</span>",toolBoxTitle:"วางกล่องภูมิประเทศ",
            secStampParams:"ขนาดรูปร่าง",labelStampW:"ความกว้าง (X)",labelStampD:"ความลึก (Z)",labelStampH:"ความสูง (+/-)",
            labelStampBiome:"ใช้ไบโอมที่เลือกด้วย",btnAddPalette:"➕ เพิ่มจานสี",
            secPaletteForm:"จานสีของฉัน",labelPaletteName:"ชื่อจานสี",labelPaletteColor:"สี",
            labelPaletteBlocks:"บล็อก Bloxd (คั่นด้วยจุลภาค)",paletteBlocksHint:"ใส่ชื่อบล็อกที่ถูกต้อง",
            btnSavePalette:"💾 บันทึก",btnCancelPalette:"ยกเลิก",errPaletteName:"ตั้งชื่อจานสี!",errPaletteExists:"มีชื่อนี้แล้ว",
            delPaletteTip:"ลบจานสีนี้",confirmDelPalette:"ลบจานสี?",
            modalPixelated:"🧊 สไตล์พิกเซล",modalPixelatedDesc:"คงเอฟเฟกต์ \"บันไดยักษ์\"",
            presetClassic:"🟢 ทุ่งราบคลาสสิก",presetArchipelago:"🏝️ หมู่เกาะเขตร้อน",presetAlpine:"🏔️ ยอดเขาน้ำแข็ง",
            promptPresetName:"ชื่อพรีเซ็ต:",defaultPresetVal:"โลก Bloxd ของฉัน",presetSaved:"บันทึกพรีเซ็ตสำเร็จ: ",errSchemGen:"ข้อผิดพลาดในการสร้าง .bloxdschem"
        }
    }
};

window.t = function(key) {
    const lang = window.I18N.lang || 'en';
    const d = window.I18N.dict[lang] || window.I18N.dict['en'];
    if (d[key] !== undefined) return d[key];
    const e = window.I18N.dict['en'];
    return e[key] !== undefined ? e[key] : key;
};

window.getBiomeName = function(bKey, defaultObj) {
    const mapKey = 'biome' + bKey.charAt(0).toUpperCase() + bKey.slice(1);
    const translated = window.t(mapKey);
    if (translated && translated !== mapKey) return translated;
    return defaultObj ? defaultObj.name : bKey;
};

window.getPresetName = function(pKey, defaultObj) {
    const mapKey = 'preset' + pKey.charAt(0).toUpperCase() + pKey.slice(1);
    const translated = window.t(mapKey);
    if (translated && translated !== mapKey) return translated;
    return defaultObj ? defaultObj.name : pKey;
};

window.applyLanguage = function(lang) {
    if (lang) {
        window.I18N.lang = lang;
        window.safeStorage.setItem('bloxdTools.lang', lang);
        window.safeStorage.setItem('bloxd_lang', lang);
    }
    const currentLang = window.I18N.lang;

    // Update toggle button text & flag
    const flagEl = document.getElementById('lang-flag');
    const textEl = document.getElementById('lang-label');
    const btnEl = document.getElementById('btn-lang-toggle');
    if (flagEl) flagEl.textContent = window.t('langToggleFlag');
    if (textEl) textEl.textContent = window.t('langToggleText');
    if (btnEl) btnEl.title = window.t('langToggleTitle');

    // Scan all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = window.t(key);
    });

    // Scan all data-i18n-title elements
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = window.t(key);
    });

    // Scan all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = window.t(key);
    });

    // Update select #cfg-ground-detail options
    const gdSelect = document.getElementById('cfg-ground-detail');
    if (gdSelect) {
        Array.from(gdSelect.options).forEach(opt => {
            const v = opt.value;
            if (v === '0') opt.textContent = window.t('optGdNone');
            if (v === '0.5') opt.textContent = window.t('optGdLight');
            if (v === '1') opt.textContent = window.t('optGdNormal');
            if (v === '2') opt.textContent = window.t('optGdRough');
        });
    }

    // Update dynamic UI components if UI manager exists
    if (window.uiManagerInstance) {
        window.uiManagerInstance.initPresetsAndActions();
        if (typeof window.uiManagerInstance.renderSettingsBiomes === 'function') window.uiManagerInstance.renderSettingsBiomes();
        if (typeof window.uiManagerInstance.renderEditorBiomes === 'function') window.uiManagerInstance.renderEditorBiomes();
        if (typeof window.uiManagerInstance.update3dMeshBtn === 'function') window.uiManagerInstance.update3dMeshBtn();
        window.uiManagerInstance.updateStatsBar();
    }
    if (window.map2dInstance) {
        window.map2dInstance.updateMouseOverlay();
    }
};

window.toggleLanguage = function() {
    const nextLang = window.I18N.lang === 'fr' ? 'en' : 'fr';
    window.applyLanguage(nextLang);
};

/* ═══════════════════════════════════════════════════════════════ */
/*  generator  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_generator.js
   Moteur de terrain : bruit procédural seedé, grille hauteurs/biomes, biomes persos, undo/redo, export .bloxdschem (Avro/RLE), découpage <200 chunks.
   Chargement : 4/8 — après terrain_editor_i18n.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_generator.js
 * Rôle : Générateur procédural de terrain (bruit 2D, biomes, gestion de la grille, outils de peinture/édition)
 * Adapté de generate_terrain.py (M2B / Bloxd.io Format)
 */

class TerrainGenerator {
    constructor() {
        // Configuration par défaut inspirée de generate_terrain.py
        this.config = {
            worldSizeX: 4000,
            worldSizeZ: 4000,
            shapeMode: 'square',
            gridResolution: 256, // Résolution de la grille globale (96/128/256)
            pixelatedExport: false, // Export en gros blocs texturés (effet pixelisé) au lieu du lissage bilinéaire
            forceSingleSchem: false, // Forcer l'export en un seul .bloxdschem (pour outils externes, dépasse la limite Bloxd)
            viewportMode: 'global', // Mode unique : grille globale (le "Focus Écran Dynamique" a été retiré ;
            // le détail au zoom est désormais assuré par les chunks 16x16 chargés à la demande, cf. getDetailChunk)
            seed: 54321,
            baseY: 70,
            seaLevel: 88,
            minHeight: 1,
            maxHeight: 400,
            noiseScale: 0.008,
            terrainIntensity: 15,
            roughness: 0.65,
            groundDetail: 1, // Micro-relief du sol au 1:1 (0=lisse, 0.5=léger, 1=normal, 2=fort)
            flatTerrain: false, // Terrain de base 100% plat (ignore le bruit de la graine)
            islandMode: false, // Génère une île : le terrain plonge sous l'eau aux bords
            flattenExact: false, // Outil Aplatir : niveau EXACT sur tout le cercle (pas de fondu)
            defaultBiome: 'plain',
            hillshading: true,
            showGrid: false,
            showWater: true,
            meshType: 'voxel' // 'voxel' | 'smooth'
        };

        // Stockage spatial persistant des modifications "Edit" (pinceau/hauteur/biome) : clé `${worldX},${worldZ}`
        this.customEdits = new Map();
        // Fenêtre active du viewport à l'écran (+ un peu plus / marge)
        this.viewport = { minX: -350, maxX: 350, minZ: -350, maxZ: 350, active: true };
        // Piles d'historique Undo / Redo (Ctrl+Z / Ctrl+Y)
        this.undoStack = [];
        this.redoStack = [];
        // Catalogue des biomes avec leurs blocs Bloxd par défaut et couleurs associées
        this.biomes = {
            plain: {
                name: 'Plaines (Plain)',
                color: '#4ade80', // Vert prairie clair
                blocks: ['Lime Concrete', 'Grass Block', 'Lime Wool', 'Lime Planks'],
                minHeight: 0,
                maxHeight: 110
            },
            forest: {
                name: 'Forêt (Forest)',
                color: '#15803d', // Vert forêt profond
                blocks: ['Lime Baked Clay', 'Green Wool', 'Green Planks', 'Green Concrete', 'Green Baked Clay'],
                minHeight: 60,
                maxHeight: 130
            },
            sand: {
                name: 'Sable / Plage (Sand)',
                color: '#e0cda9', // Beige sable
                blocks: ['Sand', 'Smooth Sandstone'],
                minHeight: 0,
                maxHeight: 93 // Proche du sea level
            },
            mountain: {
                name: 'Montagne (Mountain)',
                color: '#64748b', // Gris rocheux
                blocks: ['Smooth Stone', 'Stone', 'Stone Bricks', 'Cracked Stone Bricks'],
                minHeight: 105,
                maxHeight: 250
            },
            snow: {
                name: 'Neige (Snow)',
                color: '#f8fafc', // Blanc neigeux
                blocks: ['Snow', 'Packed Snow', 'White Concrete'],
                minHeight: 140,
                maxHeight: 400
            },
            desert: {
                name: 'Mesa (Mesa)',
                color: '#ea580c', // Orange terre cuite
                blocks: ['Orange Baked Clay', 'Baked Clay', 'Smooth Red Sandstone', 'Red Sand'],
                minHeight: 65,
                maxHeight: 150
            },
            volcano: {
                name: 'Volcan (Volcano)',
                color: '#dc2626', // Rouge magma / basalte
                blocks: ['Cherry Log', 'Dark Red Brick', 'Dark Red Stone', 'Red Baked Clay', 'Magma'],
                minHeight: 120,
                maxHeight: 350
            }
        };


        // REGLES DE HAUTEUR PAR BIOME : { active, yMin, yMax, locked }
        // - active : la règle force ce biome entre yMin et yMax à la génération
        // - locked : "prioritaire" = le pinceau biome ne peut pas peindre par-dessus
        this.initBiomeRules();
        // Presets prédéfinis pour charger rapidement des univers intéressants
        this.presets = {
            classic: {
                name: "🟢 Plaines Bloxd Classique",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 54321, baseY: 70, seaLevel: 88, minHeight: 1, maxHeight: 250, noiseScale: 0.008, terrainIntensity: 15, roughness: 0.65 }
            },
            archipelago: {
                name: "🏝️ Archipel Tropical & Plages",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 88412, baseY: 65, seaLevel: 92, minHeight: 10, maxHeight: 180, noiseScale: 0.012, terrainIntensity: 22, roughness: 0.4 }
            },
            alpine: {
                name: "🏔️ Hauts Sommets Glacés",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 99123, baseY: 90, seaLevel: 80, minHeight: 40, maxHeight: 380, noiseScale: 0.006, terrainIntensity: 35, roughness: 0.85 }
            },
            canyon: {
                name: "🏜️ Canyons du Désert Aride",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 33214, baseY: 80, seaLevel: 60, minHeight: 20, maxHeight: 220, noiseScale: 0.015, terrainIntensity: 28, roughness: 0.9 }
            }
        };

        // Table de hash pour le bruit pseudo-aléatoire
        this.perm = new Uint8Array(512);
        this.initPermutationTable(this.config.seed);

        // Grille de données 2D : grid[gx][gz] = { height, biome, isCustomHeight, isCustomBiome }
        this.grid = [];
        this.stats = {
            minHeight: 0,
            maxHeight: 0,
            avgHeight: 0,
            biomeCounts: {}
        };
        this._rev = 0; // compteur de version de la grille (invalidation du cache couleur 2D)
        this.shapeMask = null;
    }

    /**
     * Initialise la table de permutation pour le bruit de Perlin/Value selon une graine
     */
    initPermutationTable(seed) {
        let p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Mélange pseudo-aléatoire basé sur seed
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            let j = s % (i + 1);
            let temp = p[i];
            p[i] = p[j];
            p[j] = temp;
        }
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    /**
     * Fonction de bruit 2D lisse (Value Noise bicubique)
     */
    valueNoise2D(x, z) {
        let xi = Math.floor(x) & 255;
        let zi = Math.floor(z) & 255;
        let xf = x - Math.floor(x);
        let zf = z - Math.floor(z);

        // Courbe d'interpolation lissée (smoothstep)
        let u = xf * xf * (3.0 - 2.0 * xf);
        let v = zf * zf * (3.0 - 2.0 * zf);

        let aa = this.perm[this.perm[xi] + zi] / 255.0;
        let ab = this.perm[this.perm[xi] + zi + 1] / 255.0;
        let ba = this.perm[this.perm[xi + 1] + zi] / 255.0;
        let bb = this.perm[this.perm[xi + 1] + zi + 1] / 255.0;

        let x1 = aa + u * (ba - aa);
        let x2 = ab + u * (bb - ab);
        return x1 + v * (x2 - x1);
    }

    /**
     * Bruit fractal multi-octaves avec gestion des crêtes (ridges)
     */
    fbmTerrain(worldX, worldZ) {
        // v3.1 TERRAIN PLAT : sol constant, aucun bruit de la graine.
        // Posé au-dessus de l'eau (sinon baseY 70 < mer 88 = océan partout).
        if (this.config.flatTerrain) {
            return Math.max(this.config.baseY, this.config.seaLevel + 2);
        }
        let scale = this.config.noiseScale;
        let intensity = this.config.terrainIntensity;
        let roughness = this.config.roughness;

        // Bruit de base 1 (ondulations douces)
        let n1 = this.valueNoise2D(worldX * scale, worldZ * scale);
        
        // Bruit de base 2 pour les crêtes rocheuses (ridges)
        let n2 = this.valueNoise2D(worldX * scale * 2.3 + 19.7, worldZ * scale * 2.3 - 41.2);
        let ridges = 1.0 - Math.abs(2.0 * n2 - 1.0);

        // Bruit octave 3 de détail
        let n3 = this.valueNoise2D(worldX * scale * 5.1, worldZ * scale * 5.1);

        let h = this.config.baseY;
        h += (n1 - 0.5) * intensity * 2.5;
        h += ridges * intensity * roughness * 1.8;
        h += (n3 - 0.5) * intensity * 0.4;

        // MODE ÎLE : falloff radial → le terrain plonge sous l'eau aux bords
        if (this.config.islandMode) {
            const meta = this.currentGridMeta;
            if (meta) {
                const dx = (worldX - (meta.startWorldX + meta.resX * meta.stepX * 0.5)) / (meta.resX * meta.stepX * 0.5);
                const dz = (worldZ - (meta.startWorldZ + meta.resZ * meta.stepZ * 0.5)) / (meta.resZ * meta.stepZ * 0.5);
                const distFromCenter = Math.min(1, Math.sqrt(dx * dx + dz * dz));
                const falloff = Math.max(0, 1 - distFromCenter * distFromCenter * 1.3);
                h = this.config.seaLevel - 10 + (h - (this.config.seaLevel - 10)) * falloff;
            }
        }

        return h;
    }

    /**
     * Détermine le biome approprié selon la hauteur et le niveau de la mer
     */

    initBiomeRules() {
        this.loadCustomBiomes();
        for (let key in this.biomes) {
            const b = this.biomes[key];
            if (!b.rule) {
                b.rule = {
                    active: false,
                    yMin: (b.minHeight !== undefined) ? b.minHeight : 0,
                    yMax: (b.maxHeight !== undefined) ? b.maxHeight : 400,
                    locked: false
                };
            }
        }
    }

    /**
     * Retourne le biome imposé par une règle active à cette hauteur, ou null.
     * Si plusieurs règles se chevauchent, la plus spécifique (intervalle le plus étroit) gagne.
     */
    getRuleBiomeForHeight(h) {
        let best = null, bestSpan = Infinity;
        for (let key in this.biomes) {
            const r = this.biomes[key].rule;
            if (r && r.active && h >= r.yMin && h <= r.yMax) {
                const span = r.yMax - r.yMin;
                if (span < bestSpan) { bestSpan = span; best = key; }
            }
        }
        return best;
    }

    /**
     * Retourne la clé du biome dont la règle "prioritaire" (locked) protège cette hauteur, ou null.
     */
    isBiomePaintBlocked(h) {
        for (let key in this.biomes) {
            const r = this.biomes[key].rule;
            if (r && r.active && r.locked && h >= r.yMin && h <= r.yMax) return key;
        }
        return null;
    }

    assignBiomeProcedural(height, worldX, worldZ) {
        // 1) REGLES DE HAUTEUR PAR BIOME (prioritaires sur la logique procédurale)
        const ruleBiome = this.getRuleBiomeForHeight(height);
        if (ruleBiome) return ruleBiome;

        // SOUS L'EAU → toujours sable (hauteur RÉELLE, avant le warp qui raterait la zone inondée)
        if (height <= this.config.seaLevel) return 'sand';

        // 2) Distorsion légère des biomes (biome warp)
        let warp = (this.valueNoise2D(worldX * 0.01, worldZ * 0.01) - 0.5) * 15;
        let effH = height + warp;

        if (effH <= this.config.seaLevel + 3) {
            return 'sand';
        } else if (effH >= 135) {
            return 'snow';
        } else if (effH >= 100) {
            return 'mountain';
        } else {
            // Alternance entre plain et forest
            let biomeNoise = this.valueNoise2D(worldX * 0.005 + 100, worldZ * 0.005 + 100);
            return biomeNoise > 0.55 ? 'forest' : 'plain';
        }
    }

    /**
     * Synchronise les cellules modifiées de la grille courante vers le stockage spatial persistant (customEdits)
     */
    syncGridToCustomEdits() {
        if (!this.grid || !this.customEdits) return;
        for (let gx = 0; gx < this.grid.length; gx++) {
            for (let gz = 0; gz < (this.grid[gx] ? this.grid[gx].length : 0); gz++) {
                const c = this.grid[gx][gz];
                if (c && (c.isCustomHeight || c.isCustomBiome)) {
                    // FIX v2.5 (trous après tampons / presets décimés) : si un
                    // point de peinture COUVRE déjà la cellule, il est la source
                    // de vérité (pinceau/tampon écrivent déjà leurs points).
                    // Réécrire ici avec l'empreinte GROSSIERE de la cellule
                    // déclenchait le balayage de setCustomEdit qui supprimait
                    // les points fins voisins : le preset Royal Continent
                    // passait de 196 512 à 65 536 points au premier snapshot
                    // undo -> gros cubes et trous visibles dans la carte !
                    if (this.getCustomEdit(c.worldX, c.worldZ, 0.01)) continue;
                    this.setCustomEdit(c.worldX, c.worldZ, c.isCustomHeight ? c.height : null, c.isCustomBiome ? c.biome : null);
                }
            }
        }
    }

    /**
     * Index spatial des édits (buckets) pour la recherche par empreinte.
     * FIX "pointillés" : la peinture couvre la surface de la cellule d'origine,
     * pas seulement son point central, même après un changement de qualité.
     */
    _rebuildEditIndex() {
        const B = 64;
        this._editIndex = new Map();
        this._maxEditHalf = 0.5;
        if (this.customEdits) {
            this.customEdits.forEach((val, key) => {
                const c = key.split(',');
                const x = parseInt(c[0], 10), z = parseInt(c[1], 10);
                const half = (val.half !== undefined) ? val.half : 0.5;
                if (half > this._maxEditHalf) this._maxEditHalf = half;
                const bkey = Math.floor(x / B) + ',' + Math.floor(z / B);
                let arr = this._editIndex.get(bkey);
                if (!arr) { arr = []; this._editIndex.set(bkey, arr); }
                arr.push({ x: x, z: z, half: half, edit: val });
            });
        }
        this._editIndexDirty = false;
    }

    getCustomEdit(wx, wz, searchHalf = 0) {
        if (!this.customEdits || this.customEdits.size === 0) return null;
        const exact = this.customEdits.get(`${Math.round(wx)},${Math.round(wz)}`);
        if (exact) return exact;
        // Recherche spatiale : un édit peint sur une cellule plus grossière
        // couvre toute la surface de cette cellule (empreinte "half")
        if (this._editIndexDirty !== false || !this._editIndex) this._rebuildEditIndex();
        const B = 64;
        const r = searchHalf + this._maxEditHalf;
        let best = null, bestD = Infinity;
        const bx0 = Math.floor((wx - r) / B), bx1 = Math.floor((wx + r) / B);
        const bz0 = Math.floor((wz - r) / B), bz1 = Math.floor((wz + r) / B);
        for (let bx = bx0; bx <= bx1; bx++) {
            for (let bz = bz0; bz <= bz1; bz++) {
                const arr = this._editIndex.get(bx + ',' + bz);
                if (!arr) continue;
                for (let i = 0; i < arr.length; i++) {
                    const e = arr[i];
                    const reach = searchHalf + e.half;
                    const dx = Math.abs(wx - e.x), dz = Math.abs(wz - e.z);
                    if (dx <= reach && dz <= reach) {
                        const d = dx * dx + dz * dz;
                        if (d < bestD) { bestD = d; best = e.edit; }
                    }
                }
            }
        }
        return best;
    }


    /**
     * Hauteur INTERPOLÉE entre les points de peinture voisins (IDW).
     * FIX "marches nettes" : l'export et la grille lissent les pentes entre
     * les points de peinture au lieu de prendre le plus proche (falaises).
     */
    getInterpolatedEditHeight(wx, wz, fallbackH) {
        if (this._editIndexDirty !== false || !this._editIndex) this._rebuildEditIndex();
        const B = 64;
        // R doit couvrir PLUSIEURS points de peinture (pas 2*half entre points),
        // sinon l'IDW dégénère en "plus proche voisin" -> plateaux carrés
        const R = Math.max(8, this._maxEditHalf * 4);
        let num = 0, den = 0;
        const bx0 = Math.floor((wx - R) / B), bx1 = Math.floor((wx + R) / B);
        const bz0 = Math.floor((wz - R) / B), bz1 = Math.floor((wz + R) / B);
        for (let bx = bx0; bx <= bx1; bx++) {
            for (let bz = bz0; bz <= bz1; bz++) {
                const arr = this._editIndex.get(bx + ',' + bz);
                if (!arr) continue;
                for (let i = 0; i < arr.length; i++) {
                    const e = arr[i];
                    if (e.edit.height === undefined) continue;
                    const dx = wx - e.x, dz = wz - e.z;
                    const d2 = dx * dx + dz * dz;
                    if (d2 > R * R) continue;
                    // + half² : dé-singularise le noyau au voisinage du point
                    // (sans ça, poids ~50x supérieur aux voisins -> gros plateaux
                    // de la taille de l'empreinte au lieu de pentes continues)
                    const w = 1 / (d2 + e.half * e.half + 0.5);
                    num += e.edit.height * w; den += w;
                }
            }
        }
        return den > 0 ? num / den : fallbackH;
    }

    setCustomEdit(wx, wz, height, biome, half) {
        if (!this.customEdits) this.customEdits = new Map();
        const key = `${Math.round(wx)},${Math.round(wz)}`;
        const existing = this.customEdits.get(key) || {};
        if (height !== null && height !== undefined) existing.height = Math.round(height);
        if (biome !== null && biome !== undefined) existing.biome = biome;
        // Empreinte : demi-taille de la cellule au moment de la peinture.
        // v2.5 : un half EXPLICITE remplace l'ancien (les tampons 1:1 doivent
        // pouvoir affiner un point grossier, sinon le point garde son empreinte
        // géante et son balayage supprimerait les points fins voisins).
        if (half === undefined || half === null) {
            const m = this.currentGridMeta;
            half = m ? Math.max(m.stepX, m.stepZ) / 2 : 0.5;
            existing.half = Math.max(existing.half || 0, half);
        } else {
            existing.half = half;
        }
        this.customEdits.set(key, existing);

        // Un coup de pinceau REMPLACE les anciens points de peinture qu'il
        // recouvre (sinon d'anciens points "fantômes" restaient stockés entre
        // les nouveaux et dominaient l'export : aplanir ne changeait rien !)
        const kx = Math.round(wx), kz = Math.round(wz);
        if (this._editIndexDirty !== false || !this._editIndex) this._rebuildEditIndex();
        const B = 64;
        // FIX v2.9 "la peinture disparaît au rechargement 1:1" : les clés des
        // points sont ARRONDIES au bloc, donc deux empreintes de cellules
        // voisines laissent un interstice pouvant atteindre ~1 bloc. Les vieux
        // points fins (presets/tampons) y survivaient et, plus proches que le
        // nouveau point, regagnaient au rechargement des chunks détaillés ->
        // quadrillage de l'ancien biome/hauteur dans la zone pourtant peinte.
        // Marge de 0.75 bloc dès que l'empreinte est "grossière" (half >= 1) ;
        // les empreintes fines (tampons 1:1, half < 1) restent sans marge pour
        // ne pas s'entre-supprimer.
        const r = existing.half + (existing.half >= 1 ? 0.75 : 0);
        const bx0 = Math.floor((kx - r) / B), bx1 = Math.floor((kx + r) / B);
        const bz0 = Math.floor((kz - r) / B), bz1 = Math.floor((kz + r) / B);
        for (let bx = bx0; bx <= bx1; bx++) {
            for (let bz = bz0; bz <= bz1; bz++) {
                const arr = this._editIndex.get(bx + ',' + bz);
                if (!arr) continue;
                for (let i = arr.length - 1; i >= 0; i--) {
                    const e = arr[i];
                    if (e.x === kx && e.z === kz) continue;
                    if (Math.abs(e.x - kx) <= r && Math.abs(e.z - kz) <= r) {
                        this.customEdits.delete(e.x + ',' + e.z);
                        arr.splice(i, 1);
                    }
                }
            }
        }
        // Mise à jour incrémentale de l'index (pas de reconstruction complète)
        const obk = Math.floor(kx / B) + ',' + Math.floor(kz / B);
        let oarr = this._editIndex.get(obk);
        if (!oarr) { oarr = []; this._editIndex.set(obk, oarr); }
        let found = null;
        for (let i = 0; i < oarr.length; i++) { if (oarr[i].x === kx && oarr[i].z === kz) { found = oarr[i]; break; } }
        if (found) { found.half = existing.half; found.edit = existing; }
        else oarr.push({ x: kx, z: kz, half: existing.half, edit: existing });
        if (existing.half > this._maxEditHalf) this._maxEditHalf = existing.half;
        this._editIndexDirty = false;
    }

    removeCustomEdit(wx, wz, half) {
        if (!this.customEdits) return;
        if (half === undefined || half === null) {
            const m = this.currentGridMeta;
            half = m ? Math.max(m.stepX, m.stepZ) / 2 : 0.5;
        }
        // Efface tout point de peinture dont l'empreinte touche la zone gommée
        const toDelete = [];
        this.customEdits.forEach((val, key) => {
            const c = key.split(',');
            const ex = parseInt(c[0], 10), ez = parseInt(c[1], 10);
            const reach = half + ((val.half !== undefined) ? val.half : 0.5);
            if (Math.abs(wx - ex) <= reach && Math.abs(wz - ez) <= reach) toDelete.push(key);
        });
        for (let i = 0; i < toDelete.length; i++) this.customEdits.delete(toDelete[i]);
        this._editIndexDirty = true;
    }

    getSerializedCustomEdits() {
        this.syncGridToCustomEdits();
        const obj = {};
        if (this.customEdits) {
            this.customEdits.forEach((val, key) => {
                // Copie (pas une référence !) sinon les snapshots undo/redo
                // sont corrompus par les modifications ultérieures des cellules
                obj[key] = Object.assign({}, val);
            });
        }
        return obj;
    }

    /**
     * Sauvegarde l'état actuel (config + modifications pinceau) pour Ctrl+Z
     */
    saveStateForUndo() {
        if (!this.undoStack) this.undoStack = [];
        const snapshot = {
            customEdits: this.getSerializedCustomEdits(),
            config: JSON.parse(JSON.stringify(this.config)),
            biomeRules: this.getSerializedBiomeRules()
        };
        this.undoStack.push(snapshot);
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = []; // Efface la pile Redo sur une nouvelle action
    }

    undo() {
        if (!this.undoStack || this.undoStack.length === 0) return false;
        if (!this.redoStack) this.redoStack = [];

        const currentSnapshot = {
            biomeRules: this.getSerializedBiomeRules(),
            customEdits: this.getSerializedCustomEdits(),
            config: JSON.parse(JSON.stringify(this.config))
        };
        this.redoStack.push(currentSnapshot);

        const prevSnapshot = this.undoStack.pop();
        this.restoreSnapshot(prevSnapshot);
        return true;
    }

    redo() {
        if (!this.redoStack || this.redoStack.length === 0) return false;
        if (!this.undoStack) this.undoStack = [];

        const currentSnapshot = {
            biomeRules: this.getSerializedBiomeRules(),
            customEdits: this.getSerializedCustomEdits(),
            config: JSON.parse(JSON.stringify(this.config))
        };
        this.undoStack.push(currentSnapshot);

        const nextSnapshot = this.redoStack.pop();
        this.restoreSnapshot(nextSnapshot);
        return true;
    }


    getSerializedBiomeRules() {
        const out = {};
        for (let key in this.biomes) {
            if (this.biomes[key].rule) out[key] = JSON.parse(JSON.stringify(this.biomes[key].rule));
        }
        return out;
    }

    restoreSnapshot(snapshot) {
        if (!snapshot) return;
        Object.assign(this.config, snapshot.config);
        if (snapshot.biomeRules) {
            for (let key in snapshot.biomeRules) {
                if (this.biomes[key]) this.biomes[key].rule = JSON.parse(JSON.stringify(snapshot.biomeRules[key]));
            }
            if (window.uiManagerInstance && typeof window.uiManagerInstance.renderSettingsBiomes === 'function') {
                window.uiManagerInstance.renderSettingsBiomes();
            }
        }
        if (!this.customEdits) this.customEdits = new Map();
        this.customEdits.clear();
        if (snapshot.customEdits) {
            for (let key in snapshot.customEdits) {
                this.customEdits.set(key, snapshot.customEdits[key]);
            }
        }
        this._editIndexDirty = true;
        this.generateGrid(false); // MUST be false so old grid doesn't sync back and overwrite restored customEdits!
    }

    /**
     * Met à jour la fenêtre de chargement en fonction de ce qui est à l'écran (+ marge)
     */
    updateViewportFromScreen(minWX, maxWX, minWZ, maxWZ, forceUpdate = false) {
        // DEPRECIE : le mode "Focus Écran Dynamique" a été retiré. La grille est
        // toujours globale ; le détail à fort zoom vient des chunks 16x16 (2D).
        return false;
        // eslint-disable-next-line no-unreachable
        if (this.config.viewportMode !== 'dynamic') return false;
        if (!this.viewport) this.viewport = { minX: -350, maxX: 350, minZ: -350, maxZ: 350, active: true };
        
        // Marge ("un peu plus" que l'écran) pour un scrolling fluide sans rechargement constant
        const marginX = Math.max(50, (maxWX - minWX) * 0.25);
        const marginZ = Math.max(50, (maxWZ - minWZ) * 0.25);
        
        const newMinX = Math.max(-this.config.worldSizeX / 2, Math.floor(minWX - marginX));
        const newMaxX = Math.min(this.config.worldSizeX / 2, Math.ceil(maxWX + marginX));
        const newMinZ = Math.max(-this.config.worldSizeZ / 2, Math.floor(minWZ - marginZ));
        const newMaxZ = Math.min(this.config.worldSizeZ / 2, Math.ceil(maxWZ + marginZ));

        const currentCovered = (minWX >= this.viewport.minX && maxWX <= this.viewport.maxX && minWZ >= this.viewport.minZ && maxWZ <= this.viewport.maxZ);
        if (!forceUpdate && currentCovered && this.grid && this.grid.length > 0) {
            return false;
        }

        this.viewport.minX = newMinX;
        this.viewport.maxX = newMaxX;
        this.viewport.minZ = newMinZ;
        this.viewport.maxZ = newMaxZ;
        this.viewport.active = true;

        this.generateGrid(true);
        return true;
    }

    /**
     * Régénère la grille 2D (soit la zone visible écran + marge à résolution max 1:1, soit la grille globale)
     */
    generateGrid(preserveCustom = false) {
        this.initPermutationTable(this.config.seed);
        if (!this.customEdits) this.customEdits = new Map();
        if (!this.viewport) this.viewport = { minX: -350, maxX: 350, minZ: -350, maxZ: 350, active: true };

        if (preserveCustom) {
            this.syncGridToCustomEdits();
        }

        let startWorldX, startWorldZ, stepX, stepZ, resX, resZ;

        // MODE UNIQUE : grille globale. Migration silencieuse des anciens
        // presets/snapshots qui portaient encore viewportMode: 'dynamic'.
        if (this.config.viewportMode !== 'global') this.config.viewportMode = 'global';
        // v2.5 : qualité UNIQUE maximale (sélecteur "Grille de Prévisu" retiré)
        if (!this.config.gridResolution || this.config.gridResolution < 256) this.config.gridResolution = 256;
        {
            const res = this.config.gridResolution || 256;
            resX = res;
            resZ = res;
            stepX = this.config.worldSizeX / res;
            stepZ = this.config.worldSizeZ / res;
            startWorldX = -this.config.worldSizeX / 2;
            startWorldZ = -this.config.worldSizeZ / 2;
        }

        // La grille change (seed/config/édits) : les chunks de détail sont périmés
        this.invalidateDetailChunks();

        this.currentGridMeta = { startWorldX, startWorldZ, stepX, stepZ, resX, resZ };

        let newGrid = [];
        let minH = Infinity;
        let maxH = -Infinity;
        let totalH = 0;
        let counts = {};
        for (let k in this.biomes) counts[k] = 0;

        for (let gx = 0; gx < resX; gx++) {
            newGrid[gx] = [];
            let worldX = startWorldX + (gx + 0.5) * stepX;

            for (let gz = 0; gz < resZ; gz++) {
                let worldZ = startWorldZ + (gz + 0.5) * stepZ;

                let height, biome, isCustomHeight = false, isCustomBiome = false;

                const edit = this.getCustomEdit(worldX, worldZ, Math.max(stepX, stepZ) / 2);
                if (edit) {
                    height = edit.height !== undefined ? Math.round(this.getInterpolatedEditHeight(worldX, worldZ, edit.height)) : Math.round(this.fbmTerrain(worldX, worldZ));
                    biome = edit.biome || this.assignBiomeProcedural(height, worldX, worldZ);
                    isCustomHeight = edit.height !== undefined;
                    isCustomBiome = edit.biome !== undefined;
                    // REGLE PRIORITAIRE : une règle verrouillée écrase même la peinture existante
                    const lockedBy = this.isBiomePaintBlocked(height);
                    if (lockedBy && biome !== lockedBy) { biome = lockedBy; isCustomBiome = false; }
                } else {
                    height = Math.round(this.fbmTerrain(worldX, worldZ));
                    height = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, height));
                    biome = this.assignBiomeProcedural(height, worldX, worldZ);
                    if (!this.biomes[biome]) biome = this.config.defaultBiome || 'plain';
                }

                newGrid[gx][gz] = {
                    height: height,
                    biome: biome,
                    worldX: worldX,
                    worldZ: worldZ,
                    isCustomHeight: isCustomHeight,
                    isCustomBiome: isCustomBiome
                };

                if (height < minH) minH = height;
                if (height > maxH) maxH = height;
                totalH += height;
                counts[biome] = (counts[biome] || 0) + 1;
            }
        }

        this.grid = newGrid;
        this.stats = {
            minHeight: minH === Infinity ? 0 : minH,
            maxHeight: maxH === -Infinity ? 0 : maxH,
            avgHeight: Math.round(totalH / Math.max(1, (resX * resZ))),
            biomeCounts: counts
        };
        this._rev = (this._rev || 0) + 1;
        this.rebuildShapeMask();
    }

    // ============ MASQUE DE FORME (Shape) ============
    rebuildShapeMask() {
        const resX = this.grid.length, resZ = (this.grid[0] && this.grid[0].length) || 0;
        if (!resX || !resZ) { this.shapeMask = null; return; }
        const mode = this.config.shapeMode || 'square';
        if (mode === 'custom') {
            if (!this.shapeMask || this.shapeMask.length !== resX || (this.shapeMask[0] && this.shapeMask[0].length) !== resZ) {
                this.shapeMask = [];
                for (let gx = 0; gx < resX; gx++) this.shapeMask.push(new Uint8Array(resZ));
            }
            return;
        }
        if (mode === 'square') { this.shapeMask = null; return; }
        // Toutes les formes géométriques : polygone régulier dans un cercle inscrit
        this.shapeMask = [];
        const cx = (resX - 1) / 2, cz = (resZ - 1) / 2;
        const rx = resX / 2, rz = resZ / 2;
        let sides = 0; // 0 = cercle/ovale
        if (mode === 'circle') sides = 0;
        else if (mode === 'triangle') sides = 3;
        else if (mode === 'pentagon') sides = 5;
        else if (mode === 'hexagon') sides = 6;
        else if (mode === 'octagon') sides = 8;
        else { this.shapeMask = null; return; }

        for (let gx = 0; gx < resX; gx++) {
            const row = new Uint8Array(resZ);
            for (let gz = 0; gz < resZ; gz++) {
                if (sides === 0) {
                    // Cercle/Ovale
                    row[gz] = (((gx - cx) / rx) ** 2 + ((gz - cz) / rz) ** 2 <= 1.0) ? 1 : 0;
                } else {
                    // Polygone régulier : teste si le point est dans le polygone inscrit
                    const nx = (gx - cx) / rx, nz = (gz - cz) / rz;
                    const angle = Math.atan2(nz, nx);
                    const sectorAngle = (Math.PI * 2) / sides;
                    const distToEdge = Math.cos(sectorAngle / 2) / Math.cos(((angle % sectorAngle) + sectorAngle) % sectorAngle - sectorAngle / 2);
                    const dist = Math.hypot(nx, nz);
                    row[gz] = (dist <= distToEdge) ? 1 : 0;
                }
            }
            this.shapeMask.push(row);
        }
        this._rev = (this._rev || 0) + 1; // invalide les caches 2D/3D
    }
    isInShape(gx, gz) {
        if (!this.shapeMask) return true;
        if (gx < 0 || gx >= this.shapeMask.length) return false;
        if (gz < 0 || gz >= this.shapeMask[gx].length) return false;
        return this.shapeMask[gx][gz] === 1;
    }
    paintShapeMask(cx, cz, radius, inside) {
        if (!this.shapeMask) return false;
        let changed = false;
        for (let dx = -radius; dx <= radius; dx++)
            for (let dz = -radius; dz <= radius; dz++) {
                if (dx * dx + dz * dz > radius * radius) continue;
                const nx = cx + dx, nz = cz + dz;
                if (nx < 0 || nx >= this.shapeMask.length || nz < 0 || nz >= this.shapeMask[nx].length) continue;
                const v = inside ? 1 : 0;
                if (this.shapeMask[nx][nz] !== v) { this.shapeMask[nx][nz] = v; changed = true; }
            }
        if (changed) this._rev = (this._rev || 0) + 1;
        return changed;
    }


    /* ============================================================
       CHUNKS DE DÉTAIL 16x16 (remplaçant du "Focus Écran Dynamique")
       Quand le monde est grand (>= ~500 blocs), la grille globale est
       grossière (1 cellule = plusieurs blocs). Au zoom, la carte 2D
       demande des chunks de 16x16 BLOCS calculés à la vraie résolution
       1:1 via getDetailChunk(). Seuls les chunks visibles à l'écran
       sont calculés, et un cache LRU évite de recalculer en pan/zoom.
       ============================================================ */
    detailChunkSize() { return 16; }

    /** Détail utile seulement si une cellule de grille couvre > 1.5 bloc */
    needsDetailChunks() {
        const m = this.currentGridMeta;
        return !!(m && Math.max(m.stepX, m.stepZ) > 1.5);
    }

    invalidateDetailChunks() {
        this._detailChunks = new Map();
        this._detailOrder = [];
    }

    /**
     * Retourne le chunk 16x16 couvrant les blocs [cx*16, cx*16+15] x [cz*16, ...]
     * en coordonnées MONDE (origine du monde = -worldSize/2).
     * { heights: Float32Array(256), biomes: Array(256), x0, z0 } ou null si hors monde.
     */
    getDetailChunk(cx, cz) {
        const S = this.detailChunkSize();
        const halfX = this.config.worldSizeX / 2, halfZ = this.config.worldSizeZ / 2;
        const x0 = cx * S, z0 = cz * S;
        if (x0 >= halfX || z0 >= halfZ || x0 + S <= -halfX || z0 + S <= -halfZ) return null;

        if (!this._detailChunks) this.invalidateDetailChunks();
        const key = cx + ',' + cz;
        const cached = this._detailChunks.get(key);
        if (cached) return cached;

        const heights = new Float32Array(S * S);
        const biomes = new Array(S * S);
        const m = this.currentGridMeta;
        for (let lz = 0; lz < S; lz++) {
            for (let lx = 0; lx < S; lx++) {
                const wx = x0 + lx + 0.5, wz = z0 + lz + 0.5;
                let h, bkey;
                const edit = this.getCustomEdit(wx, wz, 0.5);
                if (edit) {
                    const hFb = edit.height !== undefined ? edit.height : Math.round(this.fbmTerrain(wx, wz));
                    // FIX v2.7 "traits dans les pentes" : hauteur FLOTTANTE.
                    // L'arrondi au bloc entier créait des terrasses de 1 bloc
                    // que le hillshading 2D transformait en anneaux/traits
                    // sombres sur les grosses formes. L'arrondi n'est plus fait
                    // qu'aux endroits qui l'exigent (rendu voxel 3D, export).
                    // v3.0 : + micro-bruit * "Détail du sol", comme l'export
                    // (chemin édits) : la preview montre le vrai sol exporté et
                    // le réglage agit ENFIN sur les cartes peintes (presets).
                    const gdP = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                    h = this.getInterpolatedEditHeight(wx, wz, hFb) +
                        (this.valueNoise2D(wx * 0.35 + 7.3, wz * 0.35 + 2.1) - 0.5) * 1.6 * gdP;
                    bkey = edit.biome || this.assignBiomeProcedural(h, wx, wz);
                    const lockedBy = this.isBiomePaintBlocked(h);
                    if (lockedBy) bkey = lockedBy;
                } else if (m && this.grid && this.grid.length) {
                    // Même échantillonnage bilinéaire + micro-bruit que l'export :
                    // le chunk zoomé montre EXACTEMENT ce qui sera exporté.
                    // BIOME : dithering spatial identique à l'export (rayon 3 blocs)
                    // pour des frontières organiques 1:1 au lieu de pavés grossiers
                    const hashB = Math.abs((((wx * 374761393 + wz * 668265263) | 0) ^ (((wx * 374761393 + wz * 668265263) | 0) >> 13)) | 0);
                    const jx = (hashB % 7) - 3;
                    const jz = (((hashB / 31) | 0) % 7) - 3;
                    const gx = Math.max(0, Math.min(m.resX - 1, Math.floor((wx + jx - m.startWorldX) / m.stepX)));
                    const gz = Math.max(0, Math.min(m.resZ - 1, Math.floor((wz + jz - m.startWorldZ) / m.stepZ)));
                    const fx = (wx - m.startWorldX) / m.stepX - 0.5;
                    const fz = (wz - m.startWorldZ) / m.stepZ - 0.5;
                    const x0i = Math.max(0, Math.min(m.resX - 1, Math.floor(fx)));
                    const z0i = Math.max(0, Math.min(m.resZ - 1, Math.floor(fz)));
                    const x1i = Math.min(m.resX - 1, x0i + 1);
                    const z1i = Math.min(m.resZ - 1, z0i + 1);
                    const tx = Math.max(0, Math.min(1, fx - x0i));
                    const tz = Math.max(0, Math.min(1, fz - z0i));
                    const hInterp =
                        this.grid[x0i][z0i].height * (1 - tx) * (1 - tz) + this.grid[x1i][z0i].height * tx * (1 - tz) +
                        this.grid[x0i][z1i].height * (1 - tx) * tz + this.grid[x1i][z1i].height * tx * tz;
                    const gd = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                    const hDetail = (this.valueNoise2D(wx * 0.35 + 7.3, wz * 0.35 + 2.1) - 0.5) * 1.6 * gd;
                    h = hInterp + hDetail; // v2.7 : flottant (voir fix ci-dessus)
                    bkey = this.grid[gx][gz].biome || 'plain';
                } else {
                    h = this.fbmTerrain(wx, wz); // v2.7 : flottant
                    h = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, h));
                    bkey = this.assignBiomeProcedural(h, wx, wz);
                }
                const i = lz * S + lx;
                heights[i] = h;
                biomes[i] = bkey;
            }
        }
        const chunk = { heights, biomes, x0, z0 };
        this._detailChunks.set(key, chunk);
        this._detailOrder.push(key);
        // LRU : le cap doit DÉPASSER le pire rayon de chargement 3D
        // ((2*17+1)^2 = 1225 chunks), sinon les chunks visibles s'évincent
        // mutuellement en boucle et des zones ne se remplissent jamais.
        // v2.5 : élargi pour la fenêtre 2D 1:1 (seuil 1 px/bloc)
        while (this._detailOrder.length > 8192) {
            const oldKey = this._detailOrder.shift();
            this._detailChunks.delete(oldKey);
        }
        return chunk;
    }

    /** Invalidation ciblée après un coup de pinceau (zone monde en blocs) */
    invalidateDetailChunksInRegion(wxMin, wxMax, wzMin, wzMax) {
        if (!this._detailChunks || this._detailChunks.size === 0) return;
        const S = this.detailChunkSize();
        const cx0 = Math.floor(wxMin / S), cx1 = Math.floor(wxMax / S);
        const cz0 = Math.floor(wzMin / S), cz1 = Math.floor(wzMax / S);
        for (let cx = cx0; cx <= cx1; cx++) {
            for (let cz = cz0; cz <= cz1; cz++) {
                const key = cx + ',' + cz;
                if (this._detailChunks.delete(key)) {
                    const idx = this._detailOrder.indexOf(key);
                    if (idx !== -1) this._detailOrder.splice(idx, 1);
                }
            }
        }
    }


    /* ============================================================
       TAMPONS DE TERRAIN : sphère (dôme/cratère) et pavé (plateau).
       - shape : 'sphere' | 'box'
       - sizeX/sizeZ : demi-largeurs en cellules ; heightAmp : hauteur
         (+ = bosse, - = creux) ; biome optionnel appliqué sur l'empreinte.
       ============================================================ */
    applyStamp(centerGx, centerGz, shape, sizeX, sizeZ, heightAmp, biome) {
        if (!this.grid || !this.grid.length) return false;
        const resX = this.grid.length;
        const resZ = this.grid[0] ? this.grid[0].length : 0;
        if (centerGx < 0 || centerGx >= resX || centerGz < 0 || centerGz >= resZ) return false;
        const meta = this.currentGridMeta;
        const stepX0 = meta ? meta.stepX : 1;
        const stepZ0 = meta ? meta.stepZ : 1;

        // v2.5 : TAMPONS 1:1. La forme est écrite en points de peinture à la
        // résolution des BLOCS (1 point / 1-2 blocs), plus par cellules de
        // grille. Avant : l'empreinte était arrondie à la cellule (15.6 blocs
        // sur un monde 4000) -> mesas géantes, tours isolées et falaises à
        // trous quand on changeait la taille de la forme.
        const cell0 = this.grid[centerGx][centerGz];
        const wcx = Math.round(cell0.worldX), wcz = Math.round(cell0.worldZ);
        const rx = Math.max(1, Math.round(sizeX));
        const rz = Math.max(1, Math.round(sizeZ));
        const sp = Math.max(rx, rz) > 40 ? 2 : 1; // espacement des points 1:1
        const half = sp / 2;
        const minWx = meta ? meta.startWorldX : -Infinity;
        const maxWx = meta ? meta.startWorldX + meta.resX * meta.stepX : Infinity;
        const minWz = meta ? meta.startWorldZ : -Infinity;
        const maxWz = meta ? meta.startWorldZ + meta.resZ * meta.stepZ : Infinity;
        const shapeF = (nx, nz) => {
            if (shape === 'sphere') {
                const d2 = nx * nx + nz * nz;
                return d2 > 1 ? -1 : Math.sqrt(1 - d2); // calotte sphérique
            }
            // pavé : plateau plein avec bord adouci sur ~15%
            const edge = Math.max(Math.abs(nx), Math.abs(nz));
            return edge > 1 ? -1 : (edge < 0.85 ? 1 : (1 - edge) / 0.15);
        };

        // Passe 1 : forme + hauteur de base de chaque point AVANT toute écriture
        // (écrire en échantillonnant au fil de l'eau fausserait les points suivants)
        const pts = [];
        for (let dx = -rx; dx <= rx; dx += sp) {
            for (let dz = -rz; dz <= rz; dz += sp) {
                const f = shapeF(dx / rx, dz / rz);
                if (f < 0) continue;
                const wx = wcx + dx, wz = wcz + dz;
                if (wx < minWx || wx > maxWx || wz < minWz || wz > maxWz) continue;
                pts.push({ wx: wx, wz: wz, f: f, h0: this.sampleWorldHeight(wx, wz) });
            }
        }
        if (!pts.length) return false;

        // Passe 2 : balayage des ANCIENS points recouverts par l'empreinte
        // (sinon ils resteraient mélangés aux nouveaux points 1:1 et l'IDW
        // créerait des creux/bosses parasites dans la forme)
        const toDelete = [];
        this.customEdits.forEach((v, k) => {
            const ci = k.indexOf(',');
            const ex = +k.slice(0, ci), ez = +k.slice(ci + 1);
            if (shapeF((ex - wcx) / rx, (ez - wcz) / rz) >= 0) toDelete.push(k);
        });
        for (let i = 0; i < toDelete.length; i++) this.customEdits.delete(toDelete[i]);
        if (toDelete.length) this._editIndexDirty = true;

        // Passe 3 : écriture des points 1:1
        let modified = false;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            let hNew = null;
            if (heightAmp) {
                hNew = Math.max(this.config.minHeight,
                    Math.min(this.config.maxHeight, p.h0 + heightAmp * p.f));
            }
            let bNew = null;
            if (biome && this.biomes[biome]) {
                const lockedBy = this.isBiomePaintBlocked(hNew !== null ? hNew : p.h0);
                if (!lockedBy || lockedBy === biome) bNew = biome;
            }
            if (hNew === null && bNew === null) continue;
            this.setCustomEdit(p.wx, p.wz, hNew, bNew, half);
            modified = true;
        }
        if (!modified) return false;

        // Passe 4 : refléter la forme sur la grille grossière (aperçu 2D/3D).
        // IMPORTANT : PAS de flag isCustomHeight/isCustomBiome ici — le tampon
        // vit entièrement dans customEdits (points 1:1). Marquer les cellules
        // les ferait re-synchroniser en points GROSSIERS (empreinte 15.6 blocs)
        // par syncGridToCustomEdits, qui balaieraient les points fins -> trous.
        const cgxMin = Math.max(0, centerGx - Math.ceil(rx / stepX0) - 1);
        const cgxMax = Math.min(resX - 1, centerGx + Math.ceil(rx / stepX0) + 1);
        const cgzMin = Math.max(0, centerGz - Math.ceil(rz / stepZ0) - 1);
        const cgzMax = Math.min(resZ - 1, centerGz + Math.ceil(rz / stepZ0) + 1);
        for (let gx = cgxMin; gx <= cgxMax; gx++) {
            for (let gz = cgzMin; gz <= cgzMax; gz++) {
                const cell = this.grid[gx][gz];
                const f = shapeF((cell.worldX - wcx) / rx, (cell.worldZ - wcz) / rz);
                if (f < 0) continue;
                // La cellule est désormais pilotée par les points 1:1 du tampon :
                // ses anciens flags custom (peinture recouverte) sont périmés.
                cell.isCustomHeight = false;
                cell.isCustomBiome = false;
                if (heightAmp) {
                    cell.height = Math.round(this.sampleWorldHeight(cell.worldX, cell.worldZ));
                }
                if (biome && this.biomes[biome]) {
                    const lockedBy = this.isBiomePaintBlocked(cell.height);
                    if (!lockedBy || lockedBy === biome) cell.biome = biome;
                }
            }
        }

        this._statsDirty = true;
        this.lastBrushRegion = { gxMin: cgxMin, gxMax: cgxMax, gzMin: cgzMin, gzMax: cgzMax };
        if (this._detailChunks && this._detailChunks.size) {
            this.invalidateDetailChunksInRegion(wcx - rx - 2, wcx + rx + 2, wcz - rz - 2, wcz + rz + 2);
        }
        this._rev = (this._rev || 0) + 1;
        return true;
    }

    /**
     * Hauteur 1:1 du monde en (wx, wz) : IDW des points de peinture si la
     * zone est peinte, sinon interpolation bilinéaire de la grille (même
     * logique que getDetailChunk et l'export).
     */
    sampleWorldHeight(wx, wz) {
        const edit = this.getCustomEdit(wx, wz, 0.5);
        if (edit) {
            const hFb = edit.height !== undefined ? edit.height : Math.round(this.fbmTerrain(wx, wz));
            return this.getInterpolatedEditHeight(wx, wz, hFb);
        }
        const m = this.currentGridMeta;
        if (m && this.grid && this.grid.length) {
            const fx = (wx - m.startWorldX) / m.stepX - 0.5;
            const fz = (wz - m.startWorldZ) / m.stepZ - 0.5;
            const x0i = Math.max(0, Math.min(m.resX - 1, Math.floor(fx)));
            const z0i = Math.max(0, Math.min(m.resZ - 1, Math.floor(fz)));
            const x1i = Math.min(m.resX - 1, x0i + 1);
            const z1i = Math.min(m.resZ - 1, z0i + 1);
            const tx = Math.max(0, Math.min(1, fx - x0i));
            const tz = Math.max(0, Math.min(1, fz - z0i));
            return this.grid[x0i][z0i].height * (1 - tx) * (1 - tz) + this.grid[x1i][z0i].height * tx * (1 - tz) +
                   this.grid[x0i][z1i].height * (1 - tx) * tz + this.grid[x1i][z1i].height * tx * tz;
        }
        return this.fbmTerrain(wx, wz);
    }

    /* ============================================================
       BIOMES PERSONNALISÉS (palettes de l'utilisateur)
       Ajout/édition/suppression + persistance localStorage.
       ============================================================ */
    addCustomBiome(key, name, color, blocks) {
        if (!key || this.biomes[key]) return false;
        this.biomes[key] = {
            name: name || key, color: color || '#ffffff',
            blocks: (blocks && blocks.length) ? blocks : ['Grass Block'],
            minHeight: 0, maxHeight: 400, custom: true,
            rule: { active: false, yMin: 0, yMax: 400, locked: false }
        };
        this.saveCustomBiomes();
        return true;
    }

    updateCustomBiome(key, name, color, blocks) {
        const b = this.biomes[key];
        if (!b) return false;
        if (name) b.name = name;
        if (color) b.color = color;
        if (blocks && blocks.length) b.blocks = blocks;
        this.saveCustomBiomes();
        return true;
    }

    removeCustomBiome(key) {
        const b = this.biomes[key];
        if (!b || !b.custom) return false; // seuls les biomes utilisateur sont supprimables
        delete this.biomes[key];
        // Les cellules peintes avec ce biome retombent sur le biome par défaut
        if (this.grid) {
            for (let gx = 0; gx < this.grid.length; gx++) {
                for (let gz = 0; gz < this.grid[gx].length; gz++) {
                    if (this.grid[gx][gz].biome === key) this.grid[gx][gz].biome = this.config.defaultBiome || 'plain';
                }
            }
        }
        if (this.customEdits) {
            this.customEdits.forEach((val) => { if (val.biome === key) delete val.biome; });
            this._editIndexDirty = true;
        }
        this.invalidateDetailChunks();
        this.saveCustomBiomes();
        return true;
    }

    saveCustomBiomes() {
        try {
            const out = {};
            for (let k in this.biomes) if (this.biomes[k].custom) out[k] = this.biomes[k];
            window.safeStorage.setItem('bloxd_custom_biomes', JSON.stringify(out));
        } catch (e) {}
    }

    loadCustomBiomes() {
        try {
            const saved = JSON.parse(window.safeStorage.getItem('bloxd_custom_biomes') || '{}');
            for (let k in saved) {
                if (!this.biomes[k]) { saved[k].custom = true; this.biomes[k] = saved[k]; }
            }
        } catch (e) {}
    }

    /**
     * Applique l'outil d'édition pinceau sur une position grille (centerGx, centerGz)
     */
    applyBrush(centerGx, centerGz, tool, radius, intensity, activeBiome, firstClickH = null) {
        if (!this.grid || !this.grid.length) return false;
        const resX = this.grid.length;
        const resZ = this.grid[0] ? this.grid[0].length : 0;
        let modified = false;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                let dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) continue;

                let gx = centerGx + dx;
                let gz = centerGz + dz;
                if (gx < 0 || gx >= resX || gz < 0 || gz >= resZ) continue;

                let cell = this.grid[gx][gz];
                let falloff = 1.0 - (dist / (radius + 1));
                let step = intensity * falloff * 0.5;

                if (tool === 'biome') {
                    // REGLE PRIORITAIRE : si une règle "locked" protège cette hauteur,
                    // le pinceau biome ne peut pas peindre par-dessus
                    const lockedBy = this.isBiomePaintBlocked(cell.height);
                    if (lockedBy && lockedBy !== activeBiome) continue;
                    cell.biome = activeBiome;
                    cell.isCustomBiome = true;
                    modified = true;
                } else if (tool === 'raise') {
                    cell.height = Math.min(this.config.maxHeight, cell.height + step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'lower') {
                    cell.height = Math.max(this.config.minHeight, cell.height - step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'flatten' && firstClickH !== null) {
                    // v3.1 : mode 100% = niveau EXACT sur tout le cercle
                    // (sans fondu falloff vers les bords)
                    cell.height = this.config.flattenExact
                        ? Math.round(firstClickH)
                        : cell.height + (firstClickH - cell.height) * falloff;
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'eraser') {
                    let procH = this.fbmTerrain(cell.worldX, cell.worldZ);
                    procH = Math.round(Math.max(this.config.minHeight, Math.min(this.config.maxHeight, procH)));
                    cell.height = procH;
                    cell.biome = this.assignBiomeProcedural(procH, cell.worldX, cell.worldZ);
                    cell.isCustomHeight = false;
                    cell.isCustomBiome = false;
                    modified = true;
                    this.removeCustomEdit(cell.worldX, cell.worldZ);
                }

                if (tool !== 'eraser' && modified) {
                    this.setCustomEdit(cell.worldX, cell.worldZ, cell.isCustomHeight ? cell.height : null, cell.isCustomBiome ? cell.biome : null);
                }
            }
        }

        // Cas spécial : Lissage (smooth)
        if (tool === 'smooth') {
            let tempH = [];
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                tempH[gx] = [];
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let sum = 0, cnt = 0;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let nz = -1; nz <= 1; nz++) {
                            let mx = gx + nx, mz = gz + nz;
                            if (mx >= 0 && mx < resX && mz >= 0 && mz < resZ) {
                                sum += this.grid[mx][mz].height;
                                cnt++;
                            }
                        }
                    }
                    tempH[gx][gz] = sum / cnt;
                }
            }
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let dist = Math.sqrt((gx - centerGx) ** 2 + (gz - centerGz) ** 2);
                    if (dist <= radius) {
                        let cell = this.grid[gx][gz];
                        cell.height = Math.round(tempH[gx][gz]);
                        cell.isCustomHeight = true;
                        modified = true;
                        this.setCustomEdit(cell.worldX, cell.worldZ, cell.height, cell.isCustomBiome ? cell.biome : null);
                    }
                }
            }
        }

        if (modified) {
            // PERF DESSIN : updateStats parcourt toute la grille (65k cellules en 256x256)
            // -> différé et throttlé au lieu d'être exécuté à chaque événement souris
            this._statsDirty = true;
            if (!this._lastStatsTime || Date.now() - this._lastStatsTime > 300) {
                this._lastStatsTime = Date.now();
                this._statsDirty = false;
                this.updateStats();
            }
            // TACHE 2 : bounding box de la zone réellement touchée par ce coup de
            // pinceau (en coordonnées grille), consommée par Map3D.updateTerrainRegion
            // pour ne recalculer que les vertices concernés au lieu de tout le mesh.
            this.lastBrushRegion = {
                gxMin: Math.max(0, centerGx - radius),
                gxMax: Math.min(resX - 1, centerGx + radius),
                gzMin: Math.max(0, centerGz - radius),
                gzMax: Math.min(resZ - 1, centerGz + radius)
            };
            // Invalide les chunks de détail couvrant la zone peinte (coords monde)
            const mMeta = this.currentGridMeta;
            if (mMeta && this._detailChunks && this._detailChunks.size) {
                const wx0 = mMeta.startWorldX + this.lastBrushRegion.gxMin * mMeta.stepX;
                const wx1 = mMeta.startWorldX + (this.lastBrushRegion.gxMax + 1) * mMeta.stepX;
                const wz0 = mMeta.startWorldZ + this.lastBrushRegion.gzMin * mMeta.stepZ;
                const wz1 = mMeta.startWorldZ + (this.lastBrushRegion.gzMax + 1) * mMeta.stepZ;
                this.invalidateDetailChunksInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
        }
        if (modified) this._rev = (this._rev || 0) + 1;
        return modified;
    }

    /**
     * Recalcule les statistiques à la suite d'une modification
     */
    updateStats() {
        let minH = Infinity, maxH = -Infinity, totalH = 0;
        let counts = {};
        for (let k in this.biomes) counts[k] = 0;
        const resX = this.grid && this.grid.length ? this.grid.length : 0;
        const resZ = resX && this.grid[0] ? this.grid[0].length : 0;

        for (let gx = 0; gx < resX; gx++) {
            for (let gz = 0; gz < resZ; gz++) {
                let cell = this.grid[gx][gz];
                if (cell.height < minH) minH = cell.height;
                if (cell.height > maxH) maxH = cell.height;
                totalH += cell.height;
                counts[cell.biome] = (counts[cell.biome] || 0) + 1;
            }
        }
        this.stats.minHeight = Math.round(minH);
        this.stats.maxHeight = Math.round(maxH);
        this.stats.avgHeight = Math.round(totalH / Math.max(1, resX * resZ));
        this.stats.biomeCounts = counts;
    }

    /**
     * Charge un preset de configuration
     */
    loadPreset(presetKey) {
        const p = this.presets[presetKey];
        if (!p) return;
        Object.assign(this.config, p.config);
        if (p.biomes) {
            this.biomes = JSON.parse(JSON.stringify(p.biomes));
        }
        if (!this.customEdits) this.customEdits = new Map();
        this.customEdits.clear();
        if (p.customEdits) {
            if (typeof p.customEdits === 'object') {
                for (let key in p.customEdits) {
                    this.customEdits.set(key, p.customEdits[key]);
                }
            }
        }
        this._editIndexDirty = true;
        // false : ne PAS resynchroniser l'ancienne grille par-dessus les édits du preset !
        this.generateGrid(false);
    }

    /**
     * Génère un script Python sur-mesure pour créer le fichier .bloxdschem autonome
     */
    exportPythonScript() {
        this.syncGridToCustomEdits();
        let editsPyStr = '{\n';
        let count = 0;
        if (this.customEdits) {
            this.customEdits.forEach((val, key) => {
                if (count < 25000) {
                    editsPyStr += `    "${key}": (${Math.round(val.height)}, "${val.biome || 'plain'}"),\n`;
                    count++;
                }
            });
        }
        editsPyStr += '}';

        // Collecte les biomes actifs
        let biomesPyStr = '{\n';
        for (let key in this.biomes) {
            let b = this.biomes[key];
            let blocksStr = b.blocks.map(bl => `"${bl}"`).join(', ');
            biomesPyStr += `    "${key}": [${blocksStr}],\n`;
        }
        biomesPyStr += '}';

        return `#!/usr/bin/env python3
"""
Générateur de terrain Bloxd.io personnalisé (.bloxdschem)
Généré par Bloxd Terrain Editor (Web App)
Date: ${new Date().toISOString().split('T')[0]}

Ce script utilise numpy et la spécification Avro M2B pour générer un fichier .bloxdschem
compatible avec Bloxd.io via la commande en jeu //schematic load.
"""

import os
import sys
import json
import math
import numpy as np
from bloxd_format import BloxdSchemWriter

# ============================================================
# PARAMÈTRES DU MONDE CONFIGURÉS
# ============================================================
SEED = ${this.config.seed}
WORLD_SIZE_X = ${this.config.worldSizeX}
WORLD_SIZE_Z = ${this.config.worldSizeZ}
WORLD_MIN_X = -WORLD_SIZE_X // 2
WORLD_MIN_Z = -WORLD_SIZE_Z // 2

BASE_Y = ${this.config.baseY}
SEA_Y = ${this.config.seaLevel}
MIN_HEIGHT = ${this.config.minHeight}
MAX_HEIGHT = ${this.config.maxHeight}

NOISE_SCALE = ${this.config.noiseScale}
TERRAIN_INTENSITY = ${this.config.terrainIntensity}
ROUGHNESS = ${this.config.roughness}

FILL_WATER = ${this.config.showWater ? 'True' : 'False'}
WATER_BLOCK = "Water"
CHUNK = 32
SCHEM_NAME = "Custom Bloxd World"
OUTPUT_PATH = "custom_terrain.bloxdschem"

# ============================================================
# CHARGEMENT TABLE DES BLOCS BLOXD
# ============================================================
try:
    with open("nameToId.json", "r", encoding="utf-8") as fp:
        NAME_TO_ID = json.load(fp)
except FileNotFoundError:
    print("⚠️  Warning: nameToId.json not found. Using fallback block mappings.")
    NAME_TO_ID = {
        "Air": 0, "Unloaded": 1, "Dirt": 2, "Messy Dirt": 3, "Grass Block": 4, "Sand": 5, "Clay": 6, "Gravel": 7, "Snow": 8,
        "Maple Log": 9, "Pine Log": 10, "Plum Log": 11, "Cedar Log": 12, "Aspen Log": 13, "Elm Log": 14,
        "Stone": 28, "Messy Stone": 29, "Smooth Stone": 31, "Diorite": 32, "Smooth Diorite": 33, "Andesite": 34, "Smooth Andesite": 35,
        "Granite": 36, "Smooth Granite": 37, "Sandstone": 38, "Yellowstone": 39,
        "White Wool": 51, "Orange Wool": 52, "Magenta Wool": 53, "Light Blue Wool": 54, "Yellow Wool": 55, "Lime Wool": 56,
        "Pink Wool": 57, "Gray Wool": 58, "Light Gray Wool": 59, "Cyan Wool": 60, "Purple Wool": 61, "Blue Wool": 62, "Brown Wool": 63,
        "Green Wool": 64, "Red Wool": 65, "Black Wool": 66,
        "Baked Clay": 67, "White Baked Clay": 68, "Orange Baked Clay": 69, "Magenta Baked Clay": 70, "Light Blue Baked Clay": 71,
        "Yellow Baked Clay": 72, "Lime Baked Clay": 73, "Pink Baked Clay": 74, "Gray Baked Clay": 75, "Light Gray Baked Clay": 76,
        "Cyan Baked Clay": 77, "Purple Baked Clay": 78, "Blue Baked Clay": 79, "Brown Baked Clay": 80, "Green Baked Clay": 81,
        "Red Baked Clay": 82, "Black Baked Clay": 83,
        "Gray Concrete": 84, "Light Gray Concrete": 85, "Black Concrete": 86, "Blue Concrete": 87, "Brown Concrete": 88,
        "Cyan Concrete": 89, "Light Blue Concrete": 90, "Lime Concrete": 91, "Magenta Concrete": 92, "Orange Concrete": 93,
        "Pink Concrete": 94, "Purple Concrete": 95, "Red Concrete": 96, "White Concrete": 97, "Green Concrete": 98, "Yellow Concrete": 99,
        "Water": 126, "Bricks": 128, "Stone Bricks": 129, "Block of Quartz": 132, "Mossy Stone Bricks": 135, "Cracked Stone Bricks": 136,
        "Smooth Sandstone": 137, "Ice": 139, "Obsidian": 140, "Bedrock": 147, "Lime Planks": 233, "Green Planks": 241,
        "Dark Red Brick": 130, "Dark Red Stone": 131, "Smooth Red Sandstone": 475, "Red Sand": 650, "Magma": 471, "Cherry Log": 1222,
        "Packed Snow": 8, "Overgrown Jungle Grass Block": 4, "White Chalk": 97
    }

_SUBSTITUTIONS = {
    "Overgrown Jungle Grass Block": "Grass Block",
    "Packed Snow": "Snow",
    "White Chalk": "White Concrete",
}

def block_id(name: str) -> int:
    if name in NAME_TO_ID: return NAME_TO_ID[name]
    sub = _SUBSTITUTIONS.get(name)
    if sub and sub in NAME_TO_ID: return NAME_TO_ID[sub]
    return NAME_TO_ID.get("Grass Block", 4)

biomes = ${biomesPyStr}
CUSTOM_EDITS = ${editsPyStr}

def _init_biome_globals():
    global biome_names, biome_index, biome_blocks_ids
    biome_names = list(biomes.keys())
    biome_index = {name: idx for idx, name in enumerate(biome_names)}
    biome_blocks_ids = {b: [block_id(n) for n in lst] for b, lst in biomes.items()}

_init_biome_globals()

# ============================================================
# FONCTIONS DE BRUIT ET HAUTEUR
# ============================================================
def rand01_from_xz(x, z):
    h = x * 374761393 + z * 668265263
    h = (h ^ (h >> 13)) * 1274126177
    return ((h ^ (h >> 16)) & 0x7fffffff) / 2147483648.0

def value_noise2d(x, z):
    xi = np.floor(x).astype(np.int64) & 255
    zi = np.floor(z).astype(np.int64) & 255
    xf = x - np.floor(x)
    zf = z - np.floor(z)
    u = xf * xf * (3.0 - 2.0 * xf)
    v = zf * zf * (3.0 - 2.0 * zf)
    
    global _PERM_TABLE
    if '_PERM_TABLE' not in globals():
        rng = np.random.RandomState(SEED)
        p = rng.permutation(256).astype(np.int64)
        _PERM_TABLE = np.concatenate([p, p])
    
    perm = _PERM_TABLE
    aa = perm[perm[xi] + zi] / 255.0
    ab = perm[perm[xi] + zi + 1] / 255.0
    ba = perm[perm[xi + 1] + zi] / 255.0
    bb = perm[perm[xi + 1] + zi + 1] / 255.0
    
    x1 = aa + u * (ba - aa)
    x2 = ab + u * (bb - ab)
    return x1 + v * (x2 - x1)

def get_terrain_height(X, Z):
    n1 = value_noise2d(X * NOISE_SCALE, Z * NOISE_SCALE)
    n2 = value_noise2d(X * NOISE_SCALE * 2.3 + 19.7, Z * NOISE_SCALE * 2.3 - 41.2)
    ridges = 1 - np.abs(2 * n2 - 1)
    
    h = BASE_Y + (n1 - 0.5) * TERRAIN_INTENSITY * 2.5
    h = h + ridges * TERRAIN_INTENSITY * ROUGHNESS * 1.8
    h = np.round(np.clip(h, MIN_HEIGHT, MAX_HEIGHT))
    return h.astype(np.int32)

def build_grid(x0, x1, z0, z1):
    xs = np.arange(x0, x1, dtype=np.float64)
    zs = np.arange(z0, z1, dtype=np.float64)
    return np.meshgrid(xs, zs, indexing="ij")

def pick_block(biome_id_arr, x_int, z_int, offx=0, offz=0):
    r = rand01_from_xz(x_int + offx, z_int + offz)
    out = np.zeros(biome_id_arr.shape, dtype=np.int32)
    for bname, bidx in biome_index.items():
        if bname not in biome_blocks_ids: continue
        ids = np.array(biome_blocks_ids[bname], dtype=np.int32)
        mask = biome_id_arr == bidx
        if not mask.any(): continue
        sel = np.floor(r[mask] * len(ids)).astype(np.int64) % len(ids)
        out[mask] = ids[sel]
    return out

def get_filler_block(main_biome_arr, top_block_arr, x_int, z_int):
    out = np.zeros(main_biome_arr.shape, dtype=np.int32)
    dirt_id = block_id("Dirt")
    sand_filler_id = block_id("Smooth Sandstone")
    for bname, bidx in biome_index.items():
        mask = main_biome_arr == bidx
        if not mask.any(): continue
        if bname in ("plain", "forest"): out[mask] = dirt_id
        elif bname == "sand": out[mask] = sand_filler_id
        else: out[mask] = top_block_arr[mask]
    return out

def rle_encode_vectorized(arr_1d):
    n = len(arr_1d)
    if n == 0: return b""
    change = np.nonzero(np.diff(arr_1d))[0] + 1
    starts = np.concatenate(([0], change))
    ends = np.concatenate((change, [n]))
    lengths = (ends - starts).tolist()
    values = arr_1d[starts].tolist()
    out = bytearray()
    from bloxd_format import _uvarint
    for length, val in zip(lengths, values):
        out += _uvarint(length)
        out += _uvarint(int(val))
    return bytes(out)

# ============================================================
# GÉNÉRATION SCHEMATIC
# ============================================================
def main():
    import time
    t_start = time.time()
    tiles_x = WORLD_SIZE_X // CHUNK
    tiles_z = WORLD_SIZE_Z // CHUNK
    water_id = block_id(WATER_BLOCK)
    
    y_lo = min(BASE_Y, MIN_HEIGHT, SEA_Y)
    y_hi = max(BASE_Y, MAX_HEIGHT, SEA_Y)
    chunk_y_lo = (y_lo // CHUNK) - 1
    chunk_y_hi = (y_hi // CHUNK) + 1
    n_y_chunks = chunk_y_hi - chunk_y_lo + 1
    total_chunks = tiles_x * tiles_z * n_y_chunks

    print(f"🚀 Génération du monde {WORLD_SIZE_X}x{WORLD_SIZE_Z} ({tiles_x}x{tiles_z} tuiles, {n_y_chunks} couches Y = {total_chunks} chunks)...")

    with open(OUTPUT_PATH, "wb") as f:
        writer = BloxdSchemWriter(f, SCHEM_NAME, WORLD_SIZE_X, n_y_chunks * CHUNK, WORLD_SIZE_Z, pos=(WORLD_MIN_X, 0, WORLD_MIN_Z))
        chunks_done = 0

        for tx in range(tiles_x):
            x0 = WORLD_MIN_X + tx * CHUNK
            for tz in range(tiles_z):
                z0 = WORLD_MIN_Z + tz * CHUNK
                X, Z = build_grid(x0, x0 + CHUNK, z0, z0 + CHUNK)
                Xi = X.astype(np.int64)
                Zi = Z.astype(np.int64)

                H = get_terrain_height(X, Z)
                topY = (BASE_Y + H).astype(np.int64)

                main_biome = np.zeros_like(Xi, dtype=np.int32)
                main_biome = np.where(topY <= SEA_Y + 3, 2 if len(biome_names)>2 else 0, main_biome)
                main_biome = np.where((topY > SEA_Y + 3) & (topY < 95), 0, main_biome)
                main_biome = np.where(topY >= 95, 3 if len(biome_names)>3 else 0, main_biome)

                for lx in range(CHUNK):
                    for lz in range(CHUNK):
                        kstr = f"{int(Xi[lx,lz])},{int(Zi[lx,lz])}"
                        if kstr in CUSTOM_EDITS:
                            topY[lx, lz] = int(CUSTOM_EDITS[kstr][0])
                            bname = CUSTOM_EDITS[kstr][1]
                            if bname in biome_index:
                                main_biome[lx, lz] = biome_index[bname]

                top_block = pick_block(main_biome, Xi, Zi)
                filler_block = get_filler_block(main_biome, top_block, Xi, Zi)
                underwater = FILL_WATER & (topY < SEA_Y)

                for cy in range(chunk_y_lo, chunk_y_hi + 1):
                    y_base = cy * CHUNK
                    ly = np.arange(CHUNK)
                    wy = (y_base + ly)[np.newaxis, np.newaxis, :]
                    topY3 = topY[:, :, np.newaxis]
                    filler3 = filler_block[:, :, np.newaxis]
                    top3 = top_block[:, :, np.newaxis]
                    underwater3 = underwater[:, :, np.newaxis]

                    is_top = wy == topY3
                    is_filler = (wy < topY3) & (wy >= BASE_Y)
                    is_water = underwater3 & (wy > topY3) & (wy <= SEA_Y)

                    block_arr = np.zeros((CHUNK, CHUNK, CHUNK), dtype=np.int32)
                    block_arr = np.where(is_filler, filler3, block_arr)
                    block_arr = np.where(is_top, top3, block_arr)
                    block_arr = np.where(is_water, water_id, block_arr)

                    if not block_arr.any():
                        rle = rle_encode_vectorized(np.zeros(CHUNK * CHUNK * CHUNK, dtype=np.int32))
                        writer.add_chunk(tx, cy - chunk_y_lo, tz, rle)
                        chunks_done += 1
                        continue

                    flat = np.transpose(block_arr, (0, 2, 1)).reshape(-1)
                    rle = rle_encode_vectorized(flat)
                    writer.add_chunk(tx, cy - chunk_y_lo, tz, rle)
                    chunks_done += 1

            if (tx + 1) % 15 == 0 or tx == tiles_x - 1:
                pct = 100.0 * chunks_done / total_chunks
                print(f"  ... {chunks_done}/{total_chunks} chunks ({pct:.1f}%), {time.time() - t_start:.1f}s écoulées", flush=True)

        writer.finish()

    dt = time.time() - t_start
    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"✅ Terminé en {dt:.1f}s ! Fichier créé : {OUTPUT_PATH} ({size_mb:.2f} Mo, {chunks_done} chunks écrits)")

if __name__ == "__main__":
    main()
`;
    }

    getBlockId(name) {
        if (!this.nameToIdMap) {
            this.nameToIdMap = {
                "Air": 0, "Unloaded": 1, "Dirt": 2, "Messy Dirt": 3, "Grass Block": 4, "Sand": 5, "Clay": 6, "Gravel": 7, "Snow": 8,
                "Maple Log": 9, "Pine Log": 10, "Plum Log": 11, "Cedar Log": 12, "Aspen Log": 13, "Elm Log": 14,
                "Stone": 28, "Messy Stone": 29, "Smooth Stone": 31, "Diorite": 32, "Smooth Diorite": 33, "Andesite": 34, "Smooth Andesite": 35,
                "Granite": 36, "Smooth Granite": 37, "Sandstone": 38, "Yellowstone": 39,
                "White Wool": 51, "Orange Wool": 52, "Magenta Wool": 53, "Light Blue Wool": 54, "Yellow Wool": 55, "Lime Wool": 56,
                "Pink Wool": 57, "Gray Wool": 58, "Light Gray Wool": 59, "Cyan Wool": 60, "Purple Wool": 61, "Blue Wool": 62, "Brown Wool": 63,
                "Green Wool": 64, "Red Wool": 65, "Black Wool": 66,
                "Baked Clay": 67, "White Baked Clay": 68, "Orange Baked Clay": 69, "Magenta Baked Clay": 70, "Light Blue Baked Clay": 71,
                "Yellow Baked Clay": 72, "Lime Baked Clay": 73, "Pink Baked Clay": 74, "Gray Baked Clay": 75, "Light Gray Baked Clay": 76,
                "Cyan Baked Clay": 77, "Purple Baked Clay": 78, "Blue Baked Clay": 79, "Brown Baked Clay": 80, "Green Baked Clay": 81,
                "Red Baked Clay": 82, "Black Baked Clay": 83,
                "Gray Concrete": 84, "Light Gray Concrete": 85, "Black Concrete": 86, "Blue Concrete": 87, "Brown Concrete": 88,
                "Cyan Concrete": 89, "Light Blue Concrete": 90, "Lime Concrete": 91, "Magenta Concrete": 92, "Orange Concrete": 93,
                "Pink Concrete": 94, "Purple Concrete": 95, "Red Concrete": 96, "White Concrete": 97, "Green Concrete": 98, "Yellow Concrete": 99,
                "Water": 126, "Bricks": 128, "Stone Bricks": 129, "Block of Quartz": 132, "Mossy Stone Bricks": 135, "Cracked Stone Bricks": 136,
                "Smooth Sandstone": 137, "Ice": 139, "Obsidian": 140, "Bedrock": 147, "Lime Planks": 233, "Green Planks": 241,
        "Dark Red Brick": 130, "Dark Red Stone": 131, "Smooth Red Sandstone": 475, "Red Sand": 650, "Magma": 471, "Cherry Log": 1222,
                "Packed Snow": 8, "Overgrown Jungle Grass Block": 4, "White Chalk": 97
            };
        }
        if (this.nameToIdMap[name] !== undefined) return this.nameToIdMap[name];
        return 4; // Grass Block fallback
    }

    exportSchematicBinary() {
        const uvarint = (n) => { let out = []; n = Math.floor(n); while (true) { let b = n & 0x7F; n = Math.floor(n / 128); if (n > 0) out.push(b | 0x80); else { out.push(b); break; } } return new Uint8Array(out); };
        const avroInt = (n) => { n = Math.floor(n); let zz = (n << 1) ^ (n >> 31); if (n >= 0) zz = n * 2; else zz = (-n * 2) - 1; return uvarint(zz); };
        const avroString = (s) => { const enc = new TextEncoder().encode(s); const lenBuf = avroInt(enc.length); let res = new Uint8Array(lenBuf.length + enc.length); res.set(lenBuf, 0); res.set(enc, lenBuf.length); return res; };
        const avroBytes = (b) => { const lenBuf = avroInt(b.length); let res = new Uint8Array(lenBuf.length + b.length); res.set(lenBuf, 0); res.set(b, lenBuf.length); return res; };
        const rleEncodeBlocks = (arr) => {
            const n = arr.length; if (n === 0) return new Uint8Array(0);
            let out = []; let currId = arr[0]; let currAmt = 1;
            for (let i = 1; i <= n; i++) {
                let bid = (i < n) ? arr[i] : null;
                if (bid === currId) currAmt++;
                else {
                    let ab = uvarint(currAmt); for (let k = 0; k < ab.length; k++) out.push(ab[k]);
                    let ib = uvarint(currId); for (let k = 0; k < ib.length; k++) out.push(ib[k]);
                    currAmt = 1; currId = bid;
                }
            }
            return new Uint8Array(out);
        };

        class BloxdSchemWriterJS {
            constructor(name, sizeX, sizeY, sizeZ, posX = 0, posY = 0, posZ = 0) {
                this.buffers = []; this.chunkCount = 0; this.blockBuffer = []; this.flushEvery = 512;
                this.buffers.push(new Uint8Array([0, 0, 0, 0])); this.buffers.push(avroString(name));
                this.buffers.push(avroInt(posX)); this.buffers.push(avroInt(posY)); this.buffers.push(avroInt(posZ));
                this.buffers.push(avroInt(sizeX)); this.buffers.push(avroInt(sizeY)); this.buffers.push(avroInt(sizeZ));
            }
            addChunk(cx, cy, cz, rleBytes) {
                this.blockBuffer.push(avroInt(cx)); this.blockBuffer.push(avroInt(cy)); this.blockBuffer.push(avroInt(cz));
                this.blockBuffer.push(avroBytes(rleBytes)); this.chunkCount++;
                if (this.chunkCount >= this.flushEvery) this.flushBlock();
            }
            flushBlock() {
                if (this.chunkCount === 0) return;
                this.buffers.push(avroInt(this.chunkCount));
                for (let b of this.blockBuffer) this.buffers.push(b);
                this.blockBuffer = []; this.chunkCount = 0;
            }
            finish() {
                this.flushBlock(); this.buffers.push(avroInt(0));
                let totalLen = 0; for (let b of this.buffers) totalLen += b.length;
                let res = new Uint8Array(totalLen); let offset = 0;
                for (let b of this.buffers) { res.set(b, offset); offset += b.length; }
                return res;
            }
        }

        const CHUNK = 32;
        const exportSizeX = Math.min(this.config.worldSizeX || 640, 2048);
        const exportSizeZ = Math.min(this.config.worldSizeZ || 640, 2048);
        const tilesX = Math.max(1, Math.floor(exportSizeX / CHUNK));
        const tilesZ = Math.max(1, Math.floor(exportSizeZ / CHUNK));
        // IMPORTANT : Bloxd.io ignore/coupe silencieusement tout ce qui est en coordonnées
        // négatives lors du //schematic load. Centrer le terrain sur l'origine (0,0) faisait
        // qu'environ la moitié de la zone (tout le côté négatif) disparaissait au chargement
        // (c'est la cause exacte du "seulement 48x48" puis "64x64" au lieu de la zone complète).
        // On place donc tout le terrain en coordonnées positives, à partir de (0, 0).
        const minX = 0;
        const minZ = 0;
        const airRle = rleEncodeBlocks(new Int32Array(32768));

        const gridRes = this.config.gridResolution || 96;
        const cellW = (this.config.worldSizeX || 4000) / gridRes;
        const cellZ = (this.config.worldSizeZ || 4000) / gridRes;
        const halfWorldX = (this.config.worldSizeX || 4000) / 2;
        const halfWorldZ = (this.config.worldSizeZ || 4000) / 2;

        const stoneBlockId = this.getBlockId("Stone");
        const dirtBlockId = this.getBlockId("Dirt");
        const waterBlockId = this.getBlockId("Water");

        // Hachage 3D rapide pour le texturing des pentes et profondeurs
        const get3DHash = (x, y, z) => {
            let h = (x * 374761393 + y * 1274126177 + z * 668265263) ^ ((x * 374761393 + y * 1274126177 + z * 668265263) >> 13);
            return Math.abs((h * 2147483647) ^ (h >> 16));
        };

        const getSubsurfaceId = (biomeKey, wx, wy, wz) => {
            if (biomeKey === "plain" || biomeKey === "forest") return dirtBlockId; // "Mais on garde la terre sous les herbes"
            const h = get3DHash(wx, wy, wz);
            if (biomeKey === "sand") {
                const pal = ["Sand", "Smooth Sandstone"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "snow") {
                const pal = ["Stone", "Smooth Stone", "Diorite", "Andesite"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "mountain") {
                const pal = ["Smooth Stone", "Stone", "Stone Bricks", "Cracked Stone Bricks"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "desert") {
                const pal = ["Baked Clay", "Orange Baked Clay", "Smooth Red Sandstone", "Red Sand"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "volcano") {
                const pal = ["Dark Red Stone", "Dark Red Brick", "Magma"];
                return this.getBlockId(pal[h % pal.length]);
            }
            return dirtBlockId;
        };

        // Passe 1 : Prcalcul des hauteurs et biomes pour trouver les bornes exactes (élagage vertical)
        let minTopY = 999999, maxTopY = -999999;
        const colHeights = new Int32Array(tilesX * CHUNK * tilesZ * CHUNK);
        const colBiomes = [];
        for (let tx = 0; tx < tilesX; tx++) {
            const worldX0 = minX + tx * CHUNK;
            for (let tz = 0; tz < tilesZ; tz++) {
                const worldZ0 = minZ + tz * CHUNK;
                for (let lx = 0; lx < CHUNK; lx++) {
                    for (let lz = 0; lz < CHUNK; lz++) {
                        let wx = worldX0 + lx, wz = worldZ0 + lz;
                        // MASQUE DE FORME : ignore les blocs hors-forme à l'export
                        if (this.shapeMask) {
                            const m = this.currentGridMeta;
                            if (m) {
                                const cgx = Math.floor((wx - halfWorldX - m.startWorldX) / m.stepX);
                                const cgz = Math.floor((wz - halfWorldZ - m.startWorldZ) / m.stepZ);
                                if (!this.isInShape(cgx, cgz)) continue;
                            }
                        }
                        // FIX DÉCALAGE Y ENTRE PARTIES : l'export écrit ses blocs en
                        // coordonnées POSITIVES (0..taille, car Bloxd coupe le négatif),
                        // mais la grille/peinture vivent en coordonnées CENTRÉES
                        // (-moitié..+moitié). Sans cette conversion, la moitié du monde
                        // ne trouvait aucun édit et retombait sur le terrain procédural
                        // à une hauteur différente (murs de roche au milieu des parties).
                        const wxS = wx - halfWorldX, wzS = wz - halfWorldZ;
                        let h = 0, bkey = "plain";
                        const customEdit = this.getCustomEdit(wxS, wzS, 0.5);
                        if (customEdit) {
                            const hFb = customEdit.height !== undefined ? customEdit.height : Math.round(this.fbmTerrain(wxS, wzS));
                            // MODE PIXELISE (case cochée) : point le plus proche = gros blocs
                            // MODE LISSE (défaut) : interpolation IDW entre points de peinture
                            // + micro-bruit (comme le chemin grille) : casse les dernières
                            // terrasses alignées sur le quadrillage des points de peinture
                            if (this.config.pixelatedExport) {
                                h = Math.round(hFb);
                            } else {
                                const hIdw = this.getInterpolatedEditHeight(wxS, wzS, hFb);
                                const gdE = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                                const hDet = (this.valueNoise2D(wxS * 0.35 + 7.3, wzS * 0.35 + 2.1) - 0.5) * 1.6 * gdE;
                                h = Math.round(hIdw + hDet);
                            }
                            bkey = customEdit.biome || this.assignBiomeProcedural(h, wxS, wzS);
                            // REGLE PRIORITAIRE : la règle verrouillée gagne sur la peinture
                            const lockedBy = this.isBiomePaintBlocked(h);
                            if (lockedBy) bkey = lockedBy;
                        } else if (this.config.viewportMode === 'global' && this.grid && this.currentGridMeta) {
                            const meta = this.currentGridMeta;
                            let gx = Math.floor((wxS - meta.startWorldX) / meta.stepX);
                            let gz = Math.floor((wzS - meta.startWorldZ) / meta.stepZ);
                            if (gx >= 0 && gx < meta.resX && gz >= 0 && gz < meta.resZ && this.grid[gx] && this.grid[gx][gz]) {
                                if (this.config.pixelatedExport) {
                                    // MODE PIXELISE (feature) : plus proche voisin -> gros blocs texturés
                                    h = Math.round(this.grid[gx][gz].height);
                                } else {
                                    // MODE LISSE (défaut) : interpolation bilinéaire entre les
                                    // 4 cellules voisines -> pentes continues, plus de "marches" géantes
                                    const fx = (wxS - meta.startWorldX) / meta.stepX - 0.5;
                                    const fz = (wzS - meta.startWorldZ) / meta.stepZ - 0.5;
                                    const x0 = Math.max(0, Math.min(meta.resX - 1, Math.floor(fx)));
                                    const z0 = Math.max(0, Math.min(meta.resZ - 1, Math.floor(fz)));
                                    const x1 = Math.min(meta.resX - 1, x0 + 1);
                                    const z1 = Math.min(meta.resZ - 1, z0 + 1);
                                    const tx2 = Math.max(0, Math.min(1, fx - x0));
                                    const tz2 = Math.max(0, Math.min(1, fz - z0));
                                    const h00 = this.grid[x0][z0].height, h10 = this.grid[x1][z0].height;
                                    const h01 = this.grid[x0][z1].height, h11 = this.grid[x1][z1].height;
                                    const hInterp =
                                        h00 * (1 - tx2) * (1 - tz2) + h10 * tx2 * (1 - tz2) +
                                        h01 * (1 - tx2) * tz2 + h11 * tx2 * tz2;
                                    // Micro-bruit organique (±0.8 bloc) : casse l'alignement
                                    // des bords de terrasses sur la grille (effet "rectangles 4x5")
                                    const gdG = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                                    const hDetail = (this.valueNoise2D(wxS * 0.35 + 7.3, wzS * 0.35 + 2.1) - 0.5) * 1.6 * gdG;
                                    h = Math.round(hInterp + hDetail);
                                }
                                bkey = this.grid[gx][gz].biome || "plain";
                            } else {
                                h = Math.round(this.fbmTerrain(wxS, wzS));
                                h = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, h));
                                bkey = this.assignBiomeProcedural(h, wxS, wzS);
                            }
                        } else {
                            h = Math.round(this.fbmTerrain(wxS, wzS));
                            h = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, h));
                            bkey = this.assignBiomeProcedural(h, wxS, wzS);
                        }
                        const idx = (tx * CHUNK + lx) * (tilesZ * CHUNK) + (tz * CHUNK + lz);
                        colHeights[idx] = h;
                        colBiomes[idx] = bkey;
                        if (h < minTopY) minTopY = h;
                        if (h > maxTopY) maxTopY = h;
                    }
                }
            }
        }

        // Bornes verticales réelles = hauteur de terrain effectivement calculée (Passe 1),
        // PAS les bornes théoriques minHeight/maxHeight de la config (qui gonflaient
        // artificiellement le nombre de chunks Y à exporter, la plupart vides).
        const yLo = Math.min(minTopY, this.config.baseY, this.config.seaLevel);
        const yHi = Math.max(maxTopY, this.config.seaLevel);

        // FIX ERREUR 400 : comme posX/posZ, le champ posY du header DOIT rester à 0,
        // sinon le serveur Bloxd rejette le fichier (HTTP 400). On écrit donc toujours
        // les chunks depuis Y=0 (pas d'élagage du bas — de toute façon le sous-sol
        // est rempli de pierre jusqu'à Y=0, ces chunks ne sont pas vides).
        const chunkYLo = 0;
        const chunkYHi = Math.floor(yHi / CHUNK) + 1;
        const nYChunks = chunkYHi - chunkYLo + 1;

        // ============================================================
        // GRADIENT DE BIOMES aux frontières (dithering spatial) :
        // pour chaque colonne, on échantillonne le biome d'une colonne
        // voisine choisie pseudo-aléatoirement dans un rayon BLEND_R.
        // Au coeur d'un biome cela ne change rien ; près d'une frontière
        // les blocs des deux biomes s'entremêlent progressivement,
        // créant une transition de textures naturelle (~6 blocs de large).
        // ============================================================
        const colsX = tilesX * CHUNK, colsZ = tilesZ * CHUNK;
        const BLEND_R = 3;
        const sampleBiomeBlended = (cx, cz, h) => {
            const dx = (h % (2 * BLEND_R + 1)) - BLEND_R;
            const dz = (((h / 31) | 0) % (2 * BLEND_R + 1)) - BLEND_R;
            const nx = Math.max(0, Math.min(colsX - 1, cx + dx));
            const nz = Math.max(0, Math.min(colsZ - 1, cz + dz));
            return colBiomes[nx * colsZ + nz];
        };

        const generateRegion = (startTx, endTx, startTz, endTz, partName) => {
            const regTilesX = endTx - startTx;
            const regTilesZ = endTz - startTz;
            const regMinX = minX + startTx * CHUNK;
            const regMinZ = minZ + startTz * CHUNK;
            // FIX BUG "HTTP 400 sur les parties 2+" : Bloxd.io n'utilise PAS le champ position
            // (x, z) du header pour placer automatiquement chaque partie ailleurs dans le monde.
            // Comme le fait l'outil officiel M2B (Quentin-X/M2B) pour ses schematics découpés,
            // seule la position Y garde un sens ; X et Z doivent rester à 0 dans CHAQUE fichier
            // (c'est au joueur de se déplacer manuellement de regMinX/regMinZ blocs entre deux
            // //schematic load). Écrire regMinX/regMinZ dans le header faisait que seule la
            // partie 1 (où regMinX = regMinZ = 0) était acceptée par le serveur ; toutes les
            // autres étaient rejetées avec une erreur 400.
            const writer = new BloxdSchemWriterJS(partName, regTilesX * CHUNK, nYChunks * CHUNK, regTilesZ * CHUNK, 0, chunkYLo * CHUNK, 0);
            let chunksWritten = 0;

            for (let tx = startTx; tx < endTx; tx++) {
                const worldX0 = minX + tx * CHUNK;
                for (let tz = startTz; tz < endTz; tz++) {
                    const worldZ0 = minZ + tz * CHUNK;
                    for (let cy = chunkYLo; cy <= chunkYHi; cy++) {
                        let yBase = cy * CHUNK;
                        let blocks = new Int32Array(32768);
                        let hasBlocks = false;

                        for (let lx = 0; lx < CHUNK; lx++) {
                            for (let lz = 0; lz < CHUNK; lz++) {
                                let wx = worldX0 + lx, wz = worldZ0 + lz;
                                const colIdx = (tx * CHUNK + lx) * (tilesZ * CHUNK) + (tz * CHUNK + lz);
                                let topY = colHeights[colIdx];
                                let bkey = colBiomes[colIdx];
                                // GRADIENT DE BIOMES : dithering de textures a la frontiere.
                                // FIX GLITCH EAU : jamais sous le niveau de la mer, sinon des
                                // blocs de plaine/foret se melangent au fond marin pres des cotes
                                if (topY > this.config.seaLevel) {
                                    const hMix = get3DHash(wx, topY, wz);
                                    const bkeyMix = sampleBiomeBlended(tx * CHUNK + lx, tz * CHUNK + lz, hMix);
                                    if (bkeyMix && bkeyMix !== bkey && this.biomes[bkeyMix]) bkey = bkeyMix;
                                }
                                const biomeObj = this.biomes[bkey] || this.biomes["plain"];
                                const blockList = (biomeObj && biomeObj.blocks && biomeObj.blocks.length > 0) ? biomeObj.blocks : ["Grass Block"];

                                for (let ly = 0; ly < CHUNK; ly++) {
                                    let wy = yBase + ly;
                                    let idx = lx * 1024 + ly * 32 + lz;

                                    let terrBid = 0;
                                    if (wy === topY) {
                                        const h3 = get3DHash(wx, wy, wz);
                                        terrBid = this.getBlockId(blockList[h3 % blockList.length]);
                                    } else if (wy < topY && wy >= this.config.baseY) {
                                        if (topY - wy <= 5) {
                                            terrBid = getSubsurfaceId(bkey, wx, wy, wz);
                                        } else {
                                            terrBid = stoneBlockId;
                                        }
                                    } else if (wy < topY && wy < this.config.baseY) {
                                        terrBid = stoneBlockId;
                                    } else if (this.config.showWater && wy > topY && wy <= this.config.seaLevel) {
                                        terrBid = waterBlockId;
                                    }

                                    if (terrBid > 0) {
                                        blocks[idx] = terrBid;
                                        hasBlocks = true;
                                    }
                                }
                            }
                        }

                        if (!hasBlocks) {
                            writer.addChunk(tx - startTx, cy - chunkYLo, tz - startTz, airRle);
                            chunksWritten++;
                        } else {
                            writer.addChunk(tx - startTx, cy - chunkYLo, tz - startTz, rleEncodeBlocks(blocks));
                            chunksWritten++;
                        }
                    }
                }
            }
            return { bytes: writer.finish(), chunks: chunksWritten, offsetX: regMinX, offsetZ: regMinZ };
        };

        const mainRes = generateRegion(0, tilesX, 0, tilesZ, "Monde Bloxd");

        // EXPORT MONO-FICHIER FORCÉ : ignore la limite ~200 chunks de Bloxd.
        // Utile pour les outils externes (autres sites/convertisseurs) qui
        // lisent le .bloxdschem entier ; Bloxd lui-même refusera probablement
        // un fichier aussi gros via //schematic load.
        if (this.config.forceSingleSchem) {
            const outBytes = mainRes.bytes;
            outBytes.splitFiles = [{ name: "monde_personnalise.bloxdschem", bytes: mainRes.bytes }];
            return outBytes;
        }

        if (mainRes.chunks <= 180) {
            const outBytes = mainRes.bytes;
            outBytes.splitFiles = [{ name: "monde_personnalise.bloxdschem", bytes: mainRes.bytes }];
            return outBytes;
        } else {
            const maxTilesPerAxis = Math.max(1, Math.floor(Math.sqrt(160 / nYChunks)));
            const files = [];
            let partNum = 1;
            for (let stx = 0; stx < tilesX; stx += maxTilesPerAxis) {
                const etx = Math.min(tilesX, stx + maxTilesPerAxis);
                for (let stz = 0; stz < tilesZ; stz += maxTilesPerAxis) {
                    const etz = Math.min(tilesZ, stz + maxTilesPerAxis);
                    const res = generateRegion(stx, etx, stz, etz, `Partie ${partNum}`);
                    if (res.chunks > 0) {
                        // Le décalage réel (offsetX/offsetZ) est gardé dans le nom du fichier ET
                        // dans l'objet retourné, pour que le guide généré côté UI (ui.js) puisse
                        // dire exactement de combien de blocs se déplacer avant chaque
                        // //schematic load (voir note dans generateRegion plus haut).
                        files.push({
                            name: `monde_partie_${partNum}_x${res.offsetX}_z${res.offsetZ}.bloxdschem`,
                            bytes: res.bytes,
                            offsetX: res.offsetX,
                            offsetZ: res.offsetZ
                        });
                        partNum++;
                    }
                }
            }
            const firstValidBytes = files.length > 0 ? files[0].bytes : mainRes.bytes;
            firstValidBytes.splitFiles = files;
            return firstValidBytes;
        }
    }

}
window.TerrainGenerator = TerrainGenerator;

/* ──── map ──── */

/**
 * terrain_editor_map.js — RENDU 2D & 3D (fusionné)
 * Contient: map2d, map3d
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  map2d  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_map2d.js
   Carte 2D éditable (canvas) : zoom/pan, relief, grille, pinceaux et tampons.
   Chargement : 5/8 — après terrain_editor_generator.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            /**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_map2d.js
 * Rôle : Gestion du rendu Canvas 2D top-down, zoom/pan, preview du brush et peinture interactive
 */

class Map2D {
    constructor(canvasId, generator, onTerrainModified) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.generator = generator;
        this.onTerrainModified = onTerrainModified;

        // Vue (Caméra 2D) : translation et zoom
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;

        // État de la souris et outils
        this.isDragging = false;
        this.isPainting = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.mousePos = { x: 0, y: 0, gx: -1, gz: -1, worldX: 0, worldZ: 0 };
        this.spacePressed = false;

        // Outil actif (venant de ui.js)
        this.activeTab = 'settings'; // 'settings' | 'editor'
        this.activeTool = 'biome'; // 'biome', 'raise', 'lower', 'smooth', 'flatten', 'eraser'
        this.brushRadius = 4;
        this.brushIntensity = 15;
        this.activeBiome = 'plain';
        this.firstClickH = null;

        // PERF : cache des couleurs finales par cellule (mélange de biomes + ombrage),
        // invalidé automatiquement à chaque mutation de la grille (generator._rev) ou
        // changement d'ombrage. Supprime tout parsing hex et tout calcul de mélange
        // dans la boucle de rendu (pan / zoom / survol / peinture).
        this._cellColorCache = new Map();
        this._cellColorRev = -2;
        this._hsKey = -1;
        this._biomeRGBCache = Object.create(null); // hex -> [r,g,b]

        this.initEvents();
        this.resize();

        if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.canvas.parentElement);
        }
        window.addEventListener('resize', () => this.resize());
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * Ajuste la taille du canvas à son conteneur parent
     */
    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
                this.canvas.width = rect.width;
                this.canvas.height = rect.height;
                this.render();
            }
        }
    }

    /**
     * Réinitialise la caméra 2D pour centrer toute la carte
     */
    resetView() {
        const grid = this.generator.grid;
        const resX = grid && grid.length ? grid.length : (this.generator.config.gridResolution || 96);
        const resZ = grid && grid[0] && grid[0].length ? grid[0].length : resX;
        const minDim = Math.min(this.canvas.width, this.canvas.height);
        this.zoom = (minDim * 0.85) / Math.max(resX, resZ);
        this.panX = (this.canvas.width - resX * this.zoom) / 2;
        this.panY = (this.canvas.height - resZ * this.zoom) / 2;
        this.render();
    }

    screenToWorld(px, py) {
        const meta = this.generator.currentGridMeta;
        const gx = (px - this.panX) / this.zoom;
        const gz = (py - this.panY) / this.zoom;
        if (!meta) {
            return { worldX: gx * 40, worldZ: gz * 40 };
        }
        return {
            worldX: meta.startWorldX + gx * meta.stepX,
            worldZ: meta.startWorldZ + gz * meta.stepZ
        };
    }

    checkViewportUpdate() {
        // DEPRECIE : plus de "Focus Écran Dynamique". Le détail au zoom est rendu
        // par les chunks 16x16 à la demande (voir render / renderDetailChunks).
        return;
        // eslint-disable-next-line no-unreachable
        if (this.generator.config.viewportMode !== 'dynamic') return;
        if (!this.generator.currentGridMeta) return;

        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);

        const updated = this.generator.updateViewportFromScreen(topLeft.worldX, bottomRight.worldX, topLeft.worldZ, bottomRight.worldZ);
        if (updated) {
            const meta = this.generator.currentGridMeta;
            const newGx_top = (topLeft.worldX - meta.startWorldX) / meta.stepX;
            const newGz_top = (topLeft.worldZ - meta.startWorldZ) / meta.stepZ;
            const newGx_bottom = (bottomRight.worldX - meta.startWorldX) / meta.stepX;
            
            const spanX = newGx_bottom - newGx_top;
            if (spanX > 0) {
                this.zoom = this.canvas.width / spanX;
                this.panX = -newGx_top * this.zoom;
                this.panY = -newGz_top * this.zoom;
            }
            this.render();
            if (this.onTerrainModified) this.onTerrainModified();
        }
    }

    /**
     * Convertit les coordonnées pixel souris (px, py) en coordonnées de grille (gx, gz)
     */
    screenToGrid(px, py) {
        const gx = Math.floor((px - this.panX) / this.zoom);
        const gz = Math.floor((py - this.panY) / this.zoom);
        return { gx, gz };
    }

    /**
     * Configure les écouteurs d'événements souris et clavier
     */
    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.spacePressed = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') this.spacePressed = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const { x: mouseX, y: mouseY } = this.getCanvasCoords(e);

            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.max(0.5, Math.min(40.0, this.zoom * zoomFactor));

            // Zoom centré sur le pointeur souris
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            this.render();
            if (this._wheelTimeout) clearTimeout(this._wheelTimeout);
            this._wheelTimeout = setTimeout(() => this.checkViewportUpdate(), 120);
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            const { x: mx, y: my } = this.getCanvasCoords(e);

            // Clic droit ou bouton milieu ou Espace maintenu -> Déplacement (pan)
            if (e.button === 2 || e.button === 1 || this.spacePressed || this.activeTab === 'settings') {
                this.isDragging = true;
                this.dragStartX = mx - this.panX;
                this.dragStartY = my - this.panY;
                this.canvas.style.cursor = 'grabbing';
            } else if (e.button === 0 && this.activeTab === 'editor') {
                if (this.generator && typeof this.generator.saveStateForUndo === 'function') this.generator.saveStateForUndo();
                // Peinture au pinceau
                this.isPainting = true;
                this._stampDone = false; // nouvelle pose de forme autorisée à chaque clic
                const gridPos = this.screenToGrid(mx, my);
                // FIX APLATIR : borner sur la taille REELLE de la grille (mode
                // dynamique = taille variable), pas sur config.gridResolution,
                // sinon firstClickH restait null et l'outil Aplatir ne faisait rien
                const gridRef = this.generator.grid;
                const gridResX = gridRef && gridRef.length ? gridRef.length : 0;
                const gridResZ = gridRef && gridRef[0] ? gridRef[0].length : 0;
                if (gridPos.gx >= 0 && gridPos.gx < gridResX &&
                    gridPos.gz >= 0 && gridPos.gz < gridResZ) {
                    this.firstClickH = gridRef[gridPos.gx][gridPos.gz].height;
                    this.applyToolAt(gridPos.gx, gridPos.gz);
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Seulement si sur ou proche du canvas 2D
            if (e.target !== this.canvas && !this.isDragging && !this.isPainting) return;
            const { x: mx, y: my } = this.getCanvasCoords(e);

            this.mousePos.x = mx;
            this.mousePos.y = my;

            const gridPos = this.screenToGrid(mx, my);
            this.mousePos.gx = gridPos.gx;
            this.mousePos.gz = gridPos.gz;

            const grid = this.generator.grid;
            const resX = grid && grid.length ? grid.length : 0;
            const resZ = grid && grid[0] ? grid[0].length : 0;

            if (gridPos.gx >= 0 && gridPos.gx < resX &&
                gridPos.gz >= 0 && gridPos.gz < resZ &&
                grid[gridPos.gx] && grid[gridPos.gx][gridPos.gz]) {
                const cell = this.generator.grid[gridPos.gx][gridPos.gz];
                this.mousePos.worldX = Math.round(cell.worldX);
                this.mousePos.worldZ = Math.round(cell.worldZ);
                this.mousePos.height = Math.round(cell.height);
                const bObj = this.generator.biomes[cell.biome];
                this.mousePos.biomeName = window.getBiomeName ? window.getBiomeName(cell.biome, bObj) : (bObj ? bObj.name : cell.biome);
            } else {
                this.mousePos.height = null;
            }

            if (this.isDragging) {
                this.panX = mx - this.dragStartX;
                this.panY = my - this.dragStartY;
                this.requestRender();
            } else if (this.isPainting) {
                // PERF DESSIN : la souris émet ~120 événements/s ; on mémorise la
                // dernière position et on applique le pinceau au plus 1x par frame
                // (le rendu est déclenché par applyToolAt via requestRender)
                this._pendingPaint = { gx: gridPos.gx, gz: gridPos.gz };
                if (!this._paintRaf) {
                    this._paintRaf = requestAnimationFrame(() => {
                        this._paintRaf = null;
                        if (this._pendingPaint && this.isPainting) {
                            this.applyToolAt(this._pendingPaint.gx, this._pendingPaint.gz);
                            this._pendingPaint = null;
                        }
                    });
                }
            } else {
                // Simple survol : seul l'anneau du pinceau bouge -> render coalescé
                this.requestRender();
            }

            this.updateMouseOverlay();
        });

        window.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'default';
                this.checkViewportUpdate();
            }
            if (this.isPainting) {
                this.isPainting = false;
                this.firstClickH = null;
                this._pendingPaint = null;
                // Fin de geste : stats recalculées une seule fois
                if (this.generator._statsDirty) {
                    this.generator._statsDirty = false;
                    this.generator.updateStats();
                    if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
                }
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Applique l'outil actif sur la position spécifiée et déclenche la synchro 3D
     */
    applyToolAt(gx, gz) {
        const grid = this.generator.grid;
        if (!grid || gx < 0 || gx >= grid.length || !grid[0] || gz < 0 || gz >= grid[0].length) return;

        // Outil FORME (custom draw) : peint le masque de forme
        if (this.activeTool === 'shape') {
            if (this.generator.shapeMask) {
                this.generator.paintShapeMask(gx, gz, this.brushRadius, true);
                this.requestRender();
            }
            return;
        }
        
        let modified;
        if (this.activeTool === 'sphere' || this.activeTool === 'box') {
            // TAMPONS : posés une seule fois par clic (pas en continu au glisser)
            if (this._stampDone) return;
            this._stampDone = true;
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 10, d: 10, h: 20, paintBiome: true };
            modified = this.generator.applyStamp(
                gx, gz,
                this.activeTool === 'sphere' ? 'sphere' : 'box',
                p.w, p.d, p.h,
                p.paintBiome ? this.activeBiome : null
            );
        } else {
            modified = this.generator.applyBrush(
                gx, gz,
                this.activeTool,
                this.brushRadius,
                this.brushIntensity,
                this.activeBiome,
                this.firstClickH
            );
        }

        if (modified) {
            this.requestRender();
            if (this.onTerrainModified) {
                // TACHE 2 : transmet la zone modifiée (bounding box grille) pour
                // permettre une mise à jour 3D partielle ; les autres appels du
                // callback (sans argument) déclenchent le rebuild complet.
                this.onTerrainModified(this.generator.lastBrushRegion || null);
            }
        }
    }

    /**
     * Met à jour le badge d'informations souris en superposition du canvas 2D
     */
    updateMouseOverlay() {
        const infoEl = document.getElementById('map2d-info');
        if (!infoEl) return;
        if (this.mousePos.height !== null && this.mousePos.height !== undefined && this.generator.grid && this.generator.grid[this.mousePos.gx] && this.generator.grid[this.mousePos.gx][this.mousePos.gz]) {
            const bKey = this.generator.grid[this.mousePos.gx][this.mousePos.gz].biome;
            const bObj = this.generator.biomes[bKey];
            const bName = window.getBiomeName ? window.getBiomeName(bKey, bObj) : (bObj ? bObj.name : bKey);
            infoEl.innerHTML = `
                <span class="info-badge"><i class="fas fa-map-marker-alt"></i> X: ${this.mousePos.worldX}, Z: ${this.mousePos.worldZ}</span>
                <span class="info-badge"><i class="fas fa-mountain"></i> Y: ${this.mousePos.height}</span>
                <span class="info-badge biome-badge" style="border-left: 3px solid ${bObj?.color || '#fff'}">
                    ${bName}
                </span>
            `;
        } else {
            infoEl.innerHTML = `<span class="info-badge">${window.t ? window.t('outOfBounds') : 'Hors carte'}</span>`;
        }
    }


    /**
     * PERF : rendu coalescé (au plus 1 par frame) et suspendu quand la section
     * 2D est masquée (toggle vue 3D). Le rendu manqué est rattrapé au retour.
     */
    requestRender() {
        if (this.canvas && this.canvas.offsetParent === null) {
            this._pendingHiddenRender = true;
            return;
        }
        if (this._renderRaf) return;
        this._renderRaf = requestAnimationFrame(() => {
            this._renderRaf = null;
            this.render();
        });
    }

    _biomeRGB(hex){
        let c=this._biomeRGBCache[hex];
        if(c)return c;
        let hx=hex.replace(/^\s*#|\s*$/g,'');
        if(hx.length===3)hx=hx.replace(/(.)/g,'$1$1');
        c=[parseInt(hx.substr(0,2),16)||0,parseInt(hx.substr(2,2),16)||0,parseInt(hx.substr(4,2),16)||0];
        this._biomeRGBCache[hex]=c;
        return c;
    }
    /** Couleur finale (mélange de biomes + ombrage) d'une cellule, mise en cache. */
    _cellFinalHex(gx,gz,resX,resZ,grid){
        const key=gx+','+gz;
        const cached=this._cellColorCache.get(key);
        if(cached!==undefined)return cached;
        const cell=grid[gx][gz];
        const cellBiome=cell.biome;
        const baseHex=(this.generator.biomes[cellBiome]||{color:'#888888'}).color;
        const base=this._biomeRGB(baseHex);
        let r,g,b;
        let hasDiff=false;
        // Sous l'eau → pas de mélange de biomes (sable pur, pas de vert qui bave)
        if(cell.height>this.generator.config.seaLevel){
        for(let dx=-1;dx<=1&&!hasDiff;dx++){for(let dz=-1;dz<=1;dz++){const nx=gx+dx,nz=gz+dz;if(nx<0||nx>=resX||nz<0||nz>=resZ)continue;if(grid[nx][nz].biome!==cellBiome){hasDiff=true;break;}}}
        }
        if(!hasDiff){r=base[0];g=base[1];b=base[2];}
        else{
            const R=2;let rr=0,gg=0,bb=0,wSum=0;
            for(let dx=-R;dx<=R;dx++){for(let dz=-R;dz<=R;dz++){const nx=gx+dx,nz=gz+dz;if(nx<0||nx>=resX||nz<0||nz>=resZ)continue;const d=Math.sqrt(dx*dx+dz*dz);if(d>R)continue;const w=1/(1+d*d);const cc=this._biomeRGB((this.generator.biomes[grid[nx][nz].biome]||{color:baseHex}).color);rr+=cc[0]*w;gg+=cc[1]*w;bb+=cc[2]*w;wSum+=w;}}
            r=rr/wSum;g=gg/wSum;b=bb/wSum;
        }
        if(this.generator.config.hillshading){
            const leftH=gx>0?grid[gx-1][gz].height:cell.height;
            const topH=gz>0?grid[gx][gz-1].height:cell.height;
            const dlt=Math.round(((leftH-cell.height)+(topH-cell.height))*2.2);
            r+=dlt;g+=dlt;b+=dlt;
        }
        if(r<0)r=0;else if(r>255)r=255;if(g<0)g=0;else if(g>255)g=255;if(b<0)b=0;else if(b>255)b=255;
        // MASQUE DE FORME : les cellules hors-forme sont complètement masquées
        if (this.generator.shapeMask && !this.generator.isInShape(gx, gz)) return null;
        const hex='#'+((1<<24)+((r|0)<<16)+((g|0)<<8)+(b|0)).toString(16).slice(1);
        this._cellColorCache.set(key,hex);
        return hex;
    }

    _renderTile(grid, resX, resZ, tx, tz, TILE) {
        const z = this.zoom;
        const cw = Math.ceil(z) + 0.5;
        const cv = document.createElement('canvas');
        cv.width = Math.ceil(TILE * z) + 1;
        cv.height = Math.ceil(TILE * z) + 1;
        const c = cv.getContext('2d');
        const sea = this.generator.config.seaLevel;
        const showWater = this.generator.config.showWater;
        const showGrid = this.generator.config.showGrid && z > 8;
        const x0 = tx * TILE, z0 = tz * TILE;
        for (let lx = 0; lx < TILE; lx++) {
            const gx = x0 + lx;
            if (gx >= resX) break;
            for (let lz = 0; lz < TILE; lz++) {
                const gz = z0 + lz;
                if (gz >= resZ) break;
                const cell = grid[gx][gz];
                const px = lx * z, py = lz * z;
                const hex = this._cellFinalHex(gx, gz, resX, resZ, grid);
                if (!hex) continue; // hors forme → invisible
                c.fillStyle = hex; c.fillRect(Math.floor(px), Math.floor(py), cw, cw);
                if (showWater && cell.height <= sea) {
                    c.fillStyle = 'rgba(14, 116, 144, 0.55)';
                    c.fillRect(Math.floor(px), Math.floor(py), cw, cw);
                }
                if (showGrid) {
                    c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    c.lineWidth = 1;
                    c.strokeRect(Math.floor(px), Math.floor(py), Math.ceil(z), Math.ceil(z));
                }
            }
        }
        return cv;
    }

    /**
     * Boucle de rendu de la carte 2D
     */
    render() {
        const ctx = this.ctx;
        const grid = this.generator.grid;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!grid || grid.length === 0) return;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;

        // Limites visibles du canvas en coordonnées de grille pour optimiser le dessin
        const startGx = Math.max(0, Math.floor(-this.panX / this.zoom));
        const startGz = Math.max(0, Math.floor(-this.panY / this.zoom));
        const endGx = Math.min(resX - 1, Math.ceil((this.canvas.width - this.panX) / this.zoom));
        const endGz = Math.min(resZ - 1, Math.ceil((this.canvas.height - this.panY) / this.zoom));

        // PERF : invalide le cache des couleurs si la grille a changé (generator._rev)
        // ou si l'ombrage a été basculé.
        const _gen = this.generator;
        const _hs = _gen.config.hillshading ? 1 : 0;
        if (_gen._rev !== this._cellColorRev || this._hsKey !== _hs) {
            this._cellColorCache.clear();
            this._cellColorRev = _gen._rev;
            this._hsKey = _hs;
            if (this._tileCache) this._tileCache.clear(); // force le redraw des tuiles
        }

        // ── SYSTÈME DE TUILES (chunk-based 2D rendering) ──
        // La grille est divisée en tuiles de 32×32 cellules. Chaque tuile est
        // rendue UNE FOIS dans un canvas hors-écran puis BLITTÉE (drawImage)
        // au lieu de faire 1024 fillRect par tuile à chaque frame.
        const TILE = 32;
        const tileSX = Math.floor(startGx / TILE);
        const tileEX = Math.floor(endGx / TILE);
        const tileSZ = Math.floor(startGz / TILE);
        const tileEZ = Math.floor(endGz / TILE);

        for (let tx = tileSX; tx <= tileEX; tx++) {
            for (let tz = tileSZ; tz <= tileEZ; tz++) {
                const tKey = tx + ',' + tz + ',' + Math.ceil(this.zoom);
                let tile = this._tileCache ? this._tileCache.get(tKey) : null;
                if (!tile) {
                    if (!this._tileCache) this._tileCache = new Map();
                    tile = this._renderTile(grid, resX, resZ, tx, tz, TILE);
                    this._tileCache.set(tKey, tile);
                    // LRU: garde au max 400 tuiles
                    if (this._tileCache.size > 400) {
                        const firstKey = this._tileCache.keys().next().value;
                        this._tileCache.delete(firstKey);
                    }
                }
                // Blit la tuile à sa position écran — taille exacte pour éviter les gaps
                const px = this.panX + tx * TILE * this.zoom;
                const py = this.panY + tz * TILE * this.zoom;
                const nextPx = this.panX + (tx + 1) * TILE * this.zoom;
                const nextPy = this.panY + (tz + 1) * TILE * this.zoom;
                ctx.drawImage(tile, Math.floor(px), Math.floor(py), Math.ceil(nextPx) - Math.floor(px), Math.ceil(nextPy) - Math.floor(py));
            }
        }

        // CHUNKS DE DÉTAIL 16x16 : quand une cellule de grille couvre plusieurs
        // blocs (grands mondes) ET que le zoom rend ce détail visible, on dessine
        // par-dessus la vraie résolution 1:1, chunk par chunk, uniquement pour
        // les chunks présents à l'écran (calcul à la demande + cache LRU).
        this.renderDetailChunks(ctx, resX, resZ);

        // Contour de toute la carte
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.panX, this.panY, resX * this.zoom, resZ * this.zoom);

        // Preview du brush sous le pointeur souris si en mode Editeur
        if (this.activeTab === 'editor' && this.mousePos.gx >= 0 && this.mousePos.gx < resX && this.mousePos.gz >= 0 && this.mousePos.gz < resZ) {
            this.renderBrushPreview(ctx);
        }
    }


    /**
     * Surcouche "chunks de détail" : ne calcule et ne dessine QUE les chunks
     * 16x16 blocs visibles dans le canvas. px/bloc = zoom / stepX.
     */
    renderDetailChunks(ctx, resX, resZ) {
        const gen = this.generator;
        if (!gen.needsDetailChunks || !gen.needsDetailChunks()) return;
        const meta = gen.currentGridMeta;
        if (!meta) return;
        const pxPerBlockX = this.zoom / meta.stepX;
        const pxPerBlockZ = this.zoom / meta.stepZ;
        // v2.5 : 1:1 dès qu'un bloc >= 1 px (comme la 3D : le max possible, sur
        // toute la zone visible). En-dessous d'1 px, plusieurs blocs partagent
        // le même pixel : le 1:1 est invisible -> grille grossière suffisante.
        if (pxPerBlockX < 1) return;

        const S = gen.detailChunkSize();
        // Fenêtre visible en coordonnées MONDE
        const wxMin = meta.startWorldX + (-this.panX / this.zoom) * meta.stepX;
        const wxMax = meta.startWorldX + ((this.canvas.width - this.panX) / this.zoom) * meta.stepX;
        const wzMin = meta.startWorldZ + (-this.panY / this.zoom) * meta.stepZ;
        const wzMax = meta.startWorldZ + ((this.canvas.height - this.panY) / this.zoom) * meta.stepZ;

        const cx0 = Math.floor(wxMin / S), cx1 = Math.floor(wxMax / S);
        const cz0 = Math.floor(wzMin / S), cz1 = Math.floor(wzMax / S);

        // v2.5 : chaque chunk est rasterisé UNE FOIS dans un petit canvas 16x16
        // (WeakMap : l'invalidation du chunk côté générateur régénère l'image
        // automatiquement) puis affiché en UN drawImage au lieu de 256 fillRect.
        // C'est ce qui permet le plein écran 1:1 (~8000 chunks) sans ramer.
        if (!this._chunkImgCache) this._chunkImgCache = new WeakMap();
        const prevSmooth = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false; // blocs nets (nearest neighbor)

        // Budget par frame : les chunks manquants seront calculés aux frames
        // suivantes (chargement progressif, comme la 3D)
        let budget = 2000;
        let missing = 0;
        for (let cz = cz0; cz <= cz1; cz++) {
            for (let cx = cx0; cx <= cx1; cx++) {
                const cached = gen._detailChunks && gen._detailChunks.get(cx + ',' + cz);
                let chunk = cached;
                if (!chunk) {
                    if (budget <= 0) { missing++; continue; }
                    budget--;
                    chunk = gen.getDetailChunk(cx, cz);
                    if (!chunk) continue;
                }
                let img = this._chunkImgCache.get(chunk);
                if (!img) {
                    img = this._buildChunkImage(chunk, S, gen);
                    this._chunkImgCache.set(chunk, img);
                }
                // Bords arrondis au pixel pour des chunks jointifs sans couture
                const fx0 = this.panX + ((chunk.x0 - meta.startWorldX) / meta.stepX) * this.zoom;
                const fy0 = this.panY + ((chunk.z0 - meta.startWorldZ) / meta.stepZ) * this.zoom;
                const fx1 = this.panX + ((chunk.x0 + S - meta.startWorldX) / meta.stepX) * this.zoom;
                const fy1 = this.panY + ((chunk.z0 + S - meta.startWorldZ) / meta.stepZ) * this.zoom;
                const px = Math.round(fx0), py = Math.round(fy0);
                if (px > this.canvas.width || py > this.canvas.height || fx1 < 0 || fy1 < 0) continue;
                ctx.drawImage(img, px, py, Math.round(fx1) - px, Math.round(fy1) - py);
            }
        }
        ctx.imageSmoothingEnabled = prevSmooth;
        // S'il reste des chunks non calculés (budget épuisé), replanifier un rendu
        if (missing > 0 && !this._detailRaf) {
            this._detailRaf = requestAnimationFrame(() => { this._detailRaf = null; this.render(); });
        }
    }

    /**
     * Rasterise un chunk de détail 16x16 dans un canvas hors écran :
     * couleur de biome + hillshading + voile d'eau, 1 pixel = 1 bloc.
     */
    _buildChunkImage(chunk, S, gen) {
        const cv = document.createElement('canvas');
        cv.width = S; cv.height = S;
        const c2 = cv.getContext('2d');
        const im = c2.createImageData(S, S);
        const data = im.data;
        if (!this._biomeRgbCache) this._biomeRgbCache = {};
        const sea = gen.config.seaLevel;
        const shading = gen.config.hillshading;
        const showWater = gen.config.showWater;
        for (let lz = 0; lz < S; lz++) {
            for (let lx = 0; lx < S; lx++) {
                const i = lz * S + lx;
                const bkey = chunk.biomes[i];
                let rgb = this._biomeRgbCache[bkey];
                if (!rgb) {
                    const bio = gen.biomes[bkey] || { color: '#888888' };
                    let hx = bio.color.replace(/^\s*#|\s*$/g, '');
                    if (hx.length === 3) hx = hx.replace(/(.)/g, '$1$1');
                    rgb = [parseInt(hx.substr(0, 2), 16), parseInt(hx.substr(2, 2), 16), parseInt(hx.substr(4, 2), 16)];
                    this._biomeRgbCache[bkey] = rgb;
                }
                const h = chunk.heights[i];
                let r = rgb[0], g = rgb[1], b = rgb[2];
                if (shading) {
                    // FIX v2.7 "traits dans les pentes" : sur la 1re colonne/ligne
                    // du chunk, le voisin ouest/nord est dans le chunk d'à côté.
                    // Avant : hl = h (ombrage nul) -> trait clair tous les 16
                    // blocs dans les pentes. On extrapole le gradient interne
                    // (2h - voisin est/sud) : ombrage continu entre chunks,
                    // sans dépendre du cache des chunks voisins.
                    const hl = lx > 0 ? chunk.heights[i - 1] : (lx + 1 < S ? 2 * h - chunk.heights[i + 1] : h);
                    const ht = lz > 0 ? chunk.heights[i - S] : (lz + 1 < S ? 2 * h - chunk.heights[i + S] : h);
                    const d = ((hl - h) + (ht - h)) * 2.2;
                    r += d; g += d; b += d;
                }
                if (showWater && h <= sea) {
                    // mélange rgba(14, 116, 144, 0.55)
                    r = r * 0.45 + 14 * 0.55;
                    g = g * 0.45 + 116 * 0.55;
                    b = b * 0.45 + 144 * 0.55;
                }
                const o = i * 4;
                data[o] = Math.max(0, Math.min(255, r));
                data[o + 1] = Math.max(0, Math.min(255, g));
                data[o + 2] = Math.max(0, Math.min(255, b));
                data[o + 3] = 255;
            }
        }
        c2.putImageData(im, 0, 0);
        return cv;
    }

    /**
     * Dessine le cercle de prévisualisation du pinceau
     */
    renderBrushPreview(ctx) {
        const centerPx = this.panX + (this.mousePos.gx + 0.5) * this.zoom;
        const centerPy = this.panY + (this.mousePos.gz + 0.5) * this.zoom;
        const radiusPx = (this.brushRadius + 0.5) * this.zoom;

        // Aperçu des FORMES : ellipse (sphère) ou rectangle (pavé) aux dimensions réelles
        if (this.activeTool === 'sphere' || this.activeTool === 'box') {
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 16, d: 16, h: 20 };
            // p.w / p.d sont en BLOCS : conversion en cellules d'aperçu via le pas de grille
            const meta = this.generator.currentGridMeta;
            const cw = meta ? Math.max(1, p.w / meta.stepX) : p.w;
            const cd = meta ? Math.max(1, p.d / meta.stepZ) : p.d;
            const rxPx = cw * this.zoom, rzPx = cd * this.zoom;
            const col = p.h >= 0 ? '#8b5cf6' : '#ef4444';
            ctx.save();
            ctx.beginPath();
            if (this.activeTool === 'sphere') ctx.ellipse(centerPx, centerPy, rxPx, rzPx, 0, 0, Math.PI * 2);
            else ctx.rect(centerPx - rxPx, centerPy - rzPx, rxPx * 2, rzPx * 2);
            ctx.fillStyle = col + '26';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = 4.5;
            ctx.stroke();
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerPx, centerPy, radiusPx, 0, Math.PI * 2);
        
        let brushColor = '#ffffff';
        if (this.activeTool === 'biome') brushColor = this.generator.biomes[this.activeBiome]?.color || '#ffffff';
        if (this.activeTool === 'raise') brushColor = '#10b981';
        if (this.activeTool === 'lower') brushColor = '#ef4444';
        if (this.activeTool === 'smooth') brushColor = '#f59e0b';
        if (this.activeTool === 'eraser') brushColor = '#ec4899';

        ctx.fillStyle = brushColor + '33'; // 20% alpha
        ctx.fill();
        // VISIBILITE : double trait (halo noir épais + trait couleur clair) pour
        // rester lisible sur tous les biomes (neige comme forêt sombre)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 4.5;
        ctx.stroke();
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Point central (repère exact du pinceau)
        ctx.beginPath();
        ctx.arc(centerPx, centerPy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerPx, centerPy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
    }

    /**
     * Utilitaire pour assombrir ou éclaircir une couleur hex en fonction d'une pente
     */

    /**
     * GRADIENT DE BIOMES (2D) : si des voisins (rayon 2) ont un biome different,
     * la couleur de la cellule est melangee avec les leurs (moyenne ponderee par
     * la distance). Loin des frontieres, aucun voisin different -> couleur pure.
     */
    getBlendedBiomeColor(grid, gx, gz, resX, resZ, baseHex) {
        const cellBiome = grid[gx][gz].biome;
        const R = 2;
        // Detection rapide : bords immediats identiques -> pas de melange
        let hasDiff = false;
        for (let dx = -1; dx <= 1 && !hasDiff; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const nx = gx + dx, nz = gz + dz;
                if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                if (grid[nx][nz].biome !== cellBiome) { hasDiff = true; break; }
            }
        }
        if (!hasDiff) return baseHex;

        // Moyenne ponderee des couleurs dans le rayon R
        const parse = (hex) => {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
            return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
        };
        let r = 0, g = 0, b = 0, wSum = 0;
        for (let dx = -R; dx <= R; dx++) {
            for (let dz = -R; dz <= R; dz++) {
                const nx = gx + dx, nz = gz + dz;
                if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                const d = Math.sqrt(dx * dx + dz * dz);
                if (d > R) continue;
                const w = 1 / (1 + d * d); // poids decroissant avec la distance
                const bio = this.generator.biomes[grid[nx][nz].biome];
                const c = parse(bio ? bio.color : baseHex);
                r += c[0] * w; g += c[1] * w; b += c[2] * w; wSum += w;
            }
        }
        r = Math.round(r / wSum); g = Math.round(g / wSum); b = Math.round(b / wSum);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    adjustBrightness(hex, percent) {
        hex = hex.replace(/^\s*#|\s*$/g, '');
        if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
        
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);

        r = Math.max(0, Math.min(255, r + percent));
        g = Math.max(0, Math.min(255, g + percent));
        b = Math.max(0, Math.min(255, b + percent));

        return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    }
}
window.Map2D = Map2D;

/* ═══════════════════════════════════════════════════════════════ */
/*  map3d  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_map3d.js
   TOUT le rendu 3D : Babylon.js, terrain CHUNKISÉ (32×32 cellules),
   mesh voxel/lisse, eau, chunks de détail 1:1, caméra ArcRotateCamera.
   Chargement : 6/8 — nécessite terrain_editor_babylon.min.js + generator.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_map3d.js
 * Rôle : Visualisation 3D interactive du terrain avec Babylon.js
 *
 * NOTE v3.5 : portage complet Three.js -> Babylon.js (fusion des éditeurs).
 * NOTE v3.6 — GROS PASSAGE PERFORMANCE :
 *  1) TERRAIN DÉCOUPÉ EN CHUNKS (32×32 cellules -> 8×8 = 64 chunks en 256²)
 *     - chaque chunk possède SA bounding box -> FRUSTUM CULLING automatique de
 *       Babylon : zoomé sur un coin, les chunks hors-champ ne sont pas dessinés
 *     - PICKING accéléré : le rayon n'est testé en triangles que contre les
 *       chunks dont la bbox est traversée (≈2k tris au lieu de 260k)
 *     - MISES À JOUR LOCALES : un coup de pinceau ne reconstruit que les chunks
 *       touchés — en mode VOXEL aussi (avant : rebuild complet de la carte !)
 *  2) BUILD PROGRESSIF : chunks construits par budget (~7 ms/frame), triés par
 *     proximité du point regardé -> la carte apparaît autour du regard, sans gel.
 *  3) OMBRES RENDUES UNE SEULE FOIS (refreshRate RENDER_ONCE + ré-armement à
 *     chaque changement de géométrie) : en orbite caméra, la passe d'ombre
 *     (toute la géométrie re-rasterisée) disparaît des frames sans édition.
 *  4) MATÉRIAUX PARTAGÉS FIGÉS (material.freeze()) + meshes statiques
 *     (freezeWorldMatrix()) : zéro recalcul CPU par frame pour la géométrie fixe.
 *  5) COULEURS SANS ALLOCATION : cache hex->RGB + objets scratch (avant : 2 à 4
 *     NEW Color3 PAR sommet à chaque rebuild -> pics de GC).
 *  6) FACES VISIBLES SEULEMENT : un chunk grossier 100% couvert par la
 *     surcouche 1:1 est purement DÉSACTIVÉ (zéro pixel rasterisé, zéro
 *     z-fighting) au lieu d'être simplement enfoncé sous la carte.
 *  7) Indices 16 bits choisis automatiquement par Babylon (< 65536 sommets par
 *     chunk) -> buffers 2× plus légers, transferts GPU réduits.
 * L'API publique consommée par ui.js / main.js est INCHANGÉE :
 * updateTerrain, updateTerrainRegion, resize, resetCamera, clearDetailOverlay,
 * clearDetailOverlayInRegion, _needsRender, _terrainDirty, _cellRanges,
 * _geomMeta, _sunkCells, _detailMeshes, detailGroup, brushCursor3D, isPainting3D.
 */

class Map3D {
    constructor(containerId, generator) {
        this.container = document.getElementById(containerId);
        this.generator = generator;

        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;

        // ---- Terrain chunkisé (v3.6) ----
        this._chunkCells = 32;              // taille d'un chunk en cellules de grille
        this._terrainChunks = [];           // entries {cx,cz,x0,x1,z0,z1,mesh,wire,positions,...,built}
        this._chunkIndex = new Map();       // 'cx,cz' -> entry
        this._chunkBuildQueue = [];         // file de construction progressive
        this._terrainMaterial = null;       // matériau PARTAGÉ de tous les chunks (figé)
        this._cellRanges = new Map();       // 'gx,gz' -> {entry, s, e} (voxel : sink par cellule)
        this._sunkCells = new Map();        // 'gx,gz' -> {cx, cz, saved:Float32Array(ys)}
        this._geomMeta = null;              // layout courant {resX,resZ,scale,halfSizeX,halfSizeZ,meshType}
        this._dbg = { chunkBuilds: 0 };     // instrumentation (tests / perf)

        this.waterMesh = null;

        this.showWireframe = false;
        this.animFrameId = null;

        // TACHE 1 : rendu à la demande (dirty flag) + pause quand invisible
        this._needsRender = true;   // au moins un rendu au démarrage
        this._wasHidden = false;    // détecte la transition invisible -> visible

        // Caches couleur (v3.6) : hex string -> {r,g,b} (auto-invalide quand
        // la couleur du biome change, car la CLÉ c'est la couleur elle-même)
        this._biomeRGBCache = new Map();
        this._colScratch = { r: 0, g: 0, b: 0 };
        this._sideScratch = { r: 0, g: 0, b: 0 };

        this.init();
    }

    /**
     * Initialisation du moteur Babylon.js, scène, caméra, lumières et contrôles
     */
    init() {
        if (!this.container || typeof BABYLON === 'undefined') {
            console.error("Babylon.js non disponible ou conteneur introuvable !");
            return;
        }

        const width = this.container.clientWidth || 600;
        const height = this.container.clientHeight || 400;

        // 0. Canvas dédié + moteur Babylon
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.canvas.style.outline = 'none';
        this.canvas.style.touchAction = 'none';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.engine = new BABYLON.Engine(this.canvas, true, { powerPreference: 'high-performance' }, true);
        // PERF : plafonne le pixel-ratio effectif à 1.5 (au lieu de 2). Sur les écrans
        // Retina/hi-DPI, la scène était rendue jusqu'à 4× les pixels CSS (coût GPU
        // énorme en orbite/édition). À 1.5 : ~44 % de pixels en moins, rendu net.
        this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));

        // 1. Scène (fond sombre + brouillard)
        this.scene = new BABYLON.Scene(this.engine);
        // Repère droitier (fix v3.5.1) : winding natif Babylon + vue identique à Three.
        this.scene.useRightHandedSystem = true;
        this.scene.clearColor = BABYLON.Color4.FromHexString('#0f111aFF');
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.0012;
        this.scene.fogColor = BABYLON.Color3.FromHexString('#0f111a');
        // Groupe de rendu 1 = « toujours au-dessus » (depth buffer effacé avant),
        // utilisé par le curseur pinceau (≈ depthTest:false + renderOrder de Three).
        this.scene.setRenderingAutoClearDepthStencil(1, true);

        // 2. Caméra ArcRotate (≈ PerspectiveCamera + OrbitControls fusionnés)
        this.camera = new BABYLON.ArcRotateCamera('map3dCamera', Math.PI / 2, 0.9, 500, new BABYLON.Vector3(0, 80, 0), this.scene);
        this.camera.fov = 50 * Math.PI / 180; // 50° comme la PerspectiveCamera d'origine
        this.camera.minZ = 0.1;
        this.camera.maxZ = 10000;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.02; // ≈ maxPolarAngle : ne jamais passer sous le sol
        this.camera.lowerRadiusLimit = 1;                // zoom très proche autorisé (le « zoom traversant » pousse ensuite la cible)
        this.camera.inertia = 0.92;                      // ≈ enableDamping + dampingFactor 0.08
        this.camera.panningInertia = 0.92;
        this.camera.attachControl(this.canvas, true);
        // Position initiale identique à la version Three (0, 350, 450) visant (0, 80, 0)
        this.camera.setTarget(new BABYLON.Vector3(0, 80, 0));
        this.camera.setPosition(new BABYLON.Vector3(0, 350, 450));
        // TACHE 1 : tout changement de la vue (drag, inertie, zoom) => un seul rendu.
        // L'observable se déclenche PENDANT scene.render() -> la chaîne « dirty -> render ->
        // dirty (inertie restante) » s'auto-entretient jusqu'à l'arrêt complet de la caméra.
        this.camera.onViewMatrixChangedObservable.add(() => { this._needsRender = true; });

        // 3. Lumières
        // ≈ AmbientLight(0xffffff, 0.45) : hémisphérique uniforme (ciel = sol)
        const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        ambientLight.groundColor = new BABYLON.Color3(1, 1, 1);
        ambientLight.specular = new BABYLON.Color3(0, 0, 0);
        ambientLight.intensity = 0.45;

        // ≈ DirectionalLight(0xfffaed, 0.9) avec ombres adoucies
        const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-300, -600, -400).normalize(), this.scene);
        sunLight.position = new BABYLON.Vector3(300, 600, 400);
        sunLight.diffuse = BABYLON.Color3.FromHexString('#fffaed');
        sunLight.intensity = 0.9;
        // Ombres : ortho caméra ±500 comme la version Three (mapSize 1024, near 50, far 1500)
        sunLight.orthoLeft = -500;
        sunLight.orthoRight = 500;
        sunLight.orthoTop = 500;
        sunLight.orthoBottom = -500;
        sunLight.shadowMinZ = 50;
        sunLight.shadowMaxZ = 1500;
        this._shadowGen = new BABYLON.ShadowGenerator(1024, sunLight);
        this._shadowGen.usePoissonSampling = true; // adoucissement des ombres (≈ PCFSoftShadowMap)
        // v3.6 PERF : la shadow map n'est re-rasterisée QUE quand la géométrie
        // émettrice change (édition, génération, sink). Entre deux éditions,
        // l'orbite caméra ne rejoue plus la passe d'ombre (elle coûtait une
        // rasterisation complète du terrain à 60 FPS).
        {
            const sm = this._shadowGen.getShadowMap();
            if (sm && BABYLON.RenderTargetTexture &&
                BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE !== undefined) {
                sm.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            }
        }

        // Lumière d'appoint d'horizon (bleutée) ≈ HemisphereLight(0x38bdf8, 0x1e293b, 0.35)
        const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.diffuse = BABYLON.Color3.FromHexString('#38bdf8');
        hemiLight.groundColor = BABYLON.Color3.FromHexString('#1e293b');
        hemiLight.specular = new BABYLON.Color3(0, 0, 0);
        hemiLight.intensity = 0.35;

        // 4. ZOOM TRAVERSANT (fix "impossible de continuer à zoomer") :
        // le dolly est multiplicatif autour d'une cible FIXE : près de la cible,
        // chaque cran de molette n'avance presque plus. Ici, quand on zoome en
        // étant déjà proche (radius < 30), on POUSSE la cible vers l'avant le
        // long du regard -> zoom sans fin, identique à la version Three.
        this.canvas.addEventListener('wheel', (e) => {
            if (!this.camera) return;
            this._needsRender = true; // la molette change toujours la vue
            if (e.deltaY >= 0) return; // on ne traite que le zoom AVANT
            const dist = this.camera.radius;
            if (dist < 30) {
                // Avance la cible de ~40% de la distance restante (borné)
                const step = Math.max(2, dist * 0.4);
                const dir = this.camera.target.subtract(this.camera.position).normalize();
                this.camera.target.x += dir.x * step;
                this.camera.target.y += dir.y * step;
                this.camera.target.z += dir.z * step;
                this._needsRender = true;
            }
        }, { passive: true });

        // 5. Curseur Pinceau 3D penché selon la pente (anneau + liseré)
        // VISIBILITE : rendu en groupe 1 (depth effacé => toujours visible,
        // ≈ depthTest:false de Three) + depthWrite désactivé + liseré noir.
        this.brushCursor3D = this._buildRingMesh('brushCursor', 0.72, 1.0, 48, '#10b981', 0.95, 2);
        const ringOutline = this._buildRingMesh('brushCursorOutline', 1.0, 1.12, 48, '#000000', 0.7, 1);
        ringOutline.parent = this.brushCursor3D; // hérite position/orientation/échelle
        this.brushCursor3D.isVisible = false;
        this._cursorHex = '#10b981';

        this.init3DInteractiveEvents();

        // NAVIGATION VOL "classique" (ZQSD/WASD + Espace/Ctrl + Maj) sur la caméra orbite
        this._flyKeys = {};
        this._initFlyControls();

        // 6. Gestion du redimensionnement
        window.addEventListener('resize', () => this.resize());

        this.animate();
    }

    /**
     * Construit un anneau plat (XZ, normales +Y) — équivalent de THREE.RingGeometry
     * pivotée de -90°. alphaIndex = ordre de dessin entre transparents (≈ renderOrder).
     */
    _buildRingMesh(name, inner, outer, segments, colorHex, alpha, alphaIndex) {
        const positions = [];
        const indices = [];
        const normals = [];
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + 1) / segments) * Math.PI * 2;
            const c0 = Math.cos(a0), s0 = Math.sin(a0);
            const c1 = Math.cos(a1), s1 = Math.sin(a1);
            const base = positions.length / 3;
            positions.push(inner * c0, 0, inner * s0,
                           outer * c0, 0, outer * s0,
                           inner * c1, 0, inner * s1,
                           outer * c1, 0, outer * s1);
            indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
            for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
        }
        const mesh = new BABYLON.Mesh(name, this.scene);
        const vd = new BABYLON.VertexData();
        vd.positions = positions;
        vd.normals = normals;
        vd.indices = indices;
        vd.applyToMesh(mesh);
        const mat = new BABYLON.StandardMaterial(name + 'Mat', this.scene);
        mat.disableLighting = true;                 // ≈ MeshBasicMaterial (non éclairé)
        mat.emissiveColor = BABYLON.Color3.FromHexString(colorHex);
        mat.alpha = alpha;
        mat.disableDepthWrite = true;               // ≈ depthWrite:false
        mat.backFaceCulling = false;                // ≈ THREE.DoubleSide
        mesh.material = mat;
        mesh.renderingGroupId = 1;                  // toujours par-dessus le terrain
        mesh.alphaIndex = alphaIndex || 0;
        mesh.isPickable = false;                    // jamais dans le picking du pinceau
        return mesh;
    }

    /** Terrain présent sous la caméra ? (au moins un chunk construit) */
    _hasTerrain() {
        return !!(this._terrainChunks && this._terrainChunks.length);
    }

    /**
     * Prédicat de picking : uniquement les chunks du terrain (+ la surcouche 1:1).
     * v3.6 : Babylon teste d'abord la BOUNDING BOX de chaque mesh candidat — le
     * rayon n'est donc comparé aux triangles que des 1-2 chunks traversés
     * (≈2-8k triangles à tester au lieu de ~260k sur l'ancien mesh unique).
     */
    _pickPredicate(mesh) {
        const md = mesh.metadata;
        if (!md || mesh.isEnabled() === false) return false;
        return md.terrainChunk === true || md.detail === true;
    }

    _pickTerrain(px, py) {
        if (!this.scene || !this.camera || !this._hasTerrain()) return null;
        const pick = this.scene.pick(px, py, (m) => this._pickPredicate(m), false, this.camera);
        if (pick && pick.hit) return pick;
        return null;
    }

    init3DInteractiveEvents() {
        const dom = this.canvas;

        dom.addEventListener('mousemove', (e) => {
            // Un drag (tout bouton) peut changer la vue même hors éditeur (pan/rotate)
            if (e.buttons !== 0) this._needsRender = true;

            if (!window.map2dInstance || window.map2dInstance.activeTab !== 'editor') {
                if (this.brushCursor3D && this.brushCursor3D.isVisible) {
                    this.brushCursor3D.isVisible = false;
                    this._needsRender = true;
                }
                return;
            }

            const rect = dom.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this._lastPointerPx = { x: mx, y: my };

            if (!this._hasTerrain()) return;
            const hit = this._pickTerrain(mx, my);

            if (hit) {
                const point = hit.pickedPoint;
                // Normale de face en monde (≈ hit.face.normal de Three)
                let normal = hit.getNormal(true, false);
                if (!normal) normal = new BABYLON.Vector3(0, 1, 0);
                else normal.normalize();

                this.brushCursor3D.isVisible = true;
                const radiusBlocks = window.map2dInstance.brushRadius || 4;
                const scale = 3.5;
                const worldRadius = radiusBlocks * scale;
                this.brushCursor3D.scaling.copyFromFloats(worldRadius, worldRadius, worldRadius);

                // Position : point + normale * 0.6 (évite le z-fighting avec la surface)
                this.brushCursor3D.position.copyFromFloats(
                    point.x + normal.x * 0.6,
                    point.y + normal.y * 0.6,
                    point.z + normal.z * 0.6
                );
                // Orientation : rotation de +Y vers la normale
                // (≈ quaternion.setFromUnitVectors(up, normal) de Three)
                const dot = Math.max(-1, Math.min(1, normal.y)); // up·normal = normal.y
                if (dot > 0.99999) {
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.Identity();
                } else if (dot < -0.99999) {
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI);
                } else {
                    const axis = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), normal).normalize();
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, Math.acos(dot));
                }
                this._needsRender = true;

                const tool = window.map2dInstance.activeTool;
                let hexColor = '#ffffff';
                if (tool === 'raise') hexColor = '#10b981';
                else if (tool === 'lower') hexColor = '#ef4444';
                else if (tool === 'smooth') hexColor = '#f59e0b';
                else if (tool === 'flatten') hexColor = '#8b5cf6';
                else if (tool === 'sphere' || tool === 'box') hexColor = '#a78bfa';
                else if (tool === 'eraser') hexColor = '#ec4899';
                else if (tool === 'biome') {
                    const bKey = window.map2dInstance.activeBiome || 'plain';
                    hexColor = this.generator.biomes[bKey]?.color || '#ffffff';
                }
                if (hexColor !== this._cursorHex) {
                    this._cursorHex = hexColor;
                    this.brushCursor3D.material.emissiveColor.copyFrom(BABYLON.Color3.FromHexString(hexColor));
                }

                if (this.isPainting3D) {
                    this.applyBrush3D(point, normal, tool, radiusBlocks, window.map2dInstance.brushIntensity || 15, window.map2dInstance.activeBiome || 'plain');
                }
            } else {
                if (this.brushCursor3D.isVisible) this._needsRender = true;
                this.brushCursor3D.isVisible = false;
            }
        });

        const handleDown = (e) => {
            if (e.button === 0 && window.map2dInstance && window.map2dInstance.activeTab === 'editor' && !e.shiftKey && !e.ctrlKey) {
                // La caméra est déjà « muette » en mode éditeur (updateControlsMode :
                // buttons = []) ; on stoppe quand même la propagation par sécurité
                // (≈ EMPÊCHE ORBITCONTROLS DE TOURNER LA CAMÉRA LORS DU CLIC GAUCHE EN ÉDITEUR)
                e.stopPropagation();
                this.isPainting3D = true;
                this.firstClickH3D = null; // capturé au 1er point touché (outil Aplatir)
                this._stampDone3D = false; // nouvelle pose de forme autorisée
                if (this.generator && typeof this.generator.saveStateForUndo === 'function') {
                    this.generator.saveStateForUndo();
                }
                if (this.brushCursor3D && this.brushCursor3D.isVisible && this._lastPointerPx) {
                    const hit = this._pickTerrain(this._lastPointerPx.x, this._lastPointerPx.y);
                    if (hit) {
                        let n = hit.getNormal(true, false);
                        if (!n) n = new BABYLON.Vector3(0, 1, 0); else n.normalize();
                        this.applyBrush3D(hit.pickedPoint, n, window.map2dInstance.activeTool, window.map2dInstance.brushRadius || 4, window.map2dInstance.brushIntensity || 15, window.map2dInstance.activeBiome || 'plain');
                    }
                }
            }
        };
        dom.addEventListener('pointerdown', handleDown, { capture: true });
        dom.addEventListener('mousedown', handleDown, { capture: true });

        const handleUp = (e) => {
            if (this.isPainting3D) {
                this.isPainting3D = false;
                this.firstClickH3D = null;
                this.updateTerrain();
                if (window.map2dInstance) window.map2dInstance.render();
                if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
            }
        };
        window.addEventListener('pointerup', handleUp, { capture: true });
        window.addEventListener('mouseup', handleUp, { capture: true });
    }

    applyBrush3D(point, normal, tool, radius, intensity, activeBiome) {
        if (!this.generator || !this.generator.grid || !this.generator.grid.length) return;
        const grid = this.generator.grid;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;
        const scale = 3.5;
        const halfSizeX = (resX * scale) / 2;
        const halfSizeZ = (resZ * scale) / 2;

        const centerGx = Math.floor((point.x + halfSizeX) / scale);
        const centerGz = Math.floor((point.z + halfSizeZ) / scale);

        // TAMPONS 3D : sphère / pavé posés une fois par clic
        if (tool === 'sphere' || tool === 'box') {
            if (this._stampDone3D) return;
            this._stampDone3D = true;
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 16, d: 16, h: 20, paintBiome: true };
            const ok = this.generator.applyStamp(centerGx, centerGz, tool, p.w, p.d, p.h, p.paintBiome ? activeBiome : null);
            if (ok) {
                // p.w/p.d sont en blocs : la zone modifiée réelle est lastBrushRegion (cellules)
                const reg = this.generator.lastBrushRegion || { gxMin: centerGx - 2, gxMax: centerGx + 2, gzMin: centerGz - 2, gzMax: centerGz + 2 };
                this.updateTerrainRegion(reg.gxMin - 1, reg.gxMax + 1, reg.gzMin - 1, reg.gzMax + 1);
                if (window.map2dInstance) {
                    if (typeof window.map2dInstance.requestRender === 'function') window.map2dInstance.requestRender();
                    else window.map2dInstance.render();
                }
            }
            return;
        }

        // Outil Aplatir : mémorise la hauteur du tout premier point touché du geste
        if (tool === 'flatten' && (this.firstClickH3D === null || this.firstClickH3D === undefined)) {
            if (centerGx >= 0 && centerGx < resX && centerGz >= 0 && centerGz < resZ && grid[centerGx] && grid[centerGx][centerGz]) {
                this.firstClickH3D = grid[centerGx][centerGz].height;
            }
        }

        let modified = false;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                let dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) continue;

                let gx = centerGx + dx;
                let gz = centerGz + dz;
                if (gx < 0 || gx >= resX || gz < 0 || gz >= resZ) continue;

                let cell = grid[gx][gz];
                let falloff = 1.0 - (dist / (radius + 1));

                let slopeBonus = 1.0;
                if (radius > 0 && normal) {
                    slopeBonus = 1.0 + ((dx * normal.x + dz * normal.z) / radius) * 0.75;
                }
                let step = intensity * falloff * 0.5 * Math.max(0.3, slopeBonus);

                if (tool === 'raise') {
                    cell.height = Math.min(this.generator.config.maxHeight, cell.height + step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'lower') {
                    cell.height = Math.max(this.generator.config.minHeight, cell.height - step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'flatten' && this.firstClickH3D !== null && this.firstClickH3D !== undefined) {
                    // v3.1 : mode 100% = niveau exact (voir generator.applyBrush)
                    cell.height = this.generator.config.flattenExact
                        ? Math.round(this.firstClickH3D)
                        : cell.height + (this.firstClickH3D - cell.height) * falloff;
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'biome') {
                    // REGLE PRIORITAIRE : respecter les règles de hauteur verrouillées
                    const lockedBy = this.generator.isBiomePaintBlocked ? this.generator.isBiomePaintBlocked(cell.height) : null;
                    if (lockedBy && lockedBy !== activeBiome) continue;
                    cell.biome = activeBiome;
                    cell.isCustomBiome = true;
                    modified = true;
                } else if (tool === 'eraser') {
                    let procH = this.generator.fbmTerrain(cell.worldX, cell.worldZ);
                    procH = Math.round(Math.max(this.generator.config.minHeight, Math.min(this.generator.config.maxHeight, procH)));
                    cell.height = procH;
                    cell.biome = this.generator.assignBiomeProcedural(procH, cell.worldX, cell.worldZ);
                    cell.isCustomHeight = false;
                    cell.isCustomBiome = false;
                    modified = true;
                    if (this.generator.removeCustomEdit) this.generator.removeCustomEdit(cell.worldX, cell.worldZ);
                }

                if (tool !== 'eraser' && modified) {
                    if (this.generator.setCustomEdit) this.generator.setCustomEdit(cell.worldX, cell.worldZ, cell.isCustomHeight ? cell.height : null, cell.isCustomBiome ? cell.biome : null);
                }
            }
        }

        if (tool === 'smooth') {
            let tempH = [];
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                tempH[gx] = [];
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let sum = 0, cnt = 0;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let nz = -1; nz <= 1; nz++) {
                            let mx = gx + nx, mz = gz + nz;
                            if (mx >= 0 && mx < resX && mz >= 0 && mz < resZ) {
                                sum += grid[mx][mz].height;
                                cnt++;
                            }
                        }
                    }
                    tempH[gx][gz] = sum / cnt;
                }
            }
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let dist = Math.sqrt((gx - centerGx) ** 2 + (gz - centerGz) ** 2);
                    if (dist <= radius) {
                        let cell = grid[gx][gz];
                        cell.height = Math.round(tempH[gx][gz]);
                        cell.isCustomHeight = true;
                        modified = true;
                        if (this.generator.setCustomEdit) this.generator.setCustomEdit(cell.worldX, cell.worldZ, cell.height, cell.isCustomBiome ? cell.biome : null);
                    }
                }
            }
        }

        if (modified) {
            // FIX v3.0 : le pinceau 3D invalide le cache des chunks 1:1 (comme
            // le pinceau 2D), sinon la surcouche se rechargeait depuis le cache périmé.
            const metaW = this.generator.currentGridMeta;
            if (metaW && this.generator.invalidateDetailChunksInRegion &&
                this.generator._detailChunks && this.generator._detailChunks.size) {
                const wx0 = metaW.startWorldX + (centerGx - radius) * metaW.stepX;
                const wx1 = metaW.startWorldX + (centerGx + radius + 1) * metaW.stepX;
                const wz0 = metaW.startWorldZ + (centerGz - radius) * metaW.stepZ;
                const wz1 = metaW.startWorldZ + (centerGz + radius + 1) * metaW.stepZ;
                this.generator.invalidateDetailChunksInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
                if (this.clearDetailOverlayInRegion) this.clearDetailOverlayInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
            if (!this._lastPaint3DTime || Date.now() - this._lastPaint3DTime > 45) {
                this._lastPaint3DTime = Date.now();
                // v3.6 : chemin chunkisé (rebuild des seuls chunks touchés,
                // smooth ET voxel — plus de fallback « rebuild complet »).
                // +1 : l'outil smooth lit les voisins immédiats de la zone.
                this.updateTerrainRegion(centerGx - radius - 1, centerGx + radius + 1,
                                         centerGz - radius - 1, centerGz + radius + 1);
                if (window.map2dInstance) {
                    if (typeof window.map2dInstance.requestRender === 'function') window.map2dInstance.requestRender();
                    else window.map2dInstance.render();
                }
            }
        }
    }

    /**
     * Gère le redimensionnement du conteneur parent (≈ renderer.setSize + camera.aspect)
     */
    resize() {
        if (!this.container || !this.engine || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.engine.resize(); // Babylon recalcule taille du buffer + ratio caméra
        this._needsRender = true;
    }

    /**
     * Réinitialise la caméra 3D vers une vue isométrique globale
     */
    resetCamera() {
        if (!this.camera) return;
        const extent = this.generator.config.gridResolution * 2.5;
        this.camera.setTarget(new BABYLON.Vector3(0, this.generator.config.baseY || 80, 0));
        // ArcRotateCamera.setPosition : recalcule alpha/beta/radius depuis la position voulue
        this.camera.setPosition(new BABYLON.Vector3(0, extent * 0.95, extent * 1.1));
        this._needsRender = true;
    }

    /* ============================================================
       COULEURS (v3.6 : zéro allocation au hot-path)
       _biomeRGB : cache hex -> {r,g,b} ; getCellColor écrit dans `out`.
       Avant : 2 à 4 « new BABYLON.Color3 » PAR SOMMET à chaque rebuild
       (65 536 sommets → ~200 000 objets temporaires -> pics de GC).
       ============================================================ */
    _biomeRGB(hex) {
        let c = this._biomeRGBCache.get(hex);
        if (c) return c;
        let r = 0x4a / 255, g = 0xde / 255, b = 0x80 / 255; // '#4ade80' par défaut
        if (typeof hex === 'string' && hex.length === 7 && hex.charCodeAt(0) === 35) {
            const n = parseInt(hex.slice(1), 16);
            if (!isNaN(n)) {
                r = ((n >> 16) & 255) / 255;
                g = ((n >> 8) & 255) / 255;
                b = (n & 255) / 255;
            }
        }
        c = { r: r, g: g, b: b };
        this._biomeRGBCache.set(hex, c);
        return c;
    }

    /**
     * Couleur du biome d'une cellule (avec ombrage selon la hauteur), écrite
     * dans `out` {r,g,b} (ou dans un nouvel objet si non fourni — compat API).
     * GRADIENT DE BIOMES : si grid/gx/gz sont fournis et qu'un voisin (rayon 2)
     * a un biome différent, les couleurs sont mélangées (moyenne pondérée par
     * la distance) — transition progressive identique à la carte 2D.
     */
    getCellColor(cell, grid, gx, gz, out) {
        out = out || { r: 0, g: 0, b: 0 };
        const sea = (this.generator && this.generator.config) ? this.generator.config.seaLevel : -Infinity;
        const biomeObj = (this.generator && this.generator.biomes && this.generator.biomes[cell.biome]) || null;
        const base = this._biomeRGB(biomeObj ? biomeObj.color : '#4ade80');
        out.r = base.r; out.g = base.g; out.b = base.b;

        // Pas de mélange de biomes sous l'eau → sable pur (pas de vert qui bave).
        if (cell.height > sea && grid && gx !== undefined && gz !== undefined) {
            const resX = grid.length, resZ = grid[0] ? grid[0].length : 0;
            let hasDiff = false;
            for (let dx = -1; dx <= 1 && !hasDiff; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const nx = gx + dx, nz = gz + dz;
                    if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                    if (grid[nx][nz].biome !== cell.biome) { hasDiff = true; break; }
                }
            }
            if (hasDiff) {
                const R = 2;
                let r = 0, g = 0, b = 0, wSum = 0;
                for (let dx = -R; dx <= R; dx++) {
                    for (let dz = -R; dz <= R; dz++) {
                        const nx = gx + dx, nz = gz + dz;
                        if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                        const d = Math.sqrt(dx * dx + dz * dz);
                        if (d > R) continue;
                        const w = 1 / (1 + d * d);
                        const nc = this._biomeRGB((this.generator.biomes[grid[nx][nz].biome] || {}).color || '#4ade80');
                        r += nc.r * w; g += nc.g * w; b += nc.b * w; wSum += w;
                    }
                }
                out.r = r / wSum; out.g = g / wSum; out.b = b / wSum;
            }
        }

        const maxH = Math.max(1, (this.generator && this.generator.config && this.generator.config.maxHeight) || 400);
        const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, cell.height / maxH));
        out.r *= shade; out.g *= shade; out.b *= shade;
        // MASQUE DE FORME : les cellules hors-forme ne sont pas dessinées
        if (this.generator && this.generator.shapeMask && !this.generator.isInShape(gx, gz)) {
            out.r = -1; out.g = -1; out.b = -1; // signal "skip"
        }
        return out;
    }

    /* ============================================================
       TERRAIN CHUNKISÉ (v3.6)
       Le terrain de base est découpé en chunks de _chunkCells² cellules,
       chacun = 1 mesh Babylon avec sa propre bounding box :
       - frustum culling par chunk (automatique)
       - picking précis accéléré par les bbox
       - updateTerrainRegion = rebuild des seuls chunks intersectés
       Ratio connu (surcoût mémoire négligeable) : les sommets de bordure
       sont dupliqués entre chunks voisins en mode lisse (quads, eux, ne
       sont JAMAIS dupliqués -> aucune surface n'est dessinée deux fois,
       donc aucun z-fighting introduit).
       ============================================================ */

    _getTerrainMaterial() {
        if (!this._terrainMaterial) {
            const material = new BABYLON.StandardMaterial('terrainMat', this.scene);
            material.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03); // ≈ roughness 0.8 (quasi mat)
            material.specularPower = 64;
            // v3.6 : matériau jamais modifié après création -> figé (Babylon saute
            // toutes les vérifications de dirty-check par frame et par mesh).
            material.freeze();
            this._terrainMaterial = material;
        }
        return this._terrainMaterial;
    }

    /**
     * Géométrie LISSE d'un chunk : sous-grille de sommets partagés.
     * entry.x0..x1 / z0..z1 = plage de SOMMETS (incluse) ; les quads couverts
     * sont [x0..x1-1] × [z0..z1-1] et partitionnent exactement la carte.
     * Les NORMALES sont calculées avec un « anneau fantôme » d'1 cellule tout
     * autour (mêmes contributions de faces que sur le mesh global) -> aucune
     * couture d'éclairage aux frontières de chunks.
     */
    _buildSmoothChunkGeometry(entry, grid, resX, resZ, scale, halfSizeX, halfSizeZ) {
        const x0 = entry.x0, x1 = entry.x1, z0 = entry.z0, z1 = entry.z1;
        const nx = x1 - x0 + 1, nz = z1 - z0 + 1;
        const positions = new Float32Array(nx * nz * 3);
        const colors = new Float32Array(nx * nz * 3);
        // (resX-1)² quads au global ; ici ceux du chunk
        const indices = new Uint32Array((x1 - x0) * (z1 - z0) * 6);
        const col = this._colScratch;

        for (let vx = x0; vx <= x1; vx++) {
            const row = grid[vx];
            const lx = vx - x0;
            for (let vz = z0; vz <= z1; vz++) {
                const cell = row[vz];
                const i = (lx * nz + (vz - z0)) * 3;
                positions[i] = vx * scale - halfSizeX;
                positions[i + 1] = cell.height;
                positions[i + 2] = vz * scale - halfSizeZ;
                this.getCellColor(cell, grid, vx, vz, col);
                if (col.r < 0) { positions[i+1] = -99999; } // hors forme → sous le sol
                colors[i] = Math.max(0, col.r); colors[i + 1] = Math.max(0, col.g); colors[i + 2] = Math.max(0, col.b);
            }
        }

        let ii = 0;
        for (let qx = x0; qx < x1; qx++) {
            for (let qz = z0; qz < z1; qz++) {
                const a = (qx - x0) * nz + (qz - z0);
                const b = (qx + 1 - x0) * nz + (qz - z0);
                const c = (qx + 1 - x0) * nz + (qz + 1 - z0);
                const d = (qx - x0) * nz + (qz + 1 - z0);
                // FIX v3.5.2 : winding natif Babylon (CW)
                indices[ii++] = a; indices[ii++] = b; indices[ii++] = d;
                indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
            }
        }

        // ---- Normales AVEC anneau fantôme (bordures identiques au mesh global) ----
        const ex0 = Math.max(0, x0 - 1), ex1 = Math.min(resX - 1, x1 + 1);
        const ez0 = Math.max(0, z0 - 1), ez1 = Math.min(resZ - 1, z1 + 1);
        const enx = ex1 - ex0 + 1, enz = ez1 - ez0 + 1;
        const extPos = new Float32Array(enx * enz * 3);
        for (let vx = ex0; vx <= ex1; vx++) {
            const row = grid[vx];
            const lx = vx - ex0;
            for (let vz = ez0; vz <= ez1; vz++) {
                const i = (lx * enz + (vz - ez0)) * 3;
                extPos[i] = vx * scale - halfSizeX;
                extPos[i + 1] = row[vz].height;
                extPos[i + 2] = vz * scale - halfSizeZ;
            }
        }
        // quads fantômes : tous ceux ayant ≥1 sommet dans le chunk = [ex0..ex1-1]×[ez0..ez1-1]
        const extIdx = new Uint32Array((ex1 - ex0) * (ez1 - ez0) * 6);
        let ei = 0;
        for (let qx = ex0; qx < ex1; qx++) {
            for (let qz = ez0; qz < ez1; qz++) {
                const a = (qx - ex0) * enz + (qz - ez0);
                const b = (qx + 1 - ex0) * enz + (qz - ez0);
                const c = (qx + 1 - ex0) * enz + (qz + 1 - ez0);
                const d = (qx - ex0) * enz + (qz + 1 - ez0);
                extIdx[ei++] = a; extIdx[ei++] = b; extIdx[ei++] = d;
                extIdx[ei++] = b; extIdx[ei++] = c; extIdx[ei++] = d;
            }
        }
        const extN = this._computeVertexNormals(extPos, extIdx, null);
        // copie des normales des VRAIS sommets depuis la grille étendue
        const normals = new Float32Array(nx * nz * 3);
        for (let vx = x0; vx <= x1; vx++) {
            for (let vz = z0; vz <= z1; vz++) {
                const dst = ((vx - x0) * nz + (vz - z0)) * 3;
                const src = ((vx - ex0) * enz + (vz - ez0)) * 3;
                normals[dst] = extN[src]; normals[dst + 1] = extN[src + 1]; normals[dst + 2] = extN[src + 2];
            }
        }

        return { positions, colors, indices, normals };
    }

    /**
     * Géométrie VOXEL d'un chunk : dessus plat par cellule + jupes verticales
     * vers les voisins plus bas (lues dans la grille GLOBALE -> aucune jupe
     * manquante aux frontières de chunks, aucune face interne inutile émise).
     *
     * v3.6 PERF — ce builder a été mesuré comme le point chaud du pinceau voxel :
     *  1) DEUX PASSES : la 1re compte exactement les quads -> Float32Array
     *     dimensionnés pile (avant : ~500 000 push() + conversions par rebuild) ;
     *  2) NORMALES ANALYTIQUES écrites à l'émission (plateau = +Y, jupes =
     *     ±X/±Z, vérifié par le calcul du produit vectoriel miroir) : on saute
     *     complètement l'accumulation _computeVertexNormals sur ~30k sommets ;
     *  3) indices DÉTERMINISTES (chaque quad émet 6 sommets non partagés dans
     *     le même ordre) remplis en O(n) sans lecture de géométrie.
     * Le résultat binaire est strictement identique à l'ancien chemin.
     */
    _buildVoxelChunkGeometry(entry, grid, resX, resZ, scale, halfSizeX, halfSizeZ) {
        const col = this._colScratch, side = this._sideScratch;

        // ---- PASSE 1 : comptage exact (mêmes conditions qu'à l'émission) ----
        let quadCount = 0;
        for (let gx = entry.x0; gx < entry.x1; gx++) {
            const row = grid[gx];
            for (let gz = entry.z0; gz < entry.z1; gz++) {
                const h = row[gz].height;
                quadCount++; // dessus
                if (gx + 1 < resX && grid[gx + 1][gz].height < h) quadCount++;
                if (gx - 1 >= 0 && grid[gx - 1][gz].height < h) quadCount++;
                if (gz + 1 < resZ && grid[gx][gz + 1].height < h) quadCount++;
                if (gz - 1 >= 0 && grid[gx][gz - 1].height < h) quadCount++;
            }
        }
        const positions = new Float32Array(quadCount * 18);
        const colors = new Float32Array(quadCount * 18);
        const normals = new Float32Array(quadCount * 18);
        const indices = new Uint32Array(quadCount * 6);
        const cellRanges = new Map(); // 'gx,gz' -> {s, e} (offsets float locaux, pour le sink)

        // Indices déterministes : quad q -> triangles (v0,v2,v1) et (v0,v3,v2)
        // (FIX v3.5.2 : winding natif Babylon), base = 6q.
        for (let q = 0, o = 0; q < quadCount; q++) {
            const base = q * 6;
            indices[o++] = base;     indices[o++] = base + 2; indices[o++] = base + 1;
            indices[o++] = base + 3; indices[o++] = base + 5; indices[o++] = base + 4;
        }

        let p = 0; // curseur float (positions/colors/normales partagent le même layout)
        const emitQuad = (v0, v1, v2, v3, nx, ny, nz, cr, cg, cb) => {
            let o = p;
            positions[o]     = v0[0]; positions[o + 1]  = v0[1]; positions[o + 2]  = v0[2];
            positions[o + 3] = v1[0]; positions[o + 4]  = v1[1]; positions[o + 5]  = v1[2];
            positions[o + 6] = v2[0]; positions[o + 7]  = v2[1]; positions[o + 8]  = v2[2];
            positions[o + 9]  = v0[0]; positions[o + 10] = v0[1]; positions[o + 11] = v0[2];
            positions[o + 12] = v2[0]; positions[o + 13] = v2[1]; positions[o + 14] = v2[2];
            positions[o + 15] = v3[0]; positions[o + 16] = v3[1]; positions[o + 17] = v3[2];
            for (let k = 0; k < 6; k++) {
                const n3 = o + k * 3;
                normals[n3] = nx; normals[n3 + 1] = ny; normals[n3 + 2] = nz;
                colors[n3] = cr; colors[n3 + 1] = cg; colors[n3 + 2] = cb;
            }
            p += 18;
        };

        for (let gx = entry.x0; gx < entry.x1; gx++) {
            const row = grid[gx];
            for (let gz = entry.z0; gz < entry.z1; gz++) {
                const cell = row[gz];
                const _cellStart = p;
                const h = cell.height;
                const x0w = gx * scale - halfSizeX;
                const x1w = x0w + scale;
                const z0w = gz * scale - halfSizeZ;
                const z1w = z0w + scale;
                this.getCellColor(cell, grid, gx, gz, col);
                if (col.r < 0) continue; // hors forme → cellule invisible
                side.r = col.r * 0.78; side.g = col.g * 0.78; side.b = col.b * 0.78;

                // Face du dessus (plateau plat) — normale analytique +Y
                emitQuad([x0w, h, z0w], [x0w, h, z1w], [x1w, h, z1w], [x1w, h, z0w],
                         0, 1, 0, col.r, col.g, col.b);

                // Jupes verticales UNIQUEMENT vers un voisin PLUS BAS
                // (faces cachées entre cellules = jamais générées)
                if (gx + 1 < resX) {
                    const nh = grid[gx + 1][gz].height;
                    if (nh < h) emitQuad([x1w, h, z0w], [x1w, h, z1w], [x1w, nh, z1w], [x1w, nh, z0w],
                                         1, 0, 0, side.r, side.g, side.b); // normale +X (vérifié)
                }
                if (gx - 1 >= 0) {
                    const nh = grid[gx - 1][gz].height;
                    if (nh < h) emitQuad([x0w, h, z1w], [x0w, h, z0w], [x0w, nh, z0w], [x0w, nh, z1w],
                                         -1, 0, 0, side.r, side.g, side.b); // normale -X (vérifié)
                }
                if (gz + 1 < resZ) {
                    const nh = grid[gx][gz + 1].height;
                    if (nh < h) emitQuad([x1w, h, z1w], [x0w, h, z1w], [x0w, nh, z1w], [x1w, nh, z1w],
                                         0, 0, 1, side.r, side.g, side.b); // normale +Z (vérifié)
                }
                if (gz - 1 >= 0) {
                    const nh = grid[gx][gz - 1].height;
                    if (nh < h) emitQuad([x0w, h, z0w], [x1w, h, z0w], [x1w, nh, z0w], [x0w, nh, z0w],
                                         0, 0, -1, side.r, side.g, side.b); // normale -Z (vérifié)
                }
                cellRanges.set(gx + ',' + gz, { s: _cellStart, e: p });
            }
        }

        return { positions, colors, indices, normals, cellRanges };
    }

    /**
     * Calcul des normales par accumulation de faces avec le produit vectoriel
     * MIROIR (adapté au winding natif Babylon depuis le fix v3.5.2).
     * Résultat numérique IDENTIQUE à la version Three pour les mêmes sommets.
     */
    _computeVertexNormals(positions, indices, normals) {
        const n = normals || new Float32Array(positions.length);
        for (let i = 0; i < n.length; i++) n[i] = 0;
        for (let t = 0; t < indices.length; t += 3) {
            const i0 = indices[t] * 3, i1 = indices[t + 1] * 3, i2 = indices[t + 2] * 3;
            const ax = positions[i0], ay = positions[i0 + 1], az = positions[i0 + 2];
            const bx = positions[i1], by = positions[i1 + 1], bz = positions[i1 + 2];
            const cx = positions[i2], cy = positions[i2 + 1], cz = positions[i2 + 2];
            const cbx = cx - bx, cby = cy - by, cbz = cz - bz;
            const abx = ax - bx, aby = ay - by, abz = az - bz;
            const nx = aby * cbz - abz * cby;   // n = ab × cb (miroir du cb × ab de Three)
            const ny = abz * cbx - abx * cbz;
            const nz = abx * cby - aby * cbx;
            n[i0] += nx; n[i0 + 1] += ny; n[i0 + 2] += nz;
            n[i1] += nx; n[i1 + 1] += ny; n[i1 + 2] += nz;
            n[i2] += nx; n[i2 + 1] += ny; n[i2 + 2] += nz;
        }
        for (let i = 0; i < n.length; i += 3) {
            const l = Math.sqrt(n[i] * n[i] + n[i + 1] * n[i + 1] + n[i + 2] * n[i + 2]) || 1;
            n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
        }
        return n;
    }

    /** Ré-arme la passe d'ombre (render-once) après un changement de géométrie. */
    _requestShadowRefresh() {
        if (!this._shadowGen) return;
        const sm = this._shadowGen.getShadowMap();
        if (sm && typeof sm.resetRefreshCounter === 'function') sm.resetRefreshCounter();
    }

    /** Construit (ou reconstruit) LE mesh d'un chunk à partir de la grille vivante. */
    _buildChunkEntry(entry) {
        const grid = this.generator.grid;
        const meta = this._geomMeta;
        const isVoxel = meta.meshType === 'voxel';

        // 1. Géométrie CPU
        const data = isVoxel
            ? this._buildVoxelChunkGeometry(entry, grid, meta.resX, meta.resZ, meta.scale, meta.halfSizeX, meta.halfSizeZ)
            : this._buildSmoothChunkGeometry(entry, grid, meta.resX, meta.resZ, meta.scale, meta.halfSizeX, meta.halfSizeZ);
        entry.positions = data.positions;
        entry.colors = data.colors;
        entry.indices = data.indices;
        entry.normals = data.normals;

        // 2. Ancien mesh -> poubelle
        this._disposeChunkMeshEntry(entry, true);

        // 3. Mesh Babylon (buffers updatable : le sink voxel réécrit les Y en place)
        const mesh = new BABYLON.Mesh('terrainChunk_' + entry.cx + '_' + entry.cz, this.scene);
        const vd = new BABYLON.VertexData();
        vd.positions = data.positions;
        vd.colors = data.colors;
        vd.indices = data.indices;
        vd.normals = data.normals;
        vd.applyToMesh(mesh, true);
        mesh.material = this._getTerrainMaterial(); // partagé + figé
        mesh.receiveShadows = true;
        mesh.isPickable = true;
        mesh.metadata = { terrainChunk: true };
        mesh.refreshBoundingInfo(true);             // picking précis dès maintenant
        mesh.freezeWorldMatrix();                   // transform identité à tout jamais
        if (this._shadowGen) this._shadowGen.getShadowMap().renderList.push(mesh);
        entry.mesh = mesh;
        entry.built = true;
        this._dbg.chunkBuilds++;

        // 4. Wireframe optionnel (arrays partagées comme avant)
        if (this.showWireframe) {
            const wire = new BABYLON.Mesh('terrainChunkWire_' + entry.cx + '_' + entry.cz, this.scene);
            const wvd = new BABYLON.VertexData();
            wvd.positions = data.positions;
            wvd.indices = data.indices;
            wvd.normals = data.normals;
            wvd.applyToMesh(wire, true);
            if (!this._wireMaterial) {
                const wireMat = new BABYLON.StandardMaterial('terrainWireMat', this.scene);
                wireMat.wireframe = true;
                wireMat.disableLighting = true;
                wireMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                wireMat.alpha = 0.15;
                wireMat.freeze();
                this._wireMaterial = wireMat;
            }
            wire.material = this._wireMaterial;
            wire.isPickable = false;
            wire.freezeWorldMatrix();
            entry.wire = wire;
        }

        // 5. Sink (voxel) : les buffers neufs ont des hauteurs FRAÎCHES -> les
        // entrées sunk de ce chunk sont périmées, on les purge (re-synchronisé
        // juste après par _syncCoarseSink si la surcouche est toujours active).
        if (this._sunkCells && this._sunkCells.size) {
            const dead = [];
            this._sunkCells.forEach((v, k) => { if (v.cx === entry.cx && v.cz === entry.cz) dead.push(k); });
            for (let i = 0; i < dead.length; i++) this._sunkCells.delete(dead[i]);
        }
        if (entry.sunkFull) { entry.sunkFull = false; mesh.setEnabled(true); }

        // 6. Plages de cellules voxel (sink par cellule) -> fusion dans la Map globale
        if (isVoxel && data.cellRanges) {
            if (entry.rangeKeys) {
                for (let i = 0; i < entry.rangeKeys.length; i++) this._cellRanges.delete(entry.rangeKeys[i]);
            }
            const keys = [];
            data.cellRanges.forEach((range, key) => {
                this._cellRanges.set(key, { entry: entry, s: range.s, e: range.e });
                keys.push(key);
            });
            entry.rangeKeys = keys;
        }

        this._requestShadowRefresh();
        this._needsRender = true;
    }

    /** Détruit le mesh d'un chunk (géométrie comprise) + son wireframe éventuel. */
    _disposeChunkMeshEntry(entry, keepBuffers) {
        if (entry.wire) { entry.wire.dispose(); entry.wire = null; }
        if (entry.mesh) {
            if (this._shadowGen) {
                const rl = this._shadowGen.getShadowMap().renderList;
                const i = rl.indexOf(entry.mesh);
                if (i >= 0) rl.splice(i, 1);
            }
            entry.mesh.dispose(); // dispose aussi la géométrie
            entry.mesh = null;
        }
        if (!keepBuffers) {
            entry.positions = entry.colors = entry.indices = entry.normals = null;
        }
    }

    _disposeTerrainMeshes() {
        this._chunkBuildQueue = [];
        if (this._terrainChunks) {
            for (let i = 0; i < this._terrainChunks.length; i++) {
                this._disposeChunkMeshEntry(this._terrainChunks[i], false);
            }
        }
        this._terrainChunks = [];
        this._chunkIndex = new Map();
        this._cellRanges = new Map();
        this._sunkCells = new Map();
        // la surcouche 1:1 est bâtie au-dessus du terrain -> périmée elle aussi
        this.clearDetailOverlay();
    }

    /**
     * Budget de construction par frame (~7 ms par défaut) : les chunks de la
     * file sont construits progressivement, sans jamais geler l'interface.
     */
    _processChunkBuildQueue(budgetMs) {
        if (!this._chunkBuildQueue || this._chunkBuildQueue.length === 0) return;
        const budget = budgetMs === undefined ? 7 : budgetMs;
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const now = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
        let built = 0;
        while (this._chunkBuildQueue.length) {
            const entry = this._chunkBuildQueue[0];
            // obsolète (re-génération entre-temps) ou déjà construit -> on saute
            if (!entry || entry.built || this._chunkIndex.get(entry.cx + ',' + entry.cz) !== entry) {
                this._chunkBuildQueue.shift();
                continue;
            }
            if (built > 0 && now() - t0 >= budget) break;
            this._chunkBuildQueue.shift();
            this._buildChunkEntry(entry);
            built++;
            if (now() - t0 >= 16) break; // garde-fou absolu, même si chaque chunk est lent
        }
        if (this._chunkBuildQueue.length === 0) this._syncCoarseSink();
        this._needsRender = true;
    }

    /** Vide la file immédiatement (tests headless, exports synchrones). */
    _flushChunkBuilds() {
        let guard = 100000;
        while (this._chunkBuildQueue && this._chunkBuildQueue.length && guard-- > 0) {
            this._processChunkBuildQueue(1e12);
        }
    }

    updateTerrain() {
        if (!this.scene || !this.generator.grid || this.generator.grid.length === 0) return;
        // VUE UNIQUE : ne pas reconstruire un mesh invisible (vue 2D affichée).
        // Le rebuild est rattrapé au basculement vers la 3D (voir ui.js switchView).
        if (this.container && this.container.offsetParent === null) {
            this._terrainDirty = true;
            return;
        }
        this._terrainDirty = false;

        // Nettoyage de l'ancien terrain chunkisé
        this._disposeTerrainMeshes();
        if (this.waterMesh) {
            this.waterMesh.material.dispose();
            this.waterMesh.dispose();
            this.waterMesh = null;
        }

        const grid = this.generator.grid;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;
        const scale = 3.5; // Facteur d'échelle pour un bon rendu dans l'espace 3D
        const halfSizeX = (resX * scale) / 2;
        const halfSizeZ = (resZ * scale) / 2;
        const isVoxel = this.generator.config.meshType === 'voxel';

        // Meta de layout : invalide la maj partielle si la grille change
        this._geomMeta = {
            resX: resX, resZ: resZ, scale: scale,
            halfSizeX: halfSizeX, halfSizeZ: halfSizeZ,
            meshType: this.generator.config.meshType
        };

        // ---- Découpage en chunks ----
        // lisse : les chunks partitionnent les QUADS (resX-1) avec sommets de bord
        // partagés (plage inclusive x0..x1) ; voxel : les chunks partitionnent les
        // CELLULES (resX), jupes lues dans la grille globale.
        const CS = this._chunkCells | 0 || 32;
        const spanX = isVoxel ? resX : resX - 1;
        const spanZ = isVoxel ? resZ : resZ - 1;
        const ncx = Math.max(1, Math.ceil(spanX / CS));
        const ncz = Math.max(1, Math.ceil(spanZ / CS));
        const entries = [];
        for (let cx = 0; cx < ncx; cx++) {
            for (let cz = 0; cz < ncz; cz++) {
                const x0 = cx * CS, z0 = cz * CS;
                const x1 = isVoxel ? Math.min((cx + 1) * CS, resX) : Math.min((cx + 1) * CS, resX - 1);
                const z1 = isVoxel ? Math.min((cz + 1) * CS, resZ) : Math.min((cz + 1) * CS, resZ - 1);
                if (x1 <= x0 || z1 <= z0) continue;
                const entry = {
                    cx: cx, cz: cz, x0: x0, x1: x1, z0: z0, z1: z1,
                    mesh: null, wire: null, built: false, sunkFull: false,
                    positions: null, colors: null, indices: null, normals: null
                };
                entries.push(entry);
                this._chunkIndex.set(cx + ',' + cz, entry);
            }
        }
        this._terrainChunks = entries;

        // PRIORITÉ AU POINT REGARDÉ : construction triée par distance chunk -> cible
        // caméra (« charger autour du regard/du curseur »). La file est ensuite
        // consommée par budget de ~7 ms/frame dans animate().
        {
            const cam = this.camera;
            const tx = cam ? cam.target.x : 0, tz = cam ? cam.target.z : 0;
            for (let i = 0; i < entries.length; i++) {
                const e = entries[i];
                const wx = ((e.x0 + e.x1) / 2) * scale - halfSizeX;
                const wz = ((e.z0 + e.z1) / 2) * scale - halfSizeZ;
                e._prio = (wx - tx) * (wx - tx) + (wz - tz) * (wz - tz);
            }
            entries.sort((a, b) => a._prio - b._prio);
        }
        this._chunkBuildQueue = entries.slice();
        // Burst synchrone initial (~8 ms) : le centre de l'écran apparaît
        // immédiatement, la périphérie suit en quelques frames.
        this._processChunkBuildQueue(8);

        // Plan d'eau (CreateGround, déjà à plat en XZ)
        if (this.generator.config.showWater) {
            const waterGeom = BABYLON.MeshBuilder.CreateGround('water', {
                width: resX * scale,
                height: resZ * scale,
                subdivisions: 1,
                updatable: false
            }, this.scene);
            const waterMat = new BABYLON.StandardMaterial('waterMat', this.scene);
            waterMat.diffuseColor = BABYLON.Color3.FromHexString('#0ea5e9');
            waterMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.25); // reflets légers
            waterMat.alpha = 0.65; // ≈ transparent+opacity (blending auto quand alpha < 1)
            // Plan natif Babylon : double-face par sécurité (coût nul, 2 triangles).
            waterMat.backFaceCulling = false;
            waterMat.freeze(); // jamais modifié ensuite
            waterGeom.material = waterMat;
            // +0.35 : évite le z-fighting avec le terrain qui affleure exactement
            // au niveau de la mer
            waterGeom.position.y = this.generator.config.seaLevel + 0.35;
            waterGeom.receiveShadows = true;
            waterGeom.isPickable = false; // le picking du pinceau ne vise que le terrain
            waterGeom.freezeWorldMatrix(); // plan statique
            this.waterMesh = waterGeom;
        }

        this._needsRender = true;
    }

    /**
     * Mise à jour PARTIELLE du terrain 3D (coups de pinceau localisés).
     * v3.6 : reconstruit UNIQUEMENT les chunks intersectant la zone élargie,
     * en SMOOTH comme en VOXEL (avant : updateVerticesData global en smooth,
     * rebuild COMPLET de la carte en voxel à chaque coup de pinceau).
     * Zone élargie de +2 cellules (mélange de couleurs de biomes) — identique à avant.
     */
    updateTerrainRegion(gxMin, gxMax, gzMin, gzMax) {
        // VUE UNIQUE : section 3D cachée -> on note juste que le mesh est périmé
        if (this.container && this.container.offsetParent === null) {
            this._terrainDirty = true;
            return;
        }
        const grid = this.generator && this.generator.grid;
        const meta = this._geomMeta;
        // Garde-fous : pas de terrain, meta absent/obsolète, grille redimensionnée
        // ou type de mesh changé -> rebuild complet classique.
        if (!grid || !grid.length || !meta || !this._terrainChunks.length ||
            meta.meshType !== this.generator.config.meshType ||
            grid.length !== meta.resX || (grid[0] ? grid[0].length : 0) !== meta.resZ) {
            this.updateTerrain();
            return;
        }

        // Marge de 2 cellules pour le mélange de couleurs aux frontières de biomes
        const M = 2;
        const x0 = Math.max(0, Math.floor(gxMin) - M);
        const x1 = Math.min(meta.resX - 1, Math.ceil(gxMax) + M);
        const z0 = Math.max(0, Math.floor(gzMin) - M);
        const z1 = Math.min(meta.resZ - 1, Math.ceil(gzMax) + M);
        if (x0 > x1 || z0 > z1) return;

        const isVoxel = meta.meshType === 'voxel';
        let touched = 0;
        for (let i = 0; i < this._terrainChunks.length; i++) {
            const entry = this._terrainChunks[i];
            // voxel : plage de cellules [x0,x1) ; lisse : plage de sommets [x0..x1]
            const hit = isVoxel
                ? (x0 < entry.x1 && x1 >= entry.x0 && z0 < entry.z1 && z1 >= entry.z0)
                : (x1 >= entry.x0 && x0 <= entry.x1 && z1 >= entry.z0 && z0 <= entry.z1);
            if (!hit) continue;
            touched++;
            // chunk encore en file de construction ? _buildChunkEntry le marque
            // 'built', la file le sautera (processeur protégé contre les obsolètes).
            this._buildChunkEntry(entry);
        }
        if (!touched) return;

        // Invalide la surcouche de détail 3D sur la zone peinte (coords monde)
        {
            const gMeta = this.generator.currentGridMeta;
            if (gMeta) {
                const wx0 = gMeta.startWorldX + x0 * gMeta.stepX;
                const wx1 = gMeta.startWorldX + (x1 + 1) * gMeta.stepX;
                const wz0 = gMeta.startWorldZ + z0 * gMeta.stepZ;
                const wz1 = gMeta.startWorldZ + (z1 + 1) * gMeta.stepZ;
                this.clearDetailOverlayInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
        }
        // Sink voxel : réappliqué depuis l'état courant (buffers fraîchement reconstruits)
        if (isVoxel) this._syncCoarseSink();
        this._needsRender = true;
    }


    /* ============================================================
       SURCOUCHE DE DÉTAIL 3D (grands mondes, ex. 4000x4000)
       Quand la caméra est proche, des chunks 16x16 blocs à la vraie
       résolution 1:1 (mêmes données que la 2D et l'export, via
       generator.getDetailChunk) sont affichés PAR-DESSUS le mesh
       grossier, UNIQUEMENT dans le rayon visible autour du point
       regardé. Un mesh par chunk -> le frustum culling de Babylon
       ignore automatiquement ce qui sort de l'écran, et rien n'est
       calculé hors du rayon visible. Cache LRU + budget par tick.
       ============================================================ */
    _maybeUpdateDetailOverlay() {
        const now = Date.now();
        if (this._lastDetailCheck && now - this._lastDetailCheck < 120) return;
        this._lastDetailCheck = now;

        const gen = this.generator;
        if (!gen || !gen.needsDetailChunks || !gen.needsDetailChunks() ||
            !this._hasTerrain() || !this.camera || !this._geomMeta ||
            (this._chunkBuildQueue && this._chunkBuildQueue.length > 0)) {
            if (this.detailGroup) this.detailGroup.setEnabled(false);
            this._restoreAllSunk();
            return;
        }
        const meta = gen.currentGridMeta;
        if (!meta) return;
        const scale = this._geomMeta.scale || 3.5;
        const halfSizeX = this._geomMeta.halfSizeX, halfSizeZ = this._geomMeta.halfSizeZ;

        // Rayon visible approx. en blocs : distance caméra -> cible, ouverture fov
        // (ArcRotateCamera.radius = distance caméra/cible exacte ; fov déjà en radians)
        const dist = this.camera.radius || this.camera.position.subtract(this.camera.target).length();
        const fov = this.camera.fov || (60 * Math.PI / 180);
        const radiusScene = Math.tan(fov / 2) * dist * 1.7;
        const blocksPerUnit = meta.stepX / scale;
        const radiusBlocks = radiusScene * blocksPerUnit;

        // Deux seuils distincts :
        // - OFF_RADIUS : au-delà, le détail 1:1 serait imperceptible (~<2px/bloc)
        //   -> surcouche masquée, zéro calcul
        // - MAX_RADIUS : rayon de CHARGEMENT clampé (les grands mondes couvrent
        //   vite des centaines de blocs, on détaille en priorité autour de la cible)
        const OFF_RADIUS_BLOCKS = 700;
        const MAX_RADIUS_BLOCKS = 260;
        if (!this.detailGroup) {
            this.detailGroup = new BABYLON.TransformNode('detailGroup', this.scene); // ≈ THREE.Group
            this._detailMeshes = new Map();
            this._detailMeshOrder = [];
        }
        if (radiusBlocks > OFF_RADIUS_BLOCKS) {
            if (this.detailGroup.isEnabled()) { this.detailGroup.setEnabled(false); this._needsRender = true; }
            this._restoreAllSunk();
            return;
        }
        this.detailGroup.setEnabled(true);

        // POINT REGARDÉ (pick) : le rayon central de la caméra est intersecté
        // avec le terrain ; c'est LE point que le joueur regarde. Fallback : la
        // cible caméra si le rayon sort du terrain.
        let lookX, lookZ;
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const pick = this._pickTerrain(rect.width / 2, rect.height / 2);
            if (pick) { lookX = pick.pickedPoint.x; lookZ = pick.pickedPoint.z; }
        }
        if (lookX === undefined) { lookX = this.camera.target.x; lookZ = this.camera.target.z; }
        const wcx = (lookX + halfSizeX) / scale * meta.stepX + meta.startWorldX;
        const wcz = (lookZ + halfSizeZ) / scale * meta.stepZ + meta.startWorldZ;

        const S = gen.detailChunkSize();
        const r = Math.min(radiusBlocks, MAX_RADIUS_BLOCKS);
        const rc = Math.max(1, Math.ceil(r / S)); // rayon en chunks
        const ccx = Math.floor(wcx / S), ccz = Math.floor(wcz / S);

        // PARCOURS EN SPIRALE : le chunk regardé d'abord, puis anneaux concentriques
        // (droite, bas, gauche, haut) -> le détail apparaît là où le joueur regarde
        // et s'étend autour, au lieu d'un balayage ligne par ligne.
        let budget = 32;
        const tryChunk = (cx, cz) => {
            if (budget <= 0) return;
            const key = cx + ',' + cz;
            if (this._detailMeshes.has(key)) return;
            const mesh = this._buildDetailChunkMesh(cx, cz, meta, scale, halfSizeX, halfSizeZ);
            if (!mesh) { this._detailMeshes.set(key, null); this._detailMeshOrder.push(key); return; }
            mesh.parent = this.detailGroup;
            this._detailMeshes.set(key, mesh);
            this._detailMeshOrder.push(key);
            budget--;
            this._needsRender = true;
        };
        tryChunk(ccx, ccz); // centre = point regardé
        for (let ring = 1; ring <= rc && budget > 0; ring++) {
            // bord haut et bas de l'anneau
            for (let dx = -ring; dx <= ring && budget > 0; dx++) {
                tryChunk(ccx + dx, ccz - ring);
                tryChunk(ccx + dx, ccz + ring);
            }
            // bords gauche/droite (sans les coins déjà faits)
            for (let dz = -ring + 1; dz <= ring - 1 && budget > 0; dz++) {
                tryChunk(ccx - ring, ccz + dz);
                tryChunk(ccx + ring, ccz + dz);
            }
        }
        // LRU "spatial" : on n'évince JAMAIS un chunk encore dans le rayon
        // visible (sinon les chunks à l'écran se chassent mutuellement et des
        // gros carrés grossiers ne se remplissent jamais). Le cap s'adapte au
        // rayon courant, et l'éviction ne touche que les chunks hors-zone.
        const cap = Math.max(600, (2 * rc + 3) * (2 * rc + 3));
        if (this._detailMeshOrder.length > cap) {
            let toEvict = this._detailMeshOrder.length - cap;
            const keep = [];
            for (const key of this._detailMeshOrder) {
                const parts = key.split(',');
                const kx = parseInt(parts[0], 10), kz = parseInt(parts[1], 10);
                const inView = Math.max(Math.abs(kx - ccx), Math.abs(kz - ccz)) <= rc + 1;
                if (!inView && toEvict > 0) {
                    toEvict--;
                    const m = this._detailMeshes.get(key);
                    this._detailMeshes.delete(key);
                    if (m) m.dispose(); // dispose mesh + géométrie (matériau partagé conservé)
                } else {
                    keep.push(key);
                }
            }
            this._detailMeshOrder = keep;
        }

        // Enfonce (ou désactive) le terrain grossier sous les chunks 1:1 chargés
        this._syncCoarseSink();
    }

    _buildDetailChunkMesh(cx, cz, meta, scale, halfSizeX, halfSizeZ) {
        const gen = this.generator;
        const chunk = gen.getDetailChunk(cx, cz);
        if (!chunk) return null;
        const S = gen.detailChunkSize();
        const chunkXp = gen.getDetailChunk(cx + 1, cz);
        const chunkZp = gen.getDetailChunk(cx, cz + 1);
        const chunkXZp = gen.getDetailChunk(cx + 1, cz + 1);
        // Voisins OUEST/NORD : nécessaires pour ne PAS dessiner de murs de jupe
        // aux frontières internes de chunks (traits noirs vus en parallèle X/Z)
        const chunkXm = gen.getDetailChunk(cx - 1, cz);
        const chunkZm = gen.getDetailChunk(cx, cz - 1);
        const hAt = (lx, lz) => {
            if (lx < S && lz < S) return chunk.heights[lz * S + lx];
            if (lx >= S && lz < S) return chunkXp ? chunkXp.heights[lz * S + (lx - S)] : chunk.heights[lz * S + (S - 1)];
            if (lx < S && lz >= S) return chunkZp ? chunkZp.heights[(lz - S) * S + lx] : chunk.heights[(S - 1) * S + lx];
            return chunkXZp ? chunkXZp.heights[(lz - S) * S + (lx - S)] : chunk.heights[S * S - 1];
        };
        const bAt = (lx, lz) => {
            const cxx = Math.min(S - 1, lx), czz = Math.min(S - 1, lz);
            return chunk.biomes[czz * S + cxx];
        };
        // Le chunk 1:1 est rendu SOLIDE et OPAQUE au-dessus du mesh grossier
        // (même style que le meshType courant, +LIFT, jupe périphérique).
        // La scène compresse X/Z (1 bloc = scale/stepX unités) mais pas Y :
        // projection du relief à l'échelle CUBIQUE, ancrée sur la surface
        // grossière (bilinéaire, continue entre chunks).
        const LIFT = 0.25;
        const isVoxel = this.generator.config.meshType === 'voxel';
        const maxH = Math.max(1, this.generator.config.maxHeight || 400);
        const pxOf = (wx) => (wx - meta.startWorldX) / meta.stepX * scale - halfSizeX;
        const pzOf = (wz) => (wz - meta.startWorldZ) / meta.stepZ * scale - halfSizeZ;
        const sBlock = scale / meta.stepX; // taille scène d'UN bloc (horizontale = verticale voulue)
        const grid = this.generator.grid;
        const baseAt = (wx, wz) => {
            // hauteur de la surface grossière (bilinéaire)
            const fx = (wx - meta.startWorldX) / meta.stepX - 0.5;
            const fz = (wz - meta.startWorldZ) / meta.stepZ - 0.5;
            const x0i = Math.max(0, Math.min(meta.resX - 1, Math.floor(fx)));
            const z0i = Math.max(0, Math.min(meta.resZ - 1, Math.floor(fz)));
            const x1i = Math.min(meta.resX - 1, x0i + 1);
            const z1i = Math.min(meta.resZ - 1, z0i + 1);
            const tx = Math.max(0, Math.min(1, fx - x0i));
            const tz = Math.max(0, Math.min(1, fz - z0i));
            return grid[x0i][z0i].height * (1 - tx) * (1 - tz) + grid[x1i][z0i].height * tx * (1 - tz) +
                   grid[x0i][z1i].height * (1 - tx) * tz + grid[x1i][z1i].height * tx * tz;
        };
        const yScene = (h, wx, wz) => {
            const b = baseAt(wx, wz);
            return b + (h - b) * sBlock + LIFT;
        };
        // v3.6 : couleurs sans allocation (cache _biomeRGB + scratchs)
        const colS = { r: 0, g: 0, b: 0 }, sideS = { r: 0, g: 0, b: 0 };
        const colorInto = (lx, lz, out) => {
            const base = this._biomeRGB((gen.biomes[bAt(lx, lz)] || {}).color || '#4ade80');
            const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, hAt(lx, lz) / maxH));
            out.r = base.r * shade; out.g = base.g * shade; out.b = base.b * shade;
            return out;
        };

        const positions = [];
        const colors = [];
        const indices = [];
        const pushTri = (ax, ay, az, bx, by, bz, cx2, cy2, cz2, c) => {
            const base = positions.length / 3;
            positions.push(ax, ay, az, bx, by, bz, cx2, cy2, cz2);
            // FIX v3.5.2 : winding natif Babylon (faces cullées sinon)
            indices.push(base, base + 2, base + 1);
            for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
        };
        const pushQuad = (v0, v1, v2, v3, c) => {
            pushTri(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], c);
            pushTri(v0[0], v0[1], v0[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2], c);
        };

        if (isVoxel) {
            // Style voxel 1:1 : un plateau par BLOC + jupes vers les voisins,
            // hauteurs re-projetées à l'échelle cubique (yScene)
            const stepPx = scale / meta.stepX, stepPz = scale / meta.stepZ;
            // Les hauteurs des chunks sont FLOTTANTES ; le style voxel arrondit
            // localement pour garder de vrais cubes 1:1 alignés, comme l'export.
            const hVox = (lx, lz) => Math.round(hAt(lx, lz));
            for (let lz = 0; lz < S; lz++) {
                for (let lx = 0; lx < S; lx++) {
                    const wx = chunk.x0 + lx, wz = chunk.z0 + lz;
                    const wcx = wx + 0.5, wcz = wz + 0.5;
                    const h = yScene(hVox(lx, lz), wcx, wcz);
                    const x0 = pxOf(wx), x1 = x0 + stepPx;
                    const z0 = pzOf(wz), z1 = z0 + stepPz;
                    const c = colorInto(lx, lz, colS);
                    pushQuad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], c);
                    const sideC = { r: c.r * 0.78, g: c.g * 0.78, b: c.b * 0.78 };
                    // jupes : hauteurs voisines projetées avec la MEME colonne de base
                    // (continuité assurée par baseAt bilinéaire). La jupe descend
                    // JUSQU'AU voisin réel ; "bottom" ne sert qu'en bord de monde.
                    const bottom = h - Math.max(2.5 * sBlock, LIFT + 2);
                    const nE = lx + 1 <= S ? yScene(hVox(lx + 1, lz), wcx + 1, wcz) : bottom;
                    if (nE < h) pushQuad([x1, h, z0], [x1, h, z1], [x1, nE, z1], [x1, nE, z0], sideC);
                    // OUEST : hauteur réelle du chunk voisin (plus de mur artificiel)
                    const hW = lx - 1 >= 0 ? hVox(lx - 1, lz) : (chunkXm ? Math.round(chunkXm.heights[lz * S + (S - 1)]) : null);
                    const nW = hW === null ? bottom : yScene(hW, wcx - 1, wcz);
                    if (nW < h) pushQuad([x0, h, z1], [x0, h, z0], [x0, nW, z0], [x0, nW, z1], sideC);
                    const nS2 = lz + 1 <= S ? yScene(hVox(lx, lz + 1), wcx, wcz + 1) : bottom;
                    if (nS2 < h) pushQuad([x1, h, z1], [x0, h, z1], [x0, nS2, z1], [x1, nS2, z1], sideC);
                    // NORD : idem
                    const hN = lz - 1 >= 0 ? hVox(lx, lz - 1) : (chunkZm ? Math.round(chunkZm.heights[(S - 1) * S + lx]) : null);
                    const nN = hN === null ? bottom : yScene(hN, wcx, wcz - 1);
                    if (nN < h) pushQuad([x0, h, z0], [x1, h, z0], [x1, nN, z0], [x0, nN, z0], sideC);
                }
            }
        } else {
            // Style lisse 1:1 : grille de quads sur sommets 17x17 (échelle cubique)
            const yV = (lx, lz) => yScene(hAt(lx, lz), chunk.x0 + lx, chunk.z0 + lz);
            for (let lz = 0; lz < S; lz++) {
                for (let lx = 0; lx < S; lx++) {
                    const wx = chunk.x0 + lx, wz = chunk.z0 + lz;
                    const c = colorInto(lx, lz, colS);
                    pushQuad(
                        [pxOf(wx), yV(lx, lz), pzOf(wz)],
                        [pxOf(wx), yV(lx, lz + 1), pzOf(wz + 1)],
                        [pxOf(wx + 1), yV(lx + 1, lz + 1), pzOf(wz + 1)],
                        [pxOf(wx + 1), yV(lx + 1, lz), pzOf(wz)], c);
                }
            }
            // Jupe périphérique UNIQUEMENT en bord de monde : entre chunks
            // adjacents, les sommets de bord sont identiques (cache partagé +
            // base bilinéaire continue), donc aucune jupe n'est nécessaire.
            const drop = 4 + LIFT;
            if (!chunkZm) for (let lx = 0; lx < S; lx++) {
                const wx = chunk.x0 + lx;
                const cN = colorInto(lx, 0, colS);
                sideS.r = cN.r * 0.75; sideS.g = cN.g * 0.75; sideS.b = cN.b * 0.75;
                pushQuad([pxOf(wx), yV(lx, 0), pzOf(chunk.z0)], [pxOf(wx + 1), yV(lx + 1, 0), pzOf(chunk.z0)],
                         [pxOf(wx + 1), yV(lx + 1, 0) - drop, pzOf(chunk.z0)], [pxOf(wx), yV(lx, 0) - drop, pzOf(chunk.z0)], sideS);
            }
            if (!chunkZp) for (let lx = 0; lx < S; lx++) {
                const wx = chunk.x0 + lx;
                const cS = colorInto(lx, S - 1, colS);
                sideS.r = cS.r * 0.75; sideS.g = cS.g * 0.75; sideS.b = cS.b * 0.75;
                pushQuad([pxOf(wx + 1), yV(lx + 1, S), pzOf(chunk.z0 + S)], [pxOf(wx), yV(lx, S), pzOf(chunk.z0 + S)],
                         [pxOf(wx), yV(lx, S) - drop, pzOf(chunk.z0 + S)], [pxOf(wx + 1), yV(lx + 1, S) - drop, pzOf(chunk.z0 + S)], sideS);
            }
            if (!chunkXm) for (let lz = 0; lz < S; lz++) {
                const wz = chunk.z0 + lz;
                const cW = colorInto(0, lz, colS);
                sideS.r = cW.r * 0.75; sideS.g = cW.g * 0.75; sideS.b = cW.b * 0.75;
                pushQuad([pxOf(chunk.x0), yV(0, lz + 1), pzOf(wz + 1)], [pxOf(chunk.x0), yV(0, lz), pzOf(wz)],
                         [pxOf(chunk.x0), yV(0, lz) - drop, pzOf(wz)], [pxOf(chunk.x0), yV(0, lz + 1) - drop, pzOf(wz + 1)], sideS);
            }
            if (!chunkXp) for (let lz = 0; lz < S; lz++) {
                const wz = chunk.z0 + lz;
                const cE = colorInto(S - 1, lz, colS);
                sideS.r = cE.r * 0.75; sideS.g = cE.g * 0.75; sideS.b = cE.b * 0.75;
                pushQuad([pxOf(chunk.x0 + S), yV(S, lz), pzOf(wz)], [pxOf(chunk.x0 + S), yV(S, lz + 1), pzOf(wz + 1)],
                         [pxOf(chunk.x0 + S), yV(S, lz + 1) - drop, pzOf(wz + 1)], [pxOf(chunk.x0 + S), yV(S, lz) - drop, pzOf(wz)], sideS);
            }
        }

        const geom = new BABYLON.VertexData();
        const normals = this._computeVertexNormals(positions, indices, null);
        geom.positions = positions;
        geom.colors = colors;
        geom.normals = normals;
        geom.indices = indices;
        if (!this._detailMaterial) {
            this._detailMaterial = new BABYLON.StandardMaterial('detailMat', this.scene);
            this._detailMaterial.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02); // ≈ roughness 0.85
            this._detailMaterial.specularPower = 64;
            // ≈ polygonOffset -2 : tire le détail vers la caméra, évite le z-fighting
            this._detailMaterial.zOffset = -2;
            this._detailMaterial.zOffsetUnits = -2;
            this._detailMaterial.freeze(); // partagé, jamais modifié ensuite
        }
        const mesh = new BABYLON.Mesh('detailChunk_' + cx + '_' + cz, this.scene);
        geom.applyToMesh(mesh);
        mesh.material = this._detailMaterial;
        mesh.metadata = { detail: true }; // reconnu par le prédicat de picking
        mesh.isPickable = true;
        mesh.freezeWorldMatrix(); // chunk 1:1 statique (disposé/recréé à l'invalidation)
        return mesh;
    }

    clearDetailOverlay() {
        this._restoreAllSunk();
        if (!this.detailGroup) { this._detailMeshes = this._detailMeshes || new Map(); this._detailMeshOrder = this._detailMeshOrder || []; return; }
        for (const [, m] of this._detailMeshes || []) {
            if (m) m.dispose();
        }
        this._detailMeshes = new Map();
        this._detailMeshOrder = [];
        this._needsRender = true;
    }

    /** Invalidation ciblée (coup de pinceau) : zone en coordonnées MONDE (blocs) */
    clearDetailOverlayInRegion(wx0, wx1, wz0, wz1) {
        if (!this._detailMeshes || this._detailMeshes.size === 0) return;
        const S = this.generator.detailChunkSize();
        const cx0 = Math.floor(wx0 / S), cx1 = Math.floor(wx1 / S);
        const cz0 = Math.floor(wz0 / S), cz1 = Math.floor(wz1 / S);
        for (let cx = cx0; cx <= cx1; cx++) {
            for (let cz = cz0; cz <= cz1; cz++) {
                const key = cx + ',' + cz;
                const m = this._detailMeshes.get(key);
                if (m !== undefined) {
                    this._detailMeshes.delete(key);
                    const idx = this._detailMeshOrder.indexOf(key);
                    if (idx !== -1) this._detailMeshOrder.splice(idx, 1);
                    if (m) m.dispose();
                }
            }
        }
        this._syncCoarseSink();
        this._needsRender = true;
    }


    /* ============================================================
       SINK DU TERRAIN GROSSIER (fix "gros cubes au zoom"), v3.6 chunkisé :
       - cellule ENTIÈREMENT couverte par des chunks 1:1 -> y = -10000
         dans le buffer de SON chunk (comme avant, mais buffers locaux) ;
       - NOUVEAU : chunk grossier 100% couvert -> mesh purement DÉSACTIVÉ
         (zéro rasterisation, zéro z-fighting possible).
       Restauration exacte à l'éviction / au dézoom / au clear.
       ============================================================ */
    _syncCoarseSink() {
        if (!this._sunkCells) this._sunkCells = new Map();
        const voxelOk = this._geomMeta && this._geomMeta.meshType === 'voxel' &&
                        this._terrainChunks && this._terrainChunks.length;
        if (!voxelOk || !this._detailMeshes || !this.detailGroup || !this.detailGroup.isEnabled()) {
            this._restoreAllSunk();
            return;
        }
        const gen = this.generator;
        const meta = gen.currentGridMeta;
        if (!meta) { this._restoreAllSunk(); return; }
        const S = gen.detailChunkSize();
        const loaded = new Set();
        this._detailMeshes.forEach((m, key) => { if (m) loaded.add(key); });

        // Cellules dont TOUS les chunks couvrants sont chargés (algorithme inchangé)
        const desired = new Set();
        const seen = new Set();
        loaded.forEach((key) => {
            const p = key.split(',');
            const cx = parseInt(p[0], 10), cz = parseInt(p[1], 10);
            const wx0 = cx * S, wz0 = cz * S;
            const gx0 = Math.floor((wx0 - meta.startWorldX) / meta.stepX);
            const gx1 = Math.floor((wx0 + S - 0.001 - meta.startWorldX) / meta.stepX);
            const gz0 = Math.floor((wz0 - meta.startWorldZ) / meta.stepZ);
            const gz1 = Math.floor((wz0 + S - 0.001 - meta.startWorldZ) / meta.stepZ);
            for (let gx = Math.max(0, gx0); gx <= Math.min(meta.resX - 1, gx1); gx++) {
                for (let gz = Math.max(0, gz0); gz <= Math.min(meta.resZ - 1, gz1); gz++) {
                    const ck = gx + ',' + gz;
                    if (seen.has(ck)) continue;
                    seen.add(ck);
                    const cwx0 = meta.startWorldX + gx * meta.stepX;
                    const cwx1 = meta.startWorldX + (gx + 1) * meta.stepX - 0.001;
                    const cwz0 = meta.startWorldZ + gz * meta.stepZ;
                    const cwz1 = meta.startWorldZ + (gz + 1) * meta.stepZ - 0.001;
                    let full = true;
                    for (let qx = Math.floor(cwx0 / S); qx <= Math.floor(cwx1 / S) && full; qx++) {
                        for (let qz = Math.floor(cwz0 / S); qz <= Math.floor(cwz1 / S); qz++) {
                            if (!loaded.has(qx + ',' + qz)) { full = false; break; }
                        }
                    }
                    if (full) desired.add(ck);
                }
            }
        });

        // Réconciliation PAR CHUNK de base
        for (let e = 0; e < this._terrainChunks.length; e++) {
            const entry = this._terrainChunks[e];
            if (!entry.built || !entry.mesh || !entry.positions) continue;
            const total = (entry.x1 - entry.x0) * (entry.z1 - entry.z0);
            if (total <= 0) continue;

            // Passe 1 : comptage des cellules couvertes dans ce chunk
            let covCount = 0;
            for (let gx = entry.x0; gx < entry.x1; gx++) {
                for (let gz = entry.z0; gz < entry.z1; gz++) {
                    if (desired.has(gx + ',' + gz)) covCount++;
                }
            }

            // Chunk 100% couvert -> DÉSACTIVATION COMPLÈTE (perf + jamais de
            // percement). Les entrées sunk partielles sont CONSERVÉES : elles
            // serviront de sauvegarde à la réactivation partielle.
            if (covCount === total) {
                if (!entry.sunkFull) {
                    entry.sunkFull = true;
                    entry.mesh.setEnabled(false);
                    this._requestShadowRefresh();
                    this._needsRender = true;
                }
                continue;
            }

            if (entry.sunkFull) { entry.sunkFull = false; entry.mesh.setEnabled(true); }

            // Passe 2 : sink / restauration cellule par cellule dans le buffer du chunk
            let changed = false;
            const pos = entry.positions;
            for (let gx = entry.x0; gx < entry.x1; gx++) {
                for (let gz = entry.z0; gz < entry.z1; gz++) {
                    const ck = gx + ',' + gz;
                    if (desired.has(ck)) {
                        if (this._sunkCells.has(ck)) continue;
                        const range = this._cellRanges.get(ck);
                        if (!range || range.entry !== entry) continue;
                        const saved = new Float32Array(Math.ceil((range.e - range.s) / 3));
                        let si = 0;
                        for (let i = range.s + 1; i < range.e; i += 3) { saved[si++] = pos[i]; pos[i] = -10000; }
                        this._sunkCells.set(ck, { cx: entry.cx, cz: entry.cz, saved: saved });
                        changed = true;
                    } else if (this._sunkCells.has(ck)) {
                        this._restoreCell(ck);
                        changed = true;
                    }
                }
            }
            if (changed) {
                entry.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
                this._requestShadowRefresh();
                this._needsRender = true;
            }
        }
    }

    _restoreCell(ck) {
        const savedEntry = this._sunkCells.get(ck);
        const range = this._cellRanges && this._cellRanges.get(ck);
        if (savedEntry && range && range.entry && range.entry.positions) {
            const pos = range.entry.positions;
            const saved = savedEntry.saved;
            let si = 0;
            for (let i = range.s + 1; i < range.e; i += 3) pos[i] = saved[si++];
        }
        this._sunkCells.delete(ck);
    }

    _restoreAllSunk() {
        // Ré-active les chunks désactivés pour couverture totale
        let anyChange = false;
        if (this._terrainChunks) {
            for (let e = 0; e < this._terrainChunks.length; e++) {
                const entry = this._terrainChunks[e];
                if (entry.sunkFull) {
                    entry.sunkFull = false;
                    if (entry.mesh) entry.mesh.setEnabled(true);
                    anyChange = true;
                }
            }
        }
        if (!this._sunkCells || this._sunkCells.size === 0) {
            if (anyChange) { this._requestShadowRefresh(); this._needsRender = true; }
            return;
        }
        // Restauration groupée par chunk (1 updateVerticesData par chunk touché)
        const touchedEntries = new Set();
        const keys = Array.from(this._sunkCells.keys());
        for (let i = 0; i < keys.length; i++) {
            const ck = keys[i];
            const range = this._cellRanges && this._cellRanges.get(ck);
            this._restoreCell(ck);
            if (range && range.entry && range.entry.mesh) touchedEntries.add(range.entry);
        }
        touchedEntries.forEach((entry) => {
            if (entry.positions) entry.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, entry.positions);
        });
        if (keys.length || anyChange) { this._requestShadowRefresh(); this._needsRender = true; }
    }

        updateControlsMode() {
        if (!this.camera || typeof BABYLON === 'undefined') return;
        const ptrInput = this.camera.inputs && this.camera.inputs.attached
            ? this.camera.inputs.attached.pointers : null;
        if (!ptrInput) return;
        const editorMode = !!(window.map2dInstance && window.map2dInstance.activeTab === 'editor');
        const mode = editorMode ? 'editor' : 'settings';
        if (this._ctrlMode === mode) return; // évite de réallouer les tableaux à chaque frame
        this._ctrlMode = mode;
        if (editorMode) {
            // Éditeur : Bloque totalement le drag caméra (boutons souris désactivés) ;
            // la molette reste active (le wheel input est indépendant de `buttons`).
            ptrInput.buttons = [];
        } else {
            // Paramètres : gauche = rotation, droite = pan (défauts ArcRotateCamera,
            // identiques aux OrbitControls d'origine), molette = zoom.
            ptrInput.buttons = [0, 1, 2];
        }
        this._needsRender = true;
    }

    /* ============================================================
       NAVIGATION VOL CLASSIQUE (v4.3) — ZQSD/WASD + Espace/Ctrl + Maj
       La caméra orbite (ArcRotateCamera) est TRANSLATÉE en déplaçant sa
       cible (le centre d'orbite) : le point de vue avance/recule/strafe/
       monte/descend comme une caméra fly, tout en gardant l'orbite souris.
       Ctrl = descente (et désactive la translation horizontale pour ne pas
       parasiter les raccourcis Ctrl+Z/Y d'annulation).
       ============================================================ */
    _is3DVisible() {
        return !!(this.container && this.container.offsetParent !== null &&
                  this.container.clientWidth > 8 && this.container.clientHeight > 8);
    }
    _normFlyKey(e) {
        // Utilise e.key (caractère réel) comme le Schem Placer — pas e.code
        const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        const kb = (typeof localStorage !== 'undefined' && localStorage.getItem('bloxdTools.keyboard')) || 'azerty';
        if (kb === 'qwerty') {
            if (k === 'w') return 'fwd';
            if (k === 'a') return 'left';
        } else {
            if (k === 'z') return 'fwd';
            if (k === 'q') return 'left';
        }
        if (k === 's') return 'back';
        if (k === 'd') return 'right';
        if (e.code === 'Space') return 'up';
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') return 'down';
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'fast';
        return null;
    }
    _initFlyControls() {
        window.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            const k = this._normFlyKey(e);
            if (!k) return;
            this._flyKeys[k] = true;
            // évite le scroll de la page quand on vole (Espace) en vue 3D
            if ((k === 'up' || k === 'down') && this._is3DVisible()) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            const k = this._normFlyKey(e);
            if (k) this._flyKeys[k] = false;
        });
        window.addEventListener('blur', () => { this._flyKeys = {}; });
    }
    _updateFly() {
        if (!this.camera || !this._is3DVisible()) return;
        const k = this._flyKeys || {};
        const ctrl = !!k.down;
        // Ctrl maintenu = descente pure (pas de translation horizontale -> évite
        // d'interférer avec Ctrl+Z/Y pour annuler/rétablir)
        const f = ctrl ? 0 : ((k.fwd ? 1 : 0) - (k.back ? 1 : 0));
        const r = ctrl ? 0 : ((k.right ? 1 : 0) - (k.left ? 1 : 0));
        const u = (k.up ? 1 : 0) - (ctrl ? 1 : 0);
        if (!f && !r && !u) return;

        const radius = this.camera.radius || 100;
        const speed = Math.max(1.5, Math.min(80, radius * 0.015)) * ((k.fast && !ctrl) ? 2.5 : 1);

        // Direction avant (caméra -> cible) projetée sur le plan XZ
        let fx = this.camera.target.x - this.camera.position.x;
        let fz = this.camera.target.z - this.camera.position.z;
        const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        const rx = -fz, rz = fx; // vecteur droite (right-handed Babylon)

        const dx = fx * f * speed + rx * r * speed;
        const dz = fz * f * speed + rz * r * speed;
        const dy = u * speed;

        // On déplace uniquement la CIBLE : la position de la caméra orbite
        // suit automatiquement (offset radius/alpha/beta conservé).
        const t = this.camera.target;
        t.x += dx; t.y += dy; t.z += dz;

        this._needsRender = true;
    }

    animate() {
        this.animFrameId = requestAnimationFrame(() => this.animate());

        // TACHE 1 : ne consommer NI GPU NI CPU quand le canvas 3D ne peut pas être vu
        // (onglet navigateur caché, section 3D repliée via le splitter, display:none).
        // La boucle rAF reste vivante pour reprendre instantanément au retour.
        const hidden = (typeof document !== 'undefined' && document.hidden) ||
            !this.container || this.container.offsetParent === null ||
            this.container.clientWidth < 8 || this.container.clientHeight < 8;
        if (hidden) {
            this._wasHidden = true;
            return;
        }
        if (this._wasHidden) {
            this._wasHidden = false;
            this._needsRender = true; // premier rendu forcé au retour de visibilité
        }

        this.updateControlsMode();
        this._updateFly();
        // Pas de controls.update() à appeler avec Babylon : l'inertie de la caméra
        // est traitée pendant scene.render() et signale ses changements via
        // onViewMatrixChangedObservable -> _needsRender (chaîne auto-entretenue).
        // v3.6 : construction progressive des chunks de terrain (budget ~7 ms)
        this._processChunkBuildQueue();
        // DETAIL AU ZOOM (grands mondes) : chargement progressif des chunks visibles
        this._maybeUpdateDetailOverlay();

        if ((this._needsRender || this._alwaysRender) && this.scene && this.camera) {
            this._needsRender = false;
            this.scene.render();
        }
    }
}
window.Map3D = Map3D;

/* ──── app ──── */

/**
 * terrain_editor_app.js — INTERFACE & APPLICATION (fusionné)
 * Contient: ui, main
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  ui  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_ui.js
   Interface : onglets, sliders, presets, palettes, splitters, modale d'export, gabarit Python.
   Chargement : 7/8 — après generator + map2d + map3d (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_ui.js
 * Rôle : Gestion des événements UI, onglets, séparateurs redimensionnables (splitters), contrôles du formulaire, et export ZIP/Python
 */

class UIManager {
    constructor(generator, map2d, map3d) {
        this.generator = generator;
        this.map2d = map2d;
        this.map3d = map3d;

        this.initTabs();
        this.initSplitters();
        this.initFormControls();
        this.initEditorControls();
        this.initPaletteForm();
        this.initBiomesGrid();
        this.initPresetsAndActions();
        this.initExportModal();
    }

    /**
     * Gestion de la navigation par onglets (Paramètres / Éditeur)
     */
    initTabs() {
        const btnSettings = document.getElementById('tab-btn-settings');
        const btnEditor = document.getElementById('tab-btn-editor');
        const panelSettings = document.getElementById('panel-settings');
        const panelEditor = document.getElementById('panel-editor');

        const switchTab = (tabName) => {
            if (btnSettings) btnSettings.classList.toggle('active', tabName === 'settings');
            if (btnEditor) btnEditor.classList.toggle('active', tabName === 'editor');
            if (panelSettings) panelSettings.classList.toggle('active', tabName === 'settings');
            if (panelEditor) panelEditor.classList.toggle('active', tabName === 'editor');
            this.map2d.activeTab = tabName;
            if (tabName === 'editor' && typeof this.renderEditorBiomes === 'function') {
                this.renderEditorBiomes();
            }
        };

        if (btnSettings) btnSettings.addEventListener('click', () => switchTab('settings'));
        if (btnEditor) btnEditor.addEventListener('click', () => switchTab('editor'));
    }

    /**
     * Séparateurs DRAGGABLE entre les zones (Panel gauche vs Cartes droite, et Map 2D vs Map 3D)
     */
    initSplitters() {
        const mapsArea = document.getElementById('app-maps');
        // 1. Séparateur vertical (Horizontal drag X) entre Panel (gauche) et Maps (droite)
        const vSplitter = document.getElementById('splitter-vertical');
        const panel = document.getElementById('app-panel');

        if (vSplitter && panel && mapsArea) {
            let isResizingX = false;
            vSplitter.addEventListener('mousedown', (e) => {
                isResizingX = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            window.addEventListener('mousemove', (e) => {
                if (!isResizingX) return;
                const totalWidth = window.innerWidth;
                let newPanelWidth = (e.clientX / totalWidth) * 100;
                newPanelWidth = Math.max(20, Math.min(65, newPanelWidth)); // Clamp entre 20% et 65%

                panel.style.width = `${newPanelWidth}%`;
                mapsArea.style.width = `${100 - newPanelWidth}%`;

                this.map2d.resize();
                this.map3d.resize();
            });

            window.addEventListener('mouseup', () => {
                if (isResizingX) {
                    isResizingX = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    this.map2d.resize();
                    this.map3d.resize();
                }
            });
        }

        // 2. Séparateur horizontal (Vertical drag Y) entre Map 2D (haut) et Map 3D (bas)
        // TOGGLE VUE 2D/3D : une seule visualisation à la fois dans la zone droite.
        // (Le splitter horizontal a été retiré avec le mode "Focus Écran Dynamique".)
        const map2dSec = document.getElementById('map2d-section');
        const map3dSec = document.getElementById('map3d-section');
        const switchView = (view) => {
            if (!map2dSec || !map3dSec) return;
            const to3d = view === '3d';
            map2dSec.classList.toggle('view-hidden', to3d);
            map3dSec.classList.toggle('view-hidden', !to3d);
            // Resize après le reflow : le canvas caché avait une taille nulle.
            // + rattrapage : si des modifications ont eu lieu pendant que la vue
            // était masquée (_terrainDirty), reconstruire maintenant.
            requestAnimationFrame(() => {
                if (to3d) {
                    this.map3d.resize();
                    if (this.map3d._terrainDirty) this.map3d.updateTerrain();
                } else {
                    this.map2d.resize();
                    this.map2d.render();
                }
            });
        };
        ['btn-view-3d', 'btn-view-3d-b'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.addEventListener('click', () => switchView('3d'));
        });
        ['btn-view-2d', 'btn-view-2d-b'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.addEventListener('click', () => switchView('2d'));
        });

        const hSplitter = null; // splitter horizontal supprimé
        if (hSplitter && map2dSec && map3dSec) {
            let isResizingY = false;
            hSplitter.addEventListener('mousedown', (e) => {
                isResizingY = true;
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
            });

            window.addEventListener('mousemove', (e) => {
                if (!isResizingY || !mapsArea) return;
                const rect = mapsArea.getBoundingClientRect();
                let relY = e.clientY - rect.top;
                let new2DHeight = (relY / rect.height) * 100;
                new2DHeight = Math.max(20, Math.min(80, new2DHeight)); // Clamp entre 20% et 80%

                map2dSec.style.height = `${new2DHeight}%`;
                map3dSec.style.height = `${100 - new2DHeight}%`;

                this.map2d.resize();
                this.map3d.resize();
            });

            window.addEventListener('mouseup', () => {
                if (isResizingY) {
                    isResizingY = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    this.map2d.resize();
                    this.map3d.resize();
                }
            });
        }
    }

    /**
     * Synchronise les contrôles du formulaire avec generator.config
     */
    initFormControls() {
        const cfg = this.generator.config;

        // Monde
        const inpWidth = document.getElementById('cfg-world-x');
        const inpLength = document.getElementById('cfg-world-z');
        const inpSeed = document.getElementById('cfg-seed');
        const btnRandomSeed = document.getElementById('btn-random-seed');
        const inpBaseY = document.getElementById('cfg-base-y');
        const inpSeaLevel = document.getElementById('cfg-sea-level');

        if (inpWidth) inpWidth.addEventListener('change', (e) => { cfg.worldSizeX = parseInt(e.target.value) || 4000; this.triggerRegeneration(); });
        if (inpLength) inpLength.addEventListener('change', (e) => { cfg.worldSizeZ = parseInt(e.target.value) || 4000; this.triggerRegeneration(); });
        if (inpSeed) inpSeed.addEventListener('change', (e) => { cfg.seed = parseInt(e.target.value) || 1; this.triggerRegeneration(); });
        const chkFlatTerrain = document.getElementById('cfg-flat-terrain');
        if (chkFlatTerrain) chkFlatTerrain.addEventListener('change', () => {
            cfg.flatTerrain = chkFlatTerrain.checked;
            this.triggerRegeneration(true);
        });
        const chkIsland = document.getElementById('cfg-island-mode');
        if (chkIsland) chkIsland.addEventListener('change', () => {
            cfg.islandMode = chkIsland.checked;
            this.triggerRegeneration(true);
        });
        const inpGroundDetail = document.getElementById('cfg-ground-detail');
        if (inpGroundDetail) inpGroundDetail.addEventListener('change', (e) => {
            cfg.groundDetail = parseFloat(e.target.value);
            if (isNaN(cfg.groundDetail)) cfg.groundDetail = 1;
            // Le micro-relief ne touche que les chunks 1:1 et l'export : pas
            // besoin de régénérer la grille, juste d'invalider le détail.
            this.generator.invalidateDetailChunks && this.generator.invalidateDetailChunks();
            if (this.map2d) (this.map2d.requestRender ? this.map2d.requestRender() : this.map2d.render());
            if (this.map3d && this.map3d.clearDetailOverlay) { this.map3d.clearDetailOverlay(); this.map3d._needsRender = true; }
        });
        if (btnRandomSeed) btnRandomSeed.addEventListener('click', () => {
            cfg.seed = Math.floor(Math.random() * 900000) + 10000;
            if (inpSeed) inpSeed.value = cfg.seed;
            this.triggerRegeneration();
        });
        if (inpBaseY) inpBaseY.addEventListener('change', (e) => { cfg.baseY = parseInt(e.target.value) || 70; this.triggerRegeneration(); });
        if (inpSeaLevel) inpSeaLevel.addEventListener('change', (e) => { cfg.seaLevel = parseInt(e.target.value) || 88; this.triggerRegeneration(); });

        // Terrain sliders
        const bindSlider = (id, valId, configKey, isFloat = false) => {
            const slider = document.getElementById(id);
            const valSpan = document.getElementById(valId);
            if (!slider) return;
            slider.addEventListener('input', (e) => {
                const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
                cfg[configKey] = val;
                if (valSpan) valSpan.textContent = val;
            });
            slider.addEventListener('change', () => this.triggerRegeneration());
        };

        bindSlider('cfg-min-h', 'val-min-h', 'minHeight');
        bindSlider('cfg-max-h', 'val-max-h', 'maxHeight');
        // Avertissement au-delà de 400 (limite conseillée) : export plus lourd
        const maxHSlider = document.getElementById('cfg-max-h');
        const maxHWarn = document.getElementById('max-h-warning');
        if (maxHSlider && maxHWarn) {
            const updWarn = () => { maxHWarn.style.display = parseInt(maxHSlider.value) > 400 ? 'block' : 'none'; };
            maxHSlider.addEventListener('input', updWarn);
            updWarn();
        }
        bindSlider('cfg-noise-scale', 'val-noise-scale', 'noiseScale', true);
        bindSlider('cfg-intensity', 'val-intensity', 'terrainIntensity');
        bindSlider('cfg-roughness', 'val-roughness', 'roughness', true);

        // Boutons overlay 2D
        const btn2dRecadrer = document.getElementById('btn-2d-reset');
        const btn2dRelief = document.getElementById('btn-2d-relief');
        const btn2dGrid = document.getElementById('btn-2d-grid');

        if (btn2dRecadrer) btn2dRecadrer.addEventListener('click', () => this.map2d.resetView());
        if (btn2dRelief) btn2dRelief.addEventListener('click', () => {
            cfg.hillshading = !cfg.hillshading;
            btn2dRelief.classList.toggle('active', cfg.hillshading);
            this.map2d.render();
        });
        if (btn2dGrid) btn2dGrid.addEventListener('click', () => {
            cfg.showGrid = !cfg.showGrid;
            btn2dGrid.classList.toggle('active', cfg.showGrid);
            this.map2d.render();
        });

        // Shape selector
        const selShape = document.getElementById('cfg-shape-mode');
        if (selShape) selShape.addEventListener('change', (e) => {
            cfg.shapeMode = e.target.value;
            if (e.target.value === 'custom') {
                this._openShapePopup();
            } else {
                this.generator.rebuildShapeMask();
                this.map2d.render();
                this.map3d.updateTerrain();
            }
        });

        // Boutons overlay 3D
        const btn3dReset = document.getElementById('btn-3d-reset');
        const btn3dMesh = document.getElementById('btn-3d-mesh');
        const btn3dWater = document.getElementById('btn-3d-water');

        if (btn3dReset) btn3dReset.addEventListener('click', () => this.map3d.resetCamera());
        if (btn3dMesh) btn3dMesh.addEventListener('click', () => {
            cfg.meshType = cfg.meshType === 'voxel' ? 'smooth' : 'voxel';
            this.update3dMeshBtn();
            this.map3d.updateTerrain();
        });
        if (btn3dWater) btn3dWater.addEventListener('click', () => {
            cfg.showWater = !cfg.showWater;
            btn3dWater.classList.toggle('active', cfg.showWater);
            this.map2d.render();
            this.map3d.updateTerrain();
        });
    }

    /**
     * Éléments de contrôle de l'Éditeur (Pinceaux et Sliders)
     */
    initEditorControls() {
        const tools = ['biome', 'raise', 'lower', 'smooth', 'flatten', 'eraser', 'sphere', 'box'];
        tools.forEach((t) => {
            const btn = document.getElementById(`tool-${t}`);
            if (!btn) return;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.map2d.activeTool = t;
                // Panneau tailles visible uniquement pour les formes
                const stampPanel = document.getElementById('stamp-params');
                if (stampPanel) stampPanel.style.display = (t === 'sphere' || t === 'box') ? 'block' : 'none';
                // Panneau Aplatir visible uniquement pour l'outil Aplatir
                const flattenPanel = document.getElementById('flatten-params');
                if (flattenPanel) flattenPanel.style.display = (t === 'flatten') ? 'block' : 'none';
            });
        });

        // Curseurs de taille des formes (sphère / pavé)
        this.stampParams = { w: 16, d: 16, h: 20, paintBiome: true }; // w/d en BLOCS réels
        const bindStamp = (id, valId, key) => {
            const el = document.getElementById(id), val = document.getElementById(valId);
            if (!el) return;
            el.addEventListener('input', (e) => {
                this.stampParams[key] = parseInt(e.target.value);
                if (val) val.textContent = e.target.value;
            });
        };
        bindStamp('stamp-w', 'val-stamp-w', 'w');
        bindStamp('stamp-d', 'val-stamp-d', 'd');
        bindStamp('stamp-h', 'val-stamp-h', 'h');
        const chkFlattenExact = document.getElementById('flatten-exact');
        if (chkFlattenExact) chkFlattenExact.addEventListener('change', () => {
            this.generator.config.flattenExact = chkFlattenExact.checked;
        });
        const chkStampBiome = document.getElementById('stamp-paint-biome');
        if (chkStampBiome) chkStampBiome.addEventListener('change', () => { this.stampParams.paintBiome = chkStampBiome.checked; });

        const sliderRadius = document.getElementById('brush-size');
        const valRadius = document.getElementById('val-brush-size');
        if (sliderRadius) sliderRadius.addEventListener('input', (e) => {
            this.map2d.brushRadius = parseInt(e.target.value);
            if (valRadius) valRadius.textContent = `${e.target.value}${window.t ? window.t('brushSizeVal') : ' cases'}`;
        });

        const sliderIntensity = document.getElementById('brush-intensity');
        const valIntensity = document.getElementById('val-brush-intensity');
        if (sliderIntensity) sliderIntensity.addEventListener('input', (e) => {
            this.map2d.brushIntensity = parseInt(e.target.value);
            if (valIntensity) valIntensity.textContent = e.target.value;
        });
    }

    /**
     * Initialise et rend la grille des biomes
     */
    initBiomesGrid() {
        this.renderSettingsBiomes();
        this.renderEditorBiomes();
    }

    renderSettingsBiomes() {
        const container = document.getElementById('biomes-grid');
        if (!container) return;
        container.innerHTML = '';
        if (this.generator.initBiomeRules) this.generator.initBiomeRules();

        for (let key in this.generator.biomes) {
            const b = this.generator.biomes[key];
            const bName = window.getBiomeName ? window.getBiomeName(key, b) : b.name;
            const rule = b.rule || { active: false, yMin: 0, yMax: 400, locked: false };
            const card = document.createElement('div');
            card.className = `biome-card ${this.generator.config.defaultBiome === key ? 'active' : ''}`;
            card.innerHTML = `
                <div class="biome-card-header">
                    <span class="biome-color-dot" style="background-color: ${b.color}"></span>
                    <span class="biome-name">${bName}</span>
                </div>
                <div class="biome-blocks">
                    ${b.blocks.map(bl => `<span class="block-tag">${bl}</span>`).join('')}
                </div>
                <div class="biome-rule" data-biome="${key}" style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted); cursor: pointer;">
                        <input type="checkbox" class="rule-active" ${rule.active ? 'checked' : ''}>
                        <span>${window.t ? window.t('ruleActive') : 'Actif (règle de hauteur)'}</span>
                    </label>
                    <div class="rule-details" style="display: ${rule.active ? 'block' : 'none'}; margin-top: 6px;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
                            <label style="font-size: 0.75rem; color: var(--text-muted); width: 24px;">Y-</label>
                            <input type="number" class="input-text rule-ymin" value="${rule.yMin}" min="0" max="1000" style="width: 64px; padding: 3px 6px; font-size: 0.8rem;" title="${window.t ? window.t('ruleYMinTip') : 'Couche basse : altitude minimale du biome'}">
                            <label style="font-size: 0.75rem; color: var(--text-muted); width: 24px; margin-left: 8px;">Y+</label>
                            <input type="number" class="input-text rule-ymax" value="${rule.yMax}" min="0" max="1000" style="width: 64px; padding: 3px 6px; font-size: 0.8rem;" title="${window.t ? window.t('ruleYMaxTip') : 'Couche haute : altitude maximale du biome'}">
                        </div>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted); cursor: pointer;">
                            <input type="checkbox" class="rule-locked" ${rule.locked ? 'checked' : ''}>
                            <span>🔒 ${window.t ? window.t('ruleLocked') : 'Prioritaire (bloque la peinture)'}</span>
                        </label>
                    </div>
                </div>
            `;

            // Clic sur la carte = choisir le biome par défaut (mais pas sur les contrôles de règle)
            card.addEventListener('click', (e) => {
                if (e.target.closest('.biome-rule')) return;
                document.querySelectorAll('#biomes-grid .biome-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.generator.config.defaultBiome = key;
                this.triggerRegeneration();
            });

            // ---- Contrôles de la règle ----
            const chkActive = card.querySelector('.rule-active');
            const chkLocked = card.querySelector('.rule-locked');
            const inpMin = card.querySelector('.rule-ymin');
            const inpMax = card.querySelector('.rule-ymax');
            const details = card.querySelector('.rule-details');

            chkActive.addEventListener('change', () => {
                if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                b.rule.active = chkActive.checked;
                details.style.display = chkActive.checked ? 'block' : 'none';
                this.triggerRegeneration();
            });
            chkLocked.addEventListener('change', () => {
                b.rule.locked = chkLocked.checked;
            });
            const applyRange = () => {
                let yMin = parseInt(inpMin.value, 10);
                let yMax = parseInt(inpMax.value, 10);
                if (isNaN(yMin)) yMin = 0;
                if (isNaN(yMax)) yMax = 400;
                if (yMin > yMax) { [yMin, yMax] = [yMax, yMin]; inpMin.value = yMin; inpMax.value = yMax; }
                if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                b.rule.yMin = yMin;
                b.rule.yMax = yMax;
                this.triggerRegeneration();
            };
            inpMin.addEventListener('change', applyRange);
            inpMax.addEventListener('change', applyRange);

            container.appendChild(card);
        }
    }

    renderEditorBiomes() {
        const container = document.getElementById('editor-biomes-grid');
        if (!container) return;
        container.innerHTML = '';

        for (let key in this.generator.biomes) {
            const b = this.generator.biomes[key];
            const bName = window.getBiomeName ? window.getBiomeName(key, b) : b.name;
            const btn = document.createElement('button');
            btn.className = `editor-biome-btn ${this.map2d.activeBiome === key ? 'active' : ''}`;
            btn.style.borderColor = b.color;
            btn.innerHTML = `
                <span class="color-preview" style="background-color: ${b.color}"></span>
                <span class="name">${bName}</span>
            `;
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editor-biomes-grid .editor-biome-btn').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                this.map2d.activeBiome = key;
            });
            // Palette personnalisée : croix de suppression
            if (b.custom) {
                const del = document.createElement('span');
                del.textContent = '✕';
                del.title = window.t ? window.t('delPaletteTip') : 'Supprimer cette palette';
                del.style.cssText = 'position:absolute;top:2px;right:5px;color:#ef4444;font-size:0.7rem;cursor:pointer;font-weight:700;';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!confirm(window.t ? window.t('confirmDelPalette') : 'Supprimer cette palette ? Les zones peintes reviendront au biome par défaut.')) return;
                    if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                    this.generator.removeCustomBiome(key);
                    if (this.map2d.activeBiome === key) this.map2d.activeBiome = this.generator.config.defaultBiome || 'plain';
                    this.renderEditorBiomes();
                    this.renderSettingsBiomes();
                    this.triggerRegeneration();
                });
                btn.style.position = 'relative';
                btn.appendChild(del);
            }
            container.appendChild(btn);
        }
    }

    /**
     * PALETTES PERSONNALISÉES : formulaire d'ajout (nom, couleur, blocs)
     */
    initPaletteForm() {
        const btnAdd = document.getElementById('btn-add-palette');
        const form = document.getElementById('palette-form');
        const inpName = document.getElementById('palette-name');
        const inpColor = document.getElementById('palette-color');
        const inpHex = document.getElementById('palette-color-hex');
        const inpBlocks = document.getElementById('palette-blocks');
        const btnSave = document.getElementById('btn-save-palette');
        const btnCancel = document.getElementById('btn-cancel-palette');
        if (!btnAdd || !form) return;

        btnAdd.addEventListener('click', () => {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
        if (btnCancel) btnCancel.addEventListener('click', () => { form.style.display = 'none'; });
        // Synchronisation pipette <-> champ hexa
        if (inpColor && inpHex) {
            inpColor.addEventListener('input', () => { inpHex.value = inpColor.value; });
            inpHex.addEventListener('change', () => {
                let v = inpHex.value.trim();
                if (!v.startsWith('#')) v = '#' + v;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) inpColor.value = v.toLowerCase();
                inpHex.value = inpColor.value;
            });
        }
        if (btnSave) btnSave.addEventListener('click', () => {
            const name = (inpName && inpName.value.trim()) || '';
            if (!name) { alert(window.t ? window.t('errPaletteName') : 'Donne un nom à ta palette !'); return; }
            const color = inpColor ? inpColor.value : '#a78bfa';
            const blocks = (inpBlocks && inpBlocks.value.trim())
                ? inpBlocks.value.split(',').map(s => s.trim()).filter(Boolean)
                : ['Grass Block'];
            const key = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            if (this.generator.biomes[key]) { alert(window.t ? window.t('errPaletteExists') : 'Une palette porte déjà ce nom.'); return; }
            if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
            this.generator.addCustomBiome(key, name, color, blocks);
            form.style.display = 'none';
            if (inpName) inpName.value = '';
            if (inpBlocks) inpBlocks.value = '';
            this.renderEditorBiomes();
            this.renderSettingsBiomes();
            this.map2d.activeBiome = key;
            this.renderEditorBiomes();
            window.showToast && window.showToast('🎨 ' + name + (window.t && window.I18N && window.I18N.lang === 'en' ? ' palette added!' : ' ajoutée à tes palettes !'));
        });
    }

    /**
     * Presets et actions rapides (Reset, Save preset)
     */
    initPresetsAndActions() {
        const selectPreset = document.getElementById('select-preset');
        if (selectPreset) {
            selectPreset.innerHTML = `<option value="">${window.t ? window.t('presetDefault') : '-- Choisir un Preset --'}</option>`;
            for (let k in this.generator.presets) {
                const pName = window.getPresetName ? window.getPresetName(k, this.generator.presets[k]) : this.generator.presets[k].name;
                selectPreset.innerHTML += `<option value="${k}">${pName}</option>`;
            }

            // Charger presets depuis localStorage s'il y en a
            const saved = window.safeStorage.getItem('bloxd_custom_presets');
            if (saved) {
                try {
                    const custom = JSON.parse(saved);
                    for (let k in custom) {
                        this.generator.presets[k] = custom[k];
                        selectPreset.innerHTML += `<option value="${k}">⭐ ${custom[k].name}</option>`;
                    }
                } catch (e) {}
            }

            selectPreset.addEventListener('change', (e) => {
                if (e.target.value) {
                    if (this.generator && typeof this.generator.saveStateForUndo === 'function') this.generator.saveStateForUndo();
                    this.generator.loadPreset(e.target.value);
                    this.syncUIWithConfig();
                    if (typeof this.renderBiomesList === 'function') this.renderBiomesList();
                    this.map2d.render();
                    this.map3d.updateTerrain();
                    this.updateStatsBar();
                }
            });
        }

        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        if (btnUndo) btnUndo.addEventListener('click', () => window.triggerUndo());
        if (btnRedo) btnRedo.addEventListener('click', () => window.triggerRedo());

        const btnReset = document.getElementById('btn-reset');
        if (btnReset) btnReset.addEventListener('click', () => {
            if (this.generator && typeof this.generator.saveStateForUndo === 'function') this.generator.saveStateForUndo();
            if (this.generator.customEdits) this.generator.customEdits.clear();
            this.generator.generateGrid(false);
            this.map2d.render();
            this.map3d.updateTerrain();
            this.updateStatsBar();
        });

        const btnSavePreset = document.getElementById('btn-save-preset');
        if (btnSavePreset) btnSavePreset.addEventListener('click', () => {
            const name = prompt(window.t ? window.t('promptPresetName') : "Nom du Preset personnalisé :", window.t ? window.t('defaultPresetVal') : "Mon Univers Bloxd");
            if (!name) return;
            
            // Force synchronize UI values into config before saving
            const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
            const cfg = this.generator.config;
            if (getVal('cfg-world-x')) cfg.worldSizeX = parseInt(getVal('cfg-world-x')) || cfg.worldSizeX;
            if (getVal('cfg-world-z')) cfg.worldSizeZ = parseInt(getVal('cfg-world-z')) || cfg.worldSizeZ;
            if (getVal('cfg-seed')) cfg.seed = parseInt(getVal('cfg-seed')) || cfg.seed;
            if (getVal('cfg-ground-detail') !== null) { const gdv = parseFloat(getVal('cfg-ground-detail')); if (!isNaN(gdv)) cfg.groundDetail = gdv; }
            { const cft = document.getElementById('cfg-flat-terrain'); if (cft) cfg.flatTerrain = cft.checked; }
            if (getVal('cfg-base-y')) cfg.baseY = parseInt(getVal('cfg-base-y')) || cfg.baseY;
            if (getVal('cfg-sea-level')) cfg.seaLevel = parseInt(getVal('cfg-sea-level')) || cfg.seaLevel;
            if (getVal('cfg-min-h')) cfg.minHeight = parseInt(getVal('cfg-min-h')) || cfg.minHeight;
            if (getVal('cfg-max-h')) cfg.maxHeight = parseInt(getVal('cfg-max-h')) || cfg.maxHeight;
            if (getVal('cfg-noise-scale')) cfg.noiseScale = parseFloat(getVal('cfg-noise-scale')) || cfg.noiseScale;
            if (getVal('cfg-intensity')) cfg.terrainIntensity = parseInt(getVal('cfg-intensity')) || cfg.terrainIntensity;
            if (getVal('cfg-roughness')) cfg.roughness = parseFloat(getVal('cfg-roughness')) || cfg.roughness;

            const key = 'custom_' + Date.now();
            this.generator.presets[key] = {
                name: name,
                config: JSON.parse(JSON.stringify(this.generator.config)),
                biomes: JSON.parse(JSON.stringify(this.generator.biomes)),
                customEdits: this.generator.getSerializedCustomEdits()
            };

            // Save to localStorage
            let saved = JSON.parse(window.safeStorage.getItem('bloxd_custom_presets') || '{}');
            saved[key] = this.generator.presets[key];
            window.safeStorage.setItem('bloxd_custom_presets', JSON.stringify(saved));

            if (selectPreset) {
                selectPreset.innerHTML += `<option value="${key}" selected>⭐ ${name}</option>`;
            }
            alert(`${window.t ? window.t('presetSaved') : 'Preset sauvegardé avec succès : '}${name}`);
        });
    }

    /**
     * Synchronise les contrôles visuels du formulaire avec l'objet config actuel
     */
    update3dMeshBtn() {
        const btn3dMesh = document.getElementById('btn-3d-mesh');
        if (btn3dMesh) {
            btn3dMesh.textContent = this.generator.config.meshType === 'voxel' ? (window.t ? window.t('btn3dMeshVoxel') : '🧱 Voxel') : (window.t ? window.t('btn3dMeshSmooth') : '🟢 Lisse');
        }
    }
    
    syncUIWithConfig() {
        const cfg = this.generator.config;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

        setVal('cfg-world-x', cfg.worldSizeX);
        setVal('cfg-world-z', cfg.worldSizeZ);
        setVal('cfg-seed', cfg.seed);
        setVal('cfg-ground-detail', (cfg.groundDetail === undefined ? 1 : cfg.groundDetail));
        { const cft = document.getElementById('cfg-flat-terrain'); if (cft) cft.checked = !!cfg.flatTerrain; }
        { const cim = document.getElementById('cfg-island-mode'); if (cim) cim.checked = !!cfg.islandMode; }
        { const cfe = document.getElementById('flatten-exact'); if (cfe) cfe.checked = !!cfg.flattenExact; }
        setVal('cfg-base-y', cfg.baseY);
        setVal('cfg-sea-level', cfg.seaLevel);

        setVal('cfg-min-h', cfg.minHeight); setText('val-min-h', cfg.minHeight);
        this.update3dMeshBtn();
        setVal('cfg-max-h', cfg.maxHeight); setText('val-max-h', cfg.maxHeight);
        { const w = document.getElementById('max-h-warning'); if (w) w.style.display = cfg.maxHeight > 400 ? 'block' : 'none'; }
        setVal('cfg-noise-scale', cfg.noiseScale); setText('val-noise-scale', cfg.noiseScale);
        setVal('cfg-intensity', cfg.terrainIntensity); setText('val-intensity', cfg.terrainIntensity);
        setVal('cfg-roughness', cfg.roughness); setText('val-roughness', cfg.roughness);
    }

    /**
     * Déclenche la régénération du terrain et met à jour les 2 cartes
     */
    triggerRegeneration(preserveCustom = true) {
        this.generator.generateGrid(preserveCustom);
        this.generator.rebuildShapeMask();
        this.map2d.render();
        this.map3d.updateTerrain();
        this.updateStatsBar();
    }

    /**
     * Popup de dessin de forme personnalisée (grille 64×64, upscale vers la grille réelle)
     */
    _openShapePopup() {
        const POPUP_SIZE = 64;
        // Supprime un popup existant
        const old = document.getElementById('shape-popup-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'shape-popup-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:#222633;border:1px solid #3b435b;border-radius:12px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
                <h3 style="color:#4aa8ff;margin-bottom:12px;">✏️ ${window.t ? window.t('shapeCustom') : 'Custom shape'}</h3>
                <p style="color:#8c95ac;font-size:12px;margin-bottom:12px;">${window.t ? (window.I18N.lang==='en' ? 'Draw the shape to keep. Click=paint, Right-click=erase.' : 'Dessinez la forme à garder. Clic=peindre, Clic droit=gommer.') : ''}</p>
                <canvas id="shape-popup-canvas" width="${POPUP_SIZE*6}" height="${POPUP_SIZE*6}" style="border:2px solid #3b435b;border-radius:6px;cursor:crosshair;background:#0b0d13;image-rendering:pixelated;"></canvas>
                <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
                    <button id="shape-popup-clear" class="ui-btn" style="background:#2c3244;border:1px solid #3b435b;color:#eef2f8;padding:8px 14px;border-radius:6px;cursor:pointer;">Clear</button>
                    <button id="shape-popup-cancel" class="ui-btn" style="background:#2c3244;border:1px solid #3b435b;color:#eef2f8;padding:8px 14px;border-radius:6px;cursor:pointer;">Cancel</button>
                    <button id="shape-popup-ok" class="ui-btn" style="background:#4aa8ff;border:none;color:#061018;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const cv = document.getElementById('shape-popup-canvas');
        const ctx2 = cv.getContext('2d');
        const CELL_PX = cv.width / POPUP_SIZE;
        const mask = new Uint8Array(POPUP_SIZE * POPUP_SIZE); // 0=outside, 1=inside
        let painting = false, erasing = false;

        function drawGrid() {
            ctx2.fillStyle = '#0b0d13';
            ctx2.fillRect(0, 0, cv.width, cv.height);
            for (let y = 0; y < POPUP_SIZE; y++) {
                for (let x = 0; x < POPUP_SIZE; x++) {
                    if (mask[y * POPUP_SIZE + x]) {
                        ctx2.fillStyle = '#4aa8ff';
                        ctx2.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX + 0.5, CELL_PX + 0.5);
                    }
                }
            }
        }
        function paintAt(cx, cy, erase) {
            const gx = Math.floor(cx / CELL_PX), gy = Math.floor(cy / CELL_PX);
            const r = 2;
            for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
                if (dx*dx + dy*dy > r*r) continue;
                const nx = gx + dx, ny = gy + dy;
                if (nx < 0 || nx >= POPUP_SIZE || ny < 0 || ny >= POPUP_SIZE) continue;
                mask[ny * POPUP_SIZE + nx] = erase ? 0 : 1;
            }
            drawGrid();
        }

        cv.addEventListener('mousedown', e => {
            const rect = cv.getBoundingClientRect();
            const sx = cv.width / rect.width, sy = cv.height / rect.height;
            painting = true; erasing = e.button === 2;
            paintAt((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy, erasing);
        });
        cv.addEventListener('mousemove', e => {
            if (!painting) return;
            const rect = cv.getBoundingClientRect();
            const sx = cv.width / rect.width, sy = cv.height / rect.height;
            paintAt((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy, erasing);
        });
        window.addEventListener('mouseup', () => { painting = false; });
        cv.addEventListener('contextmenu', e => e.preventDefault());

        document.getElementById('shape-popup-clear').addEventListener('click', () => {
            mask.fill(0); drawGrid();
        });
        document.getElementById('shape-popup-cancel').addEventListener('click', () => {
            overlay.remove();
            selShape.value = this.generator.config.shapeMode !== 'custom' ? this.generator.config.shapeMode : 'square';
        });
        document.getElementById('shape-popup-ok').addEventListener('click', () => {
            // Upscale 64×64 → grille réelle
            const grid = this.generator.grid;
            const resX = grid.length, resZ = grid[0] ? grid[0].length : 0;
            this.generator.shapeMask = [];
            for (let gx = 0; gx < resX; gx++) {
                const row = new Uint8Array(resZ);
                for (let gz = 0; gz < resZ; gz++) {
                    const px = Math.floor(gx / resX * POPUP_SIZE);
                    const pz = Math.floor(gz / resZ * POPUP_SIZE);
                    row[gz] = mask[pz * POPUP_SIZE + px] || 0;
                }
                this.generator.shapeMask.push(row);
            }
            overlay.remove();
            this.map2d.render();
            this.map3d.updateTerrain();
        });

        drawGrid();
        // Remplissage par défaut : tout à 1 (forme pleine)
        mask.fill(1);
        drawGrid();
    }

    /**
     * Met à jour la barre de statistiques (hauteurs min/max et compteurs de biomes)
     */
    updateStatsBar() {
        const stMin = document.getElementById('stat-min-h');
        const stMax = document.getElementById('stat-max-h');
        const stAvg = document.getElementById('stat-avg-h');
        if (stMin) stMin.textContent = `${this.generator.stats.minHeight}m`;
        if (stMax) stMax.textContent = `${this.generator.stats.maxHeight}m`;
        if (stAvg) stAvg.textContent = `${this.generator.stats.avgHeight}m`;
    }

    /**
     * Initialisation de la modale d'export (Télécharger le projet en ZIP / Script Python)
     */
    initExportModal() {
        const btnOpen = document.getElementById('btn-download-project');
        const modal = document.getElementById('export-modal');
        const btnClose = document.getElementById('btn-close-modal');
        const btnDownloadZip = document.getElementById('btn-do-download-zip');
        const inputFilename = document.getElementById('export-filename');
        const inputFoldername = document.getElementById('export-foldername');
        const inputAnchorX = document.getElementById('export-anchor-x');
        const inputAnchorY = document.getElementById('export-anchor-y');
        const inputAnchorZ = document.getElementById('export-anchor-z');

        if (!btnOpen || !modal) return;

        // Nettoie un nom de fichier/dossier saisi par l'utilisateur (retire l'extension
        // éventuelle et les caractères invalides sur la plupart des systèmes de fichiers)
        const sanitizeName = (raw, fallback) => {
            let n = (raw || "").trim().replace(/\.bloxdschem$/i, "").replace(/[\\/:*?"<>|]/g, "");
            return n.length > 0 ? n : fallback;
        };

        btnOpen.addEventListener('click', () => {
            modal.classList.add('active');
        });

        if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        if (btnDownloadZip) btnDownloadZip.addEventListener('click', async () => {
            btnDownloadZip.disabled = true;
            btnDownloadZip.innerHTML = '<i class="fas fa-cog fa-spin"></i> Génération directe du schématique...';

            try {
                // STYLE PIXELISE : lit la case à cocher de la modale
                const chkPix = document.getElementById('export-pixelated');
                this.generator.config.pixelatedExport = !!(chkPix && chkPix.checked);
                // MONO-FICHIER FORCÉ : pour outils externes hors Bloxd
                const chkSingle = document.getElementById('export-single-file');
                this.generator.config.forceSingleSchem = !!(chkSingle && chkSingle.checked);
                const schemBytes = this.generator.exportSchematicBinary();
                const anchorX = parseInt(inputAnchorX?.value, 10) || 0;
                const anchorY = parseInt(inputAnchorY?.value, 10) || 0;
                const anchorZ = parseInt(inputAnchorZ?.value, 10) || 0;

                if (!schemBytes.splitFiles || schemBytes.splitFiles.length <= 1) {
                    // Téléchargement direct et unique du fichier .bloxdschem sans rien d'autre
                    const filename = sanitizeName(inputFilename?.value, "monde_personnalise");
                    const blob = new Blob([schemBytes], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${filename}.bloxdschem`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    // Si le monde est grand (>180 chunks), on regroupe les parties dans un ZIP
                    const foldername = sanitizeName(inputFoldername?.value, "schematics_decoupes");
                    const zip = new JSZip();
                    const schemFolder = zip.folder(foldername);
                    let guideTxt = (window.t && window.I18N && window.I18N.lang === 'en') ? window.t('guideSplitHeader') : "============================================================\n📦 MONDE DÉCOUPÉ EN PARTIES (<200 CHUNKS/FICHIER)\n";
                    guideTxt += "============================================================\n\n";
                    guideTxt += "Ce monde étant volumineux, il a été découpé en plusieurs fichiers pour respecter\n";
                    guideTxt += "la limite technique de Bloxd.io (~200 chunks maximum par commande //schematic load).\n\n";
                    guideTxt += "⚠️ IMPORTANT : Bloxd.io ne repositionne PAS automatiquement chaque partie à sa\n";
                    guideTxt += "place dans le monde (comme le fait aussi l'outil officiel M2B pour ses schematics\n";
                    guideTxt += "découpés) : c'est à VOUS de vous déplacer entre deux chargements, sinon toutes\n";
                    guideTxt += "les parties se superposent au même endroit.\n\n";
                    guideTxt += "Chaque fichier est nommé numéro_[posX,posY,posZ], où posX/posY/posZ correspond à\n";
                    guideTxt += "la position (dans le monde Bloxd) de l'angle où poser ce schéma, calculée à partir\n";
                    guideTxt += `de la position d'ancrage que vous avez choisie (${anchorX}, ${anchorY}, ${anchorZ}).\n\n`;
                    guideTxt += "INSTRUCTIONS D'IMPORTATION :\n";
                    guideTxt += `1. Placez tous les fichiers .bloxdschem du dossier "${foldername}" dans le répertoire schématiques de Bloxd.\n`;
                    guideTxt += "2. En jeu, rendez-vous à la position de l'angle de collage indiquée dans le nom du 1er fichier.\n";
                    guideTxt += "3. Pour chaque fichier ci-dessous, déplacez-vous à la position [posX,posY,posZ] indiquée dans\n";
                    guideTxt += "   son nom, PUIS chargez-le :\n\n";
                    guideTxt += "🚨 RÈGLE D'OR — ALTITUDE Y CONSTANTE :\n";
                    guideTxt += "Bloxd colle chaque schéma PAR RAPPORT À VOTRE POSITION, Y COMPRIS VOTRE HAUTEUR !\n";
                    guideTxt += `Chargez TOUTES les parties depuis EXACTEMENT la même altitude Y=${anchorY}.\n`;
                    guideTxt += "Si vous marchez sur le terrain déjà généré (dunes, collines...), votre Y varie et\n";
                    guideTxt += "la partie suivante sera DÉCALÉE VERTICALEMENT (falaises de roche, sable surélevé).\n";
                    guideTxt += "👉 Astuce : passez en vol (/fly ou mode créatif), placez-vous à Y exact affiché\n";
                    guideTxt += "   à l'écran, et vérifiez ce Y avant CHAQUE //schematic load.\n\n";

                    schemBytes.splitFiles.forEach((file, idx) => {
                        const posX = anchorX + (file.offsetX || 0);
                        const posY = anchorY;
                        const posZ = anchorZ + (file.offsetZ || 0);
                        const schemName = `${idx + 1}_[${posX},${posY},${posZ}]`;
                        schemFolder.file(`${schemName}.bloxdschem`, file.bytes);
                        guideTxt += `   [${schemName}] Position : X=${posX}, Y=${posY}, Z=${posZ}\n`;
                        guideTxt += `   //schematic load ${schemName}\n\n`;
                    });

                    zip.file("GUIDE_CHARGEMENT_PARTIES.txt", guideTxt);
                    const blob = await zip.generateAsync({ type: "blob" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${foldername}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } catch (err) {
                console.error("Erreur lors de la génération du fichier .bloxdschem:", err);
                alert(window.t ? window.t('errSchemGen') : "Erreur lors de la création du fichier .bloxdschem.");
            } finally {
                btnDownloadZip.disabled = false;
                btnDownloadZip.innerHTML = '<i class="fas fa-download"></i> Télécharger le fichier .bloxdschem';
            }
        });
    }

    getDirectGuideContent() {
        if (window.t && window.I18N && window.I18N.lang === 'en') return window.t('directGuideContent');
        return `============================================================
📦 GUIDE D'IMPORTATION DIRECTE DANS BLOXD.IO
============================================================

Félicitations ! Votre monde a été généré en direct par Bloxd Terrain Editor sans avoir besoin de code Python.
Le fichier schématique prêt à l'emploi est situé dans le dossier "schematics" :
👉 monde_personnalise.bloxdschem

MODE D'EMPLOI EN 3 ÉTAPES SIMPLES :
1. Lancez Bloxd.io dans votre navigateur internet.
2. Placez le fichier "monde_personnalise.bloxdschem" dans votre dossier de schématiques Bloxd (ou utilisez un proxy/mod compatible).
3. Ouvrez le tchat en jeu et tapez la commande :
   //schematic load monde_personnalise

Et voilà ! Votre terrain apparaîtra instantanément dans le jeu.
============================================================
Note pour les développeurs : Si vous préférez exécuter les scripts manuellement, 
ils sont conservés dans le dossier "options_avancees_python/".
`;
    }

    getReadmeContent() {
        if (window.t && window.I18N && window.I18N.lang === 'en') return window.t('readmeHeader');
        return `# 📦 Projet Terrain Bloxd.io Personnalisé
Généré depuis l'application **Bloxd Terrain Editor**

## 🚀 Contenu de l'archive
- \`generate_terrain.py\` : Script de génération configuré avec vos paramètres exacts et biomes.
- \`bloxd_format.py\` : Moteur d'écriture binaire Avro (.bloxdschem).
- \`nameToId.json\` : Table de mapping des ID de blocs Bloxd.io.

## 🛠️ Comment générer votre carte sur votre ordinateur
1. Assurez-vous d'avoir Python 3 installé avec \`numpy\` :
   \`\`\`bash
   pip install numpy
   \`\`\`
2. Exécutez le générateur :
   \`\`\`bash
   python generate_terrain.py
   \`\`\`
3. Un fichier **\`custom_terrain.bloxdschem\`** sera généré en quelques secondes.

## 🎮 Comment importer dans Bloxd.io
1. Lancez Bloxd.io dans votre navigateur (mode Créatif ou serveur Worlds avec permissions).
2. Placez le fichier \`custom_terrain.bloxdschem\` ou utilisez un mod/proxy compatible avec les commandes de schématiques de Bloxd.
3. Chargez le schématique en jeu via la commande :
   \`//schematic load custom_terrain\`

Profitez de votre nouveau monde Bloxd ! 🌟
`;
    }

    getBloxdFormatPyContent() {
        return `"""
Low-level .bloxdschem (Avro-based) binary writer.
Reverse engineered from Bloxd.io schematic converter.
"""
import struct

def _uvarint(n: int) -> bytes:
    out = bytearray()
    n = int(n)
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)

def avro_int(n: int) -> bytes:
    n = int(n)
    zz = (n << 1) if n >= 0 else ((-n << 1) - 1)
    return _uvarint(zz)

def avro_string(s: str) -> bytes:
    b = s.encode("utf-8")
    return avro_int(len(b)) + b

def avro_bytes(b: bytes) -> bytes:
    return avro_int(len(b)) + b

class BloxdSchemWriter:
    def __init__(self, f, name: str, size_x: int, size_y: int, size_z: int, pos=(0, 0, 0)):
        self.f = f
        self._chunk_count = 0
        self._buffer = bytearray()
        self._flush_every = 512
        self.f.write(b"\\x00\\x00\\x00\\x00")
        self.f.write(avro_string(name))
        self.f.write(avro_int(pos[0]))
        self.f.write(avro_int(pos[1]))
        self.f.write(avro_int(pos[2]))
        self.f.write(avro_int(size_x))
        self.f.write(avro_int(size_y))
        self.f.write(avro_int(size_z))

    def add_chunk(self, cx: int, cy: int, cz: int, rle_bytes: bytes):
        self._buffer += avro_int(cx)
        self._buffer += avro_int(cy)
        self._buffer += avro_int(cz)
        self._buffer += avro_bytes(rle_bytes)
        self._chunk_count += 1
        if self._chunk_count >= self._flush_every:
            self._flush_block()

    def _flush_block(self):
        if self._chunk_count == 0: return
        self.f.write(avro_int(self._chunk_count))
        self.f.write(bytes(self._buffer))
        self._buffer = bytearray()
        self._chunk_count = 0

    def finish(self):
        self._flush_block()
        self.f.write(avro_int(0))
`;
    }

    getFallbackNameToId() {
        return {
            "Air": 0, "Dirt": 2, "Grass Block": 4, "Sand": 5, "Clay": 6, "Snow": 8,
            "Stone": 28, "Smooth Stone": 31, "Lime Wool": 56, "Green Wool": 64,
            "Lime Baked Clay": 73, "Green Baked Clay": 81, "Orange Baked Clay": 69,
            "Lime Concrete": 91, "Green Concrete": 98, "White Concrete": 97,
            "Yellow Concrete": 99, "Black Concrete": 86, "Water": 126,
            "Stone Bricks": 129, "Cracked Stone Bricks": 136, "Smooth Sandstone": 137,
            "Obsidian": 140, "Packed Snow": 8, "Sandstone": 38,
            "Baked Clay": 67, "Red Baked Clay": 82, "Dark Red Brick": 130, "Dark Red Stone": 131,
            "Smooth Red Sandstone": 475, "Red Sand": 650, "Magma": 471, "Cherry Log": 1222
        };
    }
}
window.UIManager = UIManager;

/* ═══════════════════════════════════════════════════════════════ */
/*  main  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_main.js
   Point d'entrée : toasts, undo/redo (Ctrl+Z/Y), initApp(), démarrage au DOMContentLoaded.
   Chargement : 8/8 — chargé en DERNIER (voir <script> dans terrain_editor.html)
   ============================================================ */

window.showToast = function(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = "position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); color: #38bdf8; border: 1px solid #38bdf8; padding: 10px 22px; border-radius: 30px; font-weight: 600; font-size: 0.95rem; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: opacity 0.3s ease; pointer-events: none;";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
};

window.triggerUndo = function() {
    if (!window.generatorInstance || typeof window.generatorInstance.undo !== 'function') return;
    const success = window.generatorInstance.undo();
    if (!success) return;
    if (window.uiManagerInstance) window.uiManagerInstance.syncUIWithConfig();
    if (window.map2dInstance) window.map2dInstance.render();
    if (window.map3dInstance) window.map3dInstance.updateTerrain();
    if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
    window.showToast(window.t ? window.t('toastUndo') : "↩️ Action annulée (Undo)");
};

window.triggerRedo = function() {
    if (!window.generatorInstance || typeof window.generatorInstance.redo !== 'function') return;
    const success = window.generatorInstance.redo();
    if (!success) return;
    if (window.uiManagerInstance) window.uiManagerInstance.syncUIWithConfig();
    if (window.map2dInstance) window.map2dInstance.render();
    if (window.map3dInstance) window.map3dInstance.updateTerrain();
    if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
    window.showToast(window.t ? window.t('toastRedo') : "↪️ Action rétablie (Redo)");
};

if (!window._undoShortcutsBound) {
    window._undoShortcutsBound = true;
    window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            return;
        }
        // Ces raccourcis ne s'appliquent qu'à l'Éditeur, pas aux Paramètres (Settings) !
        if (!window.map2dInstance || window.map2dInstance.activeTab === 'settings') {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ')) {
            e.preventDefault();
            window.triggerUndo();
        } else if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || e.code === 'KeyY')) ||
                   ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ'))) {
            e.preventDefault();
            window.triggerRedo();
        }
    });
}
            /**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Fichier principal : terrain_editor_main.js
 * Rôle : Point d'entrée de l'application, initialisation des modules et coordination
 */

function initApp() {
    try {
        console.log("🚀 Lancement de Bloxd Terrain Editor...");

        if (typeof window.TerrainGenerator === 'undefined') {
            console.error("Les modules JS n'ont pas été chargés !");
            return;
        }

        // 1. Initialisation du Générateur
        const generator = new window.TerrainGenerator();
        generator.generateGrid();

        // 2. Initialisation de la vue 3D (Babylon.js)
        const map3d = new window.Map3D('map3d-container', generator);

        // 3. Initialisation de la vue 2D (Canvas) avec callback de modification
        const map2d = new window.Map2D('map2d-canvas', generator, (region) => {
            // Callback appelé à chaque coup de pinceau sur la carte 2D.
            // TACHE 2 : si la zone modifiée est connue, mise à jour 3D PARTIELLE
            // (seuls les vertices touchés sont réécrits) ; sinon rebuild complet.
            if (region && typeof map3d.updateTerrainRegion === 'function') {
                map3d.updateTerrainRegion(region.gxMin, region.gxMax, region.gzMin, region.gzMax);
            } else {
                map3d.updateTerrain();
            }
        });

        // 4. Initialisation du gestionnaire UI et des contrôles
        const ui = new window.UIManager(generator, map2d, map3d);

        window.generatorInstance = generator;
        window.map2dInstance = map2d;
        window.map3dInstance = map3d;
        window.uiManagerInstance = ui;

        // Synchronisation initiale et premier affichage
        ui.syncUIWithConfig();
        map2d.render();
        map3d.updateTerrain();
        ui.updateStatsBar();

        if (window.applyLanguage && window.I18N) {
            window.applyLanguage(window.I18N.lang || 'fr');
        }

        // Masquer l'écran de chargement s'il est présent
        const loader = document.getElementById('app-loading');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 400);
            }, 300);
        }

        console.log("✅ Bloxd Terrain Editor initialisé avec succès !");
    } catch (err) {
        console.error("Erreur lors de l'initialisation de l'application:", err);
        const loader = document.getElementById('app-loading');
        if (loader) {
            loader.innerHTML = `<div style="color: #ef4444; font-size: 2rem; margin-bottom: 16px;"><i class="fas fa-exclamation-triangle"></i></div>
            <h2 style="color: #fff; font-size: 1.2rem;">Erreur de chargement</h2>
            <p style="color: #f87171; margin-top: 8px; max-width: 500px; text-align: center;">${err.message}</p>`;
        }
    }
}

if (document.readyState === 'loading') {
// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // Si le document est déjà chargé
    setTimeout(initApp, 50);
}
