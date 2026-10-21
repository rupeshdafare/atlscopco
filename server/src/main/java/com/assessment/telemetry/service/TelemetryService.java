package com.assessment.telemetry.service;

import com.assessment.telemetry.model.TelemetrySample;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class TelemetryService {

    private static final int MAX_SAMPLES = 100;

    private final Deque<TelemetrySample> history = new ArrayDeque<>();

    private double velocity = 185.4;
    private double pressure = 1012.0;
    private double temperature = 36.8;
    private int cycle = 0;

    public TelemetryService() {
        history.addLast(createSample());
    }

    @Scheduled(fixedRate = 1000)
    public synchronized void generateSample() {
        cycle++;

        if (cycle % 5 == 0) {
            velocity += (185.4 - velocity) * 0.35;
            pressure += (1012.0 - pressure) * 0.35;
            temperature += (36.8 - temperature) * 0.35;
        } else {
            velocity = vary(velocity, 0.10);
            pressure = vary(pressure, 0.10);
            temperature = vary(temperature, 0.10);
        }

        velocity = Math.max(0, velocity);
        pressure = Math.max(0, pressure);
        temperature = Math.max(-50, Math.min(150, temperature));

        history.addLast(createSample());

        while (history.size() > MAX_SAMPLES) {
            history.removeFirst();
        }
    }

    private double vary(double value, double fraction) {
        double delta = Math.abs(value) * fraction;
        return value + ThreadLocalRandom.current()
                .nextDouble(-delta, delta);
    }

    private TelemetrySample createSample() {
        return new TelemetrySample(
                Instant.now(),
                velocity,
                pressure,
                temperature
        );
    }

    public synchronized List<TelemetrySample> getHistory() {
        return new ArrayList<>(history);
    }

    public synchronized TelemetrySample getLatest() {
        return history.getLast();
    }
}