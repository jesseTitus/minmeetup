package com.titus.developer.jugtours;

import com.titus.developer.jugtours.web.JwtAuthenticationFilter;
import com.titus.developer.jugtours.service.JwtService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.core.user.OAuth2User;

@Profile("!test")
@Configuration
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtService jwtService;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter, JwtService jwtService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtService = jwtService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors()
                .and()
                .csrf().disable() // Disable CSRF since we're using JWT
                .authorizeHttpRequests((authz) -> authz
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/index.html", "/static/**",
                                "/*.ico", "/*.json", "/*.png", "/api/auth/user")
                        .permitAll()
                        .requestMatchers("/oauth2/**", "/login/**", "/api/auth/token").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2
                        .successHandler((request, response, authentication) -> {
                            // Generate JWT token immediately and pass it to frontend
                            OAuth2User user = (OAuth2User) authentication.getPrincipal();
                            String token = jwtService.generateToken(user);
                            
                            String referer = request.getHeader("referer");
                            String host = request.getServerName();
                            String redirectUrl;

                            if (host.equals("localhost") || host.equals("127.0.0.1") ||
                                    (referer != null && referer.contains("localhost:5173"))) {
                                redirectUrl = "http://localhost:5173/auth/callback";
                            } else {
                                redirectUrl = "https://minmeetup.vercel.app/auth/callback";
                            }
                            
                            // Pass token as URL parameter
                            redirectUrl += "?token=" + token;
                            response.sendRedirect(redirectUrl);
                        }));
        return http.build();
    }
}