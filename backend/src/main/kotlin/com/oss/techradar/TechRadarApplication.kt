package com.oss.techradar

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class TechRadarApplication

fun main(args: Array<String>) {
    runApplication<TechRadarApplication>(*args)
}
