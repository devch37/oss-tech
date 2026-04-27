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
import java.time.YearMonth

@Entity
@Table(
    name = "library_usages",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uq_library_domain_month",
            columnNames = ["library_name", "domain", "collected_month"],
        ),
    ],
)
class LibraryUsage(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "library_name", nullable = false, length = 500)
    val libraryName: String,

    @Column(nullable = false, length = 100)
    val domain: String,

    @Convert(converter = YearMonthConverter::class)
    @Column(name = "collected_month", nullable = false)
    val collectedMonth: YearMonth,

    @Column(nullable = false)
    val usageCount: Int = 0,

    @Column(nullable = false)
    val prevMonthCount: Int = 0,

    @Column(nullable = false)
    val growthRate: Double = 0.0,
)
