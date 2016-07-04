'use strict';

var fs = require('fs');
var path = require('path');
var jpeg = require('jpeg-js');
var PNG = require('pngjs').PNG;
var filetype = require('file-type');
var mime = require('mime');


exports.tilerate = function (options, cb) {

        var options = options || {};

        var cb = cb || function(){};


        var tileWidth = options.tileWidth || 20;
        var tileHeight = options.tileHeight || 20;

        var numTilesX = options.numTilesX || 5;
        var numTilesY = options.numTilesY || 5;


        var tileGapX = options.tileGapX || 2;
        var tileGapY = options.tileGapY || 2;

        var tileGapColor = options.tileGapColor || 0x000000;
        var tileGapAlpha = options.tileGapAlpha || 255; //only applies if file format supports alpha

        const FILE_TYPE_PNG = 1;


        var fileName = options.infile || 'test.png';
        var imageData = fs.readFile(fileName, function (err, imageData) {

            if (err) {
                console.log(err);
                return false;
            }

            var imageType = filetype(imageData).mime;

            switch (imageType) {

                case 'image/jpeg':

                    var bufferData = createBufferFromImageData(jpeg.decode(imageData));
                    saveJPG(bufferData, jpeg.decode(imageData));
                    break;

                case 'image/png':

                    var pngData = new PNG({}).parse(imageData, function (err, data) {
                        var bufferData = createBufferFromImageData(data);
                        savePNG(bufferData, data);
                    });

                    break;

                default:
                    console.log('unknown filetype. doing nothing.');
                    break;
            }

        });


        function createBufferFromImageData(imageData) {

            numTilesX = Math.ceil(imageData.width / tileWidth);
            numTilesY = Math.ceil(imageData.height / tileHeight);

            var actualTileWidth = tileWidth;
            var actualTileHeight = tileHeight;

            var newBuffer = new Buffer((imageData.width + tileGapX * (numTilesX - 1)) * 4 * (imageData.height + tileGapY * (numTilesY)));
            var nidx = 0;

            for (var currentTileY = 0; currentTileY < numTilesY; currentTileY++) {

                if (currentTileY > 0) {

                    //insert horizontal gap
                    for (var gapIdy = 0; gapIdy < tileGapY; gapIdy++) {
                        for (var gpx = 0; gpx < imageData.width + tileGapX * (numTilesX - 1); gpx++) {
                            newBuffer[nidx++] = 0;
                            newBuffer[nidx++] = 0;
                            newBuffer[nidx++] = 0;
                            newBuffer[nidx++] = 0;
                        }
                    }
                }

                //calculate the size of the last tile
                actualTileHeight = (currentTileY * tileHeight + tileHeight > imageData.height)
                    ? imageData.height - (currentTileY) * tileHeight
                    : tileHeight;

                for (var y = 0; y < actualTileHeight; y++) {

                    for (var currentTileX = 0; currentTileX < numTilesX; currentTileX++) {

                        //insert vertical gap
                        if (currentTileX > 0 && currentTileX < numTilesX) {
                            for (var gapIdx = 0; gapIdx < tileGapX; gapIdx++) {
                                newBuffer[nidx++] = 0;
                                newBuffer[nidx++] = 0;
                                newBuffer[nidx++] = 0;
                                newBuffer[nidx++] = 0;
                            }
                        }

                        //last tile might be smaller, calculate actual width
                        actualTileWidth = (currentTileX * tileWidth + tileWidth > imageData.width)
                            ? imageData.width - currentTileX * tileWidth
                            : tileWidth;

                        //copy image data into new buffer at updated positions
                        for (var x = 0; x < actualTileWidth; x++) {
                            var idx = (imageData.width * (currentTileY * tileHeight + y) + x + currentTileX * tileWidth) << 2;
                            newBuffer[nidx++] = imageData.data[idx];
                            newBuffer[nidx++] = imageData.data[idx + 1];
                            newBuffer[nidx++] = imageData.data[idx + 2];
                            newBuffer[nidx++] = imageData.data[idx + 3];

                        }
                    }
                }
            }

            return newBuffer;

        }

        function savePNG(newBuffer, imageData) {
            console.log('saving png');
            var newfile = new PNG({
                width: imageData.width + tileGapX * (numTilesX - 1),
                height: imageData.height + tileGapY * (numTilesY - 1)
            });
            newfile.data = newBuffer;
            //make sync
            newfile.pack()
                .pipe(fs.createWriteStream(options.outfile))
                .on('finish', function () {
                    console.log('successfully created '+options.outfile);
                });
        }

        function saveJPG(newBuffer, imageData) {

            var rawTargetData = {
                data: newBuffer,
                width: imageData.width + tileGapX * (numTilesX - 1), //tileWidth,
                height: imageData.height + tileGapY * (numTilesY - 1)//tileHeight
            }
            var targetJPEG = require('jpeg-js');
            var targetJPEGData = targetJPEG.encode(rawTargetData, 50);
            fs.writeFile(options.outfile, targetJPEGData.data);
            console.log('successfully created '+options.outfile);
        }
    }

