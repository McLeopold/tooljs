var finddir = require('./finddir.js')
  , fs = require('fs')
  , async = require('async')
  , util = require('util')
  , path = require('path')
;

function mkdir (dir, mode, callback) {
  if (typeof mode === 'function') {
    callback = mode;
    mode = undefined;
  }
  fs.mkdir(dir, mode, function (err) {
    if (err) {
      console.log('error mkdiring ' + dir);
    } else {
      console.log('mkdir ' + dir, mode);
    }
    callback(err);
  });
}

function rmdir (dir, callback) {
  fs.rmdir(dir, function (err) {
    if (err) {
      console.error('error rmdiring ' + dir);
    } else {
      console.log('rmdir ' + dir);
    }
    callback(err);
  });
}

function cp (src, dst, options, callback) {
  var that = this
    , log = function () {
      (that && that.log || console.log).apply(that, arguments);
  };
  function file_copy(src_file, dst_file, callback) {
    util.pump(fs.createReadStream(src_file),
              fs.createWriteStream(dst_file),
              function (err) {
                if (err) {
                  log('error copying ' + src_file + ' -> ' + dst_file);
                } else {
                  log('copy  ' + src_file + ' -> ' + dst_file);
                }
                callback(err);
              });
  }
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  log('copying ' + src + ' -> ' + dst);
  fs.stat(dst, function (err, stats) {
    if (err) {
      if (/\\\//.test(src[src.length-1]) || /[\*\?\[\]]/.test(src)) {
        console.error('destination "' + dst + '"" does not exist');
        callback(err);
      } else {
        // assume src is file destination
        file_copy(src, dst, callback);
      }
    } else if (!stats.isDirectory()) {
      if (/[\*\?\[\]]/.test(src)) {
        console.error('destination "' + dst + '"" is not a directory');
        callback(new Error('not a directory'));
      } else {
        // assume src is file destination
        file_copy(src, dst, callback);
      }
    } else {
      finddir(src,
        { recursive: options.recursive,
          dirs: options.recursive,
          stats: true },
        function (err, root, files) {
          async.forEachSeries(files, function (file, callback) {
            var src_file = path.join(root, file.name)
              , dst_file = path.join(dst, file.name)
            ;
            fs.stat(src_file, function (err, stats) {
              if (stats.isDirectory()) {
                fs.stat(dst_file, function (err, stats) {
                  if (err) {
                    fs.mkdir(dst_file, function (err) {
                      log('mkdir ' + dst_file);
                      callback(err); // ignore error
                    });
                  } else {
                    //console.log('directory already exists: ' + dst_file);
                    callback();
                  }
                });
              } else if (stats.isFile()) {
                file_copy(src_file, dst_file, callback);
              }
            });
          }, callback);
        },
        callback
      )
    }
  })
}

function rm (src, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  console.log('remove ' + src);
  finddir(src,
    { recursive: options.recursive,
      dirs: options.recursive,
      stats: true },
    function (err, root, files) {
      files.reverse();
      async.forEachSeries(files, function (file, callback) {
        if (file.stats.isDirectory()) {
          fs.rmdir(path.join(root, file.name), function (err) {
            console.log('rmdir  ' + path.join(root, file.name));
            callback();
          });
        } else if (file.stats.isFile()) {
          fs.unlink(path.join(root, file.name), function (err) {
            if (err) {
              console.log('error deleting ' + path.join(root, file.name));
            } else {
              console.log('remove ' + path.join(root, file.name));
            }
            callback(err);
          });
        }
      }, callback);
    },
    callback
  );
}

module.exports = {
  cp: cp,
  copy: cp,
  mkdir: mkdir,
  rmdir: rmdir,
  del: rm,
  rm: rm
};