<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");


header("Content-Type: application/json; charset=utf-8"); // new


$servername = "localhost";
//$username = "zzhong5";
$username = "root";
//$password = "50457160";
$password = "";
$dbname = "testdb";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {

    http_response_code(500); // new

    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

mysqli_set_charset($conn, 'utf8mb4'); // new 

//--- new funcion to validate_username and password-------

function validate_username($name) {
    return (bool) preg_match('/^[A-Za-z0-9_]{3,20}$/', $name); // 3-20 alphanumeric characters with underscore
}
function validate_password($pwd) {
    if (strlen($pwd) < 8) return false;
    if (!preg_match('/[a-z]/', $pwd)) return false;
    if (!preg_match('/[A-Z]/', $pwd)) return false;
    if (!preg_match('/[^a-zA-Z0-9]/', $pwd)) return false; // At least one special character
    return true;
}


if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all users (does not return passwords)
    $result = $conn->query("SELECT id, name, university FROM users");
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode($users);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Distinguish between registration and login
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

//---------------------new register--------
    if ($action === 'register') {
    $name = trim($data['name'] ?? '');
    $password = $data['password'] ?? '';

    // Required check
    if ($name === '' || $password === '') {
        echo json_encode(["success" => false, "message" => "Missing name or password"]);
        exit;
    }

    // Username cannot have leading and trailing spaces
    if ($name !== ($data['name'] ?? '')) {
        echo json_encode(["success" => false, "message" => "Username cannot contain leading or trailing spaces"]);
        exit;
    }


    

    // Server verification (calling the function defined above)
    if (!validate_username($name)) {
        echo json_encode(["success" => false, "message" => "Invalid username (3–20 letters/numbers/_)"]);
        exit;
    }
    if (!validate_password($password)) {
        echo json_encode(["success" => false, "message" => "Password does not meet complexity requirements"]);
        exit;
    }

    // put into database
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $conn->prepare("INSERT INTO users (name, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $hashedPassword);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "User registered"]);
    } else {
        
        if ($conn->errno === 1062) {
            echo json_encode(["success" => false, "message" => "Username already exists"]);
        } else {
            echo json_encode(["success" => false, "message" => "Registration failed"]);
        }
    }
}

//------------------------Login-----------------------------------------------------

    if ($action === 'login') {
        $name = $data['name'] ?? '';
        $password = $data['password'] ?? '';

        if ($name && $password) {
            $stmt = $conn->prepare("SELECT id, password FROM users WHERE name = ?");
            $stmt->bind_param("s", $name);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) {
                if (password_verify($password, $row['password'])) {
                    echo json_encode(["success" => true, "message" => "Login successful", "id" => $row['id']]);
                } else {
                    echo json_encode(["success" => false, "message" => "Invalid password"]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "User not found"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Missing name or password"]);
        }
    }
}

$conn->close();
?>
