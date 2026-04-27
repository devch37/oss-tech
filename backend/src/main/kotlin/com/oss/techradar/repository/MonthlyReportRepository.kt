package com.oss.techradar.repository

import com.oss.techradar.domain.MonthlyReport
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface MonthlyReportRepository : JpaRepository<MonthlyReport, Long> {

    fun findAllByDomainOrderByReportMonthDesc(domain: String): List<MonthlyReport>

    /** YearMonthConverter 적용으로 파라미터는 LocalDate (월의 첫째 날) */
    fun findByDomainAndReportMonth(domain: String, reportMonth: LocalDate): MonthlyReport?

    fun existsByDomainAndReportMonth(domain: String, reportMonth: LocalDate): Boolean
}
