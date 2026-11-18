package com.oss.techradar.crawler

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CrawlDomainsTest {

    @Test
    fun `목록과 문서형 레포는 걸러낸다`() {
        listOf(
            "awesome-scalability", "Awesome-Hacking", "awesome-cheatsheets", "Summer2027-Internships",
            "AI-Expert-Roadmap", "fe-interview", "DevOps-Roadmap", "CheatSheetSeries", "free-programming-books",
            "public-apis", "free-for-dev", "programming-books",
        ).forEach { assertTrue(CrawlDomains.isCuratedList(it), "걸러져야 함: $it") }
    }

    @Test
    fun `실제 소프트웨어 프로젝트는 걸리지 않는다`() {
        listOf(
            "react", "vue", "kubernetes", "airflow", "awesome", "awesomewm", "intercom", "booking-service",
            "rea", "roadrunner", "infisical", "internal-tools", "nuclei", "flutter", "bookstack", "ebook-reader",
        ).forEach { assertFalse(CrawlDomains.isCuratedList(it), "걸리면 안 됨: $it") }
    }
}
