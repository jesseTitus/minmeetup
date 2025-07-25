package com.titus.developer.jugtours;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class JugtoursApplication {

	public static void main(String[] args) {
		SpringApplication.run(JugtoursApplication.class, args);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")
					.allowedOrigins("http://localhost:5173", "https://minmeetup.vercel.app")
					.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
					.allowCredentials(true);
			}
		};
	}
}
