package com.oss.techradar.common

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.time.LocalDate
import java.time.YearMonth

@Converter(autoApply = false)
class YearMonthConverter : AttributeConverter<YearMonth, LocalDate> {

    override fun convertToDatabaseColumn(attribute: YearMonth?): LocalDate? =
        attribute?.atDay(1)

    override fun convertToEntityAttribute(dbData: LocalDate?): YearMonth? =
        dbData?.let { YearMonth.of(it.year, it.monthValue) }
}
