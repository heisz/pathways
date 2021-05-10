<?php
/*
 * Management page for user profile information.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Start with the common initialization elements */
include_once('src/inc/init.inc');

/* Don't lose tab context */
$selTab = 0;

/* Handle incoming updates */
function sanitize($data) {
    return trim(stripslashes($data));
}
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $selTab = 1;
    if (array_key_exists('displayname', $_POST)) {
        $dispName = sanitize($_POST['displayname']);
        if ($dispName == '') {
            $dispNameError = 'Display name must be provided';
        }

        if (!$User->updateDisplayName($dispName)) {
            $dispNameError = 'Unexpected error updating display name';
        }
    }
    if (array_key_exists('avatar', $_FILES)) {
        $chk = getimagesize($_FILES['avatar']['tmp_name']);
        if ($chk === false) {
            $avatarError = 'Uploaded file is not an image file';
        } else {
            if (($chk['width'] > 512) || ($chk['height'] > 512) ||
                   ($_FILES['avatar']['size'] > 128000)) {
                $avatarError = 'Uploaded too large (over 512x512, 128kb)';
            } else {
                $fileType = strtolower(pathinfo($_FILES['avatar']['name'],
                                                PATHINFO_EXTENSION));
                if (($fileType != 'jpg') && ($fileType != 'jpeg') &&
                        ($fileType != 'png') && ($fileType != 'gif')) {
                    $avatarError = 'Unsupported image type (not png, gif, jpg)';
                } else {
                    if (!$User->updateAvatar($_FILES['avatar']['tmp_name'],
                                             $fileType)) {
                        $avatarError = 'Unexpected error updating avatar';
                    }
                }
            }
        }
    }
}

/* Only output header after updates above... */
include_once('src/inc/header.inc');

?>

<div class="profile-tabbar">
  <ul class="profile-tablist">
    <li class="profile-tab<?php if ($selTab == 0) echo ' tab-active';?>"
        onclick="openTab(0)">Badges</li>
    <li class="profile-tab<?php if ($selTab == 1) echo ' tab-active';?>"
        onclick="openTab(1)">Settings</li>
  </ul>
  <div class="profile-tabhighlight"></div>
</div>

<div class="profile-content">
  <div id="badges-tab" class="profile-page">
    <div class="profile-badge-count"><?php
       if ($User->badgeCount == 0) {
           echo 'Looks like you haven\'t earned any badges yet.  ' .
                'What are you waiting for?';
       } else {
           echo $User->badgeCount . ' Badge' .
                       (($User->badgeCount == 1) ? '' : 's') . ' Earned';
       }
    ?></div>
    <div class="profile-badges">
      <?php echo $User->renderBadges(); ?>
    </div>
  </div>
  <div id="settings-tab" class="profile-page">
    <div class="profile-forms">
      <form action="profile" method="post">
        <label for="displayname" class="profile-form-label">Display Name</label>
        <div>
          <input class="profile-text-input" type="text" name="displayname"
                 value="<?php echo htmlspecialchars($User->name);?>"
                 size="50"/>
          <?php if ($dispNameError != null) { ?>
            <div class="profile-form-error">
              <?php echo $dispNameError; ?>
            </div>
          <?php } ?>
        </div>
        <div></div>
        <div class="profile-submit-row">
          <input type="submit" class="profile-submit" value="Update">
        </div>
      </form>

      <form action="profile" method="post" enctype="multipart/form-data">
        <label for="avatar" class="profile-form-label">Upload Avatar</label>
        <div>
          <input class="profile-file-input" type="file" name="avatar"
                 size="50"/>
          <?php if ($avatarError != null) { ?>
            <div class="profile-form-error">
              <?php echo $avatarError; ?>
            </div>
          <?php } ?>
        </div>
        <div></div>
        <div class="profile-submit-row">
          <input type="submit" class="profile-submit" value="Update">
        </div>
      </form>
    </div>
  </div>
</div>

<script>
    var tabs = document.querySelectorAll('.profile-tab');
    var highlight = document.querySelector('.profile-tabhighlight');
    var pages = document.querySelectorAll('.profile-page');

    /* Onclick method to highlight the selected tab and show the page */
    function openTab(idx) {
        tabs.forEach(function(tb) {
            tb.classList.remove('tab-active');
        });
        tabs[idx].classList.add('tab-active');
        highlight.style.width = `${tabs[idx].offsetWidth - 1}px`;
        highlight.style.transform = `translateX(${tabs[idx].offsetLeft}px)`;

        pages.forEach(function(pg) {
            pg.classList.remove('tab-active');
        });
        pages[idx].classList.add('tab-active');
    }

    window.addEventListener('load',function() {
        openTab(<?php echo $selTab; ?>);
        setTimeout(function() {
            highlight.style.transition =
                          'width 0.2s linear 0s, transform 0.2s ease-out 0s';
        });
    });
</script>

<?php include_once('src/inc/footer.inc'); ?>
