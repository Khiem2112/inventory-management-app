// UserProfileHook.jsx
import React, { useState, useEffect } from 'react'; // (1) Imports

function UserProfileHook({ userId }) { // (2) Component Function with Props
  // (3) State Variables
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (4) The useEffect Hook Itself
  useEffect(() => {
    // (5) Effect Setup (runs when dependencies change)
    console.log(`Hook: Effect setup for user ${userId}`);

    // (6) AbortController for managing pending fetch requests
    let controller = new AbortController();
    const signal = controller.signal;

    // (7) Inner Async Function for Data Fetching
    const fetchUserData = async () => {
      setLoading(true); // Indicate loading has started
      setError(null);    // Clear any previous errors
      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, { signal });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUser(data); // Set user data on success
      } catch (e) {
        // (8) Error Handling and AbortError Check
        if (e.name === 'AbortError') {
          console.log('Hook: Fetch was aborted (expected behavior during cleanup)');
        } else {
          setError(e); // Set error if a real error occurred
        }
      } finally {
        setLoading(false); // Indicate loading has finished (success or failure)
      }
    };

    fetchUserData(); // (9) Execute the fetch operation

    // (10) Cleanup Function (runs before re-run or on unmount)
    return () => {
      console.log(`Hook: Cleanup for user ${userId}`);
      controller.abort(); // Abort the fetch associated with THIS effect run
    };
  }, [userId]); // (11) Dependency Array

  // (12) Render Logic
  if (loading) return <p>Loading user {userId}...</p>;
  if (error) return <p>Error loading user: {error.message}</p>;
  if (!user) return <p>No user data.</p>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px' }}>
      <h3>User Profile (Hook Component)</h3>
      <p>ID: {user.id}</p>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfileHook;