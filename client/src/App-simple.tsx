// Simple test component to debug React mounting issues
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>RadIntel Test App</h1>
      <p>If you can see this, React is working correctly.</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <strong>Debug Info:</strong>
        <ul>
          <li>React is mounting: ✅</li>
          <li>useState is working: {count > 0 ? '✅' : '⏳'}</li>
          <li>Event handlers working: {count > 0 ? '✅' : '⏳'}</li>
        </ul>
      </div>
    </div>
  );
}

export default App;