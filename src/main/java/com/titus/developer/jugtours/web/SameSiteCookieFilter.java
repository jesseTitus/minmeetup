package com.titus.developer.jugtours.web;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50) // After Spring Security filters
public class SameSiteCookieFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(request, response);
        if (response instanceof HttpServletResponse res) {
            for (String header : res.getHeaders("Set-Cookie")) {
                if (header.startsWith("XSRF-TOKEN")) {
                    // Only add if not already present
                    if (!header.contains("SameSite=None")) {
                        res.setHeader("Set-Cookie", header + "; SameSite=None; Secure");
                    }
                }
            }
        }
    }
} 