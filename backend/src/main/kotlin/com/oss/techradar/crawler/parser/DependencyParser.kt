package com.oss.techradar.crawler.parser

import com.oss.techradar.domain.FileType

/** 의존성 파일 1개를 파싱해 라이브러리 식별자 목록을 추출한다. */
interface DependencyParser {
    val fileType: FileType
    fun parse(content: String): List<String>
}
