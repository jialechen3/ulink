<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Allow CORS for development (adjust for production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Handle CORS preflight request
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Require validation helpers
//require_once __DIR__ . "/backend/lib/validate.php";

// Database connection config
$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "testdb";

// Connect to MySQL
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}
// Set charset to utf8mb4 (supports emojis and multi-byte characters)
mysqli_set_charset($conn, 'utf8mb4');

// Enforce JSON for write methods: return 415 if not application/json
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (in_array($method, ['POST', 'PATCH'], true)) {
    $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/json') !== 0) {
        http_response_code(415);
        echo json_encode(["error" => "UNSUPPORTED_MEDIA_TYPE"]);
        exit;
    }
}

// ========================== GET ==========================
// Fetch all users (id, name, university)
if ($method === 'GET') {
    $result = $conn->query("SELECT id, name, university FROM users");
    $users = [];
    while ($row = $result->fetch_assoc()) $users[] = $row;
    echo json_encode($users);
    $conn->close();
    exit;
}

// ========================== POST ==========================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? [];
    $action = $data['action'] ?? '';

    // ---------------- REGISTER ----------------
if ($action === 'register') {
    $rawName = $data['name'] ?? '';
    $pwd     = $data['password'] ?? '';
    $name    = $rawName;

    // Check duplicate username
    $check = $conn->prepare("SELECT 1 FROM users WHERE name = ?");
    $check->bind_param("s", $name);
    $check->execute();
    if ($check->get_result()->fetch_row()) {
        http_response_code(409);
        echo json_encode(["error" => "USERNAME_TAKEN"]);
        $conn->close();
        exit;
    }

    // Insert new user
    $hashed = password_hash($pwd, PASSWORD_BCRYPT);
    $stmt = $conn->prepare("INSERT INTO users (name, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $hashed);
    if ($stmt->execute()) {
        echo json_encode(["ok" => true, "id" => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "REGISTRATION_FAILED"]);
    }
    $conn->close();
    exit;
}
}

// Fallback for other methods
http_response_code(405);
echo json_encode(["error" => "METHOD_NOT_ALLOWED"]);
$conn->close();