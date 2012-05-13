var async = require('async')
  , path = require('path')
  , fs = require('fs')
;

finddir = function (name, options, cb) {
  // reorder parameters if there are no options
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  // setup default options and variables
  var parts = name.split(/\\|\//)
    , include_dirs = options.dirs === undefined ? false : options.dirs
    , include_files = options.files === undefined ? true : options.files
    , include_all = options.all === undefined ? false : options.all
    , recursive = options.recursive === undefined ? false : options.recursive
    , include_stats = options.stats === undefined ? false : options.stats
    , root
    , add_file
    , files = []
  ;
  function add_file (file, stats) {
    //console.log('add_file:', file);
    var name = cb.length === 2 ?
      path.join(root, file) :
      file;
    if (include_stats) {
      files.push({name: name, stats: stats});
    } else {
      files.push(name);
    }
  }
  callback = function (err) {
    if (cb.length === 2) {
      cb(err, files);
    } else {
      cb(err, root, files);
    }
  };
  // set root path to filesystem root or current directory
  // or first stable part of search path
  if (parts[0] === '') {
    parts.shift();
    root = '/';
  } else {
    root = '.';
  }
  while (parts.length > 0 && !(/[\*\?\[\]]/.test(parts[0]))) {
    root = path.join(root, parts.shift());
  }
  //console.log('matching:', root, parts);
  // ensure root path exists
  fs.stat(root, function (err, stats) {
    if (err) throw err;
    if (parts.length > 0) {
      match_files('', parts, callback);
    } else if (recursive) {
      list_files('', callback);
    } else {
      // return early if there is no wildcards to match
      var basename = path.basename(root);
      root = root.slice(0, -path.basename(root).length);
      if (stats.isDirectory()) {
        include_dirs && add_file(basename, stats);
      }
      if (stats.isFile()) {
        include_files && add_file(basename, stats);
      }
      callback();
    }
  })
  // function to recursively search wildcard paths
  function match_files (dir, patterns, callback) {
    //console.log('match_files:', root, dir, patterns);
    // translate file matching patterns to regexp
    var pattern = RegExp('^' +
                         patterns[0]
                           .replace(/\./g, '\\.')
                           .replace(/\*/g, '.*')
                           .replace(/\?/g, '.')
                         + '$');
    //console.log('reading from ', path.join(root, dir));
    fs.readdir(path.join(root, dir), function (err, files) {
      if (err) {
        console.error('error reading directory ' + path.join(root, dir));
        callback(err);
      }
      async.forEach(files,
        function (file, callback) {
          //console.log('match_file:', root, dir, file);
          if (pattern.test(file)) {
            if (include_all || file[0] !== '.' || patterns[0][0] === '.') {
              file = path.join(dir, file);
              fs.stat(path.join(root, file), function (err, stats) {
                if (patterns.length > 1) {
                  if (patterns[1] === '') {
                    if (stats.isDirectory()) {
                      include_dirs && add_file(file, stats);
                      recursive ? list_files(file, callback) : callback();
                    } else {
                      callback();
                    }
                  } else {
                    if (stats.isDirectory()) {
                      match_files(file, patterns.slice(1), callback);
                    } else {
                      callback();
                    }
                  }
                } else {
                  if (stats.isDirectory()) {
                    include_dirs && add_file(file, stats);
                    recursive ? list_files(file, callback) : callback();
                  } else if (stats.isFile()) {
                    include_files && add_file(file, stats);
                    callback();
                  }
                }
              });
            } else {
              callback();
            }
          } else {
            callback();
          }
        },
        callback
      );
      //console.log('not done with match_files');
    });
  }
  // function to recusively list all files and directories
  function list_files (dir, callback) {
    //console.log('list_files:', dir);
    fs.readdir(path.join(root, dir), function (err, files) {
      if (err) {
        console.error('error reading directory ' + path.join(root, dir));
        callback(err);
      }
      if (files.length === 0) {
        callback();
      } else {
        async.forEach(files,
          function (file, callback) {
            //console.log('list:', root, dir, file);
            if (include_all || file[0] !== '.') {
              file = path.join(dir, file);
              fs.stat(path.join(root, file), function (err, stats) {
                if (stats.isDirectory()) {
                  include_dirs && add_file(file, stats);
                  list_files(file, callback);
                } else if (stats.isFile()) {
                  include_files && add_file(file, stats);
                  callback();
                }
              });
            } else {
              callback();
            }
          },
          callback
        );
        //console.log('not done with list_files ' + dir);
      }
    });
  }
  //console.log('not done with finddir');
}

module.exports = finddir;