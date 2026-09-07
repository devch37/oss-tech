package com.oss.techradar.crawler.parser

import com.oss.techradar.domain.FileType
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.w3c.dom.Element
import java.io.ByteArrayInputStream
import javax.xml.parsers.DocumentBuilderFactory

/** JDK 내장 XML 파서로 pom.xml의 `<dependencies><dependency>` 목록을 읽는다. 추가 의존성 불필요. */
@Component
class MavenDependencyParser : DependencyParser {
    override val fileType = FileType.MAVEN

    private val log = LoggerFactory.getLogger(javaClass)

    override fun parse(content: String): List<String> {
        val factory = DocumentBuilderFactory.newInstance().apply {
            // XXE 방지
            setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
            isExpandEntityReferences = false
        }

        return try {
            val document = factory.newDocumentBuilder()
                .parse(ByteArrayInputStream(content.toByteArray(Charsets.UTF_8)))

            val dependencyNodes = document.getElementsByTagName("dependency")
            (0 until dependencyNodes.length)
                .mapNotNull { dependencyNodes.item(it) as? Element }
                .mapNotNull { dep ->
                    val groupId = dep.firstChildTextOrNull("groupId") ?: return@mapNotNull null
                    val artifactId = dep.firstChildTextOrNull("artifactId") ?: return@mapNotNull null
                    "$groupId:$artifactId"
                }
                .distinct()
        } catch (e: Exception) {
            log.warn("pom.xml 파싱 실패, 건너뜀: ${e.message}")
            emptyList()
        }
    }

    private fun Element.firstChildTextOrNull(tagName: String): String? {
        val nodes = getElementsByTagName(tagName)
        for (i in 0 until nodes.length) {
            val node = nodes.item(i)
            if (node.parentNode === this) return node.textContent?.trim()
        }
        return null
    }
}
