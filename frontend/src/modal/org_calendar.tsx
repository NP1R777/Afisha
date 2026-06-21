import React from "react";
import { Box, Grid, Text, VStack } from "@chakra-ui/react";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

type Day = { value: number; isCurrentMonth: boolean };

type CalendarSlot = {
  date_event: string;
  start_time: string;
};

type CalendarSourceEvent = {
  id: number;
  name: string;
  time_slots?: CalendarSlot[];
};

type CalendarEvent = {
  eventId: number;
  date: string;
  title: string;
  time: string;
};

type CalendarProps = {
  events?: CalendarSourceEvent[];
};

function generateDaysForMonth(year: number, monthIndex: number): Day[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysArray: Day[] = [];
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevMonthYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();

  for (let index = startDay - 1; index >= 0; index -= 1) {
    daysArray.push({ value: prevMonthDays - index, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    daysArray.push({ value: day, isCurrentMonth: true });
  }
  let nextMonthDay = 1;
  while (daysArray.length < 42) {
    daysArray.push({ value: nextMonthDay, isCurrentMonth: false });
    nextMonthDay += 1;
  }
  return daysArray;
}

function formatDate(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function normalizeSlotDate(rawDate: string): string {
  return (rawDate || "").split("T")[0];
}

function normalizeSlotTime(rawTime: string): string {
  return (rawTime || "").slice(0, 5);
}

export const Calendar: React.FC<CalendarProps> = ({ events = [] }) => {
  const currentYear = new Date().getFullYear();
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

  const calendarEvents = React.useMemo<CalendarEvent[]>(() => {
    return events.flatMap((event) =>
      (event.time_slots || []).map((slot) => ({
        eventId: event.id,
        date: normalizeSlotDate(slot.date_event),
        title: event.name,
        time: normalizeSlotTime(slot.start_time),
      }))
    );
  }, [events]);

  const getEventsForDay = (day: Day, monthIndex: number) => {
    if (!day.isCurrentMonth) {
      return [];
    }
    const fullDate = formatDate(currentYear, monthIndex, day.value);
    return calendarEvents.filter((event) => event.date === fullDate);
  };

  return (
    <Box bg="#6B84EA" w="95%" py={7} borderRadius="20px" mt={10} ml="auto">
      <VStack gap={6} align="center">
        <Box bg="#A3B3F2" color="white" px={4} py={2} borderRadius="20px">
          <Text fontSize="xl" textAlign="center">{currentYear} год</Text>
        </Box>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }} gap={6}>
          {MONTHS.map((monthName, monthIndex) => (
            <Box
              key={monthName}
              bg="#A3B3F2"
              borderRadius="20px"
              p={4}
              color="white"
              w={{ base: "100%", sm: "270px" }}
              boxShadow="lg"
            >
              <Text fontWeight="bold" mb={2} textAlign="center">
                {monthName}
              </Text>
              <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                {DAYS.map((dayName) => (
                  <Text key={dayName} fontSize="xs" textAlign="center" opacity={0.8}>
                    {dayName}
                  </Text>
                ))}
              </Grid>
              <Grid templateColumns="repeat(7, 1fr)" gap={1}>
                {generateDaysForMonth(currentYear, monthIndex).map((day, dayIndex) => {
                  const eventsForDay = getEventsForDay(day, monthIndex);
                  const active = eventsForDay.length > 0;
                  const fullDate = formatDate(currentYear, monthIndex, day.value);

                  return (
                    <Box
                      key={`${monthName}-${dayIndex}`}
                      h="32px"
                      lineHeight="32px"
                      textAlign="center"
                      borderRadius="md"
                      cursor={active ? "pointer" : "default"}
                      bg={active ? "#3D5AFE" : "transparent"}
                      color={day.isCurrentMonth ? "white" : "whiteAlpha.500"}
                      fontWeight={active ? "bold" : "normal"}
                      position="relative"
                      onMouseEnter={() => active && setHoveredDate(fullDate)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      {day.value}
                      {hoveredDate === fullDate && active && (
                        <Box
                          position="absolute"
                          top="36px"
                          left="50%"
                          transform="translateX(-50%)"
                          bg="white"
                          color="black"
                          borderRadius="lg"
                          p={2}
                          minW="210px"
                          zIndex={20}
                          boxShadow="xl"
                          textAlign="left"
                        >
                          {eventsForDay.map((event) => (
                            <Box key={`${event.eventId}-${event.time}`} mb={1}>
                              <Text fontSize="12px" fontWeight="bold">{event.title}</Text>
                              <Text fontSize="11px">{event.time || "Время не указано"}</Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Grid>
        {!calendarEvents.length ? (
          <Text color="white" opacity={0.85}>У организатора пока нет запланированных мероприятий.</Text>
        ) : null}
      </VStack>
    </Box>
  );
};
