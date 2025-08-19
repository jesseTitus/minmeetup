package com.titus.developer.jugtours.messaging;

import com.titus.developer.jugtours.config.RabbitConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

// @Service
@ConditionalOnProperty(name = "rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
public class RsvpMessageProducer {
    
    private static final Logger log = LoggerFactory.getLogger(RsvpMessageProducer.class);
    
    private final RabbitTemplate rabbitTemplate;
    
    public RsvpMessageProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }
    
    public void sendRsvpConfirmed(RsvpMessage message) {
        log.info("Sending RSVP confirmed message: {}", message);
        rabbitTemplate.convertAndSend(
            RabbitConfig.RSVP_EXCHANGE,
            RabbitConfig.RSVP_CONFIRMED_ROUTING_KEY,
            message
        );
    }
    
    public void sendWaitlistAdded(RsvpMessage message) {
        log.info("Sending waitlist message: {}", message);
        rabbitTemplate.convertAndSend(
            RabbitConfig.RSVP_EXCHANGE,
            RabbitConfig.WAITLIST_ROUTING_KEY,
            message
        );
    }
    
    public void sendRsvpCancelled(RsvpMessage message) {
        log.info("Sending RSVP cancelled message: {}", message);
        rabbitTemplate.convertAndSend(
            RabbitConfig.RSVP_EXCHANGE,
            RabbitConfig.RSVP_CANCELLED_ROUTING_KEY,
            message
        );
    }
}