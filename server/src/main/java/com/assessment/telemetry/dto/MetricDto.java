package com.assessment.telemetry.dto;

import java.util.List;

public record MetricDto(double value, String unit, List<HistoryPoint> history) {}
