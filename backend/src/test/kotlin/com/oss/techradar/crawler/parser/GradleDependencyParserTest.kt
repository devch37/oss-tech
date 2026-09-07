package com.oss.techradar.crawler.parser

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class GradleDependencyParserTest {

    private val ktsParser = GradleKtsDependencyParser()
    private val groovyParser = GradleDependencyParser()

    @Test
    fun `parse - build gradle kts 문자열 표기법 추출`() {
        val content = """
            dependencies {
                implementation("org.springframework.boot:spring-boot-starter-web")
                api("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.0")
                testImplementation("io.mockk:mockk:1.13.12")
                runtimeOnly("org.postgresql:postgresql")
            }
        """.trimIndent()

        val result = ktsParser.parse(content)

        assertEquals(
            setOf(
                "org.springframework.boot:spring-boot-starter-web",
                "com.fasterxml.jackson.module:jackson-module-kotlin",
                "io.mockk:mockk",
                "org.postgresql:postgresql",
            ),
            result.toSet(),
        )
    }

    @Test
    fun `parse - build gradle groovy 작은따옴표 표기법 추출`() {
        val content = """
            dependencies {
                implementation 'org.springframework.boot:spring-boot-starter-web'
                testImplementation 'junit:junit:4.13.2'
            }
        """.trimIndent()

        val result = groovyParser.parse(content)

        assertEquals(
            setOf("org.springframework.boot:spring-boot-starter-web", "junit:junit"),
            result.toSet(),
        )
    }

    @Test
    fun `parse - 의존성이 없으면 빈 리스트`() {
        assertEquals(emptyList<String>(), ktsParser.parse("plugins { id(\"java\") }"))
    }
}
