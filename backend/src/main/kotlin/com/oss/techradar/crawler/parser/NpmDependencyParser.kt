package com.oss.techradar.crawler.parser

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.oss.techradar.domain.FileType
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class NpmDependencyParser(
    private val objectMapper: ObjectMapper,
) : DependencyParser {
    override val fileType = FileType.NPM

    private val log = LoggerFactory.getLogger(javaClass)

    override fun parse(content: String): List<String> = try {
        val root = objectMapper.readTree(content) as? ObjectNode
        if (root == null) {
            emptyList()
        } else {
            listOf("dependencies", "devDependencies")
                .flatMap { key -> (root.get(key) as? ObjectNode)?.fieldNames()?.asSequence()?.toList() ?: emptyList() }
                .distinct()
        }
    } catch (e: Exception) {
        log.warn("package.json 파싱 실패, 건너뜀: ${e.message}")
        emptyList()
    }
}
