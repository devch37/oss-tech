package com.oss.techradar.api.dto

import com.oss.techradar.domain.MonthlyReport
import java.time.LocalDateTime

data class MonthlyReportDto(
    val id: Long,
    val domain: String,
    val reportMonth: String,   // "YYYY-MM" 형식
    val content: String,
    val generatedAt: LocalDateTime,
) {
    companion object {
        fun from(entity: MonthlyReport): MonthlyReportDto = MonthlyReportDto(
            id = entity.id,
            domain = entity.domain,
            reportMonth = entity.reportMonth.toString(),  // YearMonth.toString() → "YYYY-MM"
            content = entity.content,
            generatedAt = entity.generatedAt,
        )
    }
}
