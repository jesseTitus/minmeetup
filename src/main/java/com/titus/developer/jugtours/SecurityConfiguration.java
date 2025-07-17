package com.titus.developer.jugtours;

import com.titus.developer.jugtours.web.CookieCsrfFilter;
import com.titus.developer.jugtours.web.SpaWebFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SimpleSavedRequest;
import org.springframework.security.web.AuthenticationEntryPoint;

@Profile("!test")
@Configuration
public class SecurityConfiguration {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Use default CookieCsrfTokenRepository
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");
        csrfTokenRepository.setCookieName("XSRF-TOKEN");

        http
                .cors()
                .and()
                .authorizeHttpRequests((authz) -> authz
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/index.html", "/static/**",
                                "/*.ico", "/*.json", "/*.png", "/api/user")
                        .permitAll()
                        .anyRequest().authenticated())
                .csrf((csrf) -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .addFilterAfter(new CookieCsrfFilter(), BasicAuthenticationFilter.class)
                .addFilterAfter(new SpaWebFilter(), BasicAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2
                    .successHandler((request, response, authentication) -> {
                        String referer = request.getHeader("referer");
                        String host = request.getServerName();
                        String redirectUrl;
                        
                        // Check if we're running locally (localhost or 127.0.0.1)
                        if (host.equals("localhost") || host.equals("127.0.0.1") || 
                            (referer != null && referer.contains("localhost:5173"))) {
                            redirectUrl = "http://localhost:5173";
                        } else {
                            redirectUrl = "https://minmeetup.vercel.app";
                        }
                        
                        response.sendRedirect(redirectUrl);
                    })
                )
                .exceptionHandling()
                .defaultAuthenticationEntryPointFor(
                        (request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Unauthorized\"}");
                        },
                        request -> request.getRequestURI().startsWith("/api"));
        return http.build();
    }

    @Bean
    public RequestCache refererRequestCache() {
        return new HttpSessionRequestCache() {
            @Override
            public void saveRequest(HttpServletRequest request, HttpServletResponse response) {
                String referrer = request.getHeader("referer");
                if (referrer == null) {
                    referrer = request.getRequestURL().toString();
                }
                request.getSession().setAttribute("SPRING_SECURITY_SAVED_REQUEST",
                        new SimpleSavedRequest(referrer));

            }
        };
    }
}