// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
// const path = require('path');
// const fs = require('fs');
var app = module.exports = loopback();
// const https = require('https');
// const options = {
//     key: fs.readFileSync(path.join(__dirname, './ssl/keys/a3032_6e279_2171e6f94fa7a9dce6e6641091812392.key')),
//     cert: fs.readFileSync(path.join(__dirname, './ssl/certs/biobiz_devbeans_io_a3032_6e279_1620777599_b92f5e8837ec484361de63dcc0f54e86.crt'))
// };

app.start = function() {
    // start the web server
    return app.listen(function() {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};
// app.startHttps = function() {
//     let Httpsserver = null;

//     Httpsserver = https.createServer(options, app);

//     Httpsserver.listen(app.get('port'), function() {
//         const baseUrl = 'https://' + app.get('host') + ':' + app.get('port');
//         app.emit('started', baseUrl);
//         console.log('LoopBack server listening @ %s%s', baseUrl, '/');
//         if (app.get('loopback-component-explorer')) {
//             const explorerPath = app.get('loopback-component-explorer').mountPath;
//             console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
//         }
//     });
//     return Httpsserver;
// };

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
        app.start();
});