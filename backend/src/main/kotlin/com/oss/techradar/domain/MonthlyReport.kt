package com.oss.techradar.domain

import com.oss.techradar.common.YearMonthConverter
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDateTime
import java.time.YearMonth

@Entity
@Table(
    name = "monthly_reports",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uq_report_domain_month_language",
            columnNames = ["domain", "report_month", "language"],
        ),
    ],
)
class MonthlyReport(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, length = 100)
    val domain: String,

    @Convert(converter = YearMonthConverter::class)
    @Column(name = "report_month", nullable = false)
    val reportMonth: YearMonth,

    /** 리포트 언어 코드 ("en" | "ko") — [ReportLanguage.code] */
    @Column(nullable = false, length = 5)
    val language: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val content: String,

    @Column(nullable = false)
    val generatedAt: LocalDateTime,
)
