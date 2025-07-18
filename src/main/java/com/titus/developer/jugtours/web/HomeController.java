package com.titus.developer.jugtours.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String redirectToFrontend() {
        return "redirect:https://minmeetup.vercel.app";
    }
} 