package com.oss.techradar.api.dto

import com.oss.techradar.domain.MonthlyReport
import java.time.LocalDateTime

/** 리포트 목록 조회용 — content 제외, 메타 정보만 */
data class ReportMetaDto(
    val id: Long,
    val domain: String,
    val reportMonth: String,     // "YYYY-MM"
    val generatedAt: LocalDateTime,
) {
    companion object {
        fun from(entity: MonthlyReport): ReportMetaDto = ReportMetaDto(
            id = entity.id,
            domain = entity.domain,
            reportMonth = entity.reportMonth.toString(),
            generatedAt = entity.generatedAt,
        )
    }
}
