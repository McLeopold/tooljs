var async = require('async')
  , tool = require('./file.js')
  , execp = require('child_process').exec
  , util = require('util')
;

// Exec object contains list of cmds
function Exec (cmds, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else {
    options = options || {};
  }
  var that = this;
	this.cmds = cmds || [];
  callback = callback || function () {};
  async.nextTick(function () {
    console.log('starting exec...');
    async.series(that.cmds, callback);
  });
  this.verbose = !!options.verbose;
}

// Extend the Exec prototype to include more commands
// fn must take a callback as the last argument
Exec.extend = function (names, fn) {
  var thunk_maker = function () {
    var that = this;
    var args = [].slice.call(arguments, 0);
    this.cmds.push(function (callback) {
      var new_args = [].slice.call(args, 0);
      new_args.push(callback);
      fn.apply(that, new_args);
    });
    return this;
  }
  if (typeof names === 'string') {
    Exec.prototype[names] = thunk_maker;
  } else {
    names.forEach(function (name) {
      Exec.prototype[name] = thunk_maker;
    });
  }
  return this;
}

Exec.prototype.log = function () {
  if (this.verbose) {
    console.log.apply(null, arguments);
  }
}

// factory function to create new exec and return for chaining
function exec(cmds, options, callback) {
  if (typeof cmds === 'function') {
    callback = cmds;
    options = undefined;
    cmds = undefined;
  } else if (typeof options === 'function') {
    callback = options;
    options = undefined;
    if (typeof cmds === 'object') {
      options = cmds;
      cmds = undefined;
    }
  }
  return new Exec(cmds, options, callback);
}

Exec.extend('echo', function (msg, callback) {
  console.log(msg);
  callback();
});

Exec.extend(['exec', 'run'], function (cmd, callback) {
  console.log('executing ' + cmd);
  execp(cmd, function (err, stdout, stderr) {
    util.puts(err ? stderr : stdout);
    callback(err);
  });
});

Exec.extend(['cp', 'copy'], tool.cp);
Exec.extend(['rm', 'del'], tool.rm);
Exec.extend('mkdir', tool.mkdir);
Exec.extend('rmdir', tool.rmdir);
Exec.extend(['ls', 'dir'], tool.ls);

module.exports = exec;