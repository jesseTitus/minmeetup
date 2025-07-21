package com.titus.developer.jugtours.web;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Profile("!test")
@RestController
@RequestMapping("/api")
public class UserController {
    private final ClientRegistration registration;

    public UserController(ClientRegistrationRepository registrations) {
        this.registration = registrations.findByRegistrationId("auth0");
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUser(Principal principal, HttpServletRequest request) {
        // Try JWT first
        io.jsonwebtoken.Claims claims = (io.jsonwebtoken.Claims) request.getAttribute("jwtClaims");
        if (claims != null) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("sub", claims.getSubject());
            userInfo.put("name", claims.get("name"));
            userInfo.put("email", claims.get("email"));
            userInfo.put("picture", claims.get("picture"));
            return ResponseEntity.ok().body(userInfo);
        }
        
        // Fallback to OAuth2
        if (principal instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauth2Token = (OAuth2AuthenticationToken) principal;
            OAuth2User user = oauth2Token.getPrincipal();
            if (user == null) {
                return new ResponseEntity<>("", HttpStatus.OK);
            } else {
                return ResponseEntity.ok().body(user.getAttributes());
            }
        }
        
        return new ResponseEntity<>("", HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request,
            @AuthenticationPrincipal(expression = "idToken") OidcIdToken idToken) {
        // send logout URL to client so they can initiate logout
        String logoutUrl = this.registration.getProviderDetails()
                .getConfigurationMetadata().get("end_session_endpoint").toString();

        Map<String, String> logoutDetails = new HashMap<>();
        logoutDetails.put("logoutUrl", logoutUrl);
        logoutDetails.put("idToken", idToken.getTokenValue());
        request.getSession(false).invalidate();
        return ResponseEntity.ok().body(logoutDetails);
    }
}