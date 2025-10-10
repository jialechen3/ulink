<?php
// CORS + JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// 处理预检
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success"=>false,"message"=>"Method not allowed"]);
    exit;
}

$baseDir = __DIR__ . '/uploads';
if (!is_dir($baseDir)) { @mkdir($baseDir, 0755, true); }

// 即使没有选择文件也返回成功的空数组，避免前端误判
if (!isset($_FILES['files'])) {
    echo json_encode(["success" => true, "urls" => []]);
    exit;
}

$urls = [];
foreach ($_FILES['files']['tmp_name'] as $i => $tmp) {
    if (!is_uploaded_file($tmp)) continue;
    $type = mime_content_type($tmp);
    if (!in_array($type, ['image/jpeg','image/png','image/webp'])) continue;

    $ext  = pathinfo($_FILES['files']['name'][$i] ?? 'img', PATHINFO_EXTENSION) ?: 'jpg';
    $name = bin2hex(random_bytes(8)) . '.' . strtolower($ext);
    $dest = $baseDir . '/' . $name;
    if (move_uploaded_file($tmp, $dest)) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
        $baseUrl = rtrim($scheme . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']), '/');
        $urls[] = $baseUrl . '/uploads/' . $name;
    }
}

echo json_encode(["success" => true, "urls" => $urls]);
