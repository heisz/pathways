<?php
/*
 * Entry point for the client-side REST API's
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */

/* Remap inclusions to the top-level directory for read safety */
set_include_path(dirname(__DIR__));

/* Allow for CORS origination/processing of the requests */
header('Access-Control-Allow-Orgin: *');
header('Access-Control-Allow-Methods: *');
header('Content-Type: application/json; charset=UTF-8');

/* Disassemble the URI for the associated REST directives */
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$args = array_slice(explode('/', rtrim($uri, '/')), 2);
$endpoint = array_shift($args);

/* Determine the exact HTTP method being used */
$method = $_SERVER['REQUEST_METHOD'];
if (($method == 'POST') &&
             array_key_exists('HTTP_X_HTTP_METHOD', $_SERVER)) {
    if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'DELETE') {
        $method = 'DELETE';
    } else if ($_SERVER['HTTP_X_HTTP_METHOD'] == 'PUT') {
        $method = 'PUT';
    } else {
        throw new Exception('Unexpected Header');
    }
}

/* Common function to clean/trim/filter inbound data */
function filterInboundData($data) {
    $result = null;
    if (is_array($data)) {
        $result = array();
        foreach ($data as $key => $value) {
            $result[$key] = $this->filterInboundData($value);
        }
    } else {
        $result = trim(strip_tags($data));
    }
    return $result;
}

/* Common response handler */
function buildResponse($status, $data) {
    /* Translate the status code */
    $statusStr = 'Unknown Internal Error';
    switch ($status) {
        case 200:
            $statusStr = 'OK';
            break;
        case 404:
            $statusStr = 'Not Found Eh';
            break;
        case 405:
            $statusStr = 'Method Not Allowed';
            break;
        case 500:
            $statusStr = 'Internal Server Error';
            break;
    }

    /* Construct/encode the HTTP response */
    header('HTTP/1.1 ' . $status . ' ' . $statusStr);
    echo json_encode($data);
    exit();
}

/* Using above, filter incoming data */
switch($method) {
    case 'DELETE':
    case 'POST':
        $request = filterInboundData($_POST);
        $file = file_get_contents('php://input');
        break;
    case 'GET':
        $request = filterInboundData($_GET);
        break;
    case 'PUT':
        $request = filterInboundData($_GET);
        $file = file_get_contents('php://input');
        break;
    default:
        buildResponse(405, 'Invalid/unsupported HTTP method encountered');
        exit();
}

/* Need associated bits for procesing */
include_once('src/inc/init.inc');
require('src/lib/unit.lib');

/* Not terribly complex application, just drive the maps directly */
if ($endpoint == 'assessment') {
    if (count($args) != 2) {
        buildResponse(405, 'Missing elements for assessment API');
    }
    if ($method == 'GET') {
        $res = Pathways\Unit::getAssessmentInfo($args[0], $args[1]);
        if ($res == null) {
            buildResponse(404, 'Unknown module/unit specified for assessment');
        } else {
            buildResponse(200, $res);
        }
    }
    if ($method == 'POST') {
        $res = Pathways\Unit::assess($args[0], $args[1],
                                     json_decode($file, true));
        if ($res == null) {
            buildResponse(404, 'Unknown module/unit specified for assessment');
        } else {
            buildResponse(200, $res);
        }
    }
}

echo buildResponse(404, 'Invalid/unrecognized REST endpoint specified');

?>
