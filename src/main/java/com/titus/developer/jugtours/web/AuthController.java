package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final JwtService jwtService;
    
    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }
    
    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> generateToken(@AuthenticationPrincipal OAuth2User user, HttpServletRequest request) {
        System.out.println("=== TOKEN REQUEST DEBUG ===");
        System.out.println("User: " + user);
        System.out.println("Session ID: " + request.getSession().getId());
        System.out.println("Referer: " + request.getHeader("referer"));
        System.out.println("User-Agent: " + request.getHeader("user-agent"));
        
        if (user == null) {
            System.out.println("ERROR: OAuth2User is null - session not established");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String token = jwtService.generateToken(user);
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("type", "Bearer");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getCurrentUser(HttpServletRequest request) {
        Claims claims = (Claims) request.getAttribute("jwtClaims");
        
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("sub", claims.getSubject());
        userInfo.put("name", claims.get("name"));
        userInfo.put("email", claims.get("email"));
        userInfo.put("picture", claims.get("picture"));
        
        return ResponseEntity.ok(userInfo);
    }
} 