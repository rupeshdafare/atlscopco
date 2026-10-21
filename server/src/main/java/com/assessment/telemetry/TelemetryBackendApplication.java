package com.assessment.telemetry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TelemetryBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TelemetryBackendApplication.class, args);
    }
}