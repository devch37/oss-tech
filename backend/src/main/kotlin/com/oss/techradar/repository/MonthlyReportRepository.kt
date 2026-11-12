package com.oss.techradar.repository

import com.oss.techradar.domain.MonthlyReport
import org.springframework.data.jpa.repository.JpaRepository
import java.time.YearMonth

interface MonthlyReportRepository : JpaRepository<MonthlyReport, Long> {

    fun findAllByDomainAndLanguageOrderByReportMonthDesc(domain: String, language: String): List<MonthlyReport>

    /** reportMonth는 YearMonthConverter가 적용된 YearMonth 필드 */
    fun findByDomainAndReportMonthAndLanguage(domain: String, reportMonth: YearMonth, language: String): MonthlyReport?

    fun existsByDomainAndReportMonthAndLanguage(domain: String, reportMonth: YearMonth, language: String): Boolean
}
