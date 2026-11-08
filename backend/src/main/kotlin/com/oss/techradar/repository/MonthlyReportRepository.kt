package com.oss.techradar.repository

import com.oss.techradar.domain.MonthlyReport
import org.springframework.data.jpa.repository.JpaRepository
import java.time.YearMonth

interface MonthlyReportRepository : JpaRepository<MonthlyReport, Long> {

    fun findAllByDomainOrderByReportMonthDesc(domain: String): List<MonthlyReport>

    /** 파라미터는 엔티티 필드와 같은 YearMonth — Hibernate 가 YearMonthConverter 로 변환 */
    fun findByDomainAndReportMonth(domain: String, reportMonth: YearMonth): MonthlyReport?

    fun existsByDomainAndReportMonth(domain: String, reportMonth: YearMonth): Boolean
}
