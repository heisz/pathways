<?php
/*
 * Parent page for path (of paths) navigation.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Start with the common initialization elements */
include_once('src/inc/init.inc');

/* Extract path identifier, load and validate */
try {
    require('src/lib/path.lib');
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('/\/path\/(.*)$/', $uri, $matches)) {
        $path = new Pathways\Path($matches[1]);
    }
    if (($path == null) || ($path->id == null)) {
        /* Hand off response error to upstream wrapper */
        http_response_code(404 /* Not found */);
        exit();
    }

    /* Watch for snoopers */
    if (($path->inPreview) && (!$User->canPreview)) {
        /* Hand off response error to upstream wrapper */
        http_response_code(403 /* Forbidden */);
        exit();
    }
} catch (\PDOException $ex) {
    error_log('Path resolve error: ' . $ex->getMessage());
    error_log('Check for proper database setup');

    /* Hand off response error to upstream wrapper */
    http_response_code(503 /* Service unavailable */);
    exit();
}

/* Like module, path is pretty tidy */
include_once('src/inc/header.inc');
echo $path->renderContent();
include_once('src/inc/footer.inc');

?>
