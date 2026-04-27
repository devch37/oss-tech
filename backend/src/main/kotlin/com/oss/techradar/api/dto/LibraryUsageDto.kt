package com.oss.techradar.api.dto

import com.oss.techradar.domain.LibraryUsage

/** 월별 순위 응답 */
data class LibraryRankDto(
    val libraryName: String,
    val domain: String,
    val collectedMonth: String,   // "YYYY-MM" 형식
    val usageCount: Int,
    val prevMonthCount: Int,
    val growthRate: Double,
) {
    companion object {
        fun from(entity: LibraryUsage): LibraryRankDto = LibraryRankDto(
            libraryName = entity.libraryName,
            domain = entity.domain,
            collectedMonth = entity.collectedMonth.toString(),  // YearMonth.toString() → "YYYY-MM"
            usageCount = entity.usageCount,
            prevMonthCount = entity.prevMonthCount,
            growthRate = entity.growthRate,
        )
    }
}

/** 시계열 트렌드 응답 (라이브러리 1개의 월별 추이) */
data class LibraryTrendDto(
    val libraryName: String,
    val domain: String,
    val trend: List<TrendPoint>,
) {
    data class TrendPoint(
        val month: String,   // "YYYY-MM"
        val usageCount: Int,
    )

    companion object {
        fun from(libraryName: String, domain: String, entities: List<LibraryUsage>): LibraryTrendDto =
            LibraryTrendDto(
                libraryName = libraryName,
                domain = domain,
                trend = entities.map { TrendPoint(it.collectedMonth.toString(), it.usageCount) },
            )
    }
}
