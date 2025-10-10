<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// —— 让 mysqli 抛异常，便于捕获并以 JSON 返回 —— //
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// —— 小工具：统一 JSON 错误 —— //
function fail($code, $msg, $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(["success"=>false, "message"=>$msg], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}
function ok($payload = []) {
    echo json_encode(array_merge(["success"=>true], $payload), JSON_UNESCAPED_UNICODE);
    exit;
}

// —— 连接数据库：本地/学校自动切换 —— //
$host = $_SERVER['HTTP_HOST'] ?? '';
if (strpos($host, 'localhost') !== false) {
    $DB_HOST = "127.0.0.1";  // 用 127.0.0.1 强制 TCP
    $DB_USER = "root";
    $DB_PASS = "";
    $DB_NAME = "testdb";
} else {
    $DB_HOST = "127.0.0.1";
    $DB_USER = "zzhong5";
    $DB_PASS = "50457160";
    $DB_NAME = "cse442_2025_fall_team_z_db";
}

try {
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    $conn->set_charset("utf8mb4");
} catch (Throwable $e) {
    fail(500, "Database connection failed", ["error"=>$e->getMessage()]);
}

// —— 内置迁移（首次部署自动建表） —— //
function ensure_schema(mysqli $conn) {
    // users
    $conn->query("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(64) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL,
            university_id INT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    // universities
    $conn->query("
        CREATE TABLE IF NOT EXISTS universities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(128) NOT NULL UNIQUE,
            is_active TINYINT(1) NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    // listings
    $conn->query("
        CREATE TABLE IF NOT EXISTS listings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            university_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT NULL,
            pictures JSON NULL,
            comments JSON NULL,
            views INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            INDEX idx_listings_university_created_at (university_id, created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 种子数据：universities 至少有一条，避免选择页空
    $res = $conn->query("SELECT COUNT(*) AS c FROM universities");
    $row = $res->fetch_assoc();
    if ((int)$row['c'] === 0) {
        $conn->query("INSERT INTO universities (name, is_active) VALUES
            ('University at Buffalo', 1),
            ('Cornell University', 1),
            ('Rochester Institute of Technology', 1)
        ");
    }
}

try { ensure_schema($conn); } catch (Throwable $e) {
    fail(500, "Schema migration failed", ["error"=>$e->getMessage()]);
}

// —— 自检接口：访问 db.php?diag=1 查看服务端真实状态 —— //
if (isset($_GET['diag'])) {
    try {
        $u = $conn->query("SHOW TABLES")->fetch_all();
        ok([
            "env" => $host ?: "cli",
            "php" => PHP_VERSION,
            "db_host" => $DB_HOST,
            "db_name" => $DB_NAME,
            "tables" => $u,
            "mysqli_client" => mysqli_get_client_info()
        ]);
    } catch (Throwable $e) {
        fail(500, "Diag failed", ["error"=>$e->getMessage()]);
    }
}

// —— 读取 JSON body —— //
$raw = file_get_contents("php://input");
$body = json_decode($raw, true);
if (!is_array($body)) $body = [];

// =============== 注册 ================== //
if (($body['action'] ?? '') === 'register') {
    try {
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        if (!$username || !$password) fail(400, "Missing username or password.");
        if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $username)) fail(400, "Invalid username.");
        if (
            strlen($password) < 8 ||
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[^a-zA-Z0-9]/', $password)
        ) fail(400, "Invalid password.");

        $stmt = $conn->prepare("SELECT id FROM users WHERE username=?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) { http_response_code(409); ok(["success"=>false, "message"=>"Username already taken"]); }
        $stmt->close();

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, NOW())");
        $stmt->bind_param("ss", $username, $hash);
        $stmt->execute();
        ok(["id"=>$stmt->insert_id]);
    } catch (Throwable $e) {
        fail(500, "Register failed", ["error"=>$e->getMessage()]);
    }
}

// =============== 登录 ================== //
if (($body['action'] ?? '') === 'login') {
    try {
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        if (!$username || !$password) fail(400, "Missing username or password.");

        $stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username=?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->bind_result($uid, $hash);
        if ($stmt->fetch() && password_verify($password, $hash)) {
            ok(["id"=>$uid]);
        } else {
            fail(401, "Invalid username or password.");
        }
        $stmt->close();
    } catch (Throwable $e) {
        fail(500, "Login failed", ["error"=>$e->getMessage()]);
    }
}

// =============== PATCH: 保存用户 university_id ================== //
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    try {
        $id = intval($body['id'] ?? 0);
        $university_id = intval($body['university_id'] ?? 0);
        if (!$id || !$university_id) fail(400, "Missing id or university_id.");

        $stmt = $conn->prepare("UPDATE users SET university_id=? WHERE id=?");
        $stmt->bind_param("ii", $university_id, $id);
        $stmt->execute();
        ok();
    } catch (Throwable $e) {
        fail(500, "Update university_id failed", ["error"=>$e->getMessage()]);
    }
}

// =============== GET: 查询某大学的 listings ================== //
if (isset($_GET['listings_by_university'])) {
    try {
        $uni = intval($_GET['listings_by_university']);
        $stmt = $conn->prepare("
            SELECT id, user_id, university_id, title, description, pictures, comments, views, created_at
            FROM listings
            WHERE university_id=?
            ORDER BY created_at DESC
        ");
        $stmt->bind_param("i", $uni);
        $stmt->execute();
        $res = $stmt->get_result();

        $items = [];
        while ($row = $res->fetch_assoc()) {
            $row['pictures'] = json_decode($row['pictures'] ?? '[]', true);
            $row['comments'] = json_decode($row['comments'] ?? '[]', true);
            $items[] = $row;
        }
        ok(["items"=>$items]);
    } catch (Throwable $e) {
        fail(500, "Fetch listings failed", ["error"=>$e->getMessage()]);
    }
}

// =============== POST: 创建 listing（存 URL JSON） ================== //
if (($body['action'] ?? '') === 'create_listing') {
    try {
        $user_id       = intval($body['user_id'] ?? 0);
        $university_id = intval($body['university_id'] ?? 0);
        $title         = trim($body['title'] ?? '');
        $description   = trim($body['description'] ?? '');
        $pictures      = json_encode($body['pictures'] ?? []);
        $comments      = json_encode($body['comments'] ?? []);
        $views         = intval($body['views'] ?? 0);

        if (!$user_id || !$university_id || !$title) fail(400, "Missing required fields.");

        $stmt = $conn->prepare("
            INSERT INTO listings (user_id, university_id, title, description, pictures, comments, views, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->bind_param("iissssi", $user_id, $university_id, $title, $description, $pictures, $comments, $views);
        $stmt->execute();
        ok(["id"=>$stmt->insert_id]);
    } catch (Throwable $e) {
        fail(500, "Create listing failed", ["error"=>$e->getMessage()]);
    }
}

// =============== GET: 读取单个用户（App.jsx 用） ================== //
if (isset($_GET['user'])) {
    try {
        $id = intval($_GET['user']);
        $stmt = $conn->prepare("SELECT id, username, university_id, created_at FROM users WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        if ($res) ok(["user"=>$res]);
        fail(404, "User not found");
    } catch (Throwable $e) {
        fail(500, "Fetch user failed", ["error"=>$e->getMessage()]);
    }
}

// 未匹配：返回 400
fail(400, "Invalid request.");
