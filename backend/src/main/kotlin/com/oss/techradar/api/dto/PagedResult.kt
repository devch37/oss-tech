package com.oss.techradar.api.dto

/** 페이징 응답 공통 래퍼 */
data class PagedResult<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Int = content.size,
)
