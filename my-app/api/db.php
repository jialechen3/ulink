<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

/* -------- 让 mysqli 抛异常，统一 JSON 处理 -------- */
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

/* -------- 统一成功/失败输出（保持你原先“可选 success”风格） -------- */
function ok($payload) {
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail($code, $msg, $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(["success"=>false, "message"=>$msg], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

/* -------- 本地 / 学校服务器自动切换 -------- */
$host = $_SERVER['HTTP_HOST'] ?? '';
if (strpos($host, 'localhost') !== false) {
    $DB_HOST = "127.0.0.1";  // 强制 TCP
    $DB_USER = "root";
    $DB_PASS = "";
    $DB_NAME = "testdb";
} else {
    $DB_HOST = "127.0.0.1";
    $DB_USER = "zzhong5";
    $DB_PASS = "50457160";
    $DB_NAME = "cse442_2025_fall_team_z_db";
}

/* -------- 连接数据库 -------- */
try {
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    $conn->set_charset("utf8mb4");
} catch (Throwable $e) {
    fail(500, "Database connection failed", ["error"=>$e->getMessage()]);
}

/* -------- Schema 工具：缺列/缺索引检测与补全 -------- */
function table_has_col(mysqli $conn, $table, $col) {
    $stmt = $conn->prepare("SELECT COUNT(*) c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
    $stmt->bind_param("ss", $table, $col);
    $stmt->execute();
    $c = $stmt->get_result()->fetch_assoc()['c'] ?? 0;
    $stmt->close();
    return intval($c) > 0;
}
function add_col_if_missing(mysqli $conn, $table, $definition) {
    // $definition 例如：`created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
    if (!preg_match('/^`?([a-zA-Z0-9_]+)`?\s/i', $definition, $m)) return;
    $col = $m[1];
    if (!table_has_col($conn, $table, $col)) {
        $conn->query("ALTER TABLE `$table` ADD COLUMN $definition");
    }
}
function add_index_if_missing(mysqli $conn, $table, $indexName, $indexDDL) {
    $stmt = $conn->prepare("SELECT COUNT(*) c FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?");
    $stmt->bind_param("ss", $table, $indexName);
    $stmt->execute();
    $c = $stmt->get_result()->fetch_assoc()['c'] ?? 0;
    $stmt->close();
    if (intval($c) === 0) {
        $conn->query("ALTER TABLE `$table` ADD $indexDDL");
    }
}

/* -------- 内置迁移（首次部署自动建表 & 之后补列补索引） -------- */
try {
    // users
    $conn->query("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(64) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    add_col_if_missing($conn, "users", "`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    add_col_if_missing($conn, "users", "`university_id` INT NULL");
    add_col_if_missing($conn, "users", "`avatar_url` VARCHAR(255) NULL");

    // universities
    $conn->query("
        CREATE TABLE IF NOT EXISTS universities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(128) NOT NULL UNIQUE,
            is_active TINYINT(1) NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    // universities 种子数据
    $r = $conn->query("SELECT COUNT(*) c FROM universities")->fetch_assoc();
    if (intval($r['c']) === 0) {
        $conn->query("INSERT INTO universities (name, is_active) VALUES
            ('University at Buffalo', 1),
            ('Cornell University', 1),
            ('Rochester Institute of Technology', 1)
        ");
    }

    // listings（含扩展字段 + 索引）
    $conn->query("
        CREATE TABLE IF NOT EXISTS listings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            university_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT NULL,
            pictures JSON NULL,
            comments JSON NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            views INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    /* ----(New) groups（学习小组）表 —— 与你给出的字段一致---- */
    $conn->query("
        CREATE TABLE IF NOT EXISTS `groups` (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id INT UNSIGNED NOT NULL,
            university_id INT UNSIGNED NOT NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NULL,
            pictures JSON NULL,
            comments JSON NULL,
            category VARCHAR(100) DEFAULT NULL,
            location VARCHAR(255) DEFAULT NULL,
            contact VARCHAR(255) DEFAULT NULL,
            capacity INT UNSIGNED DEFAULT NULL,       -- NULL 表示不限
            member_count INT UNSIGNED NOT NULL DEFAULT 0,
            views INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // 组合索引（与 listings 一样的风格 + 分类筛选友好）
    add_index_if_missing($conn, "groups", "idx_groups_university_created_at",
        "INDEX idx_groups_university_created_at (university_id, created_at DESC)");
    add_index_if_missing($conn, "groups", "idx_groups_user_created_at",
        "INDEX idx_groups_user_created_at (user_id, created_at DESC)");
    add_index_if_missing($conn, "groups", "idx_groups_uni_cat_created",
        "INDEX idx_groups_uni_cat_created (university_id, category, created_at DESC)");

    // group_members（成员关系）
    $conn->query("
        CREATE TABLE IF NOT EXISTS `group_members` (
            group_id INT UNSIGNED NOT NULL,
            user_id  INT UNSIGNED NOT NULL,
            joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (group_id, user_id),
            KEY idx_member_user (user_id),
            KEY idx_member_group (group_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    /* ----(DianZ，10242025）---------------------------------- */

    // 你现有代码里用到的可选扩展列
    add_col_if_missing($conn, "listings", "`price` DECIMAL(10,2) NULL");
    add_col_if_missing($conn, "listings", "`category` VARCHAR(64) NULL");
    add_col_if_missing($conn, "listings", "`location` VARCHAR(128) NULL");
    add_col_if_missing($conn, "listings", "`contact` VARCHAR(128) NULL");

    // 索引
    add_index_if_missing($conn, "listings", "idx_listings_university_created_at", "INDEX idx_listings_university_created_at (university_id, created_at DESC)");
    add_index_if_missing($conn, "listings", "idx_listings_user_created_at", "INDEX idx_listings_user_created_at (user_id, created_at DESC)");
} catch (Throwable $e) {
    fail(500, "Schema migration failed", ["error"=>$e->getMessage()]);
}

/* -------- 自检：db.php?diag=1 -------- */
if (isset($_GET['diag'])) {
    try {
        $tables = $conn->query("SHOW TABLES")->fetch_all();
        ok([
            "success" => true,
            "env" => $host ?: "cli",
            "php" => PHP_VERSION,
            "db" => ["host"=>$DB_HOST, "name"=>$DB_NAME],
            "mysqli_client" => mysqli_get_client_info(),
            "tables" => $tables
        ]);
    } catch (Throwable $e) {
        fail(500, "Diag failed", ["error"=>$e->getMessage()]);
    }
}

/* -------- 校验函数（与你前端保持一致） -------- */
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

/* -------- 读取 JSON body -------- */
$raw = file_get_contents("php://input");
$body = json_decode($raw, true);
if (!is_array($body)) $body = [];

/* ===================== GET ===================== */

//  Bug Report 处理逻辑
// ------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!empty($input['action']) && $input['action'] === 'report_bug') {
        try {
            $stmt = $conn->prepare("
                INSERT INTO reports (user_id, page_name, url, category, description, steps, contact)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            if (!$stmt) {
                fail(500, "Prepare failed", ["error" => $conn->error]);
            }

            $user_id = intval($input['user_id'] ?? 0);
                if ($user_id === 0) $user_id = null; // ✅ 匿名用户用 NULL
            $page_name = $input['page_name'] ?? '';
            $url = $input['url'] ?? '';
            $category = $input['category'] ?? '';
            $desc = $input['desc'] ?? '';
            $steps = $input['steps'] ?? '';
            $contact = $input['contact'] ?? '';

            // 👇 注意这里类型声明："i"=整数,"s"=字符串
            $stmt->bind_param("issssss", $user_id, $page_name, $url, $category, $desc, $steps, $contact);
            $stmt->execute();

            ok(["success" => true, "id" => $conn->insert_id]);
        } catch (Throwable $e) {
            fail(500, "Insert report failed", ["error" => $e->getMessage()]);
        }
        exit;
    }
}



/* 0) 默认：返回所有用户 + 大学名称（保持你现有“直接数组”结构） */
/* ----(New)互斥校验：同一请求不允许既要listings又要groups----*/
if (isset($_GET['listings_by_university']) && isset($_GET['groups_by_university'])) {
    fail(400, "Choose either listings_by_university or groups_by_university, not both.");
}
if (isset($_GET['listings_by_user']) && isset($_GET['groups_by_user'])) {
    fail(400, "Choose either listings_by_user or groups_by_user, not both.");
}
/* ----(DianZ，10242025）---------------------------------- */

if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($_GET)) {
    try {
        $sql = "SELECT u.id, u.username, u.university_id, uni.name AS university
                FROM users u
                LEFT JOIN universities uni ON u.university_id = uni.id";
        $result = $conn->query($sql);
        $users = [];
        while ($row = $result->fetch_assoc()) { $users[] = $row; }
        echo json_encode($users, JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Throwable $e) {
        fail(500, "Query failed", ["error"=>$e->getMessage()]);
    }
}

/* 1) 按大学读取 listing（扩展字段 + 关联 username，最多 100 条） */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['listings_by_university'])) {
    try {
        $uni = intval($_GET['listings_by_university']);
        $stmt = $conn->prepare("
            SELECT 
                l.id, l.user_id, l.university_id, l.title, l.description,
                l.pictures, l.comments,
                l.price, l.category, l.location, l.contact,
                l.views, l.created_at,
                u.username
            FROM listings l
            LEFT JOIN users u ON u.id = l.user_id
            WHERE l.university_id = ?
            ORDER BY l.created_at DESC
            LIMIT 100
        ");
        $stmt->bind_param("i", $uni);
        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) {
            $row['pictures'] = $row['pictures'] ? json_decode($row['pictures'], true) : [];
            $row['comments'] = $row['comments'] ? json_decode($row['comments'], true) : [];
            $items[] = $row;
        }
        ok(["success"=>true, "items"=>$items]);
    } catch (Throwable $e) {
        fail(500, "Fetch listings failed", ["error"=>$e->getMessage()]);
    }
}
/* 1.1) (New) groups_by_university（可选 &category=study） */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['groups_by_university'])) {
    try {
        $uni = intval($_GET['groups_by_university']);
        $cat = trim((string)($_GET['category'] ?? ''));

        if ($cat !== '') {
            $stmt = $conn->prepare("
                SELECT
                    g.id, g.user_id, g.university_id,
                    g.title, g.description,
                    g.pictures, g.comments,
                    g.category, g.location, g.contact,
                    g.capacity, g.member_count,
                    g.views, g.created_at,
                    u.username
                FROM `groups` g
                LEFT JOIN users u ON u.id = g.user_id
                WHERE g.university_id = ? AND LOWER(g.category) = LOWER(?)
                ORDER BY g.created_at DESC
                LIMIT 100
            ");
            $stmt->bind_param("is", $uni, $cat);
        } else {
            $stmt = $conn->prepare("
                SELECT
                    g.id, g.user_id, g.university_id,
                    g.title, g.description,
                    g.pictures, g.comments,
                    g.category, g.location, g.contact,
                    g.capacity, g.member_count,
                    g.views, g.created_at,
                    u.username
                FROM `groups` g
                LEFT JOIN users u ON u.id = g.user_id
                WHERE g.university_id = ?
                ORDER BY g.created_at DESC
                LIMIT 100
            ");
            $stmt->bind_param("i", $uni);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) {
            // 与 listings 保持一致：把 JSON 列转数组
            $row['pictures'] = $row['pictures'] ? json_decode($row['pictures'], true) : [];
            $row['comments'] = $row['comments'] ? json_decode($row['comments'], true) : [];
            $items[] = $row;
        }
        /* 预览用户头像：用 IN (...) + PHP 侧截取前5个，避免 bind_param 数量不匹配 */
        $withPrev = isset($_GET['previews']) && $_GET['previews'] == '1';
        if ($withPrev && !empty($items)) {
            // 1) 收集并净化 group ids
            $ids = array_map('intval', array_column($items, 'id'));
            $ids = array_values(array_unique(array_filter($ids)));

            if (!empty($ids)) {
                // 2) 如果 users.avatar_url 列不存在，也能返回 null（更健壮）
                $hasAvatar = table_has_col($conn, "users", "avatar_url");
                $avatarSel = $hasAvatar ? "u.avatar_url" : "NULL AS avatar_url";

                // 3) 查询成员（按加入时间倒序）；注意：这里不再使用 bind_param
                $sqlPrev = "
                SELECT gm.group_id, gm.user_id, $avatarSel
                FROM group_members gm
                LEFT JOIN users u ON u.id = gm.user_id
                WHERE gm.group_id IN (" . implode(',', $ids) . ")
                ORDER BY gm.group_id, gm.joined_at DESC
                ";
                $resPrev = $conn->query($sqlPrev);

                // 4) 分组并保留每组前 5 个
                $byG = [];
                while ($r = $resPrev->fetch_assoc()) {
                    $gid = (int)$r['group_id'];
                    if (!isset($byG[$gid])) $byG[$gid] = [];
                    if (count($byG[$gid]) < 5) {
                        $byG[$gid][] = [
                            "user_id"    => (int)$r['user_id'],
                            "avatar_url" => $r['avatar_url'] ?? null
                        ];
                    }
                }

                // 5) 回填到 items
                foreach ($items as &$it) {
                    $gid = (int)$it['id'];
                    $it['member_previews'] = $byG[$gid] ?? [];
                }
                unset($it);
            }
        }
        ok(["success" => true, "items" => $items]);
    } catch (Throwable $e) {
        fail(500, "Fetch groups failed", ["error" => $e->getMessage()]);
    }
}
/* ----(DianZ，10242025）---------------------------------- */

/* 2) 查询单个用户（登录后获取其 university_id 等） */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['user'])) {
    try {
        $uid = intval($_GET['user']);
        $stmt = $conn->prepare("SELECT id, username, university_id, created_at FROM users WHERE id = ?");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        if ($res) {
            ok(["success"=>true, "user"=>$res]);
        } else {
            ok(["success"=>false, "message"=>"User not found"]);
        }
    } catch (Throwable $e) {
        fail(500, "Fetch user failed", ["error"=>$e->getMessage()]);
    }
}
/* 3) 按用户读取 listing（获取用户发布的所有商品） */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['listings_by_user'])) {
    try {
        $user_id = intval($_GET['listings_by_user']);
        $stmt = $conn->prepare("
            SELECT 
                l.id, l.user_id, l.university_id, l.title, l.description,
                l.pictures, l.comments,
                l.price, l.category, l.location, l.contact,
                l.views, l.created_at,
                u.username
            FROM listings l
            LEFT JOIN users u ON u.id = l.user_id
            WHERE l.user_id = ?
            ORDER BY l.created_at DESC
            LIMIT 100
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) {
            $row['pictures'] = $row['pictures'] ? json_decode($row['pictures'], true) : [];
            $row['comments'] = $row['comments'] ? json_decode($row['comments'], true) : [];
            $items[] = $row;
        }
        ok(["success"=>true, "items"=>$items]);
    } catch (Throwable $e) {
        fail(500, "Fetch user listings failed", ["error"=>$e->getMessage()]);
    }
}


/* 3.1) groups_by_user（某用户创建的所有小组） */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['groups_by_user'])) {
    try {
        $uid = intval($_GET['groups_by_user']);
        $stmt = $conn->prepare("
            SELECT
                g.id, g.user_id, g.university_id,
                g.title, g.description,
                g.pictures, g.comments,
                g.category, g.location, g.contact,
                g.capacity, g.member_count,
                g.views, g.created_at,
                u.username
            FROM `groups` g
            LEFT JOIN users u ON u.id = g.user_id
            WHERE g.user_id = ?
            ORDER BY g.created_at DESC
            LIMIT 100
        ");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $res = $stmt->get_result();

        $items = [];
        while ($row = $res->fetch_assoc()) {
            $row['pictures'] = $row['pictures'] ? json_decode($row['pictures'], true) : [];
            $row['comments'] = $row['comments'] ? json_decode($row['comments'], true) : [];
            $items[] = $row;
        }

        ok(["success" => true, "items" => $items]);
    } catch (Throwable $e) {
        fail(500, "Fetch user groups failed", ["error" => $e->getMessage()]);
    }
}


/* 3.2) group_categories_by_university —— 返回 {category, c} 列表 */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['group_categories_by_university'])) {
    try {
        $uni = intval($_GET['group_categories_by_university']);
        $stmt = $conn->prepare("
            SELECT
              COALESCE(NULLIF(TRIM(category), ''), 'uncategorized') AS category,
              COUNT(*) AS c
            FROM `groups`
            WHERE university_id = ?
            GROUP BY category
            ORDER BY c DESC, category ASC
        ");
        $stmt->bind_param("i", $uni);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        ok(["success" => true, "items" => $rows]);
    } catch (Throwable $e) {
        fail(500, "Fetch group categories failed", ["error" => $e->getMessage()]);
    }
}

/* ----(DianZ，10242025）---------------------------------- */

/* ===================== POST ===================== */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $body['action'] ?? '';

    /* register —— 重复用户名返回 409，返回结构保留你原先习惯 */
    if ($action === 'register') {
        try {
            $username = trim($body['username'] ?? '');
            $password = $body['password'] ?? '';

            if (!$username || !$password) ok(["success"=>false, "message"=>"Missing username or password"]);
            if (!validate_username($username)) ok(["success"=>false, "message"=>"Invalid username. Must be 3-20 characters: letters, numbers, or underscore."]);
            if (!validate_password($password)) ok(["success"=>false, "message"=>"Invalid password. Must be at least 8 characters, include uppercase, lowercase, and a special character."]);

            // 先查重，保证 409 行为稳定
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
            ok(["success"=>true, "message"=>"User registered", "id"=>$conn->insert_id]);
        } catch (Throwable $e) {
            // 兜底处理唯一键冲突
            if ($conn->errno === 1062 || stripos($e->getMessage(), 'duplicate') !== false) {
                http_response_code(409);
                ok(["success"=>false, "message"=>"Username already taken"]);
            }
            fail(500, "Registration failed", ["error"=>$e->getMessage()]);
        }
    }

    /* login —— 保持原有返回结构 */
    if ($action === 'login') {
        try {
            $username = trim($body['username'] ?? '');
            $password = $body['password'] ?? '';
            if (!$username || !$password) ok(["success"=>false, "message"=>"Missing username or password"]);
            if (!validate_username($username)) ok(["success"=>false, "message"=>"Invalid username format"]);

            $stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                if (password_verify($password, $row['password_hash'])) {
                    ok(["success"=>true, "message"=>"Login successful", "id"=>$row['id']]);
                } else {
                    ok(["success"=>false, "message"=>"Invalid password"]);
                }
            } else {
                ok(["success"=>false, "message"=>"User not found"]);
            }
        } catch (Throwable $e) {
            fail(500, "Login failed", ["error"=>$e->getMessage()]);
        }
    }

    /* create_listing —— 允许无图片，兼容字符串/数组 JSON，含扩展字段 */
    if ($action === 'create_listing') {
        try {
            $user_id       = intval($body['user_id'] ?? 0);
            $university_id = intval($body['university_id'] ?? 0);
            $title         = trim((string)($body['title'] ?? ''));
            $description   = trim((string)($body['description'] ?? ''));

            // pictures：可能是数组、字符串 JSON，或未提供
            $pictures_input = $body['pictures'] ?? [];
            if (is_string($pictures_input)) {
                $tmp = json_decode($pictures_input, true);
                $pictures = is_array($tmp) ? $tmp : [];
            } elseif (is_array($pictures_input)) {
                $pictures = array_values(array_filter($pictures_input, fn($u) => is_string($u) && trim($u) !== ''));
            } else {
                $pictures = [];
            }

            // comments：缺省为空数组
            $comments_input = $body['comments'] ?? [];
            $comments = is_array($comments_input) ? $comments_input : [];

            if ($user_id <= 0 || $university_id <= 0 || $title === '') ok(["success"=>false, "message"=>"Missing required fields"]);

            $pictures_json = json_encode($pictures, JSON_UNESCAPED_UNICODE);
            $comments_json = json_encode($comments, JSON_UNESCAPED_UNICODE);

            // 扩展字段
            $price    = floatval($body['price'] ?? 0);
            $category = trim((string)($body['category'] ?? ''));
            $location = trim((string)($body['location'] ?? ''));
            $contact  = trim((string)($body['contact'] ?? ''));

            $stmt = $conn->prepare("
                INSERT INTO listings
                    (user_id, university_id, title, description, pictures, comments, price, category, location, contact, created_at, views)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)
            ");
            if (!$stmt) fail(500, "Prepare failed", ["error"=>$conn->error]);

            $stmt->bind_param(
                "iissssdsss",
                $user_id, $university_id, $title, $description,
                $pictures_json, $comments_json,
                $price, $category, $location, $contact
            );
            $stmt->execute();
            ok(["success"=>true, "id"=>$conn->insert_id]);
        } catch (Throwable $e) {
            fail(500, "Create listing failed", ["error"=>$e->getMessage()]);
        }
    }
}

/* ===================== PATCH ===================== */
/* 更新用户的 university_id（保持原响应结构） */
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    try {
        $id = intval($body['id'] ?? 0);
        $university_id = intval($body['university_id'] ?? 0);

        if ($id && $university_id) {
            $stmt = $conn->prepare("UPDATE users SET university_id = ? WHERE id = ?");
            $stmt->bind_param("ii", $university_id, $id);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                ok(["success"=>true, "message"=>"University updated"]);
            } else {
                ok(["success"=>false, "message"=>"Update failed"]);
            }
        } else {
            ok(["success"=>false, "message"=>"Missing id or university_id"]);
        }
    } catch (Throwable $e) {
        fail(500, "Update university_id failed", ["error"=>$e->getMessage()]);
    }
}

/* ===================== 未匹配 ===================== */
fail(400, "Invalid or unsupported request.");
