package com.oss.techradar.crawler.parser

import com.oss.techradar.domain.FileType
import org.springframework.stereotype.Component

/**
 * Gradle Groovy(`build.gradle`)와 Kotlin DSL(`build.gradle.kts`) 모두
 * `configuration("group:artifact:version")` 문자열 표기법을 공유하므로 동일한 정규식으로 파싱한다.
 * (`group: '...', name: '...'` 맵 표기법은 v1 범위에서 제외)
 */
private val DEPENDENCY_LINE_REGEX = Regex(
    """(?:implementation|api|testImplementation|androidTestImplementation|compileOnly|runtimeOnly|kapt|ksp|annotationProcessor|classpath)\s*\(?\s*["']([\w.\-]+):([\w.\-]+)(?::[^"']+)?["']""",
)

private fun parseGradleDependencies(content: String): List<String> =
    DEPENDENCY_LINE_REGEX.findAll(content)
        .map { "${it.groupValues[1]}:${it.groupValues[2]}" }
        .distinct()
        .toList()

@Component
class GradleKtsDependencyParser : DependencyParser {
    override val fileType = FileType.GRADLE_KTS
    override fun parse(content: String): List<String> = parseGradleDependencies(content)
}

@Component
class GradleDependencyParser : DependencyParser {
    override val fileType = FileType.GRADLE
    override fun parse(content: String): List<String> = parseGradleDependencies(content)
}
