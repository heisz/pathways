/*
 * Specific definitions for the development build process.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

const { merge } = require('webpack-merge');

module.exports = merge(require('./webpack.base.js'), {
    mode: 'development',
    watch: true,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        /* logLevel: 'info', */
                        configFile: './build/tsconfig.dev.json'
                    }
                }],
                exclude: /node_modules/
            }
        ]
   }
});
