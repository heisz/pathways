<?php
/*
 * Home page (entry point) for the pathways application.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Start with the common initialization elements */
include_once('src/inc/init.inc');
include_once('src/inc/header.inc');

/* Welcome, welcome, welcome! */
if ($User->badgeCount == 0) {
    echo '<div class="home-welcome-header">' .
           '<div><b>Welcome ' . $User->name . '!</b></div>' . "\n" .
           '<div> You look new around here, ' .
                 'might I suggest starting with the ' .
                 '<a href="/module/pathways-basic">Pathways Basics</a> ' .
                 'module?' .
           '</div>' . "\n" .
         '</div>' . "\n";
}

echo '<div class="home-content">' . "\n";

/* In-progress modules */
$ipMods = $User->inProgressModules(3);
if (count($ipMods) != 0) {
    echo '<div class="home-header">In-Progress Modules</div>' . "\n" .
         '<div class="home-summary-row">' . "\n";
    foreach($ipMods as $mod) {
        echo '<a class="pmcell-link" href="/module/' . $mod['id'] . '">' . "\n" .
                Pathways\Utility::FormatPathModCell($mod) . "\n" .
             '</a>' . "\n";
    }
    echo '</div>' . "\n";
}

/* In-progress paths */
$ipPaths = $User->inProgressPaths(3);
if (count($ipPaths) != 0) {
    echo '<div class="home-header">In-Progress Paths</div>' . "\n" .
         '<div class="home-summary-row">' . "\n";
    foreach($ipPaths as $pth) {
        echo '<a class="pmcell-link" href="/path/' . $pth['id'] . '">' . "\n" .
                Pathways\Utility::FormatPathModCell($pth) . "\n" .
             '</a>' . "\n";
    }
    echo '</div>' . "\n";
}

/* Newest unworked modules */
$newMods = $User->newestModules(3);
if (count($newMods) != 0) {
    echo '<div class="home-header">Newest Modules</div>' . "\n" .
         '<div class="home-summary-row">' . "\n";
    foreach($newMods as $mod) {
        echo '<a class="pmcell-link" href="/module/' . $mod['id'] . '">' . "\n" .
                Pathways\Utility::FormatPathModCell($mod) . "\n" .
             '</a>' . "\n";
    }
    echo '</div>' . "\n";
}

if ((count($ipMods) == 0) && (count($ipPaths) == 0) && (count($newMods) == 0)) {
    echo '<div class="home-welcome-header">' .
           '<div>Well, it appears you\'ve completed <i>everything</i>! ' .
                'Perhaps you\'d like to write some new content?' .
           '</div>' . "\n" .
         '</div>' . "\n";
}

echo '</div>' . "\n";

?>
