var tilerator = require('tilerator');
var options = {
  'infile': 'foobar.jpg',
    'outfile' : 'baz.jpg',
    'tileWidth' : 20,
    'tileHeight' : 20,
    'gapWidth' : 10
};

tilerator.tilerate(options);

