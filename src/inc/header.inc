<?php
/*
 * Common header formatting for all of the pathways HTML content.
 *
 * Copyright (C) 2020-2023 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Ixnay on the caching please, note that PHP typically does this by default */
header("Expires: Mon, 21 May 1988 16:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
if (!isset($PageTitle)) $PageTitle = 'Pathways';
?>

<!doctype html>
<html>
  <head>
    <title><?php echo $PageTitle; ?></title>
    <meta name="description" content="Pathways e-learning platform"/>
    <meta name="keywords" content="training, e-learning"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>

    <!-- Grab some fancy fonts -->
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500"
          rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Roboto:wght@400;500"
          rel="stylesheet">

    <link href="/css/pathways.css" rel="stylesheet" type="text/css"/>

    <script type="text/javascript" src="/js/pathways-bundle.js"></script>
  </head>
  <body>
    <header>
      <div class="header-left">
        <a href="/home" class="header-logo">
          <img src="/images/pathways.png" alt="Pathways learning platform"/>
        </a>
        <span id="header-search"></span>
      </div>

      <div class="header-right">
        <?php echo $User->renderHeader(); ?>
      </div>

      <script type="text/javascript">
          Pathways.ReactDOM.render(
              Pathways.React.createElement(Pathways.Search,
                  { 'searchQuery': '<?php 
                       echo ((!isset($searchQuery))) ? '' : $searchQuery;
                     ?>',
                    'placeholder': 'Open your mind...' }),
              document.getElementById('header-search')
          );
      </script>
    </header>
