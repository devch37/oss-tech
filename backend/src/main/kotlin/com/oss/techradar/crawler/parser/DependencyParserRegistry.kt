package com.oss.techradar.crawler.parser

import com.oss.techradar.domain.FileType
import org.springframework.stereotype.Component

/** Spring이 주입하는 [DependencyParser] 목록을 [FileType]별로 조회 가능하게 인덱싱한다. */
@Component
class DependencyParserRegistry(parsers: List<DependencyParser>) {

    private val byFileType: Map<FileType, DependencyParser> = parsers.associateBy { it.fileType }

    fun parserFor(fileType: FileType): DependencyParser? = byFileType[fileType]
}
