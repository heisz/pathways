<?php
/*
 * Primary module publishing processor
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* All inclusions are relative to source origin */
$RootDir = dirname(__DIR__) . DIRECTORY_SEPARATOR;

/* Start with the common initialization methods */
include_once($RootDir . 'src/inc/init.inc');
require($RootDir . 'src/lib/path.lib');

/* Determine the assets directory and build publishing structures */
function pathIsAbsolute($path) {
    if (realpath( $path ) == $path) return true;
    if ((strlen( $path ) == 0)|| ($path[0] === '.')) return false;
    if (preg_match('#^[a-zA-Z]:\\\\#', $path)) return true;
    return (($path[0] === '/') || ($path[0] === '\\'));
}
$AssetsDir = $GlobalConfig['Pathways']['assets'];
if (!pathIsAbsolute($AssetsDir)) $AssetsDir = $RootDir . '/' . $AssetsDir;
$AssetsDir = realpath($AssetsDir);
if (($AssetsDir === false) || (!is_dir($AssetsDir))) {
    throw new \ErrorException('Invalid assets directory: ' . $AssetsDir);
}
$BadgesDir = $AssetsDir . '/badges';
if (!is_dir($BadgesDir)) {
    if (!mkdir($BadgesDir)) {
        throw new \ErrorException('Failed to create assets/badges directory');
    }
}

/* There should just be the one argument - the content to publish */
if ($argc != 2) {
    exit("Invalid arguments, expecting publish XML file\n");
}
$doc = simplexml_load_file($argv[1], 'SimpleXMLElement',
                           LIBXML_NOCDATA | LIBXML_NOBLANKS);
if ($doc === false) {
    exit("Invalid publish content, see above for parsing errors\n");
}

/* All of the parsing intelligence is in the library instances */
if ($doc->getName() == 'Path') {
    $path = new Pathways\Path($doc);
    $path->publish();
} else if ($doc->getName() == 'Module') {
    $module = new Pathways\Module($doc);
    $module->publish();
}

?>
