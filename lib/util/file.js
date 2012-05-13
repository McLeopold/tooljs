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
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  log('copying ' + src + ' -> ' + dst);
  fs.stat(dst, function (err, stats) {
    if (err) {
      console.error('destination "' + dst + '"" does not exist');
      callback(err);
    } else if (!stats.isDirectory()) {
      console.error('destination "' + dst + '"" is not a directory');
      callback(new Error('not a directory'));
    } else {
      finddir(src,
        { recursive: options.recursive,
          dirs: options.recursive,
          stats: true },
        function (err, root, files) {
          async.forEachSeries(files, function (file, callback) {
            var src_file = path.join(src, file.name)
              , dst_file = path.join(dst, file.name)
            ;
            fs.stat(dst_file, function (err, stats) {
              if (file.stats.isDirectory()) {
                if (err) {
                  fs.mkdir(dst_file, function (err) {
                    log('mkdir ' + dst_file);
                    callback(err); // ignore error
                  });
                } else {
                  //console.log('directory already exists: ' + dst_file);
                  callback();
                }
              } else if (file.stats.isFile()) {
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