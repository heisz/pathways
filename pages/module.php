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
require('src/lib/module.lib');
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('/\/module\/(.*)$/', $uri, $matches)) {
    $module = new Pathways\Module($matches[1]);
}
if (($module == null) || ($module->id == null)) {
    /* TODO - some fancy Rexy 404 errors */
    echo 'BAD';
    exit();
}

include_once('src/inc/header.inc');

?>

<?php echo $module->renderContent(); ?>

<?php include_once('src/inc/footer.inc'); ?>
