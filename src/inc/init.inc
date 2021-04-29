<?php
/*
 * First-level inclusion file for all PHP pages for setup/initialization.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Detect context and manage error conditions */
$isCLI = (php_sapi_name() == 'cli');
// if (!$isCLI) ini_set('display_errors', 'off');

/* Utilities are needed everywhere */
require_once('src/lib/utility.lib');

/* Initialize libraries and configuration up front */
$GlobalConfig = parse_ini_file('config/pathways.ini', true);

/* TODO - language/localization initialization here? */

/* Everything we do is to singleton database, so just define the class here */
class Database {
    /* Singleton connection instance */
    private static $pdo = null;
    private static $schema = null;

    /* Allocate/initialize the connection instance */
    private static function initPDO() {
        global $GlobalConfig;

        /* Create the PDO with exceptions as the *default* */
        $dbInfo = $GlobalConfig['Database'];
        $pdo = new \PDO($dbInfo['dsn'], $dbInfo['user'], $dbInfo['password'],
                        $config['DatabaseOptions']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $attr = $GlobalConfig['DatabaseAttributes'];
        foreach ($attr as $key => $val) {
            $pdo->setAttribute(constant("PDO::{$key}"),
                               constant("PDO::{$val}"));
        }
        self::$schema = array_key_exists('schema', $dbInfo) ?
                                      ($dbInfo['schema'] . '.') : '';

        self::$pdo = $pdo;
        return self::$pdo;
    }

    /* Initialization accessor to catch errors right up front */
    public static function pdo() {
        if (self::$pdo) return self::$pdo;
        return self::initPDO();
    }

    /* Wrap the schema definition if needed */
    public static function schema() {
        return self::$schema;
    }

    /* Wrap all static references to the underlying PDO instance */
    public static function __callStatic($name, $args) {
        $callback = array (self::pdo(), $name);
        return call_user_func_array($callback, $args);
    }
}

/* Make a connection right up front to validate configuration */
try {
    $pdo = Database::pdo();
} catch (\PDOException $ex) {
    if ($isCLI) {
        echo "\nERROR: Failed to establish database connection:\n    " .
             $ex->getMessage() . "\n\n";
        exit();
    } else {
        error_log('Database connection error: ' . $ex->getMessage());

        /* Hand off response error to upstream wrapper */
        http_response_code(503 /* Service unavailable */);
        exit();
    }
}

/* Resolve user information for non-CLI (publish) environment */
if (!$isCLI) {

    /* TODO - integration user_id determination here! */
    $UserId = 'test';

    /* Verify and retrieve user information for display */
    try {
        require_once('src/lib/user.lib');
        $User = new Pathways\User($UserId);
        if (($User == null) || ($User->id == null)) {
            /* Hand off response error to upstream wrapper */
            http_response_code(401 /* Unauthorized (unknown) */);
            exit();
        }
    } catch (\PDOException $ex) {
        error_log('Unable to resolve user information: ' . $ex->getMessage());
        error_log('Check for proper database setup');

        /* Hand off response error to upstream wrapper */
        http_response_code(503 /* Service unavailable */);
        exit();
    }
}
    
?>
