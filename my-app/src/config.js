// 自动识别环境，默认使用本地 (XAMPP)
const host = window.location.hostname;

let API_BASE = "http://localhost/Ulink"; // 默认本地

// 如果检测到是在 UB 服务器上，则自动切换
if (host.includes("aptitude.cse.buffalo.edu")) {
    API_BASE = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442z";
} else if (host.includes("cattle.cse.buffalo.edu")) {
    API_BASE = "https://cattle.cse.buffalo.edu/CSE442/2025-Fall/cse-442z";
}

export { API_BASE };
