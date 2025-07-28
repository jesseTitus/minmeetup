package com.titus.developer.jugtours.web;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

/**
 * Filter that adds SameSite=None; Secure attributes to CSRF cookies
 * in production environments only. Localhost behavior unchanged.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SameSiteCookieFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Wrap response to intercept Set-Cookie headers
        SameSiteResponseWrapper wrapper = new SameSiteResponseWrapper(httpResponse, httpRequest);

        chain.doFilter(request, wrapper);
    }

    private static class SameSiteResponseWrapper extends HttpServletResponseWrapper {
        private final HttpServletRequest request;

        public SameSiteResponseWrapper(HttpServletResponse response, HttpServletRequest request) {
            super(response);
            this.request = request;
        }

        @Override
        public void addHeader(String name, String value) {
            if ("Set-Cookie".equals(name) && value.contains("XSRF-TOKEN") && isProductionEnvironment()) {
                // Only modify CSRF cookies in production
                if (!value.contains("SameSite=None") && !value.contains("SameSite=none")) {
                    value = value + "; SameSite=None; Secure";
                }
            }
            super.addHeader(name, value);
        }

        @Override
        public void setHeader(String name, String value) {
            if ("Set-Cookie".equals(name) && value.contains("XSRF-TOKEN") && isProductionEnvironment()) {
                // Only modify CSRF cookies in production
                if (!value.contains("SameSite=None") && !value.contains("SameSite=none")) {
                    value = value + "; SameSite=None; Secure";
                }
            }
            super.setHeader(name, value);
        }

        private boolean isProductionEnvironment() {
            String serverName = request.getServerName();
            // Only apply to production (not localhost/127.0.0.1)
            return !("localhost".equals(serverName) || "127.0.0.1".equals(serverName));
        }
    }
}