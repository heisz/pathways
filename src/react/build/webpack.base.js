/*
 * Base webpack definitions, common to all build types.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

const path = require('path');

/* The React elements of pathways is not large or terribly complex */
module.exports = {
    /* stats: 'verbose', */
    entry: './index.jsx',

    module: {
        /* Note: tsx rules are in targets to support differing config */
        rules: [
        ]
   },

   resolve: {
       extensions: ['.tsx', '.ts', '.js']
   },

   output: {
       filename: 'pathways-bundle.js',
       path: path.resolve(__dirname, '../../../assets/js'),
       library: 'Pathways'
   }
};
