<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// ---- DB 连接：本地与学校服务器自动切换 ----
$host = $_SERVER['HTTP_HOST'] ?? '';
if (strpos($host, 'localhost') !== false) {
    // 本地 XAMPP
    $servername = "localhost";
    $username   = "root";
    $password   = "";
    $dbname     = "testdb";
} else {
    // 学校服务器
    $servername = "localhost";
    $username   = "zzhong5";
    $password   = "50457160";
    $dbname     = "cse442_2025_fall_team_z_db";
}

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}
$conn->set_charset("utf8mb4");

// ---- 工具函数：用户名/密码校验 ----
function validate_username($name) {
    return (bool) preg_match('/^[A-Za-z0-9_]{3,20}$/', $name);
}
function validate_password($pwd) {
    if (strlen($pwd) < 8) return false;
    if (!preg_match('/[a-z]/', $pwd)) return false;
    if (!preg_match('/[A-Z]/', $pwd)) return false;
    if (!preg_match('/[^a-zA-Z0-9]/', $pwd)) return false;
    return true;
}

// ------------- GET -------------
// 0) 默认：返回所有用户 + 大学名称
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($_GET)) {
    $result = $conn->query("SELECT u.id, u.username, u.university_id, uni.name AS university
                            FROM users u
                            LEFT JOIN universities uni ON u.university_id = uni.id");
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode($users);
    exit;
}

// 1) 按大学读取 listing
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['listings_by_university'])) {
    $uni = intval($_GET['listings_by_university']);

    $stmt = $conn->prepare("
        SELECT 
            l.id, l.user_id, l.university_id, l.title, l.description,
            l.pictures, l.comments, l.created_at,
            u.username
        FROM listings l
        LEFT JOIN users u ON u.id = l.user_id
        WHERE l.university_id = ?
        ORDER BY l.created_at DESC
        LIMIT 100
    ");
    $stmt->bind_param("i", $uni);

    if ($stmt->execute()) {
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) {
            $row['pictures'] = $row['pictures'] ? json_decode($row['pictures'], true) : [];
            $row['comments'] = $row['comments'] ? json_decode($row['comments'], true) : [];
            $items[] = $row;
        }
        echo json_encode(["success" => true, "items" => $items]);
    } else {
        echo json_encode(["success" => false, "message" => "Query failed"]);
    }
    exit;
}

// 2) 查询单个用户（登录后获取其 university_id）
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['user'])) {
    $uid = intval($_GET['user']);
    $stmt = $conn->prepare("SELECT id, username, university_id FROM users WHERE id = ?");
    $stmt->bind_param("i", $uid);
    if ($stmt->execute()) {
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            echo json_encode(["success" => true, "user" => $row]);
        } else {
            echo json_encode(["success" => false, "message" => "User not found"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Query failed"]);
    }
    exit;
}

// ------------- POST -------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    // register
    if ($action === 'register') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (!$username || !$password) {
            echo json_encode(["success" => false, "message" => "Missing username or password"]);
            exit;
        }
        if (!validate_username($username)) {
            echo json_encode(["success" => false, "message" => "Invalid username. Must be 3-20 characters: letters, numbers, or underscore."]);
            exit;
        }
        if (!validate_password($password)) {
            echo json_encode(["success" => false, "message" => "Invalid password. Must be at least 8 characters, include uppercase, lowercase, and a special character."]);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->bind_param("ss", $username, $hashedPassword);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "User registered", "id" => $conn->insert_id]);
        } else {
            if ($stmt->errno === 1062) {
                echo json_encode(["success" => false, "message" => "Username already taken"]);
            } else {
                echo json_encode(["success" => false, "message" => "Registration failed: " . $stmt->error]);
            }
        }
        exit;
    }

    // login
    if ($action === 'login') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (!$username || !$password) {
            echo json_encode(["success" => false, "message" => "Missing username or password"]);
            exit;
        }
        if (!validate_username($username)) {
            echo json_encode(["success" => false, "message" => "Invalid username format"]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            if (password_verify($password, $row['password_hash'])) {
                echo json_encode(["success" => true, "message" => "Login successful", "id" => $row['id']]);
            } else {
                echo json_encode(["success" => false, "message" => "Invalid password"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "User not found"]);
        }
        exit;
    }

    // create_listing（允许无图片）
    if ($action === 'create_listing') {
        $user_id       = intval($data['user_id'] ?? 0);
        $university_id = intval($data['university_id'] ?? 0);
        $title         = trim((string)($data['title'] ?? ''));
        $description   = trim((string)($data['description'] ?? ''));

        // pictures：可能是数组、字符串 JSON，或未提供
        $pictures_input = $data['pictures'] ?? [];
        if (is_string($pictures_input)) {
            $tmp = json_decode($pictures_input, true);
            $pictures = is_array($tmp) ? $tmp : [];
        } elseif (is_array($pictures_input)) {
            $pictures = array_values(array_filter($pictures_input, function ($u) {
                return is_string($u) && trim($u) !== '';
            }));
        } else {
            $pictures = [];
        }

        // comments：缺省为空数组
        $comments_input = $data['comments'] ?? [];
        $comments = is_array($comments_input) ? $comments_input : [];

        // 必填校验：不强制图片
        if ($user_id <= 0 || $university_id <= 0 || $title === '') {
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit;
        }

        $pictures_json = json_encode($pictures, JSON_UNESCAPED_UNICODE);
        $comments_json = json_encode($comments, JSON_UNESCAPED_UNICODE);

        $stmt = $conn->prepare("
            INSERT INTO listings (user_id, university_id, title, description, pictures, comments, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Prepare failed"]);
            exit;
        }
        $stmt->bind_param("iissss", $user_id, $university_id, $title, $description, $pictures_json, $comments_json);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        } else {
            echo json_encode(["success" => false, "message" => "Insert failed"]);
        }
        exit;
    }
}

// ------------- PATCH -------------
// 更新用户的 university_id
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id'] ?? 0);
    $university_id = intval($data['university_id'] ?? 0);

    if ($id && $university_id) {
        $stmt = $conn->prepare("UPDATE users SET university_id = ? WHERE id = ?");
        $stmt->bind_param("ii", $university_id, $id);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            echo json_encode(["success" => true, "message" => "University updated"]);
        } else {
            echo json_encode(["success" => false, "message" => "Update failed"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Missing id or university_id"]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Unsupported request"]);
$conn->close();
