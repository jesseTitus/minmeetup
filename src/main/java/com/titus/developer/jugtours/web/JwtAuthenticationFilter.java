package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtService jwtService;
    
    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String jwt = authHeader.substring(7);
        
        if (jwtService.isTokenValid(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
            Claims claims = jwtService.extractClaims(jwt);
            
            // Create a user details object from JWT claims
            UserDetails userDetails = User.builder()
                    .username(claims.getSubject())
                    .password("") // No password needed for JWT
                    .authorities(new ArrayList<>()) // Add authorities if needed
                    .build();
            
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            // Store JWT claims in request attributes for controllers to access
            request.setAttribute("jwtClaims", claims);
            
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        
        filterChain.doFilter(request, response);
    }
} 