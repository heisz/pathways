<?php
/*
 * Entry page for displaying module entry point.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Start with the common initialization elements */
include_once('src/inc/init.inc');

/* Extract module identifier, load and validate */
try {
    require('src/lib/module.lib');
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('/\/module\/(.*)$/', $uri, $matches)) {
        $module = new Pathways\Module($matches[1]);
    }
    if (($module == null) || ($module->id == null)) {
        /* Hand off response error to upstream wrapper */
        http_response_code(404 /* Not found */);
        exit();
    }
} catch (\PDOException $ex) {
    error_log('Module resolve error: ' . $ex->getMessage());
    error_log('Check for proper database setup');

    /* Hand off response error to upstream wrapper */
    http_response_code(503 /* Service unavailable */);
    exit();
}

/* Module content is pretty tidy */
include_once('src/inc/header.inc');
echo $module->renderContent();
include_once('src/inc/footer.inc');

?>
