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



if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

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
            echo json_encode([
                "success" => true,
                "message" => "User registered",
                "id" => $conn->insert_id
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Registration failed"]);
        }
    }

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
    }
}

$conn->close();
?>
