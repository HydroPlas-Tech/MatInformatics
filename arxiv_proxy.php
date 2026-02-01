<?php
// arxiv_proxy.php
// A simple proxy to fetch data from ArXiv server-side and return to the client.
// This bypasses browser CORS restrictions.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/xml");

// Get the target URL parameter
$query = isset($_GET['query']) ? $_GET['query'] : '';

if (!$query) {
    http_response_code(400);
    echo "Missing query parameter";
    exit;
}

// Construct the ArXiv API URL
// We re-construct the URL here to prevent open proxy abuse, ensuring we only hit ArXiv.
$baseUrl = "http://export.arxiv.org/api/query";
$targetUrl = $baseUrl . "?" . $query;

// Use file_get_contents to fetch
$response = @file_get_contents($targetUrl);

if ($response === FALSE) {
    http_response_code(500);
    echo "Error fetching from ArXiv";
} else {
    echo $response;
}
?>