
package com.assessment.telemetry.controller;

import com.assessment.telemetry.model.TelemetrySample;
import com.assessment.telemetry.service.TelemetryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final TelemetryService service;

    public DashboardController(TelemetryService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {

        TelemetrySample latest = service.getLatest();
        List<TelemetrySample> history = service.getHistory();

        List<HistoryPoint> velocityHistory = history.stream()
                .map(s -> new HistoryPoint(
                        s.timestamp().toString(),
                        s.velocity()))
                .toList();

        List<HistoryPoint> pressureHistory = history.stream()
                .map(s -> new HistoryPoint(
                        s.timestamp().toString(),
                        s.pressure()))
                .toList();

        List<HistoryPoint> temperatureHistory = history.stream()
                .map(s -> new HistoryPoint(
                        s.timestamp().toString(),
                        s.temperature()))
                .toList();

        return new DashboardResponse(
                latest.timestamp().toString(),
                new MetricResponse(
                        latest.velocity(), "cm/s", velocityHistory),
                new MetricResponse(
                        latest.pressure(), "mbar", pressureHistory),
                new MetricResponse(
                        latest.temperature(), "°C", temperatureHistory)
        );
    }

    public record HistoryPoint(String time, double value) {}

    public record MetricResponse(
            double value,
            String unit,
            List<HistoryPoint> history
    ) {}

    public record DashboardResponse(
            String timestamp,
            MetricResponse velocity,
            MetricResponse pressure,
            MetricResponse temperature
    ) {}
}
