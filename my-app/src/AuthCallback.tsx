import { useEffect } from "react";

const AuthCallback = () => {
  useEffect(() => {
    const getTokenAndRedirect = () => {
      try {
        // Get token from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
          // Store JWT in localStorage
          localStorage.setItem("jwt_token", token);
          console.log("JWT token stored successfully");
        } else {
          console.error("No token found in URL");
        }

        // Always redirect to home page
        window.location.href = "/";
      } catch (error) {
        console.error("Error processing auth callback:", error);
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
