<?php
// upload.php — 安全版（保存到 Ulink/uploads，并返回“绝对 URL”）
// 本地 XAMPP：BASE_PATH = '/Ulink'
// 部署到 aptitude：把 BASE_PATH 改成 '/CSE442/2025-Fall/cse-442z'

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success"=>false,"message"=>"Method not allowed"]);
    exit;
}

/** ===== 配置 ===== */
define('MAX_BYTES', 100 * 1024 * 1024);      // 单文件最大 5MB
const BASE_PATH = '/Ulink';                 // ← 在 aptitude 上改成 '/CSE442/2025-Fall/cse-442z'
//const BASE_PATH = '/CSE442/2025-Fall/cse-442z';

// 物理保存目录（不受 upload.php 放哪影响）
$DOCROOT    = rtrim($_SERVER['DOCUMENT_ROOT'], "/\\"); // C:\xampp\htdocs
$UPLOAD_DIR = $DOCROOT . DIRECTORY_SEPARATOR
    . ltrim(str_replace('/', DIRECTORY_SEPARATOR, BASE_PATH), "\\/") // Ulink
    . DIRECTORY_SEPARATOR . 'uploads';

if (!is_dir($UPLOAD_DIR)) { @mkdir($UPLOAD_DIR, 0755, true); }

// 对外前缀（路径）
$PUBLIC_BASE = rtrim(BASE_PATH, '/') . '/uploads';

// 绝对 URL 前缀（协议+域名）
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST']; // localhost 或 aptitude.cse.buffalo.edu
$ABS_BASE = $scheme . '://' . $host . $PUBLIC_BASE; // e.g. http://localhost/Ulink/uploads

/** ===== 工具 ===== */
function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['success'=>false, 'message'=>$msg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function allow_mimes() { return ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/bmp']; }
function reencode_and_save($tmpPath, $dstPath, $imgType) {
    if (!function_exists('imagecreatefromstring')) return false; // 未启用 GD
    $data = @file_get_contents($tmpPath); if ($data === false) return false;
    $im = @imagecreatefromstring($data);  if ($im   === false) return false;

    $ok = false;
    switch ($imgType) {
        case IMAGETYPE_JPEG: $ok = imagejpeg($im, $dstPath, 90); break;
        case IMAGETYPE_PNG:  $ok = imagepng($im, $dstPath, 0);   break;
        case IMAGETYPE_GIF:  $ok = imagegif($im, $dstPath);      break;
        case IMAGETYPE_WEBP:
            if (function_exists('imagewebp')) $ok = imagewebp($im, $dstPath);
            else $ok = imagepng($im, $dstPath, 0);
            break;
        case IMAGETYPE_BMP:
            if (function_exists('imagebmp')) $ok = imagebmp($im, $dstPath);
            else $ok = imagepng($im, $dstPath, 0);
            break;
        default: $ok = false;
    }
    imagedestroy($im);
    return $ok;
}

/** ===== 收集上传文件 ===== */
$files = [];
if (!empty($_FILES['file'])) {
    $files[] = $_FILES['file'];
} elseif (!empty($_FILES['files']) && is_array($_FILES['files']['name'])) {
    foreach ($_FILES['files']['name'] as $i => $_) {
        $files[] = [
            'name' => $_FILES['files']['name'][$i],
            'type' => $_FILES['files']['type'][$i],
            'tmp_name' => $_FILES['files']['tmp_name'][$i],
            'error' => $_FILES['files']['error'][$i],
            'size' => $_FILES['files']['size'][$i],
        ];
    }
}
if (!$files) fail('No file uploaded');

/** ===== 处理上传 ===== */
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$urls  = [];

foreach ($files as $f) {
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
    $tmp  = $f['tmp_name'] ?? null;
    $size = (int)($f['size'] ?? 0);
    if (!$tmp || !is_uploaded_file($tmp)) continue;
    if ($size <= 0 || $size > MAX_BYTES) continue;

    $mime = finfo_file($finfo, $tmp);
    if (!in_array($mime, allow_mimes(), true)) continue;

    $imgInfo = @getimagesize($tmp);
    if ($imgInfo === false) continue;
    $imgType = $imgInfo[2];

    $ext = match ($imgType) {
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_GIF => 'gif',
        IMAGETYPE_WEBP => 'webp',
        IMAGETYPE_BMP => 'bmp',
        default => 'jpg',
    };

    $name = bin2hex(random_bytes(12)) . '.' . $ext;
    $dest = $UPLOAD_DIR . DIRECTORY_SEPARATOR . $name;

    if (!reencode_and_save($tmp, $dest, $imgType)) continue;

    @chmod($dest, 0644);
    // 关键：返回“绝对 URL”
    $urls[] = $ABS_BASE . '/' . $name; // 例如 http://localhost/Ulink/uploads/xxx.jpg
}

finfo_close($finfo);

/** ===== 返回结果 ===== */
echo json_encode(['success' => true, 'urls' => $urls], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
