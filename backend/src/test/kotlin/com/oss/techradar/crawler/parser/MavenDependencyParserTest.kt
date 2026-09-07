package com.oss.techradar.crawler.parser

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class MavenDependencyParserTest {

    private val parser = MavenDependencyParser()

    @Test
    fun `parse - pom xml 최상위 dependency만 추출하고 exclusion은 제외`() {
        val content = """
            <?xml version="1.0" encoding="UTF-8"?>
            <project>
                <dependencies>
                    <dependency>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-web</artifactId>
                        <version>3.3.4</version>
                        <exclusions>
                            <exclusion>
                                <groupId>com.excluded</groupId>
                                <artifactId>excluded-lib</artifactId>
                            </exclusion>
                        </exclusions>
                    </dependency>
                    <dependency>
                        <groupId>junit</groupId>
                        <artifactId>junit</artifactId>
                        <scope>test</scope>
                    </dependency>
                </dependencies>
            </project>
        """.trimIndent()

        val result = parser.parse(content)

        assertEquals(
            setOf("org.springframework.boot:spring-boot-starter-web", "junit:junit"),
            result.toSet(),
        )
    }

    @Test
    fun `parse - 잘못된 XML이면 예외 대신 빈 리스트`() {
        val result = parser.parse("<not-valid-xml")
        assertEquals(emptyList<String>(), result)
    }
}
