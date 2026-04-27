package com.oss.techradar.api

import com.oss.techradar.common.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Crawl", description = "GitHub 크롤링 수동 트리거 (개발/테스트용)")
@RestController
@RequestMapping("/api/v1/crawl")
class CrawlController {

    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(
        summary = "크롤링 수동 트리거",
        description = "특정 도메인의 GitHub 레포지토리 수집을 즉시 실행합니다. 백그라운드로 처리됩니다.",
    )
    @PostMapping("/trigger")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun triggerCrawl(
        @RequestParam domain: String,
    ): ApiResponse<CrawlTriggerResponse> {
        log.info("수동 크롤링 트리거 요청: domain=$domain")

        // TODO: GitHubApiClient 구현 완료 후 CrawlerService.crawlDomain(domain) 연동
        // crawlScope.launch { crawlerService.crawlDomain(domain) }

        return ApiResponse.ok(
            CrawlTriggerResponse(
                domain = domain,
                status = "ACCEPTED",
                message = "크롤링이 요청되었습니다. 백그라운드에서 실행됩니다.",
            )
        )
    }

    data class CrawlTriggerResponse(
        val domain: String,
        val status: String,
        val message: String,
    )
}
