package com.titus.developer.jugtours;

import com.titus.developer.jugtours.web.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Profile("!test")
@Configuration
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
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
                            // After OAuth2 success, redirect to a frontend page that will get the JWT
                            String referer = request.getHeader("referer");
                            String host = request.getServerName();
                            String redirectUrl;

                            if (host.equals("localhost") || host.equals("127.0.0.1") ||
                                    (referer != null && referer.contains("localhost:5173"))) {
                                redirectUrl = "http://localhost:5173/auth/callback";
                            } else {
                                redirectUrl = "https://minmeetup.vercel.app/auth/callback";
                            }

                            response.sendRedirect(redirectUrl);
                        }));
        return http.build();
    }
}