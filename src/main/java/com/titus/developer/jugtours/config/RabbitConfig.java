package com.titus.developer.jugtours.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// @Configuration
// @EnableRabbit
// @ConditionalOnProperty(name = "rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
public class RabbitConfig {

    // Queue names
    public static final String RSVP_CONFIRMED_QUEUE = "rsvp.confirmed.queue";
    public static final String WAITLIST_QUEUE = "waitlist.queue";
    public static final String RSVP_CANCELLED_QUEUE = "rsvp.cancelled.queue";
    
    // Exchange name
    public static final String RSVP_EXCHANGE = "rsvp.exchange";
    
    // Routing keys
    public static final String RSVP_CONFIRMED_ROUTING_KEY = "rsvp.confirmed";
    public static final String WAITLIST_ROUTING_KEY = "rsvp.waitlist";
    public static final String RSVP_CANCELLED_ROUTING_KEY = "rsvp.cancelled";

    // Queues
    // @Bean
    public Queue rsvpConfirmedQueue() {
        return new Queue(RSVP_CONFIRMED_QUEUE, true); // durable = true
    }

    // @Bean
    public Queue waitlistQueue() {
        return new Queue(WAITLIST_QUEUE, true);
    }

    // @Bean
    public Queue rsvpCancelledQueue() {
        return new Queue(RSVP_CANCELLED_QUEUE, true);
    }

    // Exchange
    // @Bean
    public TopicExchange rsvpExchange() {
        return new TopicExchange(RSVP_EXCHANGE);
    }

    // Bindings
    // @Bean
    public Binding rsvpConfirmedBinding() {
        return BindingBuilder.bind(rsvpConfirmedQueue())
                .to(rsvpExchange())
                .with(RSVP_CONFIRMED_ROUTING_KEY);
    }

    // @Bean
    public Binding waitlistBinding() {
        return BindingBuilder.bind(waitlistQueue())
                .to(rsvpExchange())
                .with(WAITLIST_ROUTING_KEY);
    }

    // @Bean
    public Binding rsvpCancelledBinding() {
        return BindingBuilder.bind(rsvpCancelledQueue())
                .to(rsvpExchange())
                .with(RSVP_CANCELLED_ROUTING_KEY);
    }

    // JSON message converter
    // @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // RabbitTemplate with JSON converter
    // @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}