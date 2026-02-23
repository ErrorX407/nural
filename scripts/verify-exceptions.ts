async function verify() {
  const baseUrl = "http://localhost:3000";

  console.log("--- 1. Testing Unauthorized Middleware (401) ---");
  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: "Bearer invalid" },
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    try {
      const body = JSON.parse(text);
      console.log("Body:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.log("Body (Text):", text);
    }
  } catch (err) {
    console.error("Request failed", err);
  }

  console.log("\n--- 2. Testing Unauthorized Handler (401) ---");
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "wrong-password",
      }),
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    try {
      const body = JSON.parse(text);
      console.log("Body:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.log("Body (Text):", text);
    }
  } catch (err) {
    console.error("Request failed", err);
  }
}

verify();
