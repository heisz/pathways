/*
 * Specific definitions for the production build process.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

const { merge } = require('webpack-merge');

module.exports = merge(require('./webpack.base.js'), {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        /* logLevel: 'info', */
                        configFile: './build/tsconfig.prod.json'
                    }
                }],
                exclude: /node_modules/
            }
        ]
   }
});
