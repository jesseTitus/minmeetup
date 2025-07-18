import { useEffect } from "react";

const AuthCallback = () => {
  useEffect(() => {
    const getTokenAndRedirect = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        
        // Get JWT token from backend using session cookie
        const response = await fetch(`${apiUrl}/api/auth/token`, {
          method: "POST",
          credentials: "include", // This uses the session cookie from OAuth2
        });

        if (response.ok) {
          const data = await response.json();
          const token = data.token;
          
          // Store JWT in localStorage
          localStorage.setItem("jwt_token", token);
          
          // Redirect to groups page
          window.location.href = "/groups";
        } else {
          console.error("Failed to get JWT token");
          // Redirect to login if token fetch fails
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
        }
      } catch (error) {
        console.error("Error getting JWT token:", error);
        window.location.href = "/";
      }
    };

    getTokenAndRedirect();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h3>Completing login...</h3>
      <p>Please wait while we set up your session.</p>
    </div>
  );
};

export default AuthCallback; 