<?php
/*
 * The core element, display a module unit with assessment elements.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Start with the common initialization elements */
include_once('src/inc/init.inc');

/* Extract unit identifier, load and validate */
try {
    require('src/lib/unit.lib');
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('/\/unit\/(.*)\/(.*)$/', $uri, $matches)) {
        $unit = new Pathways\Unit($matches[2], $matches[1]);
    }
    if (($unit == null) || ($unit->id == null)) {
        /* Hand off response error to upstream wrapper */
        http_response_code(404 /* Not found */);
        exit();
    }

    /* Watch for snoopers */
    if (($unit->inPreview) && (!$User->canPreview)) {
        /* Hand off response error to upstream wrapper */
        http_response_code(403 /* Forbidden */);
        exit();
    }
} catch (\PDOException $ex) {
    error_log('Unit resolve error: ' . $ex->getMessage());
    error_log('Check for proper database setup');

    /* Hand off response error to upstream wrapper */
    http_response_code(503 /* Service unavailable */);
    exit();
}
$unitURI = $matches[1] . '/' . $matches[2];

include_once('src/inc/header.inc');
echo $unit->renderContent();
?>

<script type="text/javascript">
    Pathways.ReactDOM.render(
        Pathways.React.createElement(Pathways.Assessor,
            { 'unitURI': '<?php echo $unitURI; ?>' }),
        document.getElementById('unit-assessment')
    );

    Pathways.ReactDOM.render(
        Pathways.React.createElement(Pathways.ScrollSpy,
            { 'track': 'unit-content',
              'id_prefix': 'unit-section',
              'points': <?php echo $unit->points; ?>,
              'offset': 30 }),
        document.getElementById('unit-sidebar-sections')
    );
</script>

<?php include_once('src/inc/footer.inc'); ?>
