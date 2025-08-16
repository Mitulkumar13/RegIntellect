// Ultra simple test - just change the page content directly
console.log("JavaScript is working!");

const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; background: #f0f8ff; border: 2px solid #007bff;">
      <h1 style="color: #007bff;">✅ RadIntel is Working!</h1>
      <p>JavaScript loaded successfully.</p>
      <p>Root element found: ✅</p>
      <p>Time: ${new Date().toLocaleTimeString()}</p>
      <button onclick="alert('Button works!')" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Test Button
      </button>
      <div style="margin-top: 20px; padding: 10px; background: #e8f5e8; border-left: 4px solid #28a745;">
        <strong>Success!</strong> The application is loading correctly. We can now restore the React components.
      </div>
    </div>
  `;
  console.log("Content updated successfully");
} else {
  console.error("Root element not found!");
  document.body.innerHTML = "<h1>ERROR: Root element not found!</h1>";
}
