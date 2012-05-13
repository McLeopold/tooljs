var finddir = require('./lib/util/finddir.js')
  , tool = require('./lib/util/file.js')
  , exec = require('./lib/util/exec.js')
;

/*
finddir('node_modules/*',
  { recursive: true,
    dirs: true,
    stats: true },
  function (err, root, files) {
    console.log('done');
    files.forEach(function (file) {
      console.log(root, file.name, file.stats.isFile());
    })
  }
);
*/

/*
tool.copy('node_modules', 'stuff', {recursive: true},
  function (err) {
    console.log('done with copy');
  }
);
*/

/*
tool.rm('stuff', true)(function (err) {
  console.log('done with remove');
});
*/

exec([], {verbose: true})
  .echo('test')
  .rm('stuff/*', {recursive: true})
  .copy('node_modules', 'stuff', {recursive: true})
;