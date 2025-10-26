<?php
// CORS + JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

// Allow only GET
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$host = $_SERVER['HTTP_HOST'] ?? '';

// 判断是否本地运行
if (strpos($host, 'localhost') !== false) {
    // ✅ 本地 XAMPP
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "testdb";
} else {
    // ✅ 学校服务器
    $servername = "dpg-d3uohbmuk2gs73e17iqg-a.render.com";
    $username = "ulinkdb_user";
    $password = "Cb8dUEedVckgedX2AW5b9DdnTWQgckjJ";
    $dbname = "cse442_2025_fall_team_z_db";
}

$mysqli = @new mysqli($servername, $username, $password, $dbname);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}
$mysqli->set_charset("utf8mb4");

// Input params
$q     = isset($_GET["q"]) ? trim($_GET["q"]) : "";
$limit = isset($_GET["limit"]) ? intval($_GET["limit"]) : 50;
$limit = max(1, min($limit, 50)); // cap to [1,50]

// Build query (is_active = 1 only)
$sqlBase = "SELECT id, name FROM universities WHERE is_active = 1";
if ($q !== "") {
    $sql = $sqlBase . " AND name LIKE ? ORDER BY name LIMIT ?";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) { http_response_code(500); echo json_encode(["error"=>"Prepare failed"]); exit; }
    $like = "%" . $q . "%";
    $stmt->bind_param("si", $like, $limit);
} else {
    $sql = $sqlBase . " ORDER BY name LIMIT ?";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) { http_response_code(500); echo json_encode(["error"=>"Prepare failed"]); exit; }
    $stmt->bind_param("i", $limit);
}

// Execute
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed"]);
    exit;
}

$res = $stmt->get_result();
$items = [];
while ($row = $res->fetch_assoc()) {
    $items[] = $row;
}

echo json_encode(["items" => $items]);
