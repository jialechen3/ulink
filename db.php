<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "testdb";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 获取所有用户（不返回密码）
    $result = $conn->query("SELECT id, username, university FROM users");
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode($users);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 区分注册还是登录
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'register') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if ($username && $password) {
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
            $stmt->bind_param("ss", $username, $hashedPassword);
            if ($stmt->execute()) {
                echo json_encode([
                    "success" => true,
                    "message" => "User registered",
                    "id" => $conn->insert_id   // 返回新用户的 ID
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Registration failed"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Missing username or password"]);
        }
    }

    if ($action === 'login') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if ($username && $password) {
            $stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) {
                if (password_verify($password, $row['password_hash'])) {
                    echo json_encode([
                        "success" => true,
                        "message" => "Login successful",
                        "id" => $row['id']
                    ]);
                } else {
                    echo json_encode(["success" => false, "message" => "Invalid password"]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "User not found"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Missing username or password"]);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    // 更新用户的 university
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? '';
    $university = $data['university'] ?? '';

    if ($id && $university) {
        $stmt = $conn->prepare("UPDATE users SET university = ? WHERE id = ?");
        $stmt->bind_param("si", $university, $id);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            echo json_encode(["success" => true, "message" => "University updated"]);
        } else {
            echo json_encode(["success" => false, "message" => "Update failed"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Missing id or university"]);
    }
}

$conn->close();
?>
