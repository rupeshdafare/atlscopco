
package com.assessment.telemetry.model;

import java.time.Instant;

public record TelemetrySample(
        Instant timestamp,
        double velocity,
        double pressure,
        double temperature
) {}
