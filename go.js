var exec = require('./lib/util/exec.js')
;

exec([], {verbose: true}, function () { console.log('finished'); })
  .echo('testing...')
  .ls('stuff/', {recursive: true})
  .cp('node_modules/*', 'stuff', {recursive: true})
  .echo('done.')
;