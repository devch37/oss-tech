package com.oss.techradar.crawler.parser

import com.oss.techradar.domain.FileType
import org.springframework.stereotype.Component

/** requirements.txt 라인 파싱 — 주석/옵션 라인 제외, 버전 지정자 앞부분을 패키지명으로 추출 */
@Component
class PipDependencyParser : DependencyParser {
    override val fileType = FileType.PIP

    private val versionSpecifierRegex = Regex("[=<>~!;\\[].*$")

    override fun parse(content: String): List<String> =
        content.lineSequence()
            .map { it.trim() }
            .filter { line ->
                line.isNotEmpty() &&
                    !line.startsWith("#") &&
                    !line.startsWith("-r") &&
                    !line.startsWith("-e") &&
                    !line.startsWith("--")
            }
            .map { line -> versionSpecifierRegex.replace(line, "").trim() }
            .filter { it.isNotEmpty() }
            .distinct()
            .toList()
}
