package com.assessment.telemetry.dto;

import java.time.Instant;

public record DashboardDto(Instant timestamp, MetricDto velocity, MetricDto pressure, MetricDto temperature) {}
