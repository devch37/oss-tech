package com.oss.techradar.config

import io.netty.channel.ChannelOption
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import java.time.Duration

@Configuration
@EnableConfigurationProperties(WebClientProperties::class)
class WebClientConfig(private val props: WebClientProperties) {

    @Bean("gitHubWebClient")
    fun gitHubWebClient(): WebClient = WebClient.builder()
        .baseUrl(props.github.baseUrl)
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer ${props.github.token}")
        .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
        .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
        .clientConnector(buildConnector())
        .build()

    @Bean("claudeWebClient")
    fun claudeWebClient(): WebClient = WebClient.builder()
        .baseUrl(props.claude.baseUrl)
        .defaultHeader("x-api-key", props.claude.apiKey)
        .defaultHeader("anthropic-version", "2023-06-01")
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .clientConnector(buildConnector())
        .build()

    private fun buildConnector(): ReactorClientHttpConnector {
        val httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, props.timeout.connectMs.toInt())
            .responseTimeout(Duration.ofMillis(props.timeout.readMs))
        return ReactorClientHttpConnector(httpClient)
    }
}
