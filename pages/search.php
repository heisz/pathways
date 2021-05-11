<?php
/*
 * Search results processing page.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Start with the common initialization elements */
include_once('src/inc/init.inc');

/* Extract the search string (so header prepopulates) */
$searchQuery = htmlspecialchars($_GET['srch_qry']);

/* Start with the common initialization elements */
include_once('src/inc/header.inc');
require_once('src/lib/utility.lib');

/* Quick exit if someone pulled a fast one */
if (trim($searchQuery) == '') {
    echo '<div class="search-empty"> ' .
           'Please provide one or more keywords to search for...' .
         '</div>';
    include_once('src/inc/footer.inc');
    exit();
}

/* Build where clauses according to search conditions */
$modWhere = $pathWhere = '';
$patterns = [];
$replaces = [];
foreach (explode(' ', $searchQuery) as $cond) {
    array_push($patterns, '/(' . $cond . ')/i');
    array_push($replaces, '<span class="search-highlight">$1</span>');

    $cond = $pdo->quote('%' . $cond . '%');
    if ($modWhere != '') $modWhere .= ' OR ';
    $modWhere .= '(mod.title ILIKE ' . $cond . ' OR ' .
                      'mod.synopsis ILIKE ' . $cond. ')';
    if ($pathWhere != '') $pathWhere .= ' OR ';
    $pathWhere .= '(pth.title ILIKE ' . $cond . ' OR ' .
                       'pth.synopsis ILIKE ' . $cond. ')';
}

/* In this case, just do the query directly here */
$schema = \Database::schema();
$modAgg = 'COALESCE(sum(un.est_time) FILTER (WHERE ast.points IS NOT NULL), 0)';
$pthAgg = 'COALESCE(sum(un.est_time) FILTER (WHERE ' .
                     '((bdg.points IS NOT NULL) OR ' .
                     '((bdg.points IS NULL) AND (ast.points IS NOT NULL)))), 0)';
$qry = 'SELECT \'mod\', mod.module_id, mod.title, mod.synopsis, mod.points, ' .
               'mod.est_time, MAX(ast.completed), ' . $modAgg . ' ' .
               'FROM ' . $schema . 'modules AS mod ' .
               Pathways\User::ModJoin() .
               'WHERE ' . $modWhere . ' AND ' .
                      '(mod.in_preview = \'f\') ' .
               'GROUP BY mod.module_id ' .
       'UNION ' .
       'SELECT \'path\', pth.path_id, pth.title, pth.synopsis, pth.points, ' .
               'pth.est_time, MAX(ast.completed), ' . $pthAgg . 
               'FROM ' . $schema . 'paths AS pth ' .
               'JOIN ' . $schema . 'signposts AS pst ' .
                 'ON (pth.path_id=pst.path_id) ' .
               'JOIN ' . $schema . 'modules AS mod ' .
                 'ON (pst.module_id=mod.module_id) ' .
               Pathways\User::ModJoin() .
               'WHERE ' . $pathWhere . ' AND ' .
                      '(pth.in_preview = \'f\') ' .
               'GROUP BY pth.path_id';
$qryStmt = \Database::prepare($qry);
$qryStmt->execute([ $User->id, $User->id, $User->id, $User->id ]);

$count = 0;
foreach ($qryStmt->fetchAll() as $row) {
    if ($count == 0) echo '<div class="search-content">' . "\n";

    if ($row[5] == $row[7]) {
        $prog = 'Completed ' . Pathways\Utility::FormatDate($row[6]);
        $progbar = '';
    } else {
        $timeLeft = $row[5] - $row[7];
        $prog = Pathways\Utility::FormatInterval($timeLeft) . ' remaining';
        $pct = intval($row[7] * 100 / $row[5]);
        $progbar = Pathways\Utility::FormatProgressBar($pct);
    }

    $title = preg_replace($patterns, $replaces, $row[2]);
    $synopsis = preg_replace($patterns, $replaces, $row[3]);

    echo '<a href="' . (($row[0] == 'mod') ? '/module/' :
                                             '/path/') . $row[1] . '" ' .
            'class="search-card-link">' .
           '<div class="search-card">' .
             '<div class="search-card-badge"> ' .
               '<image src="/badges/' . $row[0] . '-' . $row[1] . '.png" ' .
                      'alt="Path/module badge"/>' . "\n" .
               (($row[5] != $row[7]) ? '' :
                 '<svg xmlns="http://www.w3.org/2000/svg" ' .
                      'viewBox="0 0 24 24">' .
                   '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 ' .
                            '21 7l-1.41-1.41L9 16.17z"/>' .
                 '</svg>' . "\n") .
             '</div>' .
             '<div class="search-card-info"> ' .
               '<div class="search-card-title-row">' .
                 '<div class="search-card-title">' . $title . '</div>' .
                 '<div class="search-card-points">' . $row[4] . ' points</div>' .
               '</div>' .
               '<div class="search-card-synopsis">' . $synopsis . '</div>' .
               '<div class="search-card-progress">' .
                 '<div>' . $prog . '</div>' .
                 '<div>' . $progbar . '</div>' .
               '</div>' .
             '</div> ' .
           '</div>' . 
         '</a>' . "\n";
    $count++;
}

if ($count == 0) {
    echo '<div class="search-empty"> ' .
           'No results found.  Please try again with different criteria.' .
         '</div>';
} else {
    echo '</div>' . "\n";
}


/* End of the line... */
include_once('src/inc/footer.inc');

?>
